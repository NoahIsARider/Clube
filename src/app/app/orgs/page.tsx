/* eslint-disable react/jsx-no-comment-textnodes */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedFetch } from '@/lib/authed-fetch';
import { Frame, StatusDot } from '@/components/geek-ui';
import { toast } from 'sonner';
import { Plus, KeyRound, Users } from 'lucide-react';

interface Membership {
  membership: { id: string; org_id: string; role: string; status: string };
  org: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    school: string | null;
    logo_url: string | null;
    join_policy: string;
  } | null;
  member_count: number;
}

export default function OrgsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const [newName, setNewName] = useState('');
  const [newSchool, setNewSchool] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPolicy, setNewPolicy] = useState<'approval' | 'invite_only' | 'open'>('approval');

  const load = async () => {
    try {
      const data = await authedFetch<{ memberships: Membership[] }>('/api/orgs');
      setMemberships(data.memberships);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!newName.trim()) {
      toast.error('组织名称不能为空');
      return;
    }
    setCreating(true);
    try {
      await authedFetch('/api/orgs', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          school: newSchool,
          description: newDesc,
          join_policy: newPolicy,
        }),
      });
      toast.success('创建成功');
      setShowCreate(false);
      setNewName('');
      setNewSchool('');
      setNewDesc('');
      setNewPolicy('approval');
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const join = async () => {
    if (!inviteCode.trim()) {
      toast.error('请输入邀请码');
      return;
    }
    setJoining(true);
    try {
      const data = await authedFetch<{ org_id: string; role: string }>('/api/orgs/join', {
        method: 'POST',
        body: JSON.stringify({ code: inviteCode }),
      });
      toast.success(`加入成功 · 角色 ${data.role}`);
      setShowJoin(false);
      setInviteCode('');
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between border-b hair-line pb-6">
        <div>
          <div className="mono text-[11px] text-[color:var(--muted-foreground)]">// ORGS</div>
          <h1 className="serif-title text-4xl mt-2">我的影协</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowJoin((s) => !s)}
            className="mono text-[11px] px-4 py-2 border hair-line hover:border-[color:var(--foreground)] transition-colors flex items-center gap-2"
          >
            <KeyRound className="w-3.5 h-3.5" strokeWidth={1.5} /> JOIN BY CODE
          </button>
          <button
            onClick={() => setShowCreate((s) => !s)}
            className="mono text-[11px] px-4 py-2 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} /> CREATE
          </button>
        </div>
      </div>

      {showJoin && (
        <Frame label="JOIN BY INVITE CODE">
          <div className="p-5 flex gap-3">
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="输入 8 位邀请码"
              className="flex-1 bg-transparent border-b hair-line py-2 text-sm font-mono tracking-widest focus:outline-none focus:border-[color:var(--phosphor)]"
              maxLength={16}
            />
            <button
              onClick={join}
              disabled={joining}
              className="mono text-[11px] px-6 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors disabled:opacity-50"
            >
              {joining ? '● WAIT' : 'JOIN →'}
            </button>
          </div>
        </Frame>
      )}

      {showCreate && (
        <Frame label="CREATE ORGANIZATION">
          <div className="p-5 space-y-4">
            <div>
              <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                NAME *
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="XX 大学影协"
                className="w-full bg-transparent border-b hair-line py-2 text-sm focus:outline-none focus:border-[color:var(--phosphor)]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  SCHOOL
                </label>
                <input
                  value={newSchool}
                  onChange={(e) => setNewSchool(e.target.value)}
                  placeholder="XX 大学"
                  className="w-full bg-transparent border-b hair-line py-2 text-sm focus:outline-none focus:border-[color:var(--phosphor)]"
                />
              </div>
              <div>
                <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                  JOIN POLICY
                </label>
                <select
                  value={newPolicy}
                  onChange={(e) => setNewPolicy(e.target.value as typeof newPolicy)}
                  className="w-full bg-transparent border-b hair-line py-2 text-sm font-mono focus:outline-none focus:border-[color:var(--phosphor)]"
                >
                  <option value="approval" className="bg-[color:var(--background)]">审核加入</option>
                  <option value="invite_only" className="bg-[color:var(--background)]">仅邀请码</option>
                  <option value="open" className="bg-[color:var(--background)]">开放加入</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mono text-[10px] text-[color:var(--muted-foreground)] block mb-2">
                DESCRIPTION
              </label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                placeholder="放映理念、活动规划……"
                className="w-full bg-transparent border hair-line p-3 text-sm focus:outline-none focus:border-[color:var(--phosphor)]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="mono text-[11px] px-4 py-2 border hair-line hover:border-[color:var(--foreground)] transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={create}
                disabled={creating}
                className="mono text-[11px] px-6 py-2 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors disabled:opacity-50"
              >
                {creating ? '● CREATING' : 'CREATE →'}
              </button>
            </div>
          </div>
        </Frame>
      )}

      {loading ? (
        <div className="mono text-xs text-[color:var(--muted-foreground)] dot-pulse py-8">
          ● LOADING
        </div>
      ) : memberships.length === 0 ? (
        <Frame label="EMPTY" className="p-16 text-center">
          <div className="mono text-[10px] text-[color:var(--muted-foreground)] mb-4">+ + +</div>
          <p className="serif-title text-3xl mb-3 italic">还没加入影协</p>
          <p className="text-sm text-[color:var(--muted-foreground)]">用上方按钮创建或加入。</p>
        </Frame>
      ) : (
        <div className="border-t border-l hair-line grid grid-cols-1 md:grid-cols-2">
          {memberships.map((m) => (
            <Link
              key={m.membership.id}
              href={m.org ? `/app/orgs/${m.org.id}` : '#'}
              className="border-b border-r hair-line p-6 hover:bg-[color:var(--muted)]/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
                  {m.membership.role.toUpperCase()}
                </span>
                {m.membership.status === 'approved' ? (
                  <StatusDot status="ongoing" />
                ) : m.membership.status === 'pending' ? (
                  <StatusDot status="published" />
                ) : (
                  <StatusDot status="canceled" />
                )}
              </div>
              <div className="serif-title text-2xl mt-2">{m.org?.name ?? '未知'}</div>
              {m.org?.school && (
                <div className="mono text-[10px] text-[color:var(--muted-foreground)] mt-0.5">
                  {m.org.school.toUpperCase()}
                </div>
              )}
              {m.org?.description && (
                <p className="text-sm text-[color:var(--muted-foreground)] mt-3 line-clamp-2 leading-relaxed">
                  {m.org.description}
                </p>
              )}
              <div className="mt-4 pt-4 border-t hair-line flex items-center justify-between">
                <span className="mono text-[10px] text-[color:var(--muted-foreground)] flex items-center gap-1.5">
                  <Users className="w-3 h-3" strokeWidth={1.5} /> {m.member_count} MEMBERS
                </span>
                <span className="mono text-[10px] text-[color:var(--muted-foreground)] group-hover:text-[color:var(--phosphor)] transition-colors">
                  ENTER →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
