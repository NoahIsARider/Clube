import { useEffect, useMemo, useState } from 'react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'

import { AnonymousFeedbackForm } from './features/feedback/anonymous-feedback-form'
import { OrganizationJoin } from './features/organizations/organization-join'
import { ScreeningCalendar } from './features/screenings/screening-calendar'
import { demoData } from './lib/demo-data'
import { getRuntimeMode } from './lib/env'
import { exportRowsToCsv } from './lib/export'
import type { DemoDataset, FeedbackEntry, OrganizationMember } from './lib/types'

const STORAGE_KEY = 'clube-demo-dataset'

function loadInitialDataset(): DemoDataset {
  if (typeof window === 'undefined') {
    return demoData
  }

  const cached = window.localStorage.getItem(STORAGE_KEY)

  if (!cached) {
    return demoData
  }

  try {
    return JSON.parse(cached) as DemoDataset
  } catch {
    return demoData
  }
}

function formatDateTime(value: string) {
  const datePart = value.slice(5, 10).replace('-', '.')
  const timePart = value.slice(11, 16)
  return `${datePart} ${timePart}`
}

function averageRating(entries: FeedbackEntry[]) {
  if (entries.length === 0) {
    return 0
  }

  const total = entries.reduce((sum, entry) => sum + entry.rating, 0)
  return total / entries.length
}

