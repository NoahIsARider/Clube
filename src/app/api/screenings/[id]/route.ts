import { NextRequest } from 'next/server';
import { requireUser, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserOrgRole, canCurate, isMember } from '@/lib/org-permission';

interface ScreeningRow {
  id: string;
  org_id: string;
  film_title: string;
  film_director: string | null;
  film_year: number | null;
  film_country: string | null;
  film_duration: number | null;
  film_poster_url: string | null;
  synopsis: string | null;
  curator_note: string | null;
  venue: string;
  start_time: string;
  end_time: string | null;
  capacity: number;
  status: string;
  semester_tag: string | null;
  checkin_code: string;
  created_by: string;
  created_at: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const client = getSupabaseClient();
    const { data: screening, error } = await client
      .from('screenings')
      .select('*')
      .eq('id', id)
      .maybeSingle<ScreeningRow>();
    if (error) return apiError(error.message);
    if (!screening) return apiError('场次不存在', 404);

    const role = await getUserOrgRole(user.id, screening.org_id);
    if (!isMember(role)) return apiError('你不是该组织成员', 403);

    if (screening.status === 'draft' && !canCurate(role)) {
      return apiError('该场次尚未发布', 403);
    }

    const { count: signupCount } = await client
      .from('signups')
      .select('*', { count: 'exact', head: true })
      .eq('screening_id', id);
    const { count: attendCount } = await client
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('screening_id', id);

    const { data: mySignup } = await client
      .from('signups')
      .select('id')
      .eq('screening_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: myAttend } = await client
      .from('attendances')
      .select('id, checked_in_at')
      .eq('screening_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: myRating } = await client
      .from('ratings')
      .select('id, rating, review')
      .eq('screening_id', id)
      .eq('voter_id', user.id)
      .maybeSingle();

    // Only officers see checkin_code; members see redacted
    const payload: Record<string, unknown> = { ...screening };
    if (!canCurate(role)) delete payload.checkin_code;

    return apiOk({
      screening: payload,
      signup_count: signupCount ?? 0,
      attend_count: attendCount ?? 0,
      i_signed_up: !!mySignup,
      i_attended: !!myAttend,
      i_rated: !!myRating,
      my_role: role,
    });
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
    const client = getSupabaseClient();
    const { data: screening } = await client
      .from('screenings')
      .select('org_id')
      .eq('id', id)
      .maybeSingle();
    if (!screening) return apiError('场次不存在', 404);
    const role = await getUserOrgRole(user.id, screening.org_id);
    if (!canCurate(role)) return apiError('无权限', 403);

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const allowed = new Set([
      'film_title', 'film_director', 'film_year', 'film_country', 'film_duration',
      'film_poster_url', 'synopsis', 'curator_note', 'venue', 'start_time', 'end_time',
      'capacity', 'status', 'semester_tag',
    ]);
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (!allowed.has(k)) continue;
      if ((k === 'start_time' || k === 'end_time') && typeof v === 'string') {
        patch[k] = new Date(v).toISOString();
      } else {
        patch[k] = v;
      }
    }
    if (Object.keys(patch).length === 0) return apiError('无更新字段', 400);

    const { error } = await client.from('screenings').update(patch).eq('id', id);
    if (error) return apiError(error.message);
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
    const { data: screening } = await client
      .from('screenings')
      .select('org_id')
      .eq('id', id)
      .maybeSingle();
    if (!screening) return apiError('场次不存在', 404);
    const role = await getUserOrgRole(user.id, screening.org_id);
    if (!canCurate(role)) return apiError('无权限', 403);
    const { error } = await client.from('screenings').delete().eq('id', id);
    if (error) return apiError(error.message);
    return apiOk({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
