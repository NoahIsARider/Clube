/* eslint-disable react/jsx-no-comment-textnodes */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authedFetch } from '@/lib/authed-fetch';
import { Frame, StatusDot } from '@/components/geek-ui';
import { toast } from 'sonner';
import { Users, KeyRound, Calendar as CalendarIcon, Copy, Trash2, Check, X } from 'lucide-react';

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  school: string | null;
  logo_url: string | null;
  join_policy: string;
  created_at: string;
  created_by: string;
}
interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  note: string | null;
  profile: { display_name: string; avatar_url: string | null };
}
interface Invite {
  id: string;
  code: string;
  role: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  created_at: string;
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

export default function OrgDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orgId = params.id;

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [tab, setTab] = useState<'schedule' | 'members' | 'invites' | 'settings'>('schedule');
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';
  const isCurator = role === 'admin' || role === 'officer';
  const isMember = role !== null;

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const d = await authedFetch<{
        org: OrgDetail;
        role: string | null;
        pending: boolean;
        member_count: number;
      }>(`/api/orgs/${orgId}`);
      setOrg(d.org);
      setRole(d.role);
      setPending(d.pending);
      setMemberCount(d.member_count);

      if (d.role) {
        const s = await authedFetch<{ screenings: Screening[] }>(`/api/orgs/${orgId}/screenings`);
        setScreenings(s.screenings);
        const m = await authedFetch<{ members: Member[] }>(`/api/orgs/${orgId}/members`);
        setMembers(m.members);
      }

