import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User,
  Mail,
  Lock,
  Shield,
  Camera,
  ArrowLeft,
  Check,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react'
import { uploadAvatar, updateProfile } from '../services/api'
import { useAppDispatch } from '../store/hooks'
import { deleteAccountThunk } from '../store/slices/authSlice'
import { DEFAULT_AVATAR } from '../constants'
import { formatVNDate } from '../utils/dateUtils'
import { profileSchema } from '../schemas/profileSchemas'
import '../styles/ProfilePage.css'

export default function ProfilePage({
  sidebarCollapsed,
  currentUser,
  onProfileUpdate,
  onAvatarUpdate,
  onLogout,
}) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const fileInputRef = useRef(null)

  // ── react-hook-form setup ──────────────────────────────────────────────────
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { errors: fieldErrors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // ── Non-form state ─────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', msg }

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ── Sync form when user data changes ────────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      reset({
        username: currentUser.username || '',
        email: currentUser.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    }
  }, [currentUser, reset])

  // ── Auto-dismiss toast ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  // ── Redirect if not logged in ───────────────────────────────────────────────
  if (!currentUser) {
    return (
      <section
        className={`profile-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      >
        <div className="profile-container" style={{ textAlign: 'center' }}>
          <h1 className="profile-title">Not signed in</h1>
          <p style={{ color: 'rgba(226,217,243,0.6)', marginBottom: 20 }}>
            Please log in to view your profile.
          </p>
          <Link to="/auth" className="profile-back-link">
            <ArrowLeft size={14} /> Go to login
          </Link>
        </div>
      </section>
    )
  }

  // ── Avatar change ───────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setAvatarPreview(objectUrl)
    setAvatarUploading(true)

    try {
      const data = await uploadAvatar(file)
      onAvatarUpdate(data.avatar)
      setToast({ type: 'success', msg: 'Avatar updated!' })
    } catch (err) {
      setToast({
        type: 'error',
        msg: err.response?.data?.msg || 'Avatar upload failed',
      })
      setAvatarPreview(null)
    } finally {
      setAvatarUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  // ── Profile save ────────────────────────────────────────────────────────────
  const onSubmit = async (formData) => {
    const payload = {}

    // Only send changed fields
    if (formData.username.trim() !== currentUser.username) {
      payload.username = formData.username.trim()
    }
    if (formData.email.trim().toLowerCase() !== currentUser.email) {
      payload.email = formData.email.trim()
    }
    if (formData.newPassword) {
      payload.currentPassword = formData.currentPassword
      payload.newPassword = formData.newPassword
    }

    // Nothing changed
    if (Object.keys(payload).length === 0) {
      setToast({ type: 'success', msg: 'No changes to save' })
      return
    }

    setSaving(true)
    try {
      const data = await updateProfile(payload)
      onProfileUpdate(data.user, data.token)
      setToast({ type: 'success', msg: 'Profile updated successfully!' })
    } catch (err) {
      setToast({
        type: 'error',
        msg: err.response?.data?.msg || 'Failed to update profile',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    reset({
      username: currentUser.username,
      email: currentUser.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await dispatch(deleteAccountThunk()).unwrap()
      navigate('/auth')
    } catch (err) {
      setToast({ type: 'error', msg: err || 'Failed to delete account' })
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const avatarSrc = avatarPreview || currentUser.avatar?.url || DEFAULT_AVATAR

  return (
    <section
      className={`profile-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      <div className="profile-container">
        {/* Back link */}
        <Link to="/" className="profile-back-link">
          <ArrowLeft size={14} />
          Back to Wiki
        </Link>

        {/* Header */}
        <div className="profile-header">
          <span className="profile-badge">Profile Settings</span>
          <h1 className="profile-title">{currentUser.username}</h1>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`profile-toast profile-toast--${toast.type}`}>
            {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Avatar section */}
        <div className="profile-avatar-section">
          <div
            className={`profile-avatar-ring ${avatarUploading ? 'profile-avatar-ring--uploading' : ''}`}
          >
            <img
              src={avatarSrc}
              alt={currentUser.username}
              className="profile-avatar-image"
              onError={(e) => {
                e.target.src = DEFAULT_AVATAR
              }}
            />
            {avatarUploading && <div className="profile-avatar-spinner" />}
          </div>

          <button
            type="button"
            className="profile-avatar-btn"
            onClick={() => fileInputRef.current.click()}
            disabled={avatarUploading}
          >
            <Camera size={13} style={{ marginRight: 4 }} />
            {avatarUploading ? 'Uploading…' : 'Change Avatar'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>

        {/* Account Info (read-only) */}
        <div className="profile-card">
          <h2 className="profile-card-title">
            <Shield size={14} />
            Account Info
          </h2>

          <div className="profile-info-row">
            <span className="profile-info-label">Role</span>
            <span
              className={`profile-role-badge profile-role-badge--${currentUser.role}`}
            >
              {currentUser.role}
            </span>
          </div>

          <div className="profile-info-row">
            <span className="profile-info-label">Member since</span>
            <span className="profile-info-value">
              {formatVNDate(currentUser.createdAt)}
            </span>
          </div>
        </div>

        {/* Editable profile form */}
        <form className="profile-card" onSubmit={rhfHandleSubmit(onSubmit)}>
          <h2 className="profile-card-title">
            <User size={14} />
            Edit Profile
          </h2>

          <div className="profile-field">
            <label className="profile-field-label">Username</label>
            <input
              type="text"
              className="profile-field-input"
              {...register('username')}
              disabled={saving}
            />
            {fieldErrors.username && (
              <p className="profile-field-error">
                {fieldErrors.username.message}
              </p>
            )}
            <p className="profile-field-hint">3–20 characters</p>
          </div>

          <div className="profile-field">
            <label className="profile-field-label">Email</label>
            <input
              type="email"
              className="profile-field-input"
              {...register('email')}
              disabled={saving}
            />
            {fieldErrors.email && (
              <p className="profile-field-error">{fieldErrors.email.message}</p>
            )}
          </div>

          <div className="profile-divider" />

          <h2 className="profile-card-title">
            <Lock size={14} />
            Change Password
          </h2>
          <p className="profile-field-hint" style={{ marginTop: -8 }}>
            Leave blank to keep your current password
          </p>

          <div className="profile-field">
            <label className="profile-field-label">Current Password</label>
            <div className="profile-input-wrapper">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                className="profile-field-input"
                {...register('currentPassword')}
                placeholder="Required to change password"
                disabled={saving}
              />
              <button
                type="button"
                className="profile-password-toggle"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                title={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.currentPassword && (
              <p className="profile-field-error">
                {fieldErrors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="profile-field">
            <label className="profile-field-label">New Password</label>
            <div className="profile-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="profile-field-input"
                {...register('newPassword')}
                placeholder="Minimum 6 characters"
                disabled={saving}
              />
              <button
                type="button"
                className="profile-password-toggle"
                onClick={() => setShowNewPassword((prev) => !prev)}
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.newPassword && (
              <p className="profile-field-error">
                {fieldErrors.newPassword.message}
              </p>
            )}
          </div>

          <div className="profile-field">
            <label className="profile-field-label">Confirm New Password</label>
            <div className="profile-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="profile-field-input"
                {...register('confirmPassword')}
                placeholder="Re-enter new password"
                disabled={saving}
              />
              <button
                type="button"
                className="profile-password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="profile-field-error">
                {fieldErrors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="profile-actions">
            <button
              type="submit"
              className="profile-btn profile-btn--primary"
              disabled={saving || !isDirty}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="profile-btn profile-btn--ghost"
              onClick={handleReset}
              disabled={saving}
            >
              Reset
            </button>
          </div>
        </form>

        {/* Delete Account Section */}
        <div className="profile-card" style={{ marginTop: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <h2 className="profile-card-title" style={{ color: '#ef4444' }}>
            <AlertTriangle size={14} />
            Danger Zone
          </h2>
          <p className="profile-field-hint" style={{ marginTop: -8, marginBottom: 16 }}>
            Permanently delete your account and all of your data. This action cannot be undone.
          </p>
          
          {showDeleteConfirm ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <p style={{ color: '#ef4444', marginBottom: '16px', fontWeight: 500, fontSize: '14px' }}>
                Are you absolutely sure? This will permanently delete your account.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="profile-btn"
                  style={{ background: '#ef4444', color: 'white', borderColor: '#ef4444' }}
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  type="button"
                  className="profile-btn profile-btn--ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="profile-btn"
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'transparent' }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
