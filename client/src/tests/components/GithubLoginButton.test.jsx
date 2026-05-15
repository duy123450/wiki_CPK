import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import GithubLoginButton from '@/components/GithubLoginButton'
import { getGithubLoginUrl } from '@/services/api'

// Mock the API service
vi.mock('@/services/api', () => ({
    getGithubLoginUrl: vi.fn(),
}))

describe('GithubLoginButton', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Mock window.location
        delete window.location
        window.location = { href: '' }
    })

    it('renders the GitHub login button', () => {
        render(<GithubLoginButton />)
        const button = screen.getByRole('button', { name: /Sign in with GitHub/i })
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('auth-google-button')
    })

    it('redirects to GitHub auth URL on click', () => {
        const mockUrl = 'http://localhost:3000/api/v1/wiki/auth/github'
        getGithubLoginUrl.mockReturnValue(mockUrl)

        render(<GithubLoginButton />)
        const button = screen.getByRole('button', { name: /Sign in with GitHub/i })
        
        button.click()
        
        expect(getGithubLoginUrl).toHaveBeenCalledTimes(1)
        expect(window.location.href).toBe(mockUrl)
    })
})
