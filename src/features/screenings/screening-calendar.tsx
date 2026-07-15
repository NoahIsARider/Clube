import type { Screening } from '../../lib/types'

function formatDayLabel(dateValue: string) {
  return dateValue.slice(5, 10).replace('-', '.')
}

export function ScreeningCalendar({ sessions }: { sessions: Screening[] }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <span className="eyebrow">排片日历</span>
        <h3>从选片到发布预告的场次总览</h3>
      </div>
      <div className="stack-md">
        {sessions.map((session) => (
          <article key={session.id} className="timeline-item">
            <div className="timeline-day">{formatDayLabel(session.startsAt)}</div>
            <div className="timeline-content">
              <div className="meta-row">
                <span className={`status status-${session.status}`}>{session.status}</span>
                <span>{session.venue}</span>
              </div>
              <h4>{session.title}</h4>
              <p className="muted">{session.subtitle}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
