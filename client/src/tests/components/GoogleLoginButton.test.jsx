/**
 * Tests for the GoogleLoginButton component.
 *
 * @react-oauth/google is mocked so we can simulate onSuccess / onError
 * callbacks without needing a real Google OAuth provider.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock @react-oauth/google — render a simple button we can click
vi.mock('@react-oauth/google', () => ({
    GoogleLogin: ({ onSuccess, onError }) => (
        <div data-testid="google-login-mock">
            <button
                data-testid="google-success-btn"
                onClick={() => onSuccess({ credential: 'mock-google-jwt' })}
            >
                Sign in with Google
            </button>
            <button
                data-testid="google-error-btn"
                onClick={() => onError()}
            >
                Trigger Error
            </button>
        </div>
    ),
}))

// Mock the API service
vi.mock('@/services/api', () => ({
    AUTH_TOKEN_KEY: 'testToken',
    googleLogin: vi.fn(),
}))

import { googleLogin } from '@/services/api'
import GoogleLoginButton from '@/components/GoogleLoginButton'

beforeEach(() => {
    vi.clearAllMocks()
})

describe('GoogleLoginButton', () => {
    const defaultProps = {
        onSuccess: vi.fn(),
        onError: vi.fn(),
    }

    const renderButton = (overrides = {}) =>
        render(<GoogleLoginButton {...defaultProps} {...overrides} />)

    it('renders the Google login button', () => {
        renderButton()
        expect(screen.getByTestId('google-login-mock')).toBeInTheDocument()
        expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
    })

    it('calls googleLogin API and onSuccess when Google returns a credential', async () => {
        const user = userEvent.setup()
        const apiResponse = { user: { username: 'googleuser' }, token: 'jwt-123' }
        googleLogin.mockResolvedValueOnce(apiResponse)

        renderButton()
        await user.click(screen.getByTestId('google-success-btn'))

        await waitFor(() => {
            expect(googleLogin).toHaveBeenCalledWith('mock-google-jwt')
            expect(defaultProps.onSuccess).toHaveBeenCalledWith(apiResponse)
        })
    })

    it('calls onError when the API call fails', async () => {
        const user = userEvent.setup()
        googleLogin.mockRejectedValueOnce({
            response: { data: { message: 'Token verification failed' } },
        })

        renderButton()
        await user.click(screen.getByTestId('google-success-btn'))

        await waitFor(() => {
            expect(defaultProps.onError).toHaveBeenCalledWith('Token verification failed')
        })
    })

    it('calls onError with default message when API error has no message', async () => {
        const user = userEvent.setup()
        googleLogin.mockRejectedValueOnce(new Error('Network error'))

        renderButton()
        await user.click(screen.getByTestId('google-success-btn'))

        await waitFor(() => {
            expect(defaultProps.onError).toHaveBeenCalledWith(
                'Google sign-in failed. Please try again.'
            )
        })
    })

    it('calls onError when Google login itself fails (onError callback)', async () => {
        const user = userEvent.setup()

        renderButton()
        await user.click(screen.getByTestId('google-error-btn'))

        expect(defaultProps.onError).toHaveBeenCalledWith(
            'Google sign-in was cancelled or failed.'
        )
    })

    it('does not crash when onError prop is not provided', async () => {
        const user = userEvent.setup()

        render(<GoogleLoginButton onSuccess={vi.fn()} />)
        await user.click(screen.getByTestId('google-error-btn'))

        // Should not throw
    })
})
