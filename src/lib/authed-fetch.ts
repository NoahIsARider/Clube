import { getSupabaseBrowserClientWithRetry } from '@/lib/supabase-browser';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * 需要登录态的 fetch。自动带 x-session。
 * 未登录时抛错，由调用方跳转登录页。
 */
export async function authedFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = await getSupabaseBrowserClientWithRetry();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (session?.access_token) {
    headers['x-session'] = session.access_token;
  }

  const res = await fetch(path, { ...options, headers });
  const json: ApiResponse<T> = await res.json().catch(() => ({ error: '响应解析失败' }));
  if (!res.ok) {
    throw new Error(json.error || `请求失败 (${res.status})`);
  }
  return json.data as T;
}

/** 匿名请求（无需登录），仅有 error/data 结构。 */
export async function publicFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  const res = await fetch(path, { ...options, headers });
  const json: ApiResponse<T> = await res.json().catch(() => ({ error: '响应解析失败' }));
  if (!res.ok) {
    throw new Error(json.error || `请求失败 (${res.status})`);
  }
  return json.data as T;
}
