/* eslint-disable react/jsx-no-comment-textnodes */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authedFetch } from '@/lib/authed-fetch';
import { Frame } from '@/components/geek-ui';
import { toast } from 'sonner';

interface OrgOption {
  membership: { role: string; status: string };
  org: { id: string; name: string } | null;
}

export default function NewScreeningPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const defaultOrg = sp.get('org') ?? '';

  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [orgId, setOrgId] = useState(defaultOrg);
  const [filmTitle, setFilmTitle] = useState('');
  const [filmDirector, setFilmDirector] = useState('');
  const [filmYear, setFilmYear] = useState<string>('');
  const [filmCountry, setFilmCountry] = useState('');
  const [filmPoster, setFilmPoster] = useState('');
  const [venue, setVenue] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState<string>('');
  const [semester, setSemester] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [curatorNote, setCuratorNote] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const d = await authedFetch<{ memberships: OrgOption[] }>('/api/orgs');
      const eligible = d.memberships.filter(
        (m) => (m.membership.role === 'admin' || m.membership.role === 'officer') && m.membership.status === 'approved'
      );
      setOrgs(eligible);
      if (!orgId && eligible[0]?.org) setOrgId(eligible[0].org.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (!orgId || !filmTitle || !venue || !startTime) {
      toast.error('请填写必填项');
      return;
    }
    setSubmitting(true);
    try {
      const created = await authedFetch<{ screening: { id: string } }>(
        `/api/orgs/${orgId}/screenings`,
        {
          method: 'POST',
          body: JSON.stringify({
            film_title: filmTitle,
            film_director: filmDirector || null,
            film_year: filmYear ? Number(filmYear) : null,
            film_country: filmCountry || null,
            film_poster_url: filmPoster || null,
            venue,
            start_time: new Date(startTime).toISOString(),
            end_time: endTime ? new Date(endTime).toISOString() : null,
            capacity: capacity ? Number(capacity) : 0,
            semester_tag: semester || null,
            synopsis: synopsis || null,
            curator_note: curatorNote || null,
            status,
          }),
        }
      );
      toast.success('已发布');
      router.replace(`/app/screenings/${created.screening.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="border-b hair-line pb-6">
        <div className="mono text-[11px] text-[color:var(--muted-foreground)]">// NEW SCREENING</div>
        <h1 className="serif-title text-4xl mt-2">新建放映</h1>
      </div>

      {orgs.length === 0 ? (
        <Frame label="EMPTY" className="p-12 text-center">
          <div className="mono text-[10px] text-[color:var(--muted-foreground)] mb-3">
            // 你还不是任何组织的干事/管理员
          </div>
          <Link
            href="/app/orgs"
            className="mono text-[11px] px-4 py-2 border hair-line inline-block hover:border-[color:var(--foreground)] transition-colors"
          >
            GO TO ORGS →
          </Link>
        </Frame>
      ) : (
        <Frame label="INPUT">
          <div className="p-6 space-y-5">
            <div>
              <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                ORGANIZATION *
              </label>
              <select
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="w-full bg-transparent border-b hair-line py-2 font-mono focus:outline-none focus:border-[color:var(--phosphor)]"
              >
                {orgs.map(
                  (o) =>
                    o.org && (
                      <option key={o.org.id} value={o.org.id} className="bg-[color:var(--background)]">
                        {o.org.name}
                      </option>
                    )
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  FILM TITLE *
                </label>
                <input
                  value={filmTitle}
                  onChange={(e) => setFilmTitle(e.target.value)}
                  placeholder="花样年华"
                  className="w-full bg-transparent border-b hair-line py-2 focus:outline-none focus:border-[color:var(--phosphor)]"
                />
              </div>
              <div>
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  DIRECTOR
                </label>
                <input
                  value={filmDirector}
                  onChange={(e) => setFilmDirector(e.target.value)}
                  placeholder="王家卫"
                  className="w-full bg-transparent border-b hair-line py-2 focus:outline-none focus:border-[color:var(--phosphor)]"
                />
              </div>
              <div>
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  YEAR
                </label>
                <input
                  value={filmYear}
                  onChange={(e) => setFilmYear(e.target.value)}
                  type="number"
                  placeholder="2000"
                  className="w-full bg-transparent border-b hair-line py-2 font-mono focus:outline-none focus:border-[color:var(--phosphor)]"
                />
              </div>
              <div>
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  COUNTRY
                </label>
                <input
                  value={filmCountry}
                  onChange={(e) => setFilmCountry(e.target.value)}
                  placeholder="中国香港"
                  className="w-full bg-transparent border-b hair-line py-2 focus:outline-none focus:border-[color:var(--phosphor)]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  POSTER URL
                </label>
                <input
                  value={filmPoster}
                  onChange={(e) => setFilmPoster(e.target.value)}
                  placeholder="https://…jpg"
                  className="w-full bg-transparent border-b hair-line py-2 font-mono text-xs focus:outline-none focus:border-[color:var(--phosphor)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  VENUE *
                </label>
                <input
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="人文楼 302"
                  className="w-full bg-transparent border-b hair-line py-2 focus:outline-none focus:border-[color:var(--phosphor)]"
                />
              </div>
              <div>
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  CAPACITY
                </label>
                <input
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  type="number"
                  placeholder="0 (不限)"
                  className="w-full bg-transparent border-b hair-line py-2 font-mono focus:outline-none focus:border-[color:var(--phosphor)]"
                />
              </div>
              <div>
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  START TIME *
                </label>
                <input
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  type="datetime-local"
                  className="w-full bg-transparent border-b hair-line py-2 font-mono focus:outline-none focus:border-[color:var(--phosphor)]"
                />
              </div>
              <div>
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  END TIME
                </label>
                <input
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  type="datetime-local"
                  className="w-full bg-transparent border-b hair-line py-2 font-mono focus:outline-none focus:border-[color:var(--phosphor)]"
                />
              </div>
              <div>
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  SEMESTER TAG
                </label>
                <input
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="2024-秋"
                  className="w-full bg-transparent border-b hair-line py-2 font-mono focus:outline-none focus:border-[color:var(--phosphor)]"
                />
              </div>
              <div>
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  STATUS
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                  className="w-full bg-transparent border-b hair-line py-2 font-mono focus:outline-none focus:border-[color:var(--phosphor)]"
                >
                  <option value="published" className="bg-[color:var(--background)]">发布</option>
                  <option value="draft" className="bg-[color:var(--background)]">草稿</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                SYNOPSIS
              </label>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                rows={3}
                placeholder="影片简介、放映主题……"
                className="w-full bg-transparent border hair-line p-3 focus:outline-none focus:border-[color:var(--phosphor)]"
              />
            </div>

            <div>
              <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                CURATOR NOTE
              </label>
              <textarea
                value={curatorNote}
                onChange={(e) => setCuratorNote(e.target.value)}
                rows={3}
                placeholder="策展语、观影提示、映后交流……"
                className="w-full bg-transparent border hair-line p-3 focus:outline-none focus:border-[color:var(--phosphor)]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t hair-line">
              <button
                onClick={() => router.back()}
                className="mono text-[11px] px-4 py-2 border hair-line hover:border-[color:var(--foreground)] transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="mono text-[11px] px-6 py-2 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors disabled:opacity-50"
              >
                {submitting ? '● PUBLISHING' : 'PUBLISH →'}
              </button>
            </div>
          </div>
        </Frame>
      )}
    </div>
  );
}
