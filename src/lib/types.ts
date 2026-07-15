export type RuntimeMode = 'demo' | 'supabase'

export type MemberRole = 'admin' | 'staff' | 'member'
export type JoinMethod = 'approval' | 'invite'
export type MemberStatus = 'pending' | 'approved'
export type ScreeningStatus = 'draft' | 'published' | 'closed'
export type RegistrationStatus = 'registered' | 'checked_in' | 'cancelled'
export type PostType = 'review' | 'notice'

export interface Organization {
  id: string
  name: string
  slug: string
  description: string
  inviteCode: string
  ownerUserId: string
  createdAt: string
}

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  name: string
  role: MemberRole
  joinMethod: JoinMethod
  status: MemberStatus
}

export interface Screening {
  id: string
  organizationId: string
  title: string
  subtitle: string
  venue: string
  startsAt: string
  capacity: number
  registrations: number
  posterUrl: string
  status: ScreeningStatus
  curatorNote: string
}

export interface FeedbackEntry {
  id: string
  screeningId: string
  rating: number
  comment: string
  createdAt: string
}

export interface Post {
  id: string
  organizationId: string
  screeningId?: string
  type: PostType
  title: string
  excerpt: string
  content: string
  author: string
  publishedAt: string
}

export interface DemoDataset {
  organizations: Organization[]
  members: OrganizationMember[]
  screenings: Screening[]
  feedbackEntries: FeedbackEntry[]
  posts: Post[]
}

export interface ExportDataset {
  screenings: Screening[]
  feedbackEntries: FeedbackEntry[]
  members: OrganizationMember[]
  posts: Post[]
}
