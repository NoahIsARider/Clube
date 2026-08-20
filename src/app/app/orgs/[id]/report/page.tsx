/* eslint-disable react/jsx-no-comment-textnodes */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { authedFetch } from '@/lib/authed-fetch';
import { Frame } from '@/components/geek-ui';
import { toast } from 'sonner';
import { Trophy, Film, Users, PercentSquare } from 'lucide-react';

interface ReportResp {
  semester: string | null;
  available_semesters: string[];
  summary: {
    total_screenings: number;
    total_capacity: number;
    total_attended: number;
    occupancy_rate: number;
    best_film: { title: string; avg: number; count: number; poster: string | null } | null;
  };
  screenings: Array<{
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
  }>;
}

interface OrgLite {
  org: { id: string; name: string; slug: string } | null;
}

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const orgId = params.id;
  const [data, setData] = useState<ReportResp | null>(null);
  const [orgName, setOrgName] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (sem: string) => {
      setLoading(true);
      try {
        const q = sem ? `?semester=${encodeURIComponent(sem)}` : '';
        const d = await authedFetch<ReportResp>(`/api/orgs/${orgId}/report${q}`);
        setData(d);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [orgId]
  );

  useEffect(() => {
    (async () => {
      try {
        const d = await authedFetch<{ org: OrgLite['org'] }>(`/api/orgs/${orgId}`);
        setOrgName(d.org?.name ?? '');
      } catch {
        // ignore
      }
    })();
    load('');
  }, [orgId, load]);

  const applySemester = (s: string) => {
    setSemester(s);
    load(s);
  };

  return (
    <div className="space-y-8">
      <div className="border-b hair-line pb-6">
        <div className="mono text-[11px] text-[color:var(--muted-foreground)]">
          //{' '}
          <Link href={`/app/orgs/${orgId}`} className="hover:text-[color:var(--foreground)]">
            {orgName.toUpperCase() || 'ORG'}
          </Link>{' '}
          / REPORT
        </div>
        <h1 className="serif-title text-4xl md:text-5xl mt-2">学期放映总结</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-3 max-w-2xl leading-relaxed">
          从排片到复盘的全流程沉淀。数据基于本组织已发布场次的报名、签到与评分。
        </p>
      </div>

      {/* Semester Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mono text-[10px] text-[color:var(--muted-foreground)] mr-2">
          SEMESTER:
        </span>
        <button
          onClick={() => applySemester('')}
          className={`mono text-[11px] px-3 py-1.5 border hair-line transition-colors ${
            semester === ''
              ? 'border-[color:var(--phosphor)] text-[color:var(--phosphor)]'
              : 'text-[color:var(--muted-foreground)] hover:border-[color:var(--foreground)]'
          }`}
        >
          ALL
        </button>
        {data?.available_semesters.map((sem) => (
          <button
            key={sem}
            onClick={() => applySemester(sem)}
            className={`mono text-[11px] px-3 py-1.5 border hair-line transition-colors ${
              semester === sem
                ? 'border-[color:var(--phosphor)] text-[color:var(--phosphor)]'
                : 'text-[color:var(--muted-foreground)] hover:border-[color:var(--foreground)]'
            }`}
          >
            {sem}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mono text-xs text-[color:var(--muted-foreground)] dot-pulse py-12">
          ● COMPILING
        </div>
      ) : !data ? null : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-l hair-line">
            <KPI
              icon={<Film className="w-4 h-4" strokeWidth={1.5} />}
              label="SCREENINGS"
              value={data.summary.total_screenings}
              hint="本学期放映场次"
            />
            <KPI
              icon={<Users className="w-4 h-4" strokeWidth={1.5} />}
              label="ATTENDED"
              value={data.summary.total_attended}
              hint={`总入场人次`}
            />
            <KPI
              icon={<PercentSquare className="w-4 h-4" strokeWidth={1.5} />}
              label="OCCUPANCY"
              value={
                data.summary.total_capacity > 0
                  ? `${data.summary.occupancy_rate}%`
                  : '—'
              }
              hint={
                data.summary.total_capacity > 0
                  ? `${data.summary.total_attended} / ${data.summary.total_capacity} 席`
                  : '未设容量'
              }
            />
            <KPI
              icon={<Trophy className="w-4 h-4" strokeWidth={1.5} />}
              label="BEST FILM"
              value={
                data.summary.best_film
                  ? `${data.summary.best_film.avg}`
                  : '—'
              }
              hint={
                data.summary.best_film
                  ? `${data.summary.best_film.title} · ${data.summary.best_film.count} REV`
                  : '暂无评分'
              }
            />
          </div>

          {/* Best film hero */}
          {data.summary.best_film && (
            <Frame label="TOP RATED">
              <div className="p-6 flex flex-col md:flex-row items-start gap-6">
                {data.summary.best_film.poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.summary.best_film.poster}
                    alt={data.summary.best_film.title}
                    className="w-32 md:w-40 aspect-[2/3] object-cover border hair-line"
                  />
                ) : (
                  <div className="w-32 md:w-40 aspect-[2/3] border hair-line flex items-center justify-center mono text-3xl text-[color:var(--muted-foreground)]">
                    +
                  </div>
                )}
                <div className="flex-1">
                  <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                    // 全学期评分最高
                  </div>
                  <div className="serif-title text-3xl md:text-4xl mt-2">
                    {data.summary.best_film.title}
                  </div>
                  <div className="mt-4 flex items-end gap-4">
                    <div>
                      <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                        AVG SCORE
                      </div>
                      <div className="serif-title text-5xl">
                        {data.summary.best_film.avg}
                        <span className="text-lg text-[color:var(--muted-foreground)] ml-1">
                          / 10
                        </span>
                      </div>
                    </div>
                    <div className="mono text-[10px] text-[color:var(--muted-foreground)] pb-2">
                      · {data.summary.best_film.count} REVIEWS
                    </div>
                  </div>
                </div>
              </div>
            </Frame>
          )}

          {/* Per-Screening Table */}
          <div>
            <h2 className="mono text-[11px] text-[color:var(--muted-foreground)] mb-3">
              {'>'} DETAILS ({data.screenings.length})
            </h2>
            <Frame>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b hair-line">
                      <th className="text-left mono text-[10px] text-[color:var(--muted-foreground)] px-4 py-3">
                        DATE
                      </th>
                      <th className="text-left mono text-[10px] text-[color:var(--muted-foreground)] px-4 py-3">
                        FILM
                      </th>
                      <th className="text-left mono text-[10px] text-[color:var(--muted-foreground)] px-4 py-3">
                        VENUE
                      </th>
                      <th className="text-right mono text-[10px] text-[color:var(--muted-foreground)] px-4 py-3">
                        REG / CAP
                      </th>
                      <th className="text-right mono text-[10px] text-[color:var(--muted-foreground)] px-4 py-3">
                        ATTEND
                      </th>
                      <th className="text-right mono text-[10px] text-[color:var(--muted-foreground)] px-4 py-3">
                        SCORE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.screenings.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b hair-line hover:bg-[color:var(--muted)]/20"
                      >
                        <td className="px-4 py-3 mono text-[10px] text-[color:var(--muted-foreground)]">
                          {new Date(s.start_time).toLocaleDateString('en-CA')}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/app/screenings/${s.id}`}
                            className="serif-title text-base hover:italic transition-all"
                          >
                            {s.title}
                          </Link>
                          {s.director && (
                            <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                              {s.director}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 mono text-[10px] text-[color:var(--muted-foreground)]">
                          {s.venue.toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-right mono text-xs">
                          {s.signup_count}
                          <span className="text-[color:var(--muted-foreground)]">
                            {s.capacity > 0 ? ` / ${s.capacity}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right mono text-xs">
                          {s.attend_count}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {s.rating_count > 0 ? (
                            <div>
                              <span className="serif-title text-lg">{s.rating_avg}</span>
                              <span className="mono text-[10px] text-[color:var(--muted-foreground)] ml-1">
                                × {s.rating_count}
                              </span>
                            </div>
                          ) : (
                            <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {data.screenings.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-12 mono text-[10px] text-[color:var(--muted-foreground)]"
                        >
                          // 该学期还没有放映数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Frame>
          </div>
        </>
      )}
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="border-b border-r hair-line p-5">
      <div className="mono text-[10px] text-[color:var(--muted-foreground)] flex items-center gap-2">
        {icon} {label}
      </div>
      <div className="serif-title text-4xl mt-3">{value}</div>
      {hint && (
        <div className="mono text-[10px] text-[color:var(--muted-foreground)] mt-1">{hint}</div>
      )}
    </div>
  );
}
