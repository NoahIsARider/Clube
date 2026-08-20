/* eslint-disable react/jsx-no-comment-textnodes */
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clube · 影协放映助手',
  description:
    '为高校影协、艺术策展团队打造的排片、签到、评分与复盘工具。从选片到学期总结，一站式完成。',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top */}
      <header className="border-b hair-line">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[color:var(--phosphor)] inline-block" />
            <span className="serif-title text-xl">Clube</span>
            <span className="mono text-[10px] text-[color:var(--muted-foreground)] hidden sm:inline">
              // FILM SOCIETY OS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="mono text-[11px] px-4 py-2 border hair-line hover:border-[color:var(--phosphor)] transition-colors"
            >
              SIGN IN →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex-1 flex items-center">
        <div className="absolute inset-0 crosshair-bg opacity-40 pointer-events-none" />
        <div className="max-w-[1200px] mx-auto w-full px-6 py-24 grid grid-cols-1 md:grid-cols-12 gap-10 relative">
          <div className="md:col-span-7 space-y-8">
            <div className="mono text-[11px] text-[color:var(--muted-foreground)] flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-[color:var(--phosphor)] inline-block dot-pulse" />
              NOW SHOWING // V0.1
            </div>
            <h1 className="serif-title text-[64px] md:text-[92px] leading-[0.95] tracking-tight">
              放映组长的
              <br />
              <span className="italic">操作台</span>
            </h1>
            <p className="text-[color:var(--muted-foreground)] max-w-lg leading-relaxed">
              从选片、发布预告、报名、扫码签到，到匿名评分与学期末总结——
              一整套为高校影协 / 艺术策展团队打造的工具链。
              替代纸质签到与散乱表格，让胶片回到银幕、让你回到策展本身。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="mono text-[12px] px-6 py-3 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors"
              >
                START PROJECTING →
              </Link>
              <Link
                href="#features"
                className="mono text-[12px] px-6 py-3 border hair-line hover:border-[color:var(--foreground)] transition-colors"
              >
                SPECS
              </Link>
            </div>
            <dl className="grid grid-cols-3 gap-6 pt-8 border-t hair-line max-w-md">
              {[
                { k: 'REEL', v: '排片日历' },
                { k: 'BADGE', v: '扫码签到' },
                { k: 'ECHO', v: '匿名评分' },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="mono text-[10px] text-[color:var(--muted-foreground)]">{s.k}</dt>
                  <dd className="serif-title text-xl mt-1">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Mock frame */}
          <div className="md:col-span-5 relative">
            <div className="border hair-line p-6 bg-[color:var(--background)]">
              <div className="flex items-center justify-between mono text-[10px] text-[color:var(--muted-foreground)] border-b hair-line pb-3">
                <span>NO.024 · REC · 21:30</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[color:var(--phosphor)] inline-block dot-pulse" />
                  LIVE
                </span>
              </div>
              <div className="aspect-[2/3] border hair-line mt-4 flex items-center justify-center bg-[color:var(--muted)]/30 relative">
                <span className="absolute top-2 left-2 mono text-[10px] opacity-60">+</span>
                <span className="absolute top-2 right-2 mono text-[10px] opacity-60">+</span>
                <span className="absolute bottom-2 left-2 mono text-[10px] opacity-60">+</span>
                <span className="absolute bottom-2 right-2 mono text-[10px] opacity-60">+</span>
                <div className="text-center px-6 space-y-3">
                  <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                    POSTER · 2:3
                  </div>
                  <div className="serif-title text-2xl italic">STALKER</div>
                  <div className="mono text-[10px] text-[color:var(--muted-foreground)]">
                    TARKOVSKY · 1979 · 163&apos;
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between border-b hair-line py-1.5">
                  <span className="mono text-[10px] text-[color:var(--muted-foreground)]">VENUE</span>
                  <span className="mono text-[11px]">HALL B</span>
                </div>
                <div className="flex justify-between border-b hair-line py-1.5">
                  <span className="mono text-[10px] text-[color:var(--muted-foreground)]">SEATS</span>
                  <span className="mono text-[11px]">42 / 60</span>
                </div>
                <div className="flex justify-between border-b hair-line py-1.5">
                  <span className="mono text-[10px] text-[color:var(--muted-foreground)]">RATING</span>
                  <span className="mono text-[11px] text-[color:var(--phosphor)]">9.1 / 10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t hair-line">
        <div className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="mono text-[11px] text-[color:var(--muted-foreground)] mb-4">
            // TOOLCHAIN
          </div>
          <h2 className="serif-title text-4xl mb-16 max-w-xl">
            从排片到复盘，<br />
            <span className="italic">一整条流水线。</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l hair-line">
            {[
              {
                n: '01',
                title: '排片日历',
                desc: '干事选片、定时间、定场地、写策展语，一键发布预告。',
              },
              {
                n: '02',
                title: '开放报名',
                desc: '普通成员浏览预告、一键报名；容量控制、名额透明。',
              },
              {
                n: '03',
                title: '扫码签到',
                desc: '每场次动态签到码，替代纸质签到本，实时统计到场人数。',
              },
              {
                n: '04',
                title: '匿名评分',
                desc: '观影后匿名 1-10 分 + 短评，评分聚合永久保存。',
              },
              {
                n: '05',
                title: '成员治理',
                desc: '管理员 / 干事 / 成员三级权限，审核制或邀请码加入。',
              },
              {
                n: '06',
                title: '学期总结',
                desc: '学期末自动统计放映场次、上座率、最高分影片。',
              },
              {
                n: '07',
                title: '多影协支持',
                desc: '同一账号加入多个影协，各高校可共用平台。',
              },
              {
                n: '08',
                title: '克制美学',
                desc: '点、线、框、图片。没有花哨渐变，只有胶片与荧光绿。',
              },
            ].map((f) => (
              <div
                key={f.n}
                className="border-b border-r hair-line p-6 hover:bg-[color:var(--muted)]/30 transition-colors"
              >
                <div className="mono text-[10px] text-[color:var(--phosphor)]">{f.n}</div>
                <div className="serif-title text-xl mt-3">{f.title}</div>
                <p className="text-sm text-[color:var(--muted-foreground)] mt-3 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t hair-line">
        <div className="max-w-[1200px] mx-auto px-6 py-24 text-center">
          <div className="mono text-[10px] text-[color:var(--muted-foreground)] mb-4">
            + + + + +
          </div>
          <h3 className="serif-title text-5xl italic mb-6">拉起银幕。</h3>
          <p className="text-[color:var(--muted-foreground)] mb-10 max-w-md mx-auto">
            创建你的影协，或用邀请码加入一个已有的。
          </p>
          <Link
            href="/login"
            className="mono text-[12px] inline-block px-8 py-4 bg-[color:var(--phosphor)] text-[color:var(--ink)] hover:bg-[color:var(--foreground)] transition-colors"
          >
            OPEN THE REEL →
          </Link>
        </div>
      </section>

      <footer className="border-t hair-line">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
          <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
            CLUBE · V0.1 · {new Date().getFullYear()}
          </span>
          <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
            ● SYSTEM ONLINE
          </span>
        </div>
      </footer>
    </div>
  );
}
