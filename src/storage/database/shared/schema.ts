import { sql } from "drizzle-orm";
import { pgTable, serial, text, varchar, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";

// 系统表：禁止删除
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// 用户资料（与 auth.users 关联，id 使用 auth user id）
export const profiles = pgTable(
  "profiles",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    display_name: varchar("display_name", { length: 64 }).notNull(),
    avatar_url: text("avatar_url"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("profiles_display_name_idx").on(table.display_name)]
);

// 组织（影协）
export const organizations = pgTable(
  "organizations",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 128 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    description: text("description"),
    logo_url: text("logo_url"),
    school: varchar("school", { length: 128 }),
    join_policy: varchar("join_policy", { length: 16 }).notNull().default("approval"), // approval | invite_only | open
    created_by: varchar("created_by", { length: 64 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("organizations_created_by_idx").on(table.created_by),
    index("organizations_slug_idx").on(table.slug),
  ]
);

// 组织成员
export const organization_members = pgTable(
  "organization_members",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    org_id: varchar("org_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    user_id: varchar("user_id", { length: 64 }).notNull(),
    role: varchar("role", { length: 16 }).notNull().default("member"), // admin | officer | member
    status: varchar("status", { length: 16 }).notNull().default("pending"), // pending | approved | rejected
    note: text("note"),
    joined_at: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organization_members_org_user_uniq").on(table.org_id, table.user_id),
    index("organization_members_org_id_idx").on(table.org_id),
    index("organization_members_user_id_idx").on(table.user_id),
    index("organization_members_status_idx").on(table.status),
  ]
);

// 邀请码
export const invite_codes = pgTable(
  "invite_codes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    org_id: varchar("org_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 32 }).notNull().unique(),
    role: varchar("role", { length: 16 }).notNull().default("member"), // 加入后授予的角色
    max_uses: integer("max_uses").notNull().default(0), // 0 = 无限
    used_count: integer("used_count").notNull().default(0),
    expires_at: timestamp("expires_at", { withTimezone: true }),
    created_by: varchar("created_by", { length: 64 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("invite_codes_org_id_idx").on(table.org_id),
    index("invite_codes_code_idx").on(table.code),
  ]
);

// 排片
export const screenings = pgTable(
  "screenings",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    org_id: varchar("org_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    film_title: varchar("film_title", { length: 200 }).notNull(),
    film_director: varchar("film_director", { length: 128 }),
    film_year: integer("film_year"),
    film_country: varchar("film_country", { length: 64 }),
    film_duration: integer("film_duration"), // 分钟
    film_poster_url: text("film_poster_url"),
    synopsis: text("synopsis"),
    curator_note: text("curator_note"), // 策展语
    venue: varchar("venue", { length: 128 }).notNull(),
    start_time: timestamp("start_time", { withTimezone: true }).notNull(),
    end_time: timestamp("end_time", { withTimezone: true }),
    capacity: integer("capacity").notNull().default(0), // 0 = 不限
    status: varchar("status", { length: 16 }).notNull().default("draft"), // draft | published | ongoing | finished | canceled
    semester_tag: varchar("semester_tag", { length: 32 }), // 例如 2025-Spring
    checkin_code: varchar("checkin_code", { length: 12 }).notNull(),
    created_by: varchar("created_by", { length: 64 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("screenings_org_id_idx").on(table.org_id),
    index("screenings_start_time_idx").on(table.start_time),
    index("screenings_status_idx").on(table.status),
    index("screenings_semester_tag_idx").on(table.semester_tag),
  ]
);

// 报名
export const signups = pgTable(
  "signups",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    screening_id: varchar("screening_id", { length: 36 })
      .notNull()
      .references(() => screenings.id, { onDelete: "cascade" }),
    user_id: varchar("user_id", { length: 64 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("signups_screening_user_uniq").on(table.screening_id, table.user_id),
    index("signups_screening_id_idx").on(table.screening_id),
    index("signups_user_id_idx").on(table.user_id),
  ]
);

// 签到
export const attendances = pgTable(
  "attendances",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    screening_id: varchar("screening_id", { length: 36 })
      .notNull()
      .references(() => screenings.id, { onDelete: "cascade" }),
    user_id: varchar("user_id", { length: 64 }).notNull(),
    checked_in_at: timestamp("checked_in_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("attendances_screening_user_uniq").on(table.screening_id, table.user_id),
    index("attendances_screening_id_idx").on(table.screening_id),
    index("attendances_user_id_idx").on(table.user_id),
  ]
);

// 匿名评分与短评
export const ratings = pgTable(
  "ratings",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    screening_id: varchar("screening_id", { length: 36 })
      .notNull()
      .references(() => screenings.id, { onDelete: "cascade" }),
    // user_id 仅用于防止重复投票，前端与聚合结果不再展示
    voter_id: varchar("voter_id", { length: 64 }).notNull(),
    rating: integer("rating").notNull(), // 1-10
    review: text("review"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ratings_screening_voter_uniq").on(table.screening_id, table.voter_id),
    index("ratings_screening_id_idx").on(table.screening_id),
    index("ratings_created_at_idx").on(table.created_at),
  ]
);
