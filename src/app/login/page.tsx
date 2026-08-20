'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClientWithRetry } from '@/lib/supabase-browser';
import { useSupabaseConfig } from '@/lib/supabase-config-inject';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { isLoading: configLoading, error: configError } = useSupabaseConfig();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (configLoading || configError) return;
    (async () => {
      try {
        const supabase = await getSupabaseBrowserClientWithRetry();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) router.replace('/app');
      } catch {
        // ignore
      }
    })();
  }, [configLoading, configError, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email || !password) {
      toast.error('请输入邮箱与密码');
      return;
    }
    setLoading(true);
    try {
      const supabase = await getSupabaseBrowserClientWithRetry();
      if (mode === 'signup') {
        if (!displayName.trim()) {
          toast.error('请输入昵称');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName.trim() } },
        });
        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }
        // 自动登录（因为 auto_confirm = true）
        const { error: siErr } = await supabase.auth.signInWithPassword({ email, password });
        if (siErr) {
          toast.error(siErr.message);
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }
      }
      toast.success('登录成功');
      router.replace('/app');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mono text-xs text-[color:var(--muted-foreground)] dot-pulse">● BOOTING</div>
      </div>
    );
  }
  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mono text-xs text-[color:var(--destructive)]">
          ● CONFIG ERROR: {configError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 crosshair-bg">
      <div className="w-full max-w-[420px] border hair-line bg-[color:var(--background)]">
        <div className="flex items-center justify-between border-b hair-line px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[color:var(--phosphor)] inline-block" />
            <span className="serif-title text-lg">Clube</span>
          </Link>
          <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
            {mode === 'signin' ? 'SIGN IN' : 'REGISTER'}
          </span>
        </div>

        <div className="flex border-b hair-line">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 mono text-[11px] py-3 transition-colors ${
              mode === 'signin'
                ? 'bg-[color:var(--foreground)] text-[color:var(--ink)]'
                : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
            }`}
          >
            SIGN IN
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 mono text-[11px] py-3 border-l hair-line transition-colors ${
              mode === 'signup'
                ? 'bg-[color:var(--foreground)] text-[color:var(--ink)]'
                : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
            }`}
          >
            REGISTER
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {mode === 'signup' && (
            <div>
              <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                DISPLAY NAME
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-transparent border-b hair-line py-2 text-sm focus:outline-none focus:border-[color:var(--phosphor)] transition-colors"
                placeholder="张导演"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b hair-line py-2 text-sm font-mono focus:outline-none focus:border-[color:var(--phosphor)] transition-colors"
              placeholder="you@film.club"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b hair-line py-2 text-sm font-mono focus:outline-none focus:border-[color:var(--phosphor)] transition-colors"
              placeholder="••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />
            <div className="mono text-[10px] text-[color:var(--muted-foreground)] mt-1">
              MIN 6 CHARS
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mono text-[11px] py-3 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors disabled:opacity-50"
          >
            {loading ? '● LOADING' : mode === 'signin' ? 'ENTER →' : 'CREATE ACCOUNT →'}
          </button>
        </form>

        <div className="border-t hair-line px-6 py-3 flex items-center justify-between">
          <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
            + + + + +
          </span>
          <Link
            href="/"
            className="mono text-[10px] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
          >
            ← BACK
          </Link>
        </div>
      </div>
    </div>
  );
}
