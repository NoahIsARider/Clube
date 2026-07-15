import { render, screen } from '@testing-library/react'

import App from '../App'

describe('App', () => {
  it('renders Clube shell', () => {
    render(<App />)

    expect(screen.getAllByText(/Clube/).length).toBeGreaterThan(0)
  })
})
