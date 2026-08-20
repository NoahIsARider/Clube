import { NextRequest } from 'next/server';
import { requireUser, ensureProfile, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserOrgRole, isMember } from '@/lib/org-permission';

/** POST /api/screenings/[id]/checkin — 使用签到码签到。 body: { code: string } */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    await ensureProfile(user);
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { code?: string };
    const code = (body.code ?? '').trim().toUpperCase();
    if (!code) return apiError('签到码不能为空', 400);

    const client = getSupabaseClient();
    const { data: screening } = await client
      .from('screenings')
      .select('id, org_id, status, checkin_code, start_time')
      .eq('id', id)
      .maybeSingle();
    if (!screening) return apiError('场次不存在', 404);

    const role = await getUserOrgRole(user.id, screening.org_id);
    if (!isMember(role)) return apiError('你不是该组织成员', 403);
    if (screening.status === 'draft') return apiError('场次未发布', 400);
    if (screening.status === 'canceled') return apiError('场次已取消', 400);
    if (screening.checkin_code.toUpperCase() !== code) return apiError('签到码错误', 400);

    const { data: existing } = await client
      .from('attendances')
      .select('id, checked_in_at')
      .eq('screening_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: profile } = await client
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    const displayName = profile?.display_name ?? '成员';

    if (existing) {
      return apiOk({
        already: true,
        checked_in_at: existing.checked_in_at,
        display_name: displayName,
      });
    }

    const { data, error } = await client
      .from('attendances')
      .insert({ screening_id: id, user_id: user.id })
      .select()
      .maybeSingle();
    if (error) return apiError(error.message);

    // Auto ensure signup exists
    await client
      .from('signups')
      .upsert(
        { screening_id: id, user_id: user.id },
        { onConflict: 'screening_id,user_id', ignoreDuplicates: true }
      );

    return apiOk({
      already: false,
      checked_in_at: data?.checked_in_at,
      display_name: displayName,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
