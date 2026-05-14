import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AuthPage from '@/pages/AuthPage'

// Mock the API module
vi.mock('@/services/api', () => ({
    AUTH_TOKEN_KEY: 'testToken',
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    uploadAvatar: vi.fn(),
    refreshAccessToken: vi.fn(),
}))

import { loginUser, registerUser } from '@/services/api'

const defaultProps = {
    sidebarCollapsed: false,
    currentUser: null,
    onAuthSuccess: vi.fn(),
    onAvatarUpdate: vi.fn(),
    onLogout: vi.fn(),
}

const renderAuth = (overrides = {}, routerOptions = {}) =>
    render(
        <MemoryRouter initialEntries={routerOptions.initialEntries}>
            <AuthPage {...defaultProps} {...overrides} />
        </MemoryRouter>
    )

beforeEach(() => {
    vi.clearAllMocks()
})

describe('AuthPage — Login Mode (default)', () => {
    it('renders login tab as active by default', () => {
        renderAuth()
        const loginTab = screen.getAllByRole('button').find(
            (btn) => btn.textContent === 'Login' && btn.classList.contains('auth-tab')
        )
        expect(loginTab).toHaveClass('active')
    })

    it('renders email/username and password fields', () => {
        renderAuth()
        expect(screen.getByText('Email or Username')).toBeInTheDocument()
        expect(screen.getByText('Password')).toBeInTheDocument()
    })

    it('does NOT render confirm password in login mode', () => {
        renderAuth()
        expect(screen.queryByText('Confirm Password')).not.toBeInTheDocument()
    })

    it('renders Login submit button', () => {
        renderAuth()
        // There are two "Login" buttons (tab + submit). Verify both exist.
        const allLoginBtns = screen.getAllByRole('button').filter(
            (btn) => btn.textContent === 'Login'
        )
        expect(allLoginBtns.length).toBeGreaterThanOrEqual(2)
    })

    it('calls loginUser and onAuthSuccess on submit', async () => {
        const user = userEvent.setup()
        const response = { user: { username: 'test' }, token: 'abc' }
        loginUser.mockResolvedValueOnce(response)

        renderAuth()

        await user.type(screen.getByLabelText(/Email or Username/i).closest('label').querySelector('input'), 'test@test.com')
        await user.type(screen.getByText('Password').closest('label').querySelector('input'), 'password123')
        // Click the submit button (auth-submit class), not the tab
        const submitBtn = screen.getAllByRole('button').find(
            (btn) => btn.textContent === 'Login' && btn.classList.contains('auth-submit')
        )
        await user.click(submitBtn)

        await waitFor(() => {
            expect(loginUser).toHaveBeenCalledWith({
                identifier: 'test@test.com',
                password: 'password123',
            })
            expect(defaultProps.onAuthSuccess).toHaveBeenCalledWith(response)
        })
    })

    it('shows error message on API failure', async () => {
        const user = userEvent.setup()
        loginUser.mockRejectedValueOnce({
            response: { data: { msg: 'Invalid credentials' } },
        })

        renderAuth()

        await user.type(screen.getByText('Email or Username').closest('label').querySelector('input'), 'bad@email.com')
        await user.type(screen.getByText('Password').closest('label').querySelector('input'), 'wrongpass')
        const submitBtn = screen.getAllByRole('button').find(
            (btn) => btn.textContent === 'Login' && btn.classList.contains('auth-submit')
        )
        await user.click(submitBtn)

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
        })
    })
})

