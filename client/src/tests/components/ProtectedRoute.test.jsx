import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthContext } from '@/context/AuthContext'
import authReducer from '@/store/slices/authSlice'

vi.mock('@/context/AuthContext', () => ({
  useAuthContext: vi.fn(),
}))

/**
 * Build a real Redux store with isRestoringSession pre-set.
 * This avoids mocking react-redux entirely (which breaks useSelector internals).
 */
function makeStore(isRestoringSession = false) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        isRestoringSession,
        status: 'idle',
        error: null,
      },
    },
  })
}

function renderWithStore(ui, isRestoringSession = false) {
  return render(
    <Provider store={makeStore(isRestoringSession)}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when currentUser exists', () => {
    const mockUser = { id: '1', username: 'testuser' }
    vi.mocked(useAuthContext).mockReturnValue({ authUser: mockUser })

    renderWithStore(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /auth when currentUser is null', () => {
    vi.mocked(useAuthContext).mockReturnValue({ authUser: null })

    renderWithStore(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to /auth when currentUser is undefined', () => {
    vi.mocked(useAuthContext).mockReturnValue({ authUser: undefined })

    renderWithStore(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
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

    renderWithStore(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('renders nothing while session is restoring', () => {
    vi.mocked(useAuthContext).mockReturnValue({ authUser: null })

    const { container } = renderWithStore(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      true // isRestoringSession = true
    )

    // Returns null — no redirect, no children
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(container.firstChild).toBeNull()
  })
})
