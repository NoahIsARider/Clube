import { useState } from 'react'

interface AnonymousFeedbackFormProps {
  onSubmitFeedback?: (payload: { rating: number; comment: string }) => void
}

export function AnonymousFeedbackForm({ onSubmitFeedback }: AnonymousFeedbackFormProps) {
  const [rating, setRating] = useState(4)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <section className="panel">
        <div className="section-heading">
          <span className="eyebrow">反馈已记录</span>
          <h3>匿名短评已进入复盘池</h3>
        </div>
        <p className="muted">评分 {rating.toFixed(1)} / 5，管理员可在导出区统一整理。</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <span className="eyebrow">匿名反馈</span>
        <h3>观影后评分与短评收集</h3>
      </div>
      <form
        className="stack-md"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmitFeedback?.({ rating, comment })
          setSubmitted(true)
        }}
      >
        <label className="field">
          <span>评分</span>
          <input
            aria-label="评分"
            max="5"
            min="1"
            step="0.1"
            type="number"
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          />
        </label>
        <label className="field">
          <span>短评</span>
          <textarea
            aria-label="短评"
            placeholder="记录你的即时感受、映后疑问或流程建议。"
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>
        <button className="button-primary" type="submit">
          提交匿名反馈
        </button>
      </form>
    </section>
  )
}
