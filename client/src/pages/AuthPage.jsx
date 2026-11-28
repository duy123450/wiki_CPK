import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import {
  loginUser,
  registerUser,
  uploadAvatar,
  refreshAccessToken,
} from '../services/api'
import {
  GoogleLoginButton,
  TwitterLoginButton,
  DiscordLoginButton,
  GithubLoginButton,
} from '../components/Button'
import { loginSchema, registerSchema } from '../schemas/authSchemas'

export default function AuthPage({
  sidebarCollapsed,
  currentUser,
  onAuthSuccess, // ({ user, token }) — called on login / register
  onAvatarUpdate, // (avatar) — called when only the avatar changes
  onLogout,
}) {
  const [mode, setMode] = useState('login')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null)
  const fileInputRef = useRef(null)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const oauthSuccess = searchParams.get('oauth') === 'success'
  const googleError = searchParams.get('googleError')
  const twitterError = searchParams.get('twitterError')
  const discordError = searchParams.get('discordError')
  const socialError = searchParams.get('error')

  // ── react-hook-form setup ───────────────────────────────────────────────────
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { errors: fieldErrors },
  } = useForm({
    resolver: zodResolver(mode === 'register' ? registerSchema : loginSchema),
    defaultValues:
      mode === 'register'
        ? { username: '', email: '', password: '', confirmPassword: '' }
        : { identifier: '', password: '' },
  })

  useEffect(() => {
    if (oauthSuccess) {
      refreshAccessToken()
        .then((data) => {
          onAuthSuccess({
            user: data.user,
            accessToken: data.accessToken,
            token: data.accessToken,
          })
          navigate('/auth', { replace: true })
        })
        .catch(() => {
          setError('Sign-in failed or expired. Please try again.')
          navigate('/auth', { replace: true })
        })
      return
    }

    if (socialError === 'social_conflict') {
      setError(
        'This email is already associated with another login method. Please use your original login.'
      )
      navigate('/auth', { replace: true })
      return
    }

    if (googleError) {
      setError('Google sign-in was cancelled or failed.')
      navigate('/auth', { replace: true })
    }

    if (twitterError) {
      setError('X sign-in was cancelled or failed.')
      navigate('/auth', { replace: true })
    }

    if (discordError) {
      setError('Discord sign-in was cancelled or failed.')
      navigate('/auth', { replace: true })
    }
  }, [
    oauthSuccess,
    googleError,
    twitterError,
    discordError,
    socialError,
    navigate,
    onAuthSuccess,
  ])

  const switchMode = (next) => {
    setMode(next)
    reset(
      next === 'register'
        ? { username: '', email: '', password: '', confirmPassword: '' }
        : { identifier: '', password: '' }
    )
    setError('')
    setAvatarPreview(null)
    setPendingAvatarFile(null)
    setAvatarError('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  // ── File chosen ────────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setAvatarPreview(objectUrl)
    setAvatarError('')

    if (!currentUser) {
      // During register: hold the file, upload after account creation
      setPendingAvatarFile(file)
      return
    }

    // Signed-in: upload immediately, then only patch the avatar field in state
    setAvatarUploading(true)
    try {
      const data = await uploadAvatar(file)
      onAvatarUpdate(data.avatar)
      // Keep the preview until the parent re-renders with the new URL
    } catch (err) {
      setAvatarError(err.response?.data?.msg || 'Upload failed')
      setAvatarPreview(null)
    } finally {
      setAvatarUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  // ── Form submit ────────────────────────────────────────────────────────────
  const onSubmit = async (formData) => {
    setSubmitting(true)
    setError('')

    try {
      let response // { user, token }

      if (mode === 'register') {
        response = await registerUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        })
      } else {
        response = await loginUser({
          identifier: formData.identifier,
          password: formData.password,
        })
      }

      // Persist session — must be { user, token }
      onAuthSuccess(response)

      // Upload avatar chosen before submitting the register form
      if (mode === 'register' && pendingAvatarFile) {
        setAvatarUploading(true)
        try {
          const data = await uploadAvatar(pendingAvatarFile)
          onAvatarUpdate(data.avatar) // patch only the avatar slice
        } catch {
          setAvatarError(
            'Account created! Avatar upload failed — you can change it later.'
          )
        } finally {
          setAvatarUploading(false)
          setPendingAvatarFile(null)
        }
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.error || 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Signed-in view ────────────────────────────────────────────────────────
  if (currentUser) {
    return <Navigate to="/welcome" replace />
  }

  // ─── Login / Register view ─────────────────────────────────────────────────
  return (
    <section
      className={`auth-root relative box-border grid min-h-screen supports-[height:100dvh]:min-h-[100dvh] w-[calc(100%_-_var(--sidebar-current-width))] place-items-center bg-[#060714] px-5 py-8 [background-image:radial-gradient(circle_at_top_left,rgba(192,132,252,0.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(103,232,249,0.16),transparent_30%),linear-gradient(180deg,#090b18_0%,#060714_100%)] [transition:margin-left_0.35s_cubic-bezier(0.4,0,0.2,1),width_0.35s_cubic-bezier(0.4,0,0.2,1)] ml-[var(--sidebar-current-width)] max-[768px]:ml-0 max-[768px]:w-full max-[768px]:px-[14px] max-[768px]:py-5 ${sidebarCollapsed ? 'sidebar-collapsed ml-0 w-full' : ''}`}
    >
      <div className="auth-shell w-full max-w-[540px] rounded-[22px] border border-solid border-[rgba(192,132,252,0.2)] bg-[rgba(12,15,31,0.84)] p-7 font-['Source_Sans_3',sans-serif] text-[#f6f0ff] shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-[18px] max-[768px]:rounded-[18px] max-[768px]:px-[18px] max-[768px]:py-[22px]">
        <div className="auth-hero mb-[22px]">
          <span className="auth-badge inline-flex items-center rounded-full border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.08)] px-3 py-1.5 font-['Inter',sans-serif] text-[11px] uppercase tracking-[0.18em] text-[#fbbf24]">
            Member Access
          </span>
          <h1 className="auth-title mx-0 mb-[10px] mt-4 font-['Inter',sans-serif] text-[clamp(28px,4vw,40px)] leading-[1.06]">
            Đăng nhập hoặc đăng ký vào CPK Wiki
          </h1>
        </div>

        <div
          className="auth-tabs mb-[18px] grid grid-cols-2 gap-[10px]"
          role="tablist"
          aria-label="Auth mode tabs"
        >
          <button
            type="button"
            className={`auth-tab min-h-[46px] cursor-pointer rounded-xl border-0 bg-[rgba(255,255,255,0.04)] font-['Inter',sans-serif] uppercase tracking-[0.12em] text-[rgba(226,217,243,0.68)] [transition:background_0.2s_ease,color_0.2s_ease] ${mode === 'login' ? 'active bg-[rgba(192,132,252,0.16)] text-[#c084fc]' : ''}`}
            onClick={() => switchMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab min-h-[46px] cursor-pointer rounded-xl border-0 bg-[rgba(255,255,255,0.04)] font-['Inter',sans-serif] uppercase tracking-[0.12em] text-[rgba(226,217,243,0.68)] [transition:background_0.2s_ease,color_0.2s_ease] ${mode === 'register' ? 'active bg-[rgba(192,132,252,0.16)] text-[#c084fc]' : ''}`}
            onClick={() => switchMode('register')}
          >
            Register
          </button>
        </div>

        <form
          className="auth-form grid gap-[14px]"
          onSubmit={rhfHandleSubmit(onSubmit)}
        >
          {mode === 'register' && (
            <>
              {/* Avatar picker shown only during registration */}
              <div className="auth-avatar-register flex flex-col items-center gap-2">
                <div
                  className="auth-avatar-register-preview group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[rgba(192,132,252,0.4)] bg-[rgba(192,132,252,0.06)] [transition:border-color_0.2s,background_0.2s] hover:border-[#c084fc] hover:bg-[rgba(192,132,252,0.12)]"
                  onClick={() => fileInputRef.current.click()}
                  title="Click to choose an avatar"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="block h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="auth-avatar-register-placeholder select-none text-[28px] leading-none text-[rgba(192,132,252,0.5)]">
                      ＋
                    </span>
                  )}
                  <div className="auth-avatar-register-overlay absolute inset-0 flex items-center justify-center rounded-full bg-[rgba(10,8,28,0.65)] opacity-0 [transition:opacity_0.2s] group-hover:opacity-100">
                    <span className="px-2 text-center font-['Inter',sans-serif] text-[9px] uppercase tracking-[0.16em] text-white">
                      Choose avatar
                    </span>
                  </div>
                </div>

                <p className="auth-avatar-register-hint m-0 max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap text-center text-[11px] tracking-[0.03em] text-[rgba(226,217,243,0.68)] opacity-[0.65]">
                  {pendingAvatarFile
                    ? `Selected: ${pendingAvatarFile.name}`
                    : 'Optional — you can change it later'}
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <label className="auth-field grid gap-2 text-[14px] tracking-[0.04em] text-[rgba(226,217,243,0.68)]">
                <span>Username</span>
                <input
                  type="text"
                  {...register('username')}
                  autoComplete="username"
                  className="box-border min-h-12 w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(3,5,14,0.68)] px-[14px] text-[#f6f0ff] outline-none [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] focus:border-[rgba(103,232,249,0.55)] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.12)]"
                />
                {fieldErrors.username && (
                  <span className="auth-field-error -mt-0.5 text-[12px] leading-[1.3] text-[#ff9b9b]">
                    {fieldErrors.username.message}
                  </span>
                )}
              </label>
            </>
          )}

          <label className="auth-field grid gap-2 text-[14px] tracking-[0.04em] text-[rgba(226,217,243,0.68)]">
            <span>{mode === 'register' ? 'Email' : 'Email or Username'}</span>
            <input
              type={mode === 'register' ? 'email' : 'text'}
              {...register(mode === 'register' ? 'email' : 'identifier')}
              autoComplete={mode === 'register' ? 'email' : 'username'}
              className="box-border min-h-12 w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(3,5,14,0.68)] px-[14px] text-[#f6f0ff] outline-none [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] focus:border-[rgba(103,232,249,0.55)] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.12)]"
            />
            {mode === 'register' && fieldErrors.email && (
              <span className="auth-field-error -mt-0.5 text-[12px] leading-[1.3] text-[#ff9b9b]">
                {fieldErrors.email.message}
              </span>
            )}
            {mode === 'login' && fieldErrors.identifier && (
              <span className="auth-field-error -mt-0.5 text-[12px] leading-[1.3] text-[#ff9b9b]">
                {fieldErrors.identifier.message}
              </span>
            )}
          </label>

          <label className="auth-field grid gap-2 text-[14px] tracking-[0.04em] text-[rgba(226,217,243,0.68)]">
            <span>Password</span>
            <div className="auth-input-wrapper relative flex w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="box-border min-h-12 w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(3,5,14,0.68)] px-[14px] pr-12 text-[#f6f0ff] outline-none [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] focus:border-[rgba(103,232,249,0.55)] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.12)]"
              />
              <button
                type="button"
                className="auth-password-toggle absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center border-0 bg-transparent text-[rgba(226,217,243,0.68)] [transition:color_0.2s_ease] hover:text-[#67e8f9]"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="auth-field-error -mt-0.5 text-[12px] leading-[1.3] text-[#ff9b9b]">
                {fieldErrors.password.message}
              </span>
            )}
          </label>

          {mode === 'register' && (
            <label className="auth-field grid gap-2 text-[14px] tracking-[0.04em] text-[rgba(226,217,243,0.68)]">
              <span>Confirm Password</span>
              <div className="auth-input-wrapper relative flex w-full">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className="box-border min-h-12 w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(3,5,14,0.68)] px-[14px] pr-12 text-[#f6f0ff] outline-none [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] focus:border-[rgba(103,232,249,0.55)] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.12)]"
                />
                <button
                  type="button"
                  className="auth-password-toggle absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center border-0 bg-transparent text-[rgba(226,217,243,0.68)] [transition:color_0.2s_ease] hover:text-[#67e8f9]"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  title={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="auth-field-error -mt-0.5 text-[12px] leading-[1.3] text-[#ff9b9b]">
                  {fieldErrors.confirmPassword.message}
                </span>
              )}
            </label>
          )}

          {error && <p className="auth-error m-0 text-[14px] text-[#ff9b9b]">{error}</p>}
          {avatarError && mode === 'register' && (
            <p className="auth-error m-0 text-[14px] text-[#ff9b9b]">{avatarError}</p>
          )}

          <button
            className="auth-submit min-h-12 cursor-pointer rounded-xl border-0 bg-[linear-gradient(135deg,#c084fc,#818cf8)] font-['Inter',sans-serif] uppercase tracking-[0.12em] text-white disabled:cursor-wait disabled:opacity-70"
            type="submit"
            disabled={submitting || avatarUploading}
          >
            {submitting || avatarUploading
              ? 'Processing…'
              : mode === 'register'
                ? 'Create Account'
                : 'Login'}
          </button>

          <div className="auth-divider my-1 flex items-center gap-3 before:h-px before:flex-1 before:bg-[rgba(255,255,255,0.1)] before:content-[''] after:h-px after:flex-1 after:bg-[rgba(255,255,255,0.1)] after:content-['']">
            <span className="font-['Inter',sans-serif] text-[12px] uppercase tracking-[0.12em] text-[rgba(226,217,243,0.68)] opacity-60">
              or
            </span>
          </div>

          <div className="auth-google-wrap mt-2 flex justify-center gap-4">
            <GoogleLoginButton />
            <TwitterLoginButton />
            <DiscordLoginButton />
            <GithubLoginButton />
          </div>
        </form>
      </div>
    </section>
  )
}
