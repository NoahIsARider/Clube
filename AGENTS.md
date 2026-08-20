# AGENTS.md — Clube · 影协放映 / 艺术策展助手

## 项目定位
一站式覆盖高校影协「排片 → 报名 → 签到 → 复盘」的极客风管理工具。

## 版本技术栈
- Framework: Next.js 16 (App Router)
- Core: React 19
- Language: TypeScript 5
- UI: Tailwind CSS 4 + shadcn/ui 基础组件（本项目主打自绘极简元件）
- Auth / DB: Supabase Auth + Supabase (Postgres) via `getSupabaseClient()`
- QR: `qrcode.react`（生成）+ `jsqr`（扫描）

## 目录结构（关键部分）
```
src/
├─ app/
│  ├─ page.tsx                          # 未登录/已登录路由跳转
│  ├─ login/page.tsx                    # 登录/注册（邮箱 + 密码）
│  ├─ app/                              # 需登录的主 App（AppShell 包裹）
│  │  ├─ page.tsx                       # 首页 Dashboard
│  │  ├─ orgs/page.tsx                  # 我的影协 · 创建/加入
│  │  ├─ orgs/[id]/page.tsx             # 单个影协：排片/成员/邀请码/设置
│  │  ├─ orgs/[id]/report/page.tsx      # 学期末总结
│  │  ├─ screenings/page.tsx            # 全部场次
│  │  ├─ screenings/new/page.tsx        # 新建场次
│  │  ├─ screenings/[id]/page.tsx       # 场次详情（报名/签到/评分/QR）
│  │  └─ screenings/[id]/scan/page.tsx  # 干事端扫码签到
│  └─ api/                              # 后端接口（详见"API 接口"）
├─ components/
│  ├─ app-shell.tsx                     # 顶部导航 + 登录态守卫
│  └─ geek-ui.tsx                       # Frame / StatusDot 等极简元件
├─ lib/
│  ├─ api-auth.ts                       # requireUser / ensureProfile / apiOk / apiError
│  ├─ authed-fetch.ts                   # 前端带 x-session 的 fetch
│  ├─ org-permission.ts                 # 权限校验 & slugify & 邀请码/签到码生成
│  ├─ supabase-browser.ts               # 浏览器端 supabase 单例
│  └─ supabase-config-inject.tsx        # 注入 supabase 配置到 window
└─ storage/database/
   ├─ supabase-client.ts                # 服务端 supabase 单例（service role）
   └─ shared/schema.ts                  # Drizzle Schema（Postgres）
```

## 角色 & 权限
- `admin` 创建者/管理员：全部操作，含成员管理、任命干事、修改组织设置。
- `officer` 干事：新建场次、生成 member 邀请码、扫码签到。
- `member` 普通成员：报名、签到、匿名评分。

## 数据表（关键字段）
- `profiles(id=auth.uid, display_name, avatar_url)`
- `organizations(id, name, slug, description, school, join_policy, created_by)`
  - `join_policy`：`approval` | `invite_only` | `open`
- `organization_members(id, org_id, user_id, role, status, note)`
  - `role`：`admin | officer | member`；`status`：`pending | approved | rejected`
- `invite_codes(id, org_id, code, role, max_uses, used_count, expires_at)`
- `screenings(id, org_id, film_title, film_director, film_year, film_country, film_poster_url, synopsis, curator_note, venue, start_time, end_time, capacity, status, semester_tag, checkin_code)`
  - `status`：`draft | published | ongoing | finished | canceled`
- `signups(id, screening_id, user_id, waitlisted)` · 唯一约束 `(screening_id, user_id)`
- `attendances(id, screening_id, user_id, checked_in_at)` · 唯一约束 `(screening_id, user_id)`
- `ratings(id, screening_id, user_id, rating 1-10, review)` · 唯一约束 `(screening_id, user_id)`；user_id 仅做去重，永不外显

## API 接口
所有需要登录的接口都通过 `requireUser(req)` 读取 `x-session` 头校验，前端用 `authedFetch()` 自动带上。

| 路径 | 方法 | 说明 |
| --- | --- | --- |
| `/api/supabase-config` | GET | 公开：返回 supabase url/anonKey |
| `/api/me` | GET | 当前用户资料 |
| `/api/orgs` | GET/POST | 我的组织列表 / 创建新组织 |
| `/api/orgs/[id]` | GET/PATCH/DELETE | 详情 / 修改（admin）/ 解散（admin） |
| `/api/orgs/[id]/members` | GET/POST | 成员列表 / 申请加入 |
| `/api/orgs/[id]/members/[memberId]` | PATCH/DELETE | 审核/改角色/踢人 |
| `/api/orgs/[id]/invites` | GET/POST | 邀请码列表 / 生成（curator） |
| `/api/orgs/join` | POST | 通过邀请码加入 |
| `/api/orgs/[id]/screenings` | GET/POST | 场次列表 / 新建（curator） |
| `/api/orgs/[id]/report` | GET | 学期末总结 |
| `/api/screenings/[id]` | GET/PATCH/DELETE | 场次详情 / 修改 / 删除 |
| `/api/screenings/[id]/signup` | POST/DELETE | 报名 / 取消报名 |
| `/api/screenings/[id]/checkin` | POST | 签到（code）·同时兼容 QR 扫描 |
| `/api/screenings/[id]/ratings` | POST | 匿名评分 + 短评（每人一次） |

## 签到机制
- 建场时后端自动生成 `checkin_code`（6 位字母数字）
- 干事页面显示 QR：内容为 `${origin}/app/screenings/${sid}?ci=${code}` 的 URL
- 成员手机相机扫码 → 打开落地页 → 自动 POST checkin
- 或成员手动输入 6 位签到码
- 干事内置扫码工具 `screenings/[id]/scan`（jsqr 摄像头识别）

## 常用命令
```bash
pnpm install                         # 安装依赖
pnpm ts-check && pnpm lint --quiet   # 静态检查
# 应用 schema 到数据库：在 Supabase SQL Editor 执行 src/storage/database/shared/schema.ts 中的建表 SQL
# 或配置 drizzle.config.ts 后使用 pnpm dlx drizzle-kit push
```

## 编码规范补充
- 严格 TypeScript：所有函数参数/返回值明确类型
- 不使用 React 默认导入（React 19 自动 jsx-runtime）
- 页面组件顶部 `'use client'` — 大部分交互页
- API 统一使用 `apiOk({...})` / `apiError('...', status)`
- 页面用 `authedFetch(path)`，返回值已自动 unwrap `data`
- 极客美学：黑底磷绿 + 衬线大字 + 等宽 caption + 1px 网格线，见 `DESIGN.md`
