import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthContext } from '@/context/AuthContext'

vi.mock('@/context/AuthContext', () => ({
  useAuthContext: vi.fn(),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when currentUser exists', () => {
    const mockUser = { id: '1', username: 'testuser' }
    vi.mocked(useAuthContext).mockReturnValue({ authUser: mockUser })

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /auth when currentUser is null', () => {
    vi.mocked(useAuthContext).mockReturnValue({ authUser: null })

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to /auth when currentUser is undefined', () => {
    vi.mocked(useAuthContext).mockReturnValue({ authUser: undefined })

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('preserves user object with email field', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
    }
    vi.mocked(useAuthContext).mockReturnValue({ authUser: mockUser })

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