function downloadCsv(filename: string, csv: string) {
  if (typeof window === 'undefined' || !csv) {
    return
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

function Shell({
  dataset,
  runtimeMode,
  selectedScreeningId,
  onSelectScreening,
  onRegister,
  onCreateOrganization,
  onApprovePending,
  onTransferAdmin,
  onExport,
  onAddFeedback,
}: {
  dataset: DemoDataset
  runtimeMode: 'demo' | 'supabase'
  selectedScreeningId: string
  onSelectScreening: (screeningId: string) => void
  onRegister: (screeningId: string) => void
  onCreateOrganization: (name: string) => void
  onApprovePending: () => void
  onTransferAdmin: (memberId: string) => void
  onExport: (kind: 'screenings' | 'feedback' | 'members' | 'posts') => void
  onAddFeedback: (screeningId: string, payload: { rating: number; comment: string }) => void
}) {
  const organization = dataset.organizations[0]
  const approvedMembers = dataset.members.filter((member) => member.status === 'approved')
  const pendingMembers = dataset.members.filter((member) => member.status === 'pending')
  const activeScreening =
    dataset.screenings.find((screening) => screening.id === selectedScreeningId) ?? dataset.screenings[0]
  const feedbackEntries = dataset.feedbackEntries.filter(
    (entry) => entry.screeningId === activeScreening.id,
  )
  const adminMember = approvedMembers.find((member) => member.role === 'admin') ?? approvedMembers[0]

  const summaryCards = [
    { label: '组织成员', value: String(approvedMembers.length).padStart(2, '0') },
    { label: '待审核申请', value: String(pendingMembers.length).padStart(2, '0') },
    { label: '本月场次', value: String(dataset.screenings.length).padStart(2, '0') },
    { label: '反馈均分', value: averageRating(dataset.feedbackEntries).toFixed(1) },
  ]

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <span className="brand-mark">CLB</span>
          <div className="brand-block">
            <p className="brand-title">Clube</p>
            <p className="brand-subtitle">影协放映 / 艺术策展助手</p>
          </div>
        </div>
        <div className="meta-row">
          <span className={`status status-${runtimeMode}`}>{runtimeMode}</span>
          <span className="mono">HashRouter / 静态部署友好</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">放映流程全链路</p>
          <h1>从排片到复盘，把高校影协的放映协作做成一套可复用系统。</h1>
          <p className="hero-description">
            管理员创建组织、审批加入、转移权限；干事排片、发布预告、维护场地与场次；成员报名、观影、匿名评分与短评。首版默认运行在
            demo mode，接入 Supabase 后即可切换成真实数据流。
          </p>
          <div className="hero-actions">
            <a className="button-primary" href="#/calendar">
              查看排片日历
            </a>
            <a className="button-secondary" href="#/organization">
              进入组织控制台
            </a>
          </div>
        </div>
        <div className="hero-poster">
          <img alt="Clube 放映海报示意" src={activeScreening.posterUrl} />
          <div className="hero-poster-meta">
            <span className="eyebrow">Next Screening</span>
            <h3>{activeScreening.title}</h3>
            <p className="muted">{activeScreening.subtitle}</p>
          </div>
        </div>
      </section>

      <nav className="nav-tabs" aria-label="主导航">
        <NavLink to="/">总览</NavLink>
        <NavLink to="/organization">组织</NavLink>
        <NavLink to="/calendar">排片</NavLink>
        <NavLink to="/posts">影评</NavLink>
        <NavLink to="/export">导出</NavLink>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <main className="page-grid">
              <section className="stack-lg">
                <div className="summary-grid">
                  {summaryCards.map((card) => (
                    <article key={card.label} className="summary-card">
                      <span className="summary-label">{card.label}</span>
                      <strong>{card.value}</strong>
                    </article>
                  ))}
                </div>
                <section className="panel">
                  <div className="section-heading">
                    <span className="eyebrow">当前组织</span>
                    <h2>{organization.name}</h2>
                  </div>
                  <p className="muted">{organization.description}</p>
                  <div className="info-grid">
                    <div>
                      <span className="info-label">管理员</span>
                      <p>{adminMember.name}</p>
                    </div>
                    <div>
                      <span className="info-label">邀请码</span>
                      <p className="mono">{organization.inviteCode}</p>
                    </div>
                    <div>
                      <span className="info-label">最近场次</span>
                      <p>{formatDateTime(activeScreening.startsAt)}</p>
                    </div>
                    <div>
                      <span className="info-label">报名进度</span>
                      <p className="mono">
                        {activeScreening.registrations}/{activeScreening.capacity}
                      </p>
                    </div>
                  </div>
                </section>
                <ScreeningCalendar sessions={dataset.screenings} />
              </section>

              <aside className="stack-lg">
                <section className="panel">
                  <div className="section-heading">
                    <span className="eyebrow">流程节点</span>
                    <h3>放映组长最常做的四件事</h3>
                  </div>
                  <ol className="number-list">
                    <li>干事提案选片并落时间、场地、容量。</li>
                    <li>管理员发布预告并开放报名。</li>
                    <li>观影后收集匿名评分与短评。</li>
                    <li>统一导出数据进入复盘文档。</li>
                  </ol>
                </section>
                <OrganizationJoin />
              </aside>
            </main>
          }
        />
        <Route
          path="/organization"
          element={
            <main className="page-grid">
              <section className="stack-lg">
                <section className="panel">
                  <div className="section-heading">
                    <span className="eyebrow">组织管理</span>
                    <h2>创建组织、成员审核、管理员转移</h2>
                  </div>
                  <CreateOrganizationForm onCreateOrganization={onCreateOrganization} />
                  <div className="grid-two">
                    <article className="subpanel">
                      <span className="info-label">邀请码加入</span>
                      <p className="mono">{organization.inviteCode}</p>
                      <p className="muted">适合社群内快速扩散，避免重复手动审批。</p>
                    </article>
                    <article className="subpanel">
                      <span className="info-label">待审核申请</span>
                      <p className="mono">{pendingMembers.length} 条</p>
                      <button className="button-secondary" type="button" onClick={onApprovePending}>
                        一键通过待审核成员
                      </button>
                    </article>
                  </div>
                </section>
                <section className="panel">
                  <div className="section-heading">
                    <span className="eyebrow">成员列表</span>
                    <h3>管理员 / 干事 / 普通成员</h3>
                  </div>
                  <div className="stack-sm">
                    {dataset.members.map((member) => (
                      <article key={member.id} className="member-row">
                        <div>
                          <h4>{member.name}</h4>
                          <p className="muted">
                            {member.role} · {member.joinMethod} · {member.status}
                          </p>
                        </div>
                        <button
                          className="button-secondary"
                          disabled={member.status !== 'approved'}
                          type="button"
                          onClick={() => onTransferAdmin(member.id)}
                        >
                          转移管理员到此人
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              </section>
              <aside className="stack-lg">
                <OrganizationJoin />
              </aside>
            </main>
          }
        />
        <Route
          path="/calendar"
          element={
            <main className="page-grid">
              <section className="stack-lg">
                <ScreeningCalendar sessions={dataset.screenings} />
                <section className="panel">
                  <div className="section-heading">
                    <span className="eyebrow">场次列表</span>
                    <h3>选择一个场次查看详情</h3>
                  </div>
                  <div className="stack-sm">
                    {dataset.screenings.map((screening) => (
                      <button
                        key={screening.id}
                        className={`screening-row${screening.id === activeScreening.id ? ' is-active' : ''}`}
                        type="button"
                        onClick={() => onSelectScreening(screening.id)}
                      >
                        <span>{screening.title}</span>
                        <span className="mono">{formatDateTime(screening.startsAt)}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </section>
              <aside className="stack-lg">
                <section className="panel">
                  <img alt={activeScreening.title} className="detail-poster" src={activeScreening.posterUrl} />
                  <div className="section-heading">
                    <span className="eyebrow">活动详情</span>
                    <h3>{activeScreening.title}</h3>
                  </div>
                  <p className="muted">{activeScreening.subtitle}</p>
                  <div className="info-grid">
                    <div>
                      <span className="info-label">时间</span>
                      <p className="mono">{formatDateTime(activeScreening.startsAt)}</p>
                    </div>
                    <div>
                      <span className="info-label">场地</span>
                      <p>{activeScreening.venue}</p>
                    </div>
                    <div>
                      <span className="info-label">报名人数</span>
                      <p className="mono">
                        {activeScreening.registrations}/{activeScreening.capacity}
                      </p>
                    </div>
                    <div>
                      <span className="info-label">状态</span>
                      <p>{activeScreening.status}</p>
                    </div>
                  </div>
                  <p>{activeScreening.curatorNote}</p>
                  <div className="hero-actions">
                    <button
                      className="button-primary"
                      type="button"
                      onClick={() => onRegister(activeScreening.id)}
                    >
                      普通成员报名
                    </button>
                    <button className="button-secondary" type="button">
                      发布预告
                    </button>
                  </div>
                </section>
                <AnonymousFeedbackForm
                  onSubmitFeedback={(payload) => onAddFeedback(activeScreening.id, payload)}
                />
              </aside>
            </main>
          }
        />
        <Route
          path="/posts"
          element={
            <main className="page-grid">
              <section className="stack-lg">
                <section className="panel">
                  <div className="section-heading">
                    <span className="eyebrow">影评与公告</span>
                    <h2>组织内的内容流</h2>
                  </div>
                  <div className="stack-md">
                    {dataset.posts.map((post) => (
                      <article key={post.id} className="post-item">
                        <div className="meta-row">
                          <span className={`status status-${post.type}`}>{post.type}</span>
                          <span className="mono">{formatDateTime(post.publishedAt)}</span>
                        </div>
                        <h3>{post.title}</h3>
                        <p className="muted">{post.excerpt}</p>
                        <p>{post.content}</p>
                        <div className="meta-row">
                          <span>{post.author}</span>
                          <span>{organization.name}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </section>
              <aside className="stack-lg">
                <section className="panel">
                  <div className="section-heading">
                    <span className="eyebrow">内容策略</span>
                    <h3>发布影评和组织信息</h3>
                  </div>
                  <p className="muted">
                    首版把影评、放映预告、策展笔记统一抽象为内容流。后续接入 Supabase 后可继续扩展富文本、标签和作者主页。
                  </p>
                </section>
              </aside>
            </main>
          }
        />
        <Route
          path="/export"
          element={
            <main className="page-grid">
              <section className="stack-lg">
                <section className="panel">
                  <div className="section-heading">
                    <span className="eyebrow">数据导出</span>
                    <h2>从报名到复盘的结构化数据</h2>
                  </div>
                  <div className="grid-two">
                    <ExportButton label="导出场次 CSV" onClick={() => onExport('screenings')} />
                    <ExportButton label="导出反馈 CSV" onClick={() => onExport('feedback')} />
                    <ExportButton label="导出成员 CSV" onClick={() => onExport('members')} />
                    <ExportButton label="导出内容 CSV" onClick={() => onExport('posts')} />
                  </div>
                </section>
                <section className="panel">
                  <div className="section-heading">
                    <span className="eyebrow">复盘视图</span>
                    <h3>匿名评分与短评摘录</h3>
                  </div>
                  <div className="summary-grid">
                    <article className="summary-card">
                      <span className="summary-label">均分</span>
                      <strong>{averageRating(feedbackEntries).toFixed(1)}</strong>
                    </article>
                    <article className="summary-card">
                      <span className="summary-label">短评条数</span>
                      <strong>{feedbackEntries.length}</strong>
                    </article>
                  </div>
                  <div className="stack-sm">
                    {feedbackEntries.map((entry) => (
                      <article key={entry.id} className="subpanel">
                        <div className="meta-row">
                          <span className="status status-feedback">{entry.rating.toFixed(1)} / 5</span>
                          <span className="mono">{formatDateTime(entry.createdAt)}</span>
                        </div>
                        <p>{entry.comment}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </section>
              <aside className="stack-lg">
                <section className="panel">
                  <div className="section-heading">
                    <span className="eyebrow">部署提醒</span>
                    <h3>Vercel 与 GitHub Pages 都可发布</h3>
                  </div>
                  <p className="muted">
                    当前使用 HashRouter，因此静态托管不依赖服务器重写规则。接入 Supabase 后只需补环境变量，无需改路由结构。
                  </p>
                </section>
              </aside>
            </main>
          }
        />
      </Routes>
    </div>
  )
}

function CreateOrganizationForm({ onCreateOrganization }: { onCreateOrganization: (name: string) => void }) {
  const [name, setName] = useState('新影像社')

  return (
    <form
      className="stack-sm"
      onSubmit={(event) => {
        event.preventDefault()
        onCreateOrganization(name)
      }}
    >
      <label className="field">
        <span>组织名称</span>
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <button className="button-primary" type="submit">
        创建组织并成为管理员
      </button>
    </form>
  )
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="export-button" type="button" onClick={onClick}>
      {label}
    </button>
  )
}

function App() {
  const runtimeMode = getRuntimeMode()
  const [dataset, setDataset] = useState<DemoDataset>(() => loadInitialDataset())
  const [selectedScreeningId, setSelectedScreeningId] = useState(demoData.screenings[0].id)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset))
    }
  }, [dataset])

  const exportRows = useMemo(
    () => ({
      screenings: dataset.screenings.map((screening) => ({
        title: screening.title,
        startsAt: screening.startsAt,
        venue: screening.venue,
        registrations: screening.registrations,
        status: screening.status,
      })),
      feedback: dataset.feedbackEntries.map((entry) => ({
        screeningId: entry.screeningId,
        rating: entry.rating,
        comment: entry.comment,
        createdAt: entry.createdAt,
      })),
      members: dataset.members.map((member) => ({
        name: member.name,
        role: member.role,
        status: member.status,
        joinMethod: member.joinMethod,
      })),
      posts: dataset.posts.map((post) => ({
        title: post.title,
        type: post.type,
        author: post.author,
        publishedAt: post.publishedAt,
      })),
    }),
    [dataset],
  )

  function updateMembers(transform: (members: OrganizationMember[]) => OrganizationMember[]) {
    setDataset((current) => ({
      ...current,
      members: transform(current.members),
    }))
  }

  function handleCreateOrganization(name: string) {
    setDataset((current) => ({
      ...current,
      organizations: [
        {
          ...current.organizations[0],
          id: `org-${Date.now()}`,
          name,
          slug: name.trim().toLowerCase().replaceAll(/\s+/g, '-'),
          inviteCode: `CLB-${String(Date.now()).slice(-4)}`,
          createdAt: new Date().toISOString(),
        },
        ...current.organizations,
      ],
    }))
  }

  function handleApprovePending() {
    updateMembers((members) =>
      members.map((member) => (member.status === 'pending' ? { ...member, status: 'approved' } : member)),
    )
  }

  function handleTransferAdmin(memberId: string) {
    updateMembers((members) =>
      members.map((member) => {
        if (member.status !== 'approved') {
          return member
        }

        if (member.id === memberId) {
          return { ...member, role: 'admin' }
        }

        return member.role === 'admin' ? { ...member, role: 'staff' } : member
      }),
    )
  }

  function handleRegister(screeningId: string) {
    setDataset((current) => ({
      ...current,
      screenings: current.screenings.map((screening) =>
        screening.id === screeningId
          ? {
              ...screening,
              registrations: Math.min(screening.capacity, screening.registrations + 1),
            }
          : screening,
      ),
    }))
  }

  function handleAddFeedback(screeningId: string, payload: { rating: number; comment: string }) {
    setDataset((current) => ({
      ...current,
      feedbackEntries: [
        {
          id: `feedback-${Date.now()}`,
          screeningId,
          rating: payload.rating,
          comment: payload.comment || '未填写短评',
          createdAt: new Date().toISOString(),
        },
        ...current.feedbackEntries,
      ],
    }))
  }

  function handleExport(kind: 'screenings' | 'feedback' | 'members' | 'posts') {
    downloadCsv(`clube-${kind}.csv`, exportRowsToCsv(exportRows[kind]))
  }

  return (
    <HashRouter>
      <Shell
        dataset={dataset}
        runtimeMode={runtimeMode}
        selectedScreeningId={selectedScreeningId}
        onSelectScreening={setSelectedScreeningId}
        onRegister={handleRegister}
        onCreateOrganization={handleCreateOrganization}
        onApprovePending={handleApprovePending}
        onTransferAdmin={handleTransferAdmin}
        onExport={handleExport}
        onAddFeedback={handleAddFeedback}
      />
    </HashRouter>
  )
}

export default App
