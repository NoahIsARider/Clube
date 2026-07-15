# Supabase 接入说明

## 1. 创建项目
- 打开 [Supabase](https://supabase.com/)，创建一个新项目。
- 记下 `Project URL` 和 `anon public key`。

## 2. 建表
- 进入 SQL Editor。
- 打开仓库中的 `supabase/schema.sql`。
- 粘贴并执行整份 SQL。

## 3. 配置前端环境变量
- 在项目根目录复制 `.env.example` 为 `.env.local`。
- 填入以下内容：

```bash
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 anon public key
```

## 4. 本地预览
- 安装依赖：`npm install`
- 启动开发环境：`npm run dev`
- 若未配置环境变量，应用自动进入 `demo mode`。
- 若已配置环境变量，应用进入 `supabase mode`，后续可将 demo 数据读写替换成真实接口。

## 5. Vercel 部署
- 将仓库推送到 GitHub。
- 在 Vercel 中导入该仓库。
- 在 Project Settings -> Environment Variables 中新增：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Framework Preset 选择 `Vite`。
- Build Command 保持 `npm run build`。
- Output Directory 保持 `dist`。

## 6. GitHub Pages 部署
- 该项目已使用 `HashRouter` 和 `base: './'`，静态托管可直接工作。
- 执行 `npm run build` 后，将 `dist` 目录发布到 Pages 即可。

## 7. 下一步建议
- 接入 Supabase Auth 完成真实登录。
- 将组织、成员、场次、反馈等本地状态替换为数据库读写。
- 增加 RLS 规则，限制不同组织间的数据访问。
