import { getGoogleLoginUrl } from '../services/api'

export default function GoogleLoginButton() {
  const handleClick = () => {
    window.location.href = getGoogleLoginUrl()
  }

  return (
    <button type="button" className="auth-google-button" onClick={handleClick}>
      <svg
        className="auth-google-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.64v3h3.89c2.27-2.1 3.53-5.19 3.53-8.88z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.89-3c-1.08.72-2.46 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95h-4v3.09A12 12 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.29 14.28A7.22 7.22 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.63h-4A12 12 0 0 0 0 12c0 1.93.46 3.75 1.29 5.37l4-3.09z"
        />
        <path
          fill="#EA4335"
          d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44A11.56 11.56 0 0 0 12 0 12 12 0 0 0 1.29 6.63l4 3.09C6.23 6.88 8.88 4.77 12 4.77z"
        />
      </svg>
      Sign in with Google
    </button>
  )
}
