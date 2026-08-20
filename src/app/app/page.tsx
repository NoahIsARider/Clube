/* eslint-disable react/jsx-no-comment-textnodes */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedFetch } from '@/lib/authed-fetch';
import { Frame, StatusDot } from '@/components/geek-ui';
import { toast } from 'sonner';
import { Users, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';

interface Membership {
  membership: { id: string; org_id: string; role: string; status: string };
  org: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    school: string | null;
    logo_url: string | null;
  } | null;
  member_count: number;
}

interface UpcomingScreening {
  id: string;
  org_id: string;
  org_name: string;
  film_title: string;
  venue: string;
  start_time: string;
  status: string;
  film_poster_url: string | null;
}

export default function DashboardPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<UpcomingScreening[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await authedFetch<{ memberships: Membership[] }>('/api/orgs');
        setMemberships(data.memberships);
        // Fetch upcoming screenings across orgs (approved memberships only)
        const approvedOrgs = data.memberships.filter((m) => m.membership.status === 'approved');
        const results: UpcomingScreening[] = [];
        for (const m of approvedOrgs) {
          if (!m.org) continue;
          try {
            const r = await authedFetch<{ screenings: Array<{ id: string; film_title: string; venue: string; start_time: string; status: string; film_poster_url: string | null }> }>(
              `/api/orgs/${m.org.id}/screenings`
            );
            r.screenings.forEach((s) => {
              if (
                (s.status === 'published' || s.status === 'ongoing') &&
                new Date(s.start_time).getTime() > Date.now() - 3 * 3600 * 1000
              ) {
                results.push({
                  id: s.id,
                  org_id: m.org!.id,
                  org_name: m.org!.name,
                  film_title: s.film_title,
                  venue: s.venue,
                  start_time: s.start_time,
                  status: s.status,
                  film_poster_url: s.film_poster_url,
                });
              }
            });
          } catch {
            // continue
          }
        }
        results.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        setUpcoming(results.slice(0, 6));
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between border-b hair-line pb-6">
        <div>
          <div className="mono text-[11px] text-[color:var(--muted-foreground)]">
            // DASHBOARD
          </div>
          <h1 className="serif-title text-4xl md:text-5xl mt-2">今晚放什么？</h1>
        </div>
        <div className="mono text-[10px] text-[color:var(--muted-foreground)] text-right">
          <div>{new Date().toLocaleDateString('en-CA')}</div>
          <div>NO.{String(new Date().getDate()).padStart(3, '0')}</div>
        </div>
      </div>

      {/* Orgs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="mono text-[11px] text-[color:var(--muted-foreground)]">
            {'>'} MY SOCIETIES
          </h2>
          <Link
            href="/app/orgs"
            className="mono text-[11px] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
          >
            MANAGE →
          </Link>
        </div>
        {loading ? (
          <div className="mono text-xs text-[color:var(--muted-foreground)] dot-pulse py-8">
            ● LOADING
          </div>
        ) : memberships.length === 0 ? (
          <Frame label="EMPTY" className="p-12 text-center">
            <div className="mono text-[10px] text-[color:var(--muted-foreground)] mb-4">
              + + + + +
            </div>
            <p className="serif-title text-2xl mb-3">还没加入任何影协</p>
            <p className="text-sm text-[color:var(--muted-foreground)] mb-6">
              创建一个，或用邀请码加入。
            </p>
            <Link
              href="/app/orgs"
              className="mono text-[11px] inline-block px-6 py-3 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors"
            >
              GO TO ORGS →
            </Link>
          </Frame>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l hair-line">
            {memberships.map((m) => (
              <Link
                href={m.org ? `/app/orgs/${m.org.id}` : '#'}
                key={m.membership.id}
                className="border-b border-r hair-line p-6 hover:bg-[color:var(--muted)]/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
                    {m.membership.role.toUpperCase()}
                  </span>
                  <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
                    {m.membership.status === 'approved' ? (
                      <StatusDot status="ongoing" />
                    ) : m.membership.status === 'pending' ? (
                      <StatusDot status="published" />
                    ) : (
                      <StatusDot status="canceled" />
                    )}
                  </span>
                </div>
                <div className="serif-title text-2xl group-hover:italic transition-all">
                  {m.org?.name ?? '未知组织'}
                </div>
                {m.org?.school && (
                  <div className="mono text-[10px] text-[color:var(--muted-foreground)] mt-1">
                    {m.org.school.toUpperCase()}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="mono text-[10px] text-[color:var(--muted-foreground)] flex items-center gap-1.5">
                    <Users className="w-3 h-3" strokeWidth={1.5} /> {m.member_count} MEMBERS
                  </span>
                  <ArrowRight
                    className="w-4 h-4 text-[color:var(--muted-foreground)] group-hover:text-[color:var(--phosphor)] transition-colors"
                    strokeWidth={1.5}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="mono text-[11px] text-[color:var(--muted-foreground)]">
            {'>'} UPCOMING SCREENINGS
          </h2>
          <Link
            href="/app/screenings"
            className="mono text-[11px] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
          >
            ALL →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <Frame label="EMPTY" className="p-8 text-center">
            <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
              // 暂无即将开始的场次
            </div>
          </Frame>
        ) : (
          <div className="border-t border-l hair-line grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((s) => (
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
                  <div className="mono text-[10px] text-[color:var(--muted-foreground)] truncate">
                    {s.org_name.toUpperCase()}
                  </div>
                  <div className="serif-title text-lg mt-1 line-clamp-2">{s.film_title}</div>
                  <div className="mono text-[10px] text-[color:var(--muted-foreground)] mt-2 flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3" strokeWidth={1.5} />
                    {new Date(s.start_time).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                    @ {s.venue.toUpperCase()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
