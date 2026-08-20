import { NextRequest } from 'next/server';
import { requireUser, ensureProfile, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserOrgRole, canManageOrg } from '@/lib/org-permission';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    await ensureProfile(user);
    const { id } = await params;
    const client = getSupabaseClient();
    const { data: org, error } = await client
      .from('organizations')
      .select('id, name, slug, description, logo_url, school, join_policy, created_at, created_by')
      .eq('id', id)
      .maybeSingle();
    if (error) return apiError(error.message);
    if (!org) return apiError('组织不存在', 404);

    const role = await getUserOrgRole(user.id, id);
    const { count } = await client
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', id)
      .eq('status', 'approved');

    // Check if there's a pending request
    let pending = false;
    if (!role) {
      const { data: pendingRow } = await client
        .from('organization_members')
        .select('id')
        .eq('org_id', id)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();
      pending = !!pendingRow;
    }

    return apiOk({ org, role, pending, member_count: count ?? 0 });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const role = await getUserOrgRole(user.id, id);
    if (!canManageOrg(role)) return apiError('无权限', 403);

    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
      school?: string;
      logo_url?: string | null;
      join_policy?: string;
    };
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name.trim().slice(0, 128);
    if (body.description !== undefined) patch.description = body.description.slice(0, 500) || null;
    if (body.school !== undefined) patch.school = body.school.slice(0, 128) || null;
    if (body.logo_url !== undefined) patch.logo_url = body.logo_url || null;
    if (body.join_policy && ['approval', 'invite_only', 'open'].includes(body.join_policy)) {
      patch.join_policy = body.join_policy;
    }
    if (Object.keys(patch).length === 0) return apiError('无更新字段', 400);

    const client = getSupabaseClient();
    const { error } = await client.from('organizations').update(patch).eq('id', id);
    if (error) return apiError(error.message);
    return apiOk({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}

/** DELETE — 解散组织（仅 admin）。 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const role = await getUserOrgRole(user.id, id);
    if (role !== 'admin') return apiError('仅管理员可解散组织', 403);

    const client = getSupabaseClient();
    // 级联清理：成员、邀请码、场次、报名、签到、评分
    const { data: screenings } = await client
      .from('screenings')
      .select('id')
      .eq('org_id', id);
    const screeningIds = (screenings ?? []).map((s) => s.id);
    if (screeningIds.length > 0) {
      await client.from('ratings').delete().in('screening_id', screeningIds);
      await client.from('attendances').delete().in('screening_id', screeningIds);
      await client.from('signups').delete().in('screening_id', screeningIds);
      await client.from('screenings').delete().eq('org_id', id);
    }
    await client.from('invite_codes').delete().eq('org_id', id);
    await client.from('organization_members').delete().eq('org_id', id);
    const { error } = await client.from('organizations').delete().eq('id', id);
    if (error) return apiError(error.message);
    return apiOk({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
