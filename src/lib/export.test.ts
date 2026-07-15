import { exportRowsToCsv } from './export'

describe('exportRowsToCsv', () => {
  it('exports screenings and feedback rows to csv format', () => {
    const csv = exportRowsToCsv([{ title: '重庆森林', rating: 4.7 }])

    expect(csv).toContain('title,rating')
    expect(csv).toContain('重庆森林,4.7')
  })
})
