import { NextRequest } from 'next/server';
import { requireUser, ensureProfile, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/** POST /api/orgs/join — 使用邀请码加入组织。 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureProfile(user);
    const body = (await req.json().catch(() => ({}))) as { code?: string };
    const code = (body.code ?? '').trim().toUpperCase();
    if (!code) return apiError('邀请码不能为空', 400);

    const client = getSupabaseClient();
    const { data: invite, error: inviteErr } = await client
      .from('invite_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (inviteErr) return apiError(inviteErr.message);
    if (!invite) return apiError('邀请码无效', 404);
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      return apiError('邀请码已过期', 400);
    }
    if (invite.max_uses > 0 && invite.used_count >= invite.max_uses) {
      return apiError('邀请码已达使用上限', 400);
    }

    const { data: existing } = await client
      .from('organization_members')
      .select('id, status')
      .eq('org_id', invite.org_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing?.status === 'approved') {
      return apiError('你已是成员', 400);
    }

    if (existing) {
      const { error } = await client
        .from('organization_members')
        .update({ status: 'approved', role: invite.role })
        .eq('id', existing.id);
      if (error) return apiError(error.message);
    } else {
      const { error } = await client.from('organization_members').insert({
        org_id: invite.org_id,
        user_id: user.id,
        role: invite.role,
        status: 'approved',
      });
      if (error) return apiError(error.message);
    }

    await client
      .from('invite_codes')
      .update({ used_count: invite.used_count + 1 })
      .eq('id', invite.id);

    return apiOk({ org_id: invite.org_id, role: invite.role });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
