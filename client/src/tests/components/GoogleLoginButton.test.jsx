import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoogleLoginButton } from '@/components/Button'

vi.mock('@/services/api', () => ({
  getGoogleLoginUrl: vi.fn(
    () => 'http://localhost:3000/api/v1/wiki/auth/google'
  ),
  getTwitterLoginUrl: vi.fn(() => 'http://localhost:3000/api/v1/wiki/auth/x'),
  getDiscordLoginUrl: vi.fn(
    () => 'http://localhost:3000/api/v1/wiki/auth/discord'
  ),
  getGithubLoginUrl: vi.fn(
    () => 'http://localhost:3000/api/v1/wiki/auth/github'
  ),
  refreshAccessToken: vi.fn(),
}))

describe('GoogleLoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete window.location
    window.location = { href: '' }
  })

  it('renders the Google login button', () => {
    render(<GoogleLoginButton />)

    const button = screen.getByRole('button', { name: 'Sign in with Google' })
    const icon = button.querySelector('svg[aria-hidden="true"]')

    expect(button).toBeInTheDocument()
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('viewBox', '0 0 24 24')
    expect(icon.querySelectorAll('path')).toHaveLength(4)
  })

  it('redirects to the backend Google OAuth route', async () => {
    const user = userEvent.setup()
    render(<GoogleLoginButton />)

    await user.click(
      screen.getByRole('button', { name: 'Sign in with Google' })
    )

    expect(window.location.href).toBe(
      'http://localhost:3000/api/v1/wiki/auth/google'
    )
  })
})
