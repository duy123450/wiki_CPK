import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProfilePage from '@/pages/ProfilePage'

// Mock API
vi.mock('@/services/api', () => ({
    AUTH_TOKEN_KEY: 'testToken',
    uploadAvatar: vi.fn(),
    updateProfile: vi.fn(),
}))

import { updateProfile } from '@/services/api'

const mockUser = {
    username: 'testuser',
    email: 'test@test.com',
    role: 'viewer',
    avatar: { url: 'http://img.com/avatar.png' },
    createdAt: '2026-01-01T00:00:00.000Z',
}

const defaultProps = {
    sidebarCollapsed: false,
    currentUser: mockUser,
    onProfileUpdate: vi.fn(),
    onAvatarUpdate: vi.fn(),
    onLogout: vi.fn(),
}

const renderProfile = (overrides = {}) =>
    render(
        <MemoryRouter>
            <ProfilePage {...defaultProps} {...overrides} />
        </MemoryRouter>
    )

beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
})

describe('ProfilePage — Not Signed In', () => {
    it('shows "Not signed in" message', () => {
        renderProfile({ currentUser: null })
        expect(screen.getByText('Not signed in')).toBeInTheDocument()
    })

    it('shows link to login page', () => {
        renderProfile({ currentUser: null })
        const link = screen.getByText(/Go to login/).closest('a')
        expect(link).toHaveAttribute('href', '/auth')
    })
})

describe('ProfilePage — Signed In', () => {
    it('shows username in header', () => {
        renderProfile()
        expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    it('shows "Profile Settings" badge', () => {
        renderProfile()
        expect(screen.getByText('Profile Settings')).toBeInTheDocument()
    })

    it('shows role badge', () => {
        renderProfile()
        expect(screen.getByText('viewer')).toBeInTheDocument()
    })

    it('shows member since date', () => {
        renderProfile()
        // The date is formatted in vi-VN locale
        expect(screen.getByText(/2026/)).toBeInTheDocument()
    })

    it('pre-fills username and email inputs', () => {
        renderProfile()
        const usernameInput = screen.getByDisplayValue('testuser')
        const emailInput = screen.getByDisplayValue('test@test.com')
        expect(usernameInput).toBeInTheDocument()
        expect(emailInput).toBeInTheDocument()
    })

    it('Save Changes button is disabled when no changes', () => {
        renderProfile()
        const saveBtn = screen.getByText('Save Changes')
        expect(saveBtn).toBeDisabled()
    })

    it('enables Save Changes when username is changed', async () => {
        const user = userEvent.setup()
        renderProfile()

        const usernameInput = screen.getByDisplayValue('testuser')
        await user.clear(usernameInput)
        await user.type(usernameInput, 'newname')

        const saveBtn = screen.getByText('Save Changes')
        expect(saveBtn).not.toBeDisabled()
    })

    it('shows error when new passwords do not match', async () => {
        const user = userEvent.setup()
        renderProfile()

        const newPwdInput = screen.getByPlaceholderText('Minimum 6 characters')
        const confirmPwdInput = screen.getByPlaceholderText('Re-enter new password')

        await user.type(newPwdInput, 'newpass1')
        await user.type(confirmPwdInput, 'newpass2')

        // Need to also type current password to enable save
        const currentPwdInput = screen.getByPlaceholderText('Required to change password')
        await user.type(currentPwdInput, 'oldpass')

        const saveBtn = screen.getByText('Save Changes')
        await user.click(saveBtn)

        await waitFor(() => {
            expect(screen.getByText('New passwords do not match')).toBeInTheDocument()
        })
    })

    it('calls updateProfile on valid save', async () => {
        const user = userEvent.setup()
        updateProfile.mockResolvedValueOnce({
            user: { username: 'newname', email: 'test@test.com', role: 'viewer' },
            token: 'new-token',
        })

        renderProfile()

        const usernameInput = screen.getByDisplayValue('testuser')
        await user.clear(usernameInput)
        await user.type(usernameInput, 'newname')

        await user.click(screen.getByText('Save Changes'))

        await waitFor(() => {
            expect(updateProfile).toHaveBeenCalledWith({ username: 'newname' })
        })
    })

    it('resets fields when Reset button is clicked', async () => {
        const user = userEvent.setup()
        renderProfile()

        const usernameInput = screen.getByDisplayValue('testuser')
        await user.clear(usernameInput)
        await user.type(usernameInput, 'changed')

        await user.click(screen.getByText('Reset'))

        expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    })

    it('renders Change Avatar button', () => {
        renderProfile()
        expect(screen.getByText('Change Avatar')).toBeInTheDocument()
    })

    it('renders Back to Wiki link', () => {
        renderProfile()
        const link = screen.getByText('Back to Wiki').closest('a')
        expect(link).toHaveAttribute('href', '/')
    })

    it('shows zod validation error for short username', async () => {
        const user = userEvent.setup()
        renderProfile()

        const usernameInput = screen.getByDisplayValue('testuser')
        await user.clear(usernameInput)
        await user.type(usernameInput, 'ab')

        await user.click(screen.getByText('Save Changes'))

        await waitFor(() => {
            expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument()
        })
        expect(updateProfile).not.toHaveBeenCalled()
    })
})
