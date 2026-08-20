import { NextRequest } from 'next/server';
import { requireUser, ensureProfile, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserOrgRole, canManageOrg, isMember } from '@/lib/org-permission';

/** GET /api/orgs/[id]/members — 管理员可看全部；普通成员只看已通过的。 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const role = await getUserOrgRole(user.id, id);
    if (!isMember(role)) return apiError('无权限', 403);

    const client = getSupabaseClient();
    const query = client
      .from('organization_members')
      .select('id, user_id, role, status, joined_at, note')
      .eq('org_id', id)
      .order('joined_at', { ascending: false });
    const finalQuery = canManageOrg(role) ? query : query.eq('status', 'approved');
    const { data: members, error } = await finalQuery;
    if (error) return apiError(error.message);

    const userIds = (members ?? []).map((m) => m.user_id);
    let profilesMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await client
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);
      profilesMap = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      );
    }

    const list = (members ?? []).map((m) => ({
      ...m,
      profile: profilesMap[m.user_id] ?? { display_name: '匿名用户', avatar_url: null },
    }));

    return apiOk({ members: list, my_role: role });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}

/** POST /api/orgs/[id]/members — 申请加入（审核制）。 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    await ensureProfile(user);
    const { id } = await params;
    const client = getSupabaseClient();

    const { data: org, error: orgErr } = await client
      .from('organizations')
      .select('id, join_policy')
      .eq('id', id)
      .maybeSingle();
    if (orgErr) return apiError(orgErr.message);
    if (!org) return apiError('组织不存在', 404);
    if (org.join_policy === 'invite_only') {
      return apiError('该组织仅支持邀请码加入', 400);
    }

    // Check existing membership
    const { data: existing } = await client
      .from('organization_members')
      .select('id, status')
      .eq('org_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) {
      if (existing.status === 'approved') return apiError('你已是成员', 400);
      if (existing.status === 'pending') return apiError('你的申请已提交，请等待审核', 400);
      // rejected -> update to pending again
      const { error } = await client
        .from('organization_members')
        .update({ status: 'pending' })
        .eq('id', existing.id);
      if (error) return apiError(error.message);
      return apiOk({ status: 'pending' });
    }

    const body = (await req.json().catch(() => ({}))) as { note?: string };
    const status = org.join_policy === 'open' ? 'approved' : 'pending';
    const { data: inserted, error } = await client
      .from('organization_members')
      .insert({
        org_id: id,
        user_id: user.id,
        role: 'member',
        status,
        note: body.note?.slice(0, 200) || null,
      })
      .select('id, org_id, user_id, role, status, joined_at, note')
      .single();
    if (error) return apiError(error.message);
    return apiOk({ membership: inserted, status });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
