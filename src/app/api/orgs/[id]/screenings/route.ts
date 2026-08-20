import { NextRequest } from 'next/server';
import { requireUser, ensureProfile, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserOrgRole, canCurate, isMember, randomCode } from '@/lib/org-permission';

/** GET /api/orgs/[id]/screenings — 列出组织所有场次。成员可见已发布，干事以上可见全部。 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const role = await getUserOrgRole(user.id, id);
    if (!isMember(role)) return apiError('无权限', 403);

    const semester = new URL(req.url).searchParams.get('semester');
    const client = getSupabaseClient();
    let q = client
      .from('screenings')
      .select(
        'id, film_title, film_director, film_year, film_country, film_duration, film_poster_url, synopsis, curator_note, venue, start_time, end_time, capacity, status, semester_tag, created_at'
      )
      .eq('org_id', id)
      .order('start_time', { ascending: false });
    if (!canCurate(role)) q = q.neq('status', 'draft');
    if (semester) q = q.eq('semester_tag', semester);
    const { data, error } = await q;
    if (error) return apiError(error.message);

    const ids = (data ?? []).map((s) => s.id);
    const signupCounts: Record<string, number> = {};
    const attendCounts: Record<string, number> = {};
    const mySignups = new Set<string>();
    if (ids.length > 0) {
      for (const sid of ids) {
        const { count: sc } = await client
          .from('signups')
          .select('*', { count: 'exact', head: true })
          .eq('screening_id', sid);
        signupCounts[sid] = sc ?? 0;
        const { count: ac } = await client
          .from('attendances')
          .select('*', { count: 'exact', head: true })
          .eq('screening_id', sid);
        attendCounts[sid] = ac ?? 0;
      }
      const { data: mine } = await client
        .from('signups')
        .select('screening_id')
        .eq('user_id', user.id)
        .in('screening_id', ids);
      (mine ?? []).forEach((r) => mySignups.add(r.screening_id));
    }

    return apiOk({
      screenings: (data ?? []).map((s) => ({
        ...s,
        signup_count: signupCounts[s.id] ?? 0,
        attend_count: attendCounts[s.id] ?? 0,
        i_signed_up: mySignups.has(s.id),
      })),
      my_role: role,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}

/** POST /api/orgs/[id]/screenings — 创建场次。干事以上可用。 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    await ensureProfile(user);
    const { id } = await params;
    const role = await getUserOrgRole(user.id, id);
    if (!canCurate(role)) return apiError('无权限', 403);

    const body = (await req.json().catch(() => ({}))) as {
      film_title?: string;
      film_director?: string;
      film_year?: number;
      film_country?: string;
      film_duration?: number;
      film_poster_url?: string;
      synopsis?: string;
      curator_note?: string;
      venue?: string;
      start_time?: string;
      end_time?: string;
      capacity?: number;
      status?: 'draft' | 'published';
      semester_tag?: string;
    };

    if (!body.film_title?.trim()) return apiError('片名不能为空', 400);
    if (!body.venue?.trim()) return apiError('放映场地不能为空', 400);
    if (!body.start_time) return apiError('开始时间不能为空', 400);

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('screenings')
      .insert({
        org_id: id,
        film_title: body.film_title.trim().slice(0, 200),
        film_director: body.film_director?.trim().slice(0, 128) || null,
        film_year: body.film_year && body.film_year > 0 ? Math.floor(body.film_year) : null,
        film_country: body.film_country?.trim().slice(0, 64) || null,
        film_duration: body.film_duration && body.film_duration > 0 ? Math.floor(body.film_duration) : null,
        film_poster_url: body.film_poster_url || null,
        synopsis: body.synopsis?.slice(0, 2000) || null,
        curator_note: body.curator_note?.slice(0, 2000) || null,
        venue: body.venue.trim().slice(0, 128),
        start_time: new Date(body.start_time).toISOString(),
        end_time: body.end_time ? new Date(body.end_time).toISOString() : null,
        capacity: Math.max(0, Math.floor(body.capacity ?? 0)),
        status: body.status === 'published' ? 'published' : 'draft',
        semester_tag: body.semester_tag?.trim().slice(0, 32) || null,
        checkin_code: randomCode(6),
        created_by: user.id,
      })
      .select()
      .maybeSingle();
    if (error || !data) return apiError(error?.message || '创建失败');
    return apiOk({ screening: data });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
