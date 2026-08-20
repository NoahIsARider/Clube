/* eslint-disable react/jsx-no-comment-textnodes */
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClientWithRetry } from '@/lib/supabase-browser';
import { useSupabaseConfig } from '@/lib/supabase-config-inject';
import { LogOut, Calendar, Users, Home, BarChart3, ScanLine } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/app', label: 'HOME', icon: Home },
  { href: '/app/orgs', label: 'ORGS', icon: Users },
  { href: '/app/screenings', label: 'SCHEDULE', icon: Calendar },
  { href: '/app/checkin', label: 'CHECK-IN', icon: ScanLine },
  { href: '/app/report', label: 'REPORT', icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading: configLoading, error: configError } = useSupabaseConfig();
  const [user, setUser] = useState<{ email: string | null; display_name: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (configLoading) return;
    if (configError) {
      setChecking(false);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        const supabase = await getSupabaseBrowserClientWithRetry();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/login');
          return;
        }
        if (cancel) return;
        const meta = session.user.user_metadata as Record<string, unknown>;
        const display =
          (typeof meta.display_name === 'string' && meta.display_name) ||
          (typeof meta.full_name === 'string' && meta.full_name) ||
          (session.user.email ? session.user.email.split('@')[0] : '匿名');
        setUser({ email: session.user.email ?? null, display_name: display });
      } finally {
        if (!cancel) setChecking(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [configLoading, configError, router]);

  const handleSignOut = async () => {
    const supabase = await getSupabaseBrowserClientWithRetry();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (configLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mono text-xs text-[color:var(--muted-foreground)] dot-pulse">
          ● LOADING SESSION
        </div>
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

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b hair-line">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/app" className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[color:var(--phosphor)] inline-block" />
            <span className="serif-title text-xl">Clube</span>
            <span className="mono text-[10px] text-[color:var(--muted-foreground)] hidden sm:inline">
              // FILM SOCIETY OS
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="mono text-[11px] text-[color:var(--muted-foreground)] hidden sm:inline">
              {user.display_name.toUpperCase()}
            </span>
            <button
              onClick={handleSignOut}
              className="mono text-[11px] flex items-center gap-1.5 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="border-b hair-line">
        <div className="max-w-[1200px] mx-auto flex items-center gap-0 px-6 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/app' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mono text-[11px] px-4 py-3 flex items-center gap-2 border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  active
                    ? 'border-[color:var(--phosphor)] text-[color:var(--foreground)]'
                    : 'border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8">{children}</main>

      <footer className="border-t hair-line">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-3">
          <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
            CLUBE · V0.1 · {new Date().getFullYear()}
          </span>
          <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
            ● SYSTEM ONLINE
          </span>
        </div>
      </footer>
    </div>
  );
}
