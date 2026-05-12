import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AuthPage from '@/pages/AuthPage'

// Mock the API module
vi.mock('@/services/api', () => ({
    AUTH_TOKEN_KEY: 'testToken',
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    uploadAvatar: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshAccessToken: vi.fn(),
}))

const defaultProps = {
    sidebarCollapsed: false,
    currentUser: null,
    onAuthSuccess: vi.fn(),
    onAvatarUpdate: vi.fn(),
    onLogout: vi.fn(),
}

const renderAuth = (routerOptions = {}) =>
    render(
        <MemoryRouter initialEntries={routerOptions.initialEntries}>
            <AuthPage {...defaultProps} />
        </MemoryRouter>
    )

beforeEach(() => {
    vi.clearAllMocks()
})

describe('AuthPage — Discord OAuth Scenarios', () => {
    it('shows social conflict error when ?error=social_conflict is present', async () => {
        renderAuth({ initialEntries: ['/auth?error=social_conflict'] })

        await waitFor(() => {
            expect(screen.getByText(/This email is already associated with another login method/i)).toBeInTheDocument()
        })
    })

    it('shows generic Discord error when ?discordError=1 is present', async () => {
        renderAuth({ initialEntries: ['/auth?discordError=1'] })

        await waitFor(() => {
            expect(screen.getByText(/Discord sign-in was cancelled or failed/i)).toBeInTheDocument()
        })
    })

    it('successfully processes login when oauth=success is present', async () => {
        const user = { id: '123', username: 'discord_user', email: 'discord@test.com' }
        const onAuthSuccess = vi.fn()
        const token = 'token123'
        
        const { refreshAccessToken } = await import('@/services/api')
        refreshAccessToken.mockResolvedValueOnce({
            user,
            accessToken: token,
            token,
        })
        
        render(
            <MemoryRouter initialEntries={[`/auth?oauth=success`]}>
                <AuthPage {...defaultProps} onAuthSuccess={onAuthSuccess} />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(onAuthSuccess).toHaveBeenCalledWith({
                user,
                accessToken: token,
                token,
            })
        })
    })
})
