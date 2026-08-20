import { getSupabaseClient } from '@/storage/database/supabase-client';

export type OrgRole = 'admin' | 'officer' | 'member';
export type OrgMemberStatus = 'pending' | 'approved' | 'rejected';

export interface OrgMembership {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  status: OrgMemberStatus;
}

/** 查询用户在指定组织的角色，未加入或未审核通过返回 null。 */
export async function getUserOrgRole(
  userId: string,
  orgId: string
): Promise<OrgRole | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('organization_members')
    .select('role, status')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .maybeSingle();
  if (error) throw new Error(`查询成员失败: ${error.message}`);
  if (!data) return null;
  if (data.status !== 'approved') return null;
  return data.role as OrgRole;
}

export function canManageOrg(role: OrgRole | null): boolean {
  return role === 'admin';
}

export function canCurate(role: OrgRole | null): boolean {
  return role === 'admin' || role === 'officer';
}

export function isMember(role: OrgRole | null): boolean {
  return role !== null;
}

export function randomCode(len: number): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  const suffix = randomCode(4).toLowerCase();
  return `${base || 'org'}-${suffix}`.slice(0, 60);
}
