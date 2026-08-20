import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string | null;
  display_name: string;
}

/**
 * 校验请求中的 x-session Token 并返回登录用户。
 * 失败时抛出 NextResponse (401)。
 */
export async function requireUser(req: NextRequest): Promise<AuthUser> {
  const token = req.headers.get('x-session');
  if (!token) {
    throw NextResponse.json({ error: '请先登录' }, { status: 401 });
  }
  const authClient = getSupabaseClient(token);
  const { data, error } = await authClient.auth.getUser();
  if (error || !data?.user) {
    throw NextResponse.json({ error: '认证失败' }, { status: 401 });
  }
  const user = data.user;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    (typeof meta.display_name === 'string' && meta.display_name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (user.email ? user.email.split('@')[0] : '匿名');
  return { id: user.id, email: user.email ?? null, display_name: displayName };
}

/**
 * 确保 profiles 表中存在该用户的记录。使用 upsert 避免并发插入冲突。
 * 使用 service role client（不需要 token）。
 */
export async function ensureProfile(user: AuthUser): Promise<void> {
  const client: SupabaseClient = getSupabaseClient();
  const { error } = await client
    .from('profiles')
    .upsert(
      { id: user.id, display_name: user.display_name },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  if (error) throw new Error(`创建用户资料失败: ${error.message}`);
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function apiOk<T>(data: T) {
  return NextResponse.json({ data });
}
