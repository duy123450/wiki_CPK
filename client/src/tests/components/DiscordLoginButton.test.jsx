import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DiscordLoginButton from '@/components/DiscordLoginButton'
import * as api from '@/services/api'

vi.mock('@/services/api', () => ({
    getDiscordLoginUrl: vi.fn(() => 'http://localhost:3000/api/v1/wiki/auth/discord'),
}))

describe('DiscordLoginButton', () => {
    it('renders correctly', () => {
        render(<DiscordLoginButton />)
        expect(screen.getByText(/Sign in with Discord/i)).toBeInTheDocument()
    })

    it('triggers redirect to backend OAuth endpoint on click', () => {
        // Mock window.location.href
        const originalLocation = window.location
        delete window.location
        window.location = { href: '' }

        render(<DiscordLoginButton />)
        const button = screen.getByRole('button')
        
        fireEvent.click(button)

        expect(window.location.href).toMatch(/auth\/discord/)

        // Cleanup
        window.location = originalLocation
    })
})
