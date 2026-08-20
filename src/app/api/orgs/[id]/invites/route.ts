import { NextRequest } from 'next/server';
import { requireUser, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserOrgRole, canCurate, randomCode } from '@/lib/org-permission';

/** GET /api/orgs/[id]/invites — 列出邀请码（干事及以上）。 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const role = await getUserOrgRole(user.id, id);
    if (!canCurate(role)) return apiError('无权限', 403);
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('invite_codes')
      .select('id, code, role, max_uses, used_count, expires_at, created_at, created_by')
      .eq('org_id', id)
      .order('created_at', { ascending: false });
    if (error) return apiError(error.message);
    return apiOk({ invites: data ?? [] });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}

/** POST /api/orgs/[id]/invites — 创建邀请码。 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const role = await getUserOrgRole(user.id, id);
    if (!canCurate(role)) return apiError('无权限', 403);

    const body = (await req.json().catch(() => ({}))) as {
      role?: 'officer' | 'member';
      max_uses?: number;
      expires_in_days?: number;
    };
    const inviteRole = body.role === 'officer' ? 'officer' : 'member';
    const maxUses = Math.max(0, Math.min(9999, Number(body.max_uses ?? 0)));
    const days = Number(body.expires_in_days ?? 0);
    const expiresAt =
      days > 0 ? new Date(Date.now() + days * 24 * 3600 * 1000).toISOString() : null;

    const code = randomCode(8);
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('invite_codes')
      .insert({
        org_id: id,
        code,
        role: inviteRole,
        max_uses: maxUses,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select()
      .maybeSingle();
    if (error) return apiError(error.message);
    return apiOk({ invite: data });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
