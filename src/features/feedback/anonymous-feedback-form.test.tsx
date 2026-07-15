import { render, screen } from '@testing-library/react'

import { AnonymousFeedbackForm } from './anonymous-feedback-form'

describe('AnonymousFeedbackForm', () => {
  it('submits rating and short review without asking for name', () => {
    render(<AnonymousFeedbackForm />)

    expect(screen.queryByLabelText(/姓名/)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/评分/)).toBeInTheDocument()
    expect(screen.getByLabelText(/短评/)).toBeInTheDocument()
  })
})
