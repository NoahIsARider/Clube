import { NextRequest } from 'next/server';
import { requireUser, ensureProfile, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserOrgRole, isMember } from '@/lib/org-permission';

/** GET /api/screenings/[id]/ratings — 匿名列出所有评分与短评。 */
export async function GET(
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
    if (!isMember(role)) return apiError('你不是该组织成员', 403);

    // 不返回 voter_id，保证匿名
    const { data, error } = await client
      .from('ratings')
      .select('id, rating, review, created_at')
      .eq('screening_id', id)
      .order('created_at', { ascending: false });
    if (error) return apiError(error.message);

    const ratings = data ?? [];
    const total = ratings.length;
    const avg =
      total === 0 ? 0 : ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / total;
    return apiOk({ ratings, count: total, avg: Number(avg.toFixed(2)) });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}

/** POST /api/screenings/[id]/ratings — 提交匿名评分与短评。 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    await ensureProfile(user);
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { rating?: number; review?: string };
    const rating = Math.round(Number(body.rating));
    if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
      return apiError('评分范围为 1-10', 400);
    }

    const client = getSupabaseClient();
    const { data: screening } = await client
      .from('screenings')
      .select('org_id')
      .eq('id', id)
      .maybeSingle();
    if (!screening) return apiError('场次不存在', 404);
    const role = await getUserOrgRole(user.id, screening.org_id);
    if (!isMember(role)) return apiError('你不是该组织成员', 403);

    const review = (body.review ?? '').slice(0, 500).trim() || null;

    const { error } = await client
      .from('ratings')
      .upsert(
        { screening_id: id, voter_id: user.id, rating, review },
        { onConflict: 'screening_id,voter_id' }
      );
    if (error) return apiError(error.message);
    return apiOk({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
