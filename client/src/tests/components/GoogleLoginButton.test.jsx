import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GoogleLoginButton from '@/components/GoogleLoginButton'

vi.mock('@/services/api', () => ({
    getGoogleLoginUrl: vi.fn(() => 'http://localhost:3000/api/v1/wiki/auth/google'),
}))

describe('GoogleLoginButton', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete window.location
        window.location = { href: '' }
    })

    it('renders the Google login button', () => {
        render(<GoogleLoginButton />)

        expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument()
        expect(document.querySelector('.auth-google-icon')).toBeInTheDocument()
    })

    it('redirects to the backend Google OAuth route', async () => {
        const user = userEvent.setup()
        render(<GoogleLoginButton />)

        await user.click(screen.getByRole('button', { name: 'Sign in with Google' }))

        expect(window.location.href).toBe('http://localhost:3000/api/v1/wiki/auth/google')
    })
})
