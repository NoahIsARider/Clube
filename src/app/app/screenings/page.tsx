/* eslint-disable react/jsx-no-comment-textnodes */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { authedFetch } from '@/lib/authed-fetch';
import { Frame, StatusDot } from '@/components/geek-ui';
import { toast } from 'sonner';

interface Membership {
  membership: { role: string; status: string };
  org: { id: string; name: string } | null;
}
interface Screening {
  id: string;
  film_title: string;
  film_director: string | null;
  film_year: number | null;
  film_poster_url: string | null;
  venue: string;
  start_time: string;
  status: string;
  capacity: number;
  signup_count: number;
  attend_count: number;
  semester_tag: string | null;
}

export default function ScreeningsIndexPage() {
  const [rows, setRows] = useState<Array<Screening & { org_id: string; org_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    (async () => {
      try {
        const d = await authedFetch<{ memberships: Membership[] }>('/api/orgs');
        const approved = d.memberships.filter((m) => m.membership.status === 'approved');
        const all: Array<Screening & { org_id: string; org_name: string }> = [];
        for (const m of approved) {
          if (!m.org) continue;
          try {
            const r = await authedFetch<{ screenings: Screening[] }>(
              `/api/orgs/${m.org.id}/screenings`
            );
            r.screenings.forEach((s) =>
              all.push({ ...s, org_id: m.org!.id, org_name: m.org!.name })
            );
          } catch {
            // ignore
          }
        }
        all.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
        setRows(all);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shown = useMemo(() => {
    const now = Date.now();
    if (filter === 'upcoming')
      return rows.filter((r) => new Date(r.start_time).getTime() > now - 3 * 3600 * 1000);
    if (filter === 'past')
      return rows.filter((r) => new Date(r.start_time).getTime() <= now - 3 * 3600 * 1000);
    return rows;
  }, [rows, filter]);

  return (
    <div className="space-y-8">
      <div className="border-b hair-line pb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="mono text-[11px] text-[color:var(--muted-foreground)]">// SCREENINGS</div>
          <h1 className="serif-title text-4xl mt-2">全部场次</h1>
        </div>
        <Link
          href="/app/screenings/new"
          className="mono text-[11px] px-4 py-2 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors"
        >
          + NEW SCREENING
        </Link>
      </div>

      <div className="flex gap-2 mono text-[11px]">
        {(['upcoming', 'past', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 border hair-line transition-colors ${
              filter === f
                ? 'border-[color:var(--phosphor)] text-[color:var(--phosphor)]'
                : 'text-[color:var(--muted-foreground)] hover:border-[color:var(--foreground)]'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mono text-xs text-[color:var(--muted-foreground)] dot-pulse py-8">
          ● LOADING
        </div>
      ) : shown.length === 0 ? (
        <Frame label="EMPTY" className="p-12 text-center">
          <div className="mono text-[10px] text-[color:var(--muted-foreground)]">// 暂无</div>
        </Frame>
      ) : (
        <div className="border-t border-l hair-line grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => (
            <Link
              key={s.id}
              href={`/app/screenings/${s.id}`}
              className="border-b border-r hair-line p-5 hover:bg-[color:var(--muted)]/30 transition-colors group flex gap-4"
            >
              {s.film_poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.film_poster_url}
                  alt={s.film_title}
                  className="w-16 aspect-[2/3] object-cover border hair-line"
                />
              ) : (
                <div className="w-16 aspect-[2/3] border hair-line flex items-center justify-center text-[color:var(--muted-foreground)] mono text-lg">
                  +
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] text-[color:var(--muted-foreground)] truncate">
                    {s.org_name.toUpperCase()}
                  </span>
                  <StatusDot status={s.status} />
                </div>
                <div className="serif-title text-lg mt-1 line-clamp-2">{s.film_title}</div>
                <div className="mono text-[10px] text-[color:var(--muted-foreground)] mt-1">
                  {s.film_director ?? '—'}
                  {s.film_year ? ` · ${s.film_year}` : ''}
                </div>
                <div className="mono text-[10px] text-[color:var(--muted-foreground)] mt-2">
                  {new Date(s.start_time).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  @ {s.venue.toUpperCase()}
                </div>
                <div className="mono text-[10px] text-[color:var(--muted-foreground)] mt-1">
                  {s.signup_count}
                  {s.capacity > 0 ? ` / ${s.capacity}` : ''} REG · {s.attend_count} IN
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
