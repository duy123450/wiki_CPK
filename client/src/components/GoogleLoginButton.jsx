import { GoogleLogin } from '@react-oauth/google'
import { googleLogin } from '../services/api'

/**
 * Renders the official "Sign in with Google" button.
 *
 * Props:
 *   onSuccess({ user, token })  — called after backend verification succeeds
 *   onError(errorMessage)       — called if anything goes wrong
 */
export default function GoogleLoginButton({ onSuccess, onError }) {
  const handleSuccess = async (credentialResponse) => {
    try {
      // Send the Google JWT to our backend for verification
      const data = await googleLogin(credentialResponse.credential)
      onSuccess(data) // { user, token }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Google sign-in failed. Please try again.'
      onError?.(message)
    }
  }

  const handleError = () => {
    onError?.('Google sign-in was cancelled or failed.')
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError}
      theme="filled_black"
      size="large"
      shape="pill"
      text="signin_with"
      width="300"
    />
  )
}
