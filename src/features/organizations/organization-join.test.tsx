import { render, screen } from '@testing-library/react'

import { OrganizationJoin } from './organization-join'

describe('OrganizationJoin', () => {
  it('shows approval and invite entry points for joining an organization', () => {
    render(<OrganizationJoin />)

    expect(screen.getByRole('heading', { name: '邀请码加入' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '提交审核申请' })).toBeInTheDocument()
  })
})
