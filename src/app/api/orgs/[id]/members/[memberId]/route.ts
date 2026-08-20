import { NextRequest } from 'next/server';
import { requireUser, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserOrgRole, canManageOrg } from '@/lib/org-permission';

/** PATCH /api/orgs/[id]/members/[memberId] — 修改状态或角色。admin 可用。 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await requireUser(req);
    const { id, memberId } = await params;
    const role = await getUserOrgRole(user.id, id);
    if (!canManageOrg(role)) return apiError('无权限', 403);

    const body = (await req.json().catch(() => ({}))) as {
      status?: 'approved' | 'rejected';
      role?: 'admin' | 'officer' | 'member';
    };
    const patch: Record<string, unknown> = {};
    if (body.status && ['approved', 'rejected'].includes(body.status)) patch.status = body.status;
    if (body.role && ['admin', 'officer', 'member'].includes(body.role)) patch.role = body.role;
    if (Object.keys(patch).length === 0) return apiError('无更新字段', 400);

    const client = getSupabaseClient();
    const { error } = await client
      .from('organization_members')
      .update(patch)
      .eq('id', memberId)
      .eq('org_id', id);
    if (error) return apiError(error.message);
    return apiOk({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}

/** DELETE — 管理员移除成员，或成员自行退出。 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await requireUser(req);
    const { id, memberId } = await params;
    const client = getSupabaseClient();

    const { data: target } = await client
      .from('organization_members')
      .select('id, user_id, role')
      .eq('id', memberId)
      .eq('org_id', id)
      .maybeSingle();
    if (!target) return apiError('成员不存在', 404);

    const myRole = await getUserOrgRole(user.id, id);
    const isSelf = target.user_id === user.id;
    if (!isSelf && !canManageOrg(myRole)) return apiError('无权限', 403);
    if (target.role === 'admin' && !isSelf) return apiError('无法移除管理员', 400);

    const { error } = await client
      .from('organization_members')
      .delete()
      .eq('id', memberId)
      .eq('org_id', id);
    if (error) return apiError(error.message);
    return apiOk({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
