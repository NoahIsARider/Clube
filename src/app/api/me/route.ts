import { NextRequest } from 'next/server';
import { requireUser, ensureProfile, apiError, apiOk } from '@/lib/api-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureProfile(user);
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('profiles')
      .select('id, display_name, avatar_url, created_at')
      .eq('id', user.id)
      .maybeSingle();
    if (error) return apiError(error.message);
    return apiOk({
      id: user.id,
      email: user.email,
      display_name: data?.display_name ?? user.display_name,
      avatar_url: data?.avatar_url ?? null,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = (await req.json().catch(() => ({}))) as {
      display_name?: string;
      avatar_url?: string | null;
    };
    if (!body.display_name || body.display_name.trim().length === 0) {
      return apiError('昵称不能为空', 400);
    }
    await ensureProfile(user);
    const client = getSupabaseClient();
    const { error } = await client
      .from('profiles')
      .update({
        display_name: body.display_name.trim().slice(0, 64),
        avatar_url: body.avatar_url ?? null,
      })
      .eq('id', user.id);
    if (error) return apiError(error.message);
    return apiOk({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return apiError((e as Error).message);
  }
}
