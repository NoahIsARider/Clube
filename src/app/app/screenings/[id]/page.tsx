/* eslint-disable react/jsx-no-comment-textnodes */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { authedFetch } from '@/lib/authed-fetch';
import { Frame, StatusDot } from '@/components/geek-ui';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Star,
  Trash2,
  Edit3,
  QrCode,
  LogIn,
} from 'lucide-react';

interface Screening {
  id: string;
  org_id: string;
  film_title: string;
  film_director: string | null;
  film_year: number | null;
  film_country: string | null;
  film_poster_url: string | null;
  synopsis: string | null;
  curator_note: string | null;
  venue: string;
  start_time: string;
  end_time: string | null;
  capacity: number;
  status: string;
  semester_tag: string | null;
  checkin_code: string;
  created_by: string;
  created_at: string;
}
interface Signup {
  id: string;
  user_id: string;
  waitlisted: boolean;
  created_at: string;
  profile: { display_name: string };
}
interface Rating {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
}
interface Attendance {
  id: string;
  user_id: string;
  checked_in_at: string;
}
interface DetailResp {
  screening: Screening;
  org: { id: string; name: string; slug: string };
  role: string | null;
  my_signup: Signup | null;
  my_attendance: Attendance | null;
  my_rating: Rating | null;
  signups: Signup[];
  attendances: Attendance[];
  ratings: Rating[];
  stats: { signup_count: number; attend_count: number; avg_rating: number | null; rating_count: number };
}

const FILM_STATUS: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  ongoing: '进行中',
  finished: '已结束',
  canceled: '已取消',
};

