import { useState, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { uploadAvatar } from '../services/api'
import '../styles/AuthPage.css'

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
    <section className={`auth-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="auth-shell auth-shell--signed-in">
        <span className="auth-badge">Signed In</span>

        <div className="auth-avatar-wrap">
          <div className={`auth-avatar-ring ${avatarUploading ? 'auth-avatar-ring--uploading' : ''}`}>
            <img
              src={avatarSrc}
              alt={`${currentUser.username}'s avatar`}
              className="auth-avatar-img"
            />
            {avatarUploading && (
              <div className="auth-avatar-spinner" aria-label="Uploading…" />
            )}
          </div>

          <button
            type="button"
            className="auth-avatar-btn"
            onClick={() => fileInputRef.current.click()}
            disabled={avatarUploading}
          >
            {avatarUploading ? 'Uploading…' : 'Change Avatar'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />

          {avatarError && <p className="auth-error">{avatarError}</p>}
        </div>

        <h1 className="auth-title">Okaeri, {currentUser.username}-san</h1>
        <p className="auth-copy">Quay về wiki hoặc đăng xuất tại đây.</p>

        <div className="auth-user-card">
          <span className="auth-user-label">Email</span>
          <strong>{currentUser.email}</strong>
          <span className="auth-user-role">{currentUser.role}</span>
        </div>

        <div className="auth-actions">
          <Link to="/" className="auth-btn auth-btn-primary">
            Back To Wiki
          </Link>
          <button
            type="button"
            className="auth-btn auth-btn-secondary"
            onClick={onLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </section>
  )
}
