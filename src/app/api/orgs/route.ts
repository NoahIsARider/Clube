import { NextRequest } from 'next/server';
import { requireUser, ensureProfile, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { slugify } from '@/lib/org-permission';

/** GET /api/orgs — 列出用户已加入或已申请的组织。 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureProfile(user);
    const client = getSupabaseClient();

    const { data: memberships, error: mErr } = await client
      .from('organization_members')
      .select('id, org_id, role, status, joined_at')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });
    if (mErr) return apiError(mErr.message);

    const orgIds = (memberships ?? []).map((m) => m.org_id);
    if (orgIds.length === 0) return apiOk({ memberships: [] });

    const { data: orgs, error: oErr } = await client
      .from('organizations')
      .select('id, name, slug, description, logo_url, school, join_policy, created_at')
      .in('id', orgIds);
    if (oErr) return apiError(oErr.message);

    const orgMap = new Map(orgs?.map((o) => [o.id, o]) ?? []);

    // Count members per org (approved only)
    const memberCounts: Record<string, number> = {};
    for (const oid of orgIds) {
      const { count } = await client
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', oid)
        .eq('status', 'approved');
      memberCounts[oid] = count ?? 0;
    }

    const list = (memberships ?? []).map((m) => ({
      membership: m,
      org: orgMap.get(m.org_id) ?? null,
      member_count: memberCounts[m.org_id] ?? 0,
    }));
    return apiOk({ memberships: list });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}

/** POST /api/orgs — 创建组织，创建者自动成为 admin。 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureProfile(user);
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
      school?: string;
      logo_url?: string;
      join_policy?: string;
    };
    const name = (body.name ?? '').trim();
    if (!name) return apiError('组织名称不能为空', 400);
    const joinPolicy =
      body.join_policy === 'invite_only' || body.join_policy === 'open'
        ? body.join_policy
        : 'approval';

    const client = getSupabaseClient();
    const { data: org, error: orgErr } = await client
      .from('organizations')
      .insert({
        name: name.slice(0, 128),
        slug: slugify(name),
        description: (body.description ?? '').slice(0, 500) || null,
        school: (body.school ?? '').slice(0, 128) || null,
        logo_url: body.logo_url || null,
        join_policy: joinPolicy,
        created_by: user.id,
      })
      .select()
      .maybeSingle();
    if (orgErr || !org) return apiError(orgErr?.message || '创建组织失败');

    const { error: memErr } = await client.from('organization_members').insert({
      org_id: org.id,
      user_id: user.id,
      role: 'admin',
      status: 'approved',
    });
    if (memErr) return apiError(memErr.message);

    return apiOk({ org });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
