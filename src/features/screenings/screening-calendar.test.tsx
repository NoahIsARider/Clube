import { render, screen } from '@testing-library/react'

import { ScreeningCalendar } from './screening-calendar'

const fixtures = [
  {
    id: 'screening-1',
    organizationId: 'org-1',
    title: '重庆森林',
    subtitle: 'Wong Kar-wai',
    venue: '文新楼 201',
    startsAt: '2026-07-18T19:00:00.000Z',
    capacity: 80,
    registrations: 40,
    posterUrl: '',
    status: 'published' as const,
    curatorNote: 'test',
  },
]

describe('ScreeningCalendar', () => {
  it('renders screening sessions grouped by day', () => {
    render(<ScreeningCalendar sessions={fixtures} />)

    expect(screen.getByText(/07\.18/)).toBeInTheDocument()
    expect(screen.getByText(/重庆森林/)).toBeInTheDocument()
  })
})
