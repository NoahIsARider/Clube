import { NextRequest } from 'next/server';
import { requireUser, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserOrgRole, isMember } from '@/lib/org-permission';

interface ScreeningLite {
  id: string;
  film_title: string;
  film_director: string | null;
  film_poster_url: string | null;
  venue: string;
  start_time: string;
  capacity: number;
  status: string;
  semester_tag: string | null;
}

/** GET /api/orgs/[id]/report?semester=xxx — 学期末自动生成的放映总结。 */
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
      .select('id, film_title, film_director, film_poster_url, venue, start_time, capacity, status, semester_tag')
      .eq('org_id', id)
      .neq('status', 'draft')
      .neq('status', 'canceled');
    if (semester) q = q.eq('semester_tag', semester);
    const { data: screeningsData, error } = await q;
    if (error) return apiError(error.message);
    const screenings = (screeningsData ?? []) as ScreeningLite[];

    // 可用学期列表
    const { data: semesterTags } = await client
      .from('screenings')
      .select('semester_tag')
      .eq('org_id', id)
      .not('semester_tag', 'is', null);
    const allSemesters = Array.from(
      new Set((semesterTags ?? []).map((r) => r.semester_tag as string).filter(Boolean))
    ).sort()
      .reverse();

    const total = screenings.length;
    let totalCapacity = 0;
    let totalAttended = 0;
    let bestFilm: { title: string; avg: number; count: number; poster: string | null } | null = null;
    const perFilm: Array<{
      id: string;
      title: string;
      director: string | null;
      poster_url: string | null;
      venue: string;
      start_time: string;
      capacity: number;
      signup_count: number;
      attend_count: number;
      rating_avg: number;
      rating_count: number;
    }> = [];

    for (const s of screenings) {
      const { count: signupCount } = await client
        .from('signups')
        .select('*', { count: 'exact', head: true })
        .eq('screening_id', s.id);
      const { count: attendCount } = await client
        .from('attendances')
        .select('*', { count: 'exact', head: true })
        .eq('screening_id', s.id);
      const { data: rates } = await client
        .from('ratings')
        .select('rating')
        .eq('screening_id', s.id);
      const ratingList = rates ?? [];
      const rc = ratingList.length;
      const ra = rc === 0 ? 0 : ratingList.reduce((a, b) => a + (b.rating ?? 0), 0) / rc;

      totalCapacity += s.capacity || 0;
      totalAttended += attendCount ?? 0;

      const rec = {
        id: s.id,
        title: s.film_title,
        director: s.film_director,
        poster_url: s.film_poster_url,
        venue: s.venue,
        start_time: s.start_time,
        capacity: s.capacity,
        signup_count: signupCount ?? 0,
        attend_count: attendCount ?? 0,
        rating_avg: Number(ra.toFixed(2)),
        rating_count: rc,
      };
      perFilm.push(rec);

      if (rc >= 1) {
        if (!bestFilm || ra > bestFilm.avg) {
          bestFilm = { title: s.film_title, avg: Number(ra.toFixed(2)), count: rc, poster: s.film_poster_url };
        }
      }
    }

    const occupancy =
      totalCapacity > 0 ? Number(((totalAttended / totalCapacity) * 100).toFixed(1)) : 0;

    perFilm.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return apiOk({
      semester: semester,
      available_semesters: allSemesters,
      summary: {
        total_screenings: total,
        total_capacity: totalCapacity,
        total_attended: totalAttended,
        occupancy_rate: occupancy,
        best_film: bestFilm,
      },
      screenings: perFilm,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
