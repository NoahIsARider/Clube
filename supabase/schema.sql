create extension if not exists pgcrypto;

-- ===== Clube 建表 SQL（由 drizzle-kit 从 schema.ts 生成）=====
-- 在 Supabase Dashboard → SQL Editor 粘贴全部执行即可

CREATE TABLE "attendances" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screening_id" varchar(36) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "health_check" (
	"id" serial NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "invite_codes" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(36) NOT NULL,
	"code" varchar(32) NOT NULL,
	"role" varchar(16) DEFAULT 'member' NOT NULL,
	"max_uses" integer DEFAULT 0 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invite_codes_code_unique" UNIQUE("code")
);
CREATE TABLE "organization_members" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(36) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"role" varchar(16) DEFAULT 'member' NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"note" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "organizations" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"slug" varchar(64) NOT NULL,
	"description" text,
	"logo_url" text,
	"school" varchar(128),
	"join_policy" varchar(16) DEFAULT 'approval' NOT NULL,
	"created_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
CREATE TABLE "profiles" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(64) NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "ratings" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screening_id" varchar(36) NOT NULL,
	"voter_id" varchar(64) NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "screenings" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(36) NOT NULL,
	"film_title" varchar(200) NOT NULL,
	"film_director" varchar(128),
	"film_year" integer,
	"film_country" varchar(64),
	"film_duration" integer,
	"film_poster_url" text,
	"synopsis" text,
	"curator_note" text,
	"venue" varchar(128) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"capacity" integer DEFAULT 0 NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"semester_tag" varchar(32),
	"checkin_code" varchar(12) NOT NULL,
	"created_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "signups" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screening_id" varchar(36) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_screening_id_screenings_id_fk" FOREIGN KEY ("screening_id") REFERENCES "public"."screenings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_screening_id_screenings_id_fk" FOREIGN KEY ("screening_id") REFERENCES "public"."screenings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "screenings" ADD CONSTRAINT "screenings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "signups" ADD CONSTRAINT "signups_screening_id_screenings_id_fk" FOREIGN KEY ("screening_id") REFERENCES "public"."screenings"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "attendances_screening_user_uniq" ON "attendances" USING btree ("screening_id","user_id");
CREATE INDEX "attendances_screening_id_idx" ON "attendances" USING btree ("screening_id");
CREATE INDEX "attendances_user_id_idx" ON "attendances" USING btree ("user_id");
CREATE INDEX "invite_codes_org_id_idx" ON "invite_codes" USING btree ("org_id");
CREATE INDEX "invite_codes_code_idx" ON "invite_codes" USING btree ("code");
CREATE UNIQUE INDEX "organization_members_org_user_uniq" ON "organization_members" USING btree ("org_id","user_id");
CREATE INDEX "organization_members_org_id_idx" ON "organization_members" USING btree ("org_id");
CREATE INDEX "organization_members_user_id_idx" ON "organization_members" USING btree ("user_id");
CREATE INDEX "organization_members_status_idx" ON "organization_members" USING btree ("status");
CREATE INDEX "organizations_created_by_idx" ON "organizations" USING btree ("created_by");
CREATE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");
CREATE INDEX "profiles_display_name_idx" ON "profiles" USING btree ("display_name");
CREATE UNIQUE INDEX "ratings_screening_voter_uniq" ON "ratings" USING btree ("screening_id","voter_id");
CREATE INDEX "ratings_screening_id_idx" ON "ratings" USING btree ("screening_id");
CREATE INDEX "ratings_created_at_idx" ON "ratings" USING btree ("created_at");
CREATE INDEX "screenings_org_id_idx" ON "screenings" USING btree ("org_id");
CREATE INDEX "screenings_start_time_idx" ON "screenings" USING btree ("start_time");
CREATE INDEX "screenings_status_idx" ON "screenings" USING btree ("status");
CREATE INDEX "screenings_semester_tag_idx" ON "screenings" USING btree ("semester_tag");
CREATE UNIQUE INDEX "signups_screening_user_uniq" ON "signups" USING btree ("screening_id","user_id");
CREATE INDEX "signups_screening_id_idx" ON "signups" USING btree ("screening_id");
CREATE INDEX "signups_user_id_idx" ON "signups" USING btree ("user_id");