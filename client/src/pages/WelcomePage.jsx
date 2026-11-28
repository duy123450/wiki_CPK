import { useState, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { uploadAvatar } from '../services/api'

export default function WelcomePage({
  sidebarCollapsed,
  currentUser,
  onAvatarUpdate,
  onLogout,
}) {
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const fileInputRef = useRef(null)

  if (!currentUser) {
    return <Navigate to="/auth" replace />
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setAvatarPreview(objectUrl)
    setAvatarError('')
    setAvatarUploading(true)

    try {
      const data = await uploadAvatar(file)
      onAvatarUpdate(data.avatar)
    } catch (err) {
      setAvatarError(err.response?.data?.msg || 'Upload failed')
      setAvatarPreview(null)
    } finally {
      setAvatarUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  const avatarSrc = avatarPreview || currentUser.avatar?.url

  return (
    <section
      className={`auth-root relative box-border grid min-h-screen supports-[height:100dvh]:min-h-[100dvh] w-[calc(100%_-_var(--sidebar-current-width))] place-items-center bg-[#060714] px-5 py-8 [background-image:radial-gradient(circle_at_top_left,rgba(192,132,252,0.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(103,232,249,0.16),transparent_30%),linear-gradient(180deg,#090b18_0%,#060714_100%)] [transition:margin-left_0.35s_cubic-bezier(0.4,0,0.2,1),width_0.35s_cubic-bezier(0.4,0,0.2,1)] ml-[var(--sidebar-current-width)] max-[768px]:ml-0 max-[768px]:w-full max-[768px]:px-[14px] max-[768px]:py-5 ${sidebarCollapsed ? 'sidebar-collapsed ml-0 w-full' : ''}`}
    >
      <div className="auth-shell auth-shell--signed-in w-full max-w-[540px] rounded-[22px] border border-solid border-[rgba(192,132,252,0.2)] bg-[rgba(12,15,31,0.84)] p-7 text-center font-['Source_Sans_3',sans-serif] text-[#f6f0ff] shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-[18px] max-[768px]:rounded-[18px] max-[768px]:px-[18px] max-[768px]:py-[22px]">
        <span className="auth-badge inline-flex items-center rounded-full border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.08)] px-3 py-1.5 font-['Inter',sans-serif] text-[11px] uppercase tracking-[0.18em] text-[#fbbf24]">
          Signed In
        </span>

        <div className="auth-avatar-wrap mb-5 flex flex-col items-center gap-3">
          <div className={`auth-avatar-ring ${avatarUploading ? 'auth-avatar-ring--uploading' : ''}`}>
            <img
              src={avatarSrc}
              alt={`${currentUser.username}'s avatar`}
              className="auth-avatar-img box-border h-20 w-20 rounded-full border-2 border-[rgba(192,132,252,0.4)] object-cover"
            />
            {avatarUploading && (
              <div className="auth-avatar-spinner" aria-label="Uploading…" />
            )}
          </div>

          <button
            type="button"
            className="auth-avatar-btn cursor-pointer rounded-lg border border-[rgba(192,132,252,0.3)] bg-[rgba(192,132,252,0.08)] px-4 py-[7px] font-['Inter',sans-serif] text-[11px] uppercase tracking-[0.14em] text-[#c084fc] [transition:background_0.2s,border-color_0.2s] hover:border-[#c084fc] hover:bg-[rgba(192,132,252,0.16)] disabled:cursor-wait disabled:opacity-60"
            onClick={() => fileInputRef.current.click()}
            disabled={avatarUploading}
          >
            {avatarUploading ? 'Uploading…' : 'Change Avatar'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            onChange={handleAvatarChange}
          />

          {avatarError && (
            <p className="auth-error m-0 text-[14px] text-[#ff9b9b]">
              {avatarError}
            </p>
          )}
        </div>

        <h1 className="auth-title mx-0 mb-[10px] mt-4 font-['Inter',sans-serif] text-[clamp(28px,4vw,40px)] leading-[1.06]">
          Okaeri, {currentUser.username}-san
        </h1>
        <p className="auth-copy m-0 text-[17px] leading-[1.5] text-[rgba(226,217,243,0.68)]">
          Quay về wiki hoặc đăng xuất tại đây.
        </p>

        <div className="auth-user-card my-[22px] grid gap-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-[18px]">
          <span className="auth-user-label text-[13px] uppercase tracking-[0.12em] text-[rgba(226,217,243,0.68)]">
            Email
          </span>
          <strong>{currentUser.email}</strong>
          <span className="auth-user-role text-[13px] uppercase tracking-[0.12em] text-[rgba(226,217,243,0.68)]">
            {currentUser.role}
          </span>
        </div>

        <div className="auth-actions flex flex-wrap justify-center gap-3 max-[768px]:flex-col">
          <Link
            to="/"
            className="auth-btn auth-btn-primary inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#c084fc,#818cf8)] px-[18px] font-['Inter',sans-serif] uppercase tracking-[0.12em] text-white no-underline"
          >
            Back To Wiki
          </Link>
          <button
            type="button"
            className="auth-btn auth-btn-secondary inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-[rgba(103,232,249,0.35)] bg-transparent px-[18px] font-['Inter',sans-serif] uppercase tracking-[0.12em] text-[#67e8f9]"
            onClick={onLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </section>
  )
}