      if (d.role === 'admin' || d.role === 'officer') {
        try {
          const inv = await authedFetch<{ invites: Invite[] }>(`/api/orgs/${orgId}/invites`);
          setInvites(inv.invites);
        } catch {
          // ignore
        }
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const applyJoin = async () => {
    try {
      await authedFetch(`/api/orgs/${orgId}/members`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success('已提交');
      loadAll();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const setMember = async (mid: string, patch: Record<string, string>) => {
    try {
      await authedFetch(`/api/orgs/${orgId}/members/${mid}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      toast.success('已更新');
      loadAll();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const removeMember = async (mid: string) => {
    if (!confirm('确认移除？')) return;
    try {
      await authedFetch(`/api/orgs/${orgId}/members/${mid}`, { method: 'DELETE' });
      toast.success('已移除');
      loadAll();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const createInvite = async (inviteRole: 'officer' | 'member') => {
    try {
      await authedFetch(`/api/orgs/${orgId}/invites`, {
        method: 'POST',
        body: JSON.stringify({ role: inviteRole, expires_in_days: 30 }),
      });
      toast.success('已生成');
      loadAll();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`已复制 ${code}`);
  };

  const leaveOrg = async () => {
    const me = members.find((m) => m.role !== 'admin');
    void me;
    const myMembership = members.find((m) => m.user_id !== 'x' /* placeholder */);
    void myMembership;
    if (!confirm('确认退出该组织？')) return;
    try {
      // 找到自己的成员记录
      const mineRes = await authedFetch<{ members: Member[] }>(`/api/orgs/${orgId}/members`);
      // 通过反向匹配自己 profile display_name 不准，改成 fetch me
      const meData = await authedFetch<{ id: string }>('/api/me');
      const mine = mineRes.members.find((x) => x.user_id === meData.id);
      if (!mine) return;
      await authedFetch(`/api/orgs/${orgId}/members/${mine.id}`, { method: 'DELETE' });
      toast.success('已退出');
      router.replace('/app/orgs');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="mono text-xs text-[color:var(--muted-foreground)] dot-pulse py-16 text-center">
        ● LOADING ORG
      </div>
    );
  }

  if (!org) {
    return (
      <Frame label="404" className="p-16 text-center">
        <div className="serif-title text-2xl">未找到该组织</div>
      </Frame>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b hair-line pb-6">
        <div className="mono text-[11px] text-[color:var(--muted-foreground)] mb-2">
          // ORG · {org.slug.toUpperCase()}
        </div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="serif-title text-4xl md:text-5xl">{org.name}</h1>
            {org.school && (
              <div className="mono text-[11px] text-[color:var(--muted-foreground)] mt-2">
                {org.school.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="mono text-[10px] text-[color:var(--muted-foreground)] flex items-center gap-1.5">
              <Users className="w-3 h-3" strokeWidth={1.5} /> {memberCount} MEMBERS
            </span>
            {role && (
              <span className="mono text-[10px] px-2 py-1 border hair-line">
                YOUR ROLE · {role.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        {org.description && (
          <p className="text-sm text-[color:var(--muted-foreground)] mt-4 max-w-3xl leading-relaxed">
            {org.description}
          </p>
        )}
        {!role && (
          <div className="mt-6 flex items-center gap-3">
            {pending ? (
              <span className="mono text-[11px] px-4 py-2 border hair-line text-[color:var(--amber)]">
                ● PENDING REVIEW
              </span>
            ) : org.join_policy === 'invite_only' ? (
              <span className="mono text-[11px] text-[color:var(--muted-foreground)]">
                该组织仅支持邀请码加入
              </span>
            ) : (
              <button
                onClick={applyJoin}
                className="mono text-[11px] px-6 py-2 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors"
              >
                {org.join_policy === 'open' ? 'JOIN →' : 'REQUEST TO JOIN →'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      {isMember && (
        <div className="border-b hair-line flex overflow-x-auto -mb-px">
          {[
            { key: 'schedule', label: 'SCHEDULE' },
            { key: 'members', label: 'MEMBERS' },
            ...(isCurator ? [{ key: 'invites' as const, label: 'INVITES' }] : []),
            ...(isAdmin ? [{ key: 'settings' as const, label: 'SETTINGS' }] : []),
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`mono text-[11px] px-5 py-3 border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-[color:var(--phosphor)] text-[color:var(--foreground)]'
                  : 'border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {isMember && tab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="mono text-[11px] text-[color:var(--muted-foreground)]">
              {'>'} SCREENINGS ({screenings.length})
            </h2>
            <div className="flex gap-2">
              <Link
                href={`/app/orgs/${org.id}/report`}
                className="mono text-[11px] px-4 py-2 border hair-line hover:border-[color:var(--foreground)] transition-colors"
              >
                REPORT →
              </Link>
              {isCurator && (
                <Link
                  href={`/app/screenings/new?org=${org.id}`}
                  className="mono text-[11px] px-4 py-2 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors"
                >
                  + NEW SCREENING
                </Link>
              )}
            </div>
          </div>
          {screenings.length === 0 ? (
            <Frame label="EMPTY" className="p-12 text-center">
              <div className="mono text-[10px] text-[color:var(--muted-foreground)]">// 还没有场次</div>
            </Frame>
          ) : (
            <div className="border-t border-l hair-line grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {screenings.map((s) => (
                <Link
                  key={s.id}
                  href={`/app/screenings/${s.id}`}
                  className="border-b border-r hair-line p-4 hover:bg-[color:var(--muted)]/30 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <StatusDot status={s.status} />
                    <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
                      {s.semester_tag ?? '—'}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    {s.film_poster_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.film_poster_url}
                        alt={s.film_title}
                        className="w-14 aspect-[2/3] object-cover border hair-line"
                      />
                    ) : (
                      <div className="w-14 aspect-[2/3] border hair-line flex items-center justify-center mono text-lg text-[color:var(--muted-foreground)]">
                        +
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="serif-title text-lg line-clamp-2">{s.film_title}</div>
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
                        })}
                      </div>
                      <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                        @ {s.venue.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="border-t hair-line mt-3 pt-2 flex items-center justify-between">
                    <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
                      {s.signup_count}{s.capacity > 0 ? ` / ${s.capacity}` : ''} REG · {s.attend_count} IN
                    </span>
                    <span className="mono text-[10px] group-hover:text-[color:var(--phosphor)] text-[color:var(--muted-foreground)] transition-colors">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {isMember && tab === 'members' && (
        <div className="space-y-4">
          <h2 className="mono text-[11px] text-[color:var(--muted-foreground)]">
            {'>'} MEMBERS ({members.length})
          </h2>
          <Frame>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b hair-line">
                  <th className="text-left mono text-[10px] text-[color:var(--muted-foreground)] px-4 py-3">NAME</th>
                  <th className="text-left mono text-[10px] text-[color:var(--muted-foreground)] px-4 py-3">ROLE</th>
                  <th className="text-left mono text-[10px] text-[color:var(--muted-foreground)] px-4 py-3">STATUS</th>
                  <th className="text-left mono text-[10px] text-[color:var(--muted-foreground)] px-4 py-3">JOINED</th>
                  {isAdmin && (
                    <th className="text-right mono text-[10px] text-[color:var(--muted-foreground)] px-4 py-3">ACTIONS</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b hair-line hover:bg-[color:var(--muted)]/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{m.profile.display_name}</div>
                      {m.note && (
                        <div className="text-[10px] text-[color:var(--muted-foreground)] mt-1">
                          「{m.note}」
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="mono text-[10px]">{m.role.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot
                        status={
                          m.status === 'approved'
                            ? 'ongoing'
                            : m.status === 'pending'
                            ? 'published'
                            : 'canceled'
                        }
                      />
                    </td>
                    <td className="px-4 py-3 mono text-[10px] text-[color:var(--muted-foreground)]">
                      {new Date(m.joined_at).toLocaleDateString('zh-CN')}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {m.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setMember(m.id, { status: 'approved' })}
                                className="mono text-[10px] px-2 py-1 border hair-line hover:border-[color:var(--phosphor)] hover:text-[color:var(--phosphor)] transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> OK
                              </button>
                              <button
                                onClick={() => setMember(m.id, { status: 'rejected' })}
                                className="mono text-[10px] px-2 py-1 border hair-line hover:border-[color:var(--destructive)] hover:text-[color:var(--destructive)] transition-colors flex items-center gap-1"
                              >
                                <X className="w-3 h-3" /> NO
                              </button>
                            </>
                          )}
                          {m.status === 'approved' && m.role !== 'admin' && (
                            <>
                              <select
                                value={m.role}
                                onChange={(e) => setMember(m.id, { role: e.target.value })}
                                className="mono text-[10px] bg-transparent border hair-line px-1 py-0.5"
                              >
                                <option value="member">MEMBER</option>
                                <option value="officer">OFFICER</option>
                                <option value="admin">ADMIN</option>
                              </select>
                              <button
                                onClick={() => removeMember(m.id)}
                                className="mono text-[10px] px-2 py-1 border hair-line hover:border-[color:var(--destructive)] hover:text-[color:var(--destructive)] transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="text-center py-12 mono text-[10px] text-[color:var(--muted-foreground)]">
                      // EMPTY
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Frame>
        </div>
      )}

      {isCurator && tab === 'invites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="mono text-[11px] text-[color:var(--muted-foreground)]">
              {'>'} INVITE CODES
            </h2>
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => createInvite('officer')}
                  className="mono text-[11px] px-4 py-2 border hair-line hover:border-[color:var(--foreground)] transition-colors"
                >
                  + OFFICER CODE
                </button>
              )}
              <button
                onClick={() => createInvite('member')}
                className="mono text-[11px] px-4 py-2 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors"
              >
                + MEMBER CODE
              </button>
            </div>
          </div>
          {invites.length === 0 ? (
            <Frame label="EMPTY" className="p-12 text-center">
              <div className="mono text-[10px] text-[color:var(--muted-foreground)]">还没有邀请码</div>
            </Frame>
          ) : (
            <div className="border-t border-l hair-line grid grid-cols-1 md:grid-cols-2">
              {invites.map((inv) => {
                const expired =
                  inv.expires_at && new Date(inv.expires_at).getTime() < Date.now();
                const usedUp = inv.max_uses > 0 && inv.used_count >= inv.max_uses;
                const active = !expired && !usedUp;
                return (
                  <div
                    key={inv.id}
                    className="border-b border-r hair-line p-5 flex items-center gap-4"
                  >
                    <KeyRound
                      className={`w-5 h-5 ${
                        active ? 'text-[color:var(--phosphor)]' : 'text-[color:var(--muted-foreground)]'
                      }`}
                      strokeWidth={1.5}
                    />
                    <div className="flex-1">
                      <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                        {inv.role.toUpperCase()} · {inv.used_count}/{inv.max_uses || '∞'}
                      </div>
                      <div className="mono text-lg tracking-[0.25em] mt-1 select-all">
                        {inv.code}
                      </div>
                      <div className="mono text-[10px] text-[color:var(--muted-foreground)] mt-1">
                        {expired
                          ? 'EXPIRED'
                          : inv.expires_at
                          ? `EXP ${new Date(inv.expires_at).toLocaleDateString('en-CA')}`
                          : 'NO EXPIRY'}
                      </div>
                    </div>
                    <button
                      onClick={() => copyCode(inv.code)}
                      className="mono text-[10px] px-3 py-2 border hair-line hover:border-[color:var(--phosphor)] transition-colors flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" strokeWidth={1.5} /> COPY
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isAdmin && tab === 'settings' && (
        <OrgSettings org={org} onChanged={loadAll} onLeave={leaveOrg} />
      )}
    </div>
  );
}

function OrgSettings({
  org,
  onChanged,
  onLeave,
}: {
  org: OrgDetail;
  onChanged: () => void;
  onLeave: () => void;
}) {
  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description ?? '');
  const [school, setSchool] = useState(org.school ?? '');
  const [joinPolicy, setJoinPolicy] = useState(org.join_policy);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await authedFetch(`/api/orgs/${org.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, description, school, join_policy: joinPolicy }),
      });
      toast.success('已保存');
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Frame label="SETTINGS">
      <div className="p-6 space-y-5">
        <div>
          <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">NAME</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border-b hair-line py-2 focus:outline-none focus:border-[color:var(--phosphor)]"
          />
        </div>
        <div>
          <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">SCHOOL</label>
          <input
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="w-full bg-transparent border-b hair-line py-2 focus:outline-none focus:border-[color:var(--phosphor)]"
          />
        </div>
        <div>
          <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
            DESCRIPTION
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-transparent border hair-line p-3 focus:outline-none focus:border-[color:var(--phosphor)]"
          />
        </div>
        <div>
          <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
            JOIN POLICY
          </label>
          <select
            value={joinPolicy}
            onChange={(e) => setJoinPolicy(e.target.value)}
            className="w-full bg-transparent border-b hair-line py-2 font-mono focus:outline-none focus:border-[color:var(--phosphor)]"
          >
            <option value="approval" className="bg-[color:var(--background)]">审核加入</option>
            <option value="invite_only" className="bg-[color:var(--background)]">仅邀请码</option>
            <option value="open" className="bg-[color:var(--background)]">开放加入</option>
          </select>
        </div>
        <div className="flex justify-between pt-4 border-t hair-line">
          <button
            onClick={onLeave}
            className="mono text-[11px] px-4 py-2 border hair-line hover:border-[color:var(--destructive)] hover:text-[color:var(--destructive)] transition-colors"
          >
            LEAVE ORG
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="mono text-[11px] px-6 py-2 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors disabled:opacity-50"
          >
            {saving ? '● SAVING' : 'SAVE →'}
          </button>
        </div>
      </div>
    </Frame>
  );
}
