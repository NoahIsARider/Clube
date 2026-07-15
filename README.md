# Clube

Clube 是一个面向高校影协 / 放映组 / 艺术策展团队的 Web MVP，覆盖从组织创建、成员加入、排片发布、成员报名，到匿名评分、短评收集和数据导出的完整流程。

## 技术栈
- React 19
- Vite
- TypeScript
- React Router HashRouter
- Vitest + Testing Library
- Supabase

## 当前能力
- 创建组织并成为管理员
- 邀请码加入 / 审核加入组织
- 成员角色展示与管理员转移入口
- 排片日历与活动详情
- 普通成员报名
- 观影后匿名评分与短评
- 影评 / 公告内容流
- CSV 数据导出
- 默认 demo mode，可先看完整前端

## 本地运行

```bash
npm install
npm run dev
```

本地启动后，终端会打印一个地址，通常是：

```bash
http://localhost:5173/
```

把这个地址复制到浏览器就能先看前端。

## 本地测试

```bash
npm run test
npm run build
```

## Supabase 连接方法
1. 在 Supabase 创建项目。
2. 运行 `supabase/schema.sql` 中的 SQL。
3. 复制 `.env.example` 为 `.env.local`。
4. 写入：

```bash
VITE_SUPABASE_URL=你的项目地址
VITE_SUPABASE_ANON_KEY=你的匿名 key
```

更详细的步骤见 `docs/supabase-setup.md`。

## 部署

### Vercel
- 导入 GitHub 仓库
- Framework Preset 选 `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- 配置环境变量 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`

### GitHub Pages
- 项目已使用 `HashRouter`
- `vite.config.ts` 已设置 `base: './'`
- 执行 `npm run build` 后发布 `dist` 目录即可

## 设计文档
- `DESIGN.md`
- `docs/plans/2026-07-15-clube-mvp.md`
- `docs/supabase-setup.md`