export default function ScreeningDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sid = params.id;
  const [data, setData] = useState<DetailResp | null>(null);
  const [loading, setLoading] = useState(true);
  const autoTriedRef = useState<{ v: string | null }>({ v: null })[0];

  const load = useCallback(async () => {
    try {
      const d = await authedFetch<DetailResp>(`/api/screenings/${sid}`);
      setData(d);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [sid]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto check-in when URL contains ?ci=CODE (from QR scan)
  useEffect(() => {
    if (!data) return;
    const ci = searchParams.get('ci');
    if (!ci) return;
    if (autoTriedRef.v === ci) return;
    autoTriedRef.v = ci;
    if (data.my_attendance) {
      toast.info('你已完成签到');
      return;
    }
    if (data.role === null) {
      toast.error('请先加入该组织再签到');
      return;
    }
    (async () => {
      try {
        await authedFetch(`/api/screenings/${sid}/checkin`, {
          method: 'POST',
          body: JSON.stringify({ code: ci }),
        });
        toast.success('签到成功');
        // Clean the URL
        router.replace(`/app/screenings/${sid}`);
        load();
      } catch (e) {
        toast.error((e as Error).message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, searchParams]);

  if (loading) {
    return (
      <div className="mono text-xs text-[color:var(--muted-foreground)] dot-pulse py-16 text-center">
        ● LOADING SCREENING
      </div>
    );
  }
  if (!data) {
    return (
      <Frame label="404" className="p-16 text-center">
        <div className="serif-title text-2xl">未找到该场次</div>
      </Frame>
    );
  }

  const { screening: s, org, role, my_signup, my_attendance, my_rating, stats } = data;
  const isCurator = role === 'admin' || role === 'officer';
  const isMember = role !== null;
  const isMemberRegular = role === 'member' || role === 'officer' || role === 'admin';
  const startAt = new Date(s.start_time);
  const now = Date.now();
  const started = now >= startAt.getTime();
  const finished = s.status === 'finished' || (s.end_time ? now >= new Date(s.end_time).getTime() : false);
  const canSignup =
    isMemberRegular &&
    !my_signup &&
    !started &&
    (s.status === 'published' || s.status === 'ongoing') &&
    (s.capacity === 0 || stats.signup_count < s.capacity);
  const canCheckin =
    isMemberRegular &&
    !my_attendance &&
    started &&
    !finished &&
    (s.status === 'published' || s.status === 'ongoing');
  const canRate = isMemberRegular && (finished || started) && !my_rating;

  const doSignup = async () => {
    try {
      await authedFetch(`/api/screenings/${sid}/signup`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success('已报名');
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const cancelSignup = async () => {
    try {
      await authedFetch(`/api/screenings/${sid}/signup`, { method: 'DELETE' });
      toast.success('已取消');
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const patchStatus = async (newStatus: string) => {
    try {
      await authedFetch(`/api/screenings/${sid}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success('已更新');
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const del = async () => {
    if (!confirm('删除该场次？此操作不可逆')) return;
    try {
      await authedFetch(`/api/screenings/${sid}`, { method: 'DELETE' });
      toast.success('已删除');
      router.replace(`/app/orgs/${org.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b hair-line pb-6">
        <div className="mono text-[11px] text-[color:var(--muted-foreground)]">
          //{' '}
          <Link href={`/app/orgs/${org.id}`} className="hover:text-[color:var(--foreground)]">
            {org.name.toUpperCase()}
          </Link>{' '}
          / SCREENING · {s.semester_tag ?? '—'}
        </div>
        <div className="mt-4 flex flex-col md:flex-row gap-6 md:items-end justify-between">
          <div className="flex gap-6 flex-1 min-w-0">
            {s.film_poster_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.film_poster_url}
                alt={s.film_title}
                className="w-28 md:w-36 aspect-[2/3] object-cover border hair-line flex-shrink-0"
              />
            ) : (
              <div className="w-28 md:w-36 aspect-[2/3] border hair-line flex items-center justify-center mono text-3xl text-[color:var(--muted-foreground)] flex-shrink-0">
                +
              </div>
            )}
            <div className="min-w-0">
              <h1 className="serif-title text-3xl md:text-5xl leading-tight">{s.film_title}</h1>
              <div className="mono text-[11px] text-[color:var(--muted-foreground)] mt-3">
                {s.film_director ?? '—'}
                {s.film_year ? ` · ${s.film_year}` : ''}
                {s.film_country ? ` · ${s.film_country}` : ''}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span className="mono text-xs text-[color:var(--muted-foreground)] flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {startAt.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="mono text-xs text-[color:var(--muted-foreground)] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {s.venue}
                </span>
                <span className="mono text-xs text-[color:var(--muted-foreground)] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {stats.signup_count}
                  {s.capacity > 0 ? ` / ${s.capacity}` : ''}
                </span>
                <StatusDot status={s.status} />
              </div>
            </div>
          </div>
          {isCurator && (
            <div className="flex gap-2 flex-shrink-0">
              <select
                value={s.status}
                onChange={(e) => patchStatus(e.target.value)}
                className="mono text-[11px] bg-transparent border hair-line px-3 py-2 focus:outline-none focus:border-[color:var(--phosphor)]"
              >
                {Object.entries(FILM_STATUS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-[color:var(--background)]">
                    {v}
                  </option>
                ))}
              </select>
              <button
                onClick={del}
                className="mono text-[11px] px-3 py-2 border hair-line hover:border-[color:var(--destructive)] hover:text-[color:var(--destructive)] transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      {s.synopsis && (
        <Frame label="SYNOPSIS">
          <p className="p-5 text-sm leading-relaxed whitespace-pre-wrap">{s.synopsis}</p>
        </Frame>
      )}

      {s.curator_note && (
        <Frame label="CURATOR NOTE">
          <p className="p-5 text-sm leading-relaxed whitespace-pre-wrap italic">{s.curator_note}</p>
        </Frame>
      )}

      {/* Actions */}
      {isMemberRegular && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l hair-line">
          {/* Signup */}
          <div className="border-b border-r hair-line p-6">
            <div className="mono text-[11px] text-[color:var(--muted-foreground)] mb-3">
              [01] REGISTER
            </div>
            {my_signup ? (
              <div>
                <div className="serif-title text-2xl mb-1">
                  {my_signup.waitlisted ? '候补中' : '已报名'}
                </div>
                <div className="mono text-[10px] text-[color:var(--muted-foreground)] mb-4">
                  {new Date(my_signup.created_at).toLocaleString('zh-CN')}
                </div>
                {!started && (
                  <button
                    onClick={cancelSignup}
                    className="mono text-[11px] px-4 py-2 border hair-line hover:border-[color:var(--destructive)] hover:text-[color:var(--destructive)] transition-colors"
                  >
                    CANCEL SIGNUP
                  </button>
                )}
              </div>
            ) : canSignup ? (
              <div>
                <div className="serif-title text-2xl mb-3">现在报名</div>
                <button
                  onClick={doSignup}
                  className="mono text-[11px] px-6 py-2 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors"
                >
                  SIGN UP →
                </button>
              </div>
            ) : (
              <div>
                <div className="serif-title text-2xl mb-1 text-[color:var(--muted-foreground)]">
                  已关闭
                </div>
                <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                  {started ? '已开场' : s.capacity > 0 && stats.signup_count >= s.capacity ? '名额已满' : '未开放'}
                </div>
              </div>
            )}
          </div>

          {/* Check-in */}
          <div className="border-b border-r hair-line p-6">
            <div className="mono text-[11px] text-[color:var(--muted-foreground)] mb-3">
              [02] CHECK-IN
            </div>
            {my_attendance ? (
              <div>
                <div className="serif-title text-2xl mb-1">已签到</div>
                <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                  {new Date(my_attendance.checked_in_at).toLocaleString('zh-CN')}
                </div>
              </div>
            ) : canCheckin ? (
              <CheckinBox sid={sid} onDone={load} />
            ) : (
              <div>
                <div className="serif-title text-2xl mb-1 text-[color:var(--muted-foreground)]">
                  待开放
                </div>
                <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                  开场后可签到
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="border-b border-r hair-line p-6">
            <div className="mono text-[11px] text-[color:var(--muted-foreground)] mb-3">
              [03] REVIEW
            </div>
            {my_rating ? (
              <div>
                <div className="serif-title text-2xl mb-1">
                  {my_rating.rating}
                  <span className="text-sm text-[color:var(--muted-foreground)] ml-1">/ 10</span>
                </div>
                {my_rating.review && (
                  <p className="text-xs text-[color:var(--muted-foreground)] mt-2 line-clamp-3">
                    「{my_rating.review}」
                  </p>
                )}
                <div className="mono text-[10px] text-[color:var(--muted-foreground)] mt-2">
                  匿名 · 已提交
                </div>
              </div>
            ) : canRate ? (
              <RatingBox sid={sid} onDone={load} />
            ) : (
              <div>
                <div className="serif-title text-2xl mb-1 text-[color:var(--muted-foreground)]">
                  待开放
                </div>
                <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                  开场后可评分
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isMember && (
        <Frame label="AUTH REQUIRED" className="p-8 text-center">
          <div className="mono text-[10px] text-[color:var(--muted-foreground)] mb-3">
            // 需加入{org.name}后才能报名
          </div>
          <Link
            href={`/app/orgs/${org.id}`}
            className="mono text-[11px] px-4 py-2 border hair-line inline-block hover:border-[color:var(--foreground)] transition-colors"
          >
            GO TO ORG →
          </Link>
        </Frame>
      )}

      {/* Curator: QR code + signups + attendances */}
      {isCurator && (
        <CuratorPanel data={data} />
      )}

      {/* Public: ratings summary */}
      <RatingsSummary stats={stats} ratings={data.ratings} />
    </div>
  );
}

function CheckinBox({ sid, onDone }: { sid: string; onDone: () => void }) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!code.trim()) {
      toast.error('输入签到码');
      return;
    }
    setSubmitting(true);
    try {
      await authedFetch(`/api/screenings/${sid}/checkin`, {
        method: 'POST',
        body: JSON.stringify({ code: code.trim() }),
      });
      toast.success('签到成功');
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div>
      <div className="serif-title text-2xl mb-3">输入签到码</div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="6 位"
          className="flex-1 bg-transparent border-b hair-line py-2 mono tracking-widest focus:outline-none focus:border-[color:var(--phosphor)]"
          maxLength={16}
        />
        <button
          onClick={submit}
          disabled={submitting}
          className="mono text-[11px] px-4 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <LogIn className="w-3 h-3" /> {submitting ? '...' : 'IN'}
        </button>
      </div>
      <div className="mono text-[10px] text-[color:var(--muted-foreground)] mt-2">
        或让干事扫你的邀请码
      </div>
    </div>
  );
}

function RatingBox({ sid, onDone }: { sid: string; onDone: () => void }) {
  const [rating, setRating] = useState<number>(8);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    setSubmitting(true);
    try {
      await authedFetch(`/api/screenings/${sid}/ratings`, {
        method: 'POST',
        body: JSON.stringify({ rating, review }),
      });
      toast.success('已提交（匿名）');
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div>
      <div className="serif-title text-2xl mb-3">
        {rating}
        <span className="text-sm text-[color:var(--muted-foreground)] ml-1">/ 10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="w-full accent-[color:var(--phosphor)]"
      />
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="短评（匿名）"
        rows={2}
        maxLength={280}
        className="w-full mt-3 bg-transparent border hair-line p-2 text-xs focus:outline-none focus:border-[color:var(--phosphor)]"
      />
      <button
        onClick={submit}
        disabled={submitting}
        className="w-full mt-2 mono text-[11px] px-4 py-2 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
      >
        <Star className="w-3 h-3" /> {submitting ? '...' : 'SUBMIT ANONYMOUSLY'}
      </button>
    </div>
  );
}

function CuratorPanel({ data }: { data: DetailResp }) {
  const [showQR, setShowQR] = useState(true);
  const s = data.screening;
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const qrPayload = origin
    ? `${origin}/app/screenings/${s.id}?ci=${s.checkin_code}`
    : s.checkin_code;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-t hair-line pt-8">
        <h2 className="mono text-[11px] text-[color:var(--muted-foreground)]">
          {'>'} CURATOR PANEL
        </h2>
        <Link
          href={`/app/screenings/${s.id}/scan`}
          className="mono text-[11px] px-4 py-2 border hair-line hover:border-[color:var(--foreground)] transition-colors flex items-center gap-1.5"
        >
          <QrCode className="w-3.5 h-3.5" strokeWidth={1.5} /> OPEN SCANNER
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-l hair-line">
        <div className="border-b border-r hair-line p-6">
          <div className="mono text-[11px] text-[color:var(--muted-foreground)] mb-3 flex items-center justify-between">
            <span>CHECK-IN QR</span>
            <button
              onClick={() => setShowQR((v) => !v)}
              className="mono text-[10px] px-2 py-0.5 border hair-line hover:border-[color:var(--foreground)] transition-colors"
            >
              {showQR ? 'HIDE' : 'SHOW'}
            </button>
          </div>
          {showQR ? (
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="p-3 bg-white">
                <QRCodeSVG value={qrPayload} size={144} level="M" />
              </div>
              <div className="flex-1">
                <div className="mono text-[10px] text-[color:var(--muted-foreground)] mb-2">
                  CODE
                </div>
                <div className="serif-title text-4xl tracking-[0.25em] mb-3 select-all">
                  {s.checkin_code}
                </div>
                <div className="mono text-[10px] text-[color:var(--muted-foreground)] leading-relaxed">
                  成员到场后：<br />
                  · 扫此 QR 自动签到<br />
                  · 或在页面输入 6 位签到码
                </div>
              </div>
            </div>
          ) : (
            <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
              // 隐藏中，避免提前泄露
            </div>
          )}
        </div>

        <div className="border-b border-r hair-line p-6">
          <div className="mono text-[11px] text-[color:var(--muted-foreground)] mb-3">STATS</div>
          <div className="grid grid-cols-3 gap-4">
            <StatBox label="REG" value={data.stats.signup_count} />
            <StatBox label="IN" value={data.stats.attend_count} />
            <StatBox
              label="AVG"
              value={data.stats.avg_rating !== null ? data.stats.avg_rating.toFixed(1) : '—'}
              hint={`${data.stats.rating_count} REVIEWS`}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mono text-[11px] text-[color:var(--muted-foreground)] mb-3">
          {'>'} SIGNUPS ({data.signups.length})
        </h3>
        <Frame>
          {data.signups.length === 0 ? (
            <div className="p-6 mono text-[10px] text-[color:var(--muted-foreground)] text-center">
              // NO REGISTRATIONS YET
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--hair)]">
              {data.signups.map((sg, idx) => {
                const attended = data.attendances.find((a) => a.user_id === sg.user_id);
                return (
                  <div key={sg.id} className="px-4 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="mono text-[10px] text-[color:var(--muted-foreground)] w-6">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span>{sg.profile.display_name}</span>
                      {sg.waitlisted && (
                        <span className="mono text-[10px] text-[color:var(--amber)]">WAITLIST</span>
                      )}
                    </div>
                    <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                      {attended ? (
                        <span className="text-[color:var(--phosphor)]">
                          ● IN {new Date(attended.checked_in_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span>NOT YET</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Frame>
      </div>
    </div>
  );
}

function StatBox({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div>
      <div className="mono text-[10px] text-[color:var(--muted-foreground)]">{label}</div>
      <div className="serif-title text-3xl mt-1">{value}</div>
      {hint && (
        <div className="mono text-[9px] text-[color:var(--muted-foreground)] mt-1">{hint}</div>
      )}
    </div>
  );
}

function RatingsSummary({
  stats,
  ratings,
}: {
  stats: DetailResp['stats'];
  ratings: Rating[];
}) {
  if (stats.rating_count === 0)
    return (
      <div className="border-t hair-line pt-8">
        <h2 className="mono text-[11px] text-[color:var(--muted-foreground)] mb-4">
          {'>'} ANONYMOUS REVIEWS
        </h2>
        <Frame label="EMPTY" className="p-8 text-center">
          <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
            // 还没有观影反馈
          </div>
        </Frame>
      </div>
    );

  return (
    <div className="border-t hair-line pt-8 space-y-4">
      <div className="flex items-end justify-between">
        <h2 className="mono text-[11px] text-[color:var(--muted-foreground)]">
          {'>'} ANONYMOUS REVIEWS ({stats.rating_count})
        </h2>
        {stats.avg_rating !== null && (
          <div className="text-right">
            <div className="mono text-[10px] text-[color:var(--muted-foreground)]">AVG</div>
            <div className="serif-title text-4xl">{stats.avg_rating.toFixed(1)}</div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-l hair-line">
        {ratings
          .filter((r) => r.review)
          .map((r) => (
            <div key={r.id} className="border-b border-r hair-line p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="serif-title text-xl">
                  {r.rating}
                  <span className="text-xs text-[color:var(--muted-foreground)] ml-1">/ 10</span>
                </span>
                <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
                  {new Date(r.created_at).toLocaleDateString('en-CA')}
                </span>
              </div>
              <p className="text-sm leading-relaxed">「{r.review}」</p>
            </div>
          ))}
        {ratings.filter((r) => r.review).length === 0 && (
          <div className="border-b border-r hair-line p-5 text-sm text-[color:var(--muted-foreground)]">
            // 有 {stats.rating_count} 个评分但没有留下短评
          </div>
        )}
      </div>
    </div>
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unused = Edit3;
