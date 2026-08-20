import { NextRequest } from 'next/server';
import { requireUser, ensureProfile, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserOrgRole, isMember } from '@/lib/org-permission';

async function getScreeningWithRole(userId: string, screeningId: string) {
  const client = getSupabaseClient();
  const { data: screening } = await client
    .from('screenings')
    .select('id, org_id, status, capacity, start_time')
    .eq('id', screeningId)
    .maybeSingle();
  if (!screening) return { screening: null, role: null };
  const role = await getUserOrgRole(userId, screening.org_id);
  return { screening, role };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    await ensureProfile(user);
    const { id } = await params;
    const { screening, role } = await getScreeningWithRole(user.id, id);
    if (!screening) return apiError('场次不存在', 404);
    if (!isMember(role)) return apiError('你不是该组织成员', 403);
    if (screening.status === 'draft') return apiError('场次未发布', 400);
    if (screening.status === 'canceled') return apiError('场次已取消', 400);

    const client = getSupabaseClient();

    if (screening.capacity && screening.capacity > 0) {
      const { count } = await client
        .from('signups')
        .select('*', { count: 'exact', head: true })
        .eq('screening_id', id);
      if ((count ?? 0) >= screening.capacity) return apiError('报名已满', 400);
    }

    const { error } = await client
      .from('signups')
      .insert({ screening_id: id, user_id: user.id });
    if (error) {
      if (error.code === '23505') return apiError('你已报名', 400);
      return apiError(error.message);
    }
    return apiOk({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const client = getSupabaseClient();
    const { error } = await client
      .from('signups')
      .delete()
      .eq('screening_id', id)
      .eq('user_id', user.id);
    if (error) return apiError(error.message);
    return apiOk({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