describe('AuthPage — Register Mode', () => {
    it('switches to register mode when clicking Register tab', async () => {
        const user = userEvent.setup()
        renderAuth()

        // Find all buttons with text "Register" — the tab one
        const registerTab = screen.getAllByRole('button').find(
            (btn) => btn.textContent === 'Register' && btn.classList.contains('auth-tab')
        )
        await user.click(registerTab)

        expect(screen.getByText('Username')).toBeInTheDocument()
        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getByText('Password')).toBeInTheDocument()
        expect(screen.getByText('Confirm Password')).toBeInTheDocument()
    })

    it('shows password mismatch error', async () => {
        const user = userEvent.setup()
        renderAuth()

        // Switch to register
        const registerTab = screen.getAllByRole('button').find(
            (btn) => btn.textContent === 'Register' && btn.classList.contains('auth-tab')
        )
        await user.click(registerTab)

        await user.type(screen.getByText('Username').closest('label').querySelector('input'), 'testuser')
        await user.type(screen.getByText('Email').closest('label').querySelector('input'), 'test@test.com')
        await user.type(screen.getByText('Password').closest('label').querySelector('input'), 'pass123')
        await user.type(screen.getByText('Confirm Password').closest('label').querySelector('input'), 'pass456')

        await user.click(screen.getByRole('button', { name: 'Create Account' }))

        await waitFor(() => {
            expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
        })
        expect(registerUser).not.toHaveBeenCalled()
    })

    it('calls registerUser on valid submit', async () => {
        const user = userEvent.setup()
        const response = { user: { username: 'newuser' }, token: 'token123' }
        registerUser.mockResolvedValueOnce(response)

        renderAuth()

        const registerTab = screen.getAllByRole('button').find(
            (btn) => btn.textContent === 'Register' && btn.classList.contains('auth-tab')
        )
        await user.click(registerTab)

        await user.type(screen.getByText('Username').closest('label').querySelector('input'), 'newuser')
        await user.type(screen.getByText('Email').closest('label').querySelector('input'), 'new@test.com')
        await user.type(screen.getByText('Password').closest('label').querySelector('input'), 'pass123')
        await user.type(screen.getByText('Confirm Password').closest('label').querySelector('input'), 'pass123')

        await user.click(screen.getByRole('button', { name: 'Create Account' }))

        await waitFor(() => {
            expect(registerUser).toHaveBeenCalledWith({
                username: 'newuser',
                email: 'new@test.com',
                password: 'pass123',
            })
            expect(defaultProps.onAuthSuccess).toHaveBeenCalledWith(response)
        })
    })

    it('shows zod validation errors for empty required fields', async () => {
        const user = userEvent.setup()
        renderAuth()

        const registerTab = screen.getAllByRole('button').find(
            (btn) => btn.textContent === 'Register' && btn.classList.contains('auth-tab')
        )
        await user.click(registerTab)

        // Submit without filling any fields
        await user.click(screen.getByRole('button', { name: 'Create Account' }))

        await waitFor(() => {
            expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument()
        })
        expect(registerUser).not.toHaveBeenCalled()
    })
})

describe('AuthPage — Google OAuth Callback', () => {
    it('calls onAuthSuccess when oauth=success is present', async () => {
        const user = { id: 'user-1', username: 'googleuser', email: 'google@test.com' }
        const onAuthSuccess = vi.fn()
        const token = 'google-access-token'
        
        const { refreshAccessToken } = await import('@/services/api')
        refreshAccessToken.mockResolvedValueOnce({
            user,
            accessToken: token,
            token,
        })

        renderAuth(
            { onAuthSuccess },
            {
                initialEntries: [
                    `/auth?oauth=success`,
                ],
            }
        )

        await waitFor(() => {
            expect(onAuthSuccess).toHaveBeenCalledWith({
                user,
                accessToken: token,
                token,
            })
        })
    })

    it('shows an error when Google callback fails', async () => {
        renderAuth({}, { initialEntries: ['/auth?googleError=1'] })

        await waitFor(() => {
            expect(screen.getByText('Google sign-in was cancelled or failed.')).toBeInTheDocument()
        })
    })
})

describe('AuthPage — Signed In View', () => {
    const signedInUser = {
        username: 'testuser',
        email: 'test@test.com',
        role: 'viewer',
        avatar: { url: 'http://img.com/a.png' },
    }

    it('shows welcome message with username', () => {
        renderAuth({ currentUser: signedInUser })
        expect(screen.getByText(/Chào mừng trở lại, testuser/)).toBeInTheDocument()
    })

    it('shows email', () => {
        renderAuth({ currentUser: signedInUser })
        expect(screen.getByText('test@test.com')).toBeInTheDocument()
    })

    it('shows "Signed In" badge', () => {
        renderAuth({ currentUser: signedInUser })
        expect(screen.getByText('Signed In')).toBeInTheDocument()
    })

    it('shows Log Out button that calls onLogout', async () => {
        const user = userEvent.setup()
        const onLogout = vi.fn()
        renderAuth({ currentUser: signedInUser, onLogout })

        await user.click(screen.getByText('Log Out'))
        expect(onLogout).toHaveBeenCalled()
    })

    it('shows "Back To Wiki" link', () => {
        renderAuth({ currentUser: signedInUser })
        const link = screen.getByText('Back To Wiki').closest('a')
        expect(link).toHaveAttribute('href', '/')
    })
})

describe('AuthPage — Password Visibility Toggle', () => {
    it('toggles password visibility', async () => {
        const user = userEvent.setup()
        renderAuth()

        const passwordInput = screen.getByText('Password').closest('label').querySelector('input')
        expect(passwordInput).toHaveAttribute('type', 'password')

        const toggleBtn = screen.getByTitle('Show password')
        await user.click(toggleBtn)

        expect(passwordInput).toHaveAttribute('type', 'text')
    })
})
