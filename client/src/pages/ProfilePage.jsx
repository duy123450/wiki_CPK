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
        className={`profile-root box-border flex min-h-[100dvh] justify-center px-5 pb-20 pt-12 font-['Source_Sans_3',sans-serif] text-[#f6f0ff] [background:radial-gradient(circle_at_top_left,rgba(192,132,252,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(103,232,249,0.14),transparent_30%),linear-gradient(180deg,#090b18_0%,#060714_100%)] [margin-left:var(--sidebar-current-width)] [transition:margin-left_0.35s_cubic-bezier(0.4,0,0.2,1),width_0.35s_cubic-bezier(0.4,0,0.2,1)] w-[calc(100%-var(--sidebar-current-width))] max-[768px]:ml-0 max-[768px]:w-full max-[768px]:px-[14px] max-[768px]:pb-[60px] max-[768px]:pt-6 ${sidebarCollapsed ? 'sidebar-collapsed !ml-0 !w-full' : ''}`}
      >
        <div className="profile-container flex w-[min(100%,600px)] flex-col gap-7 text-center">
          <h1 className="profile-title m-0 font-['Inter',sans-serif] text-[clamp(26px,4vw,36px)] font-bold leading-[1.1] text-transparent [background:linear-gradient(135deg,#e2d9f3,#c084fc)] [background-clip:text] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">Not signed in</h1>
          <p className="mb-5 text-[rgba(226,217,243,0.6)]">
            Please log in to view your profile.
          </p>
          <Link to="/auth" className="profile-back-link inline-flex items-center justify-center gap-[6px] self-center font-['Inter',sans-serif] text-[13px] tracking-[0.06em] text-[rgba(226,217,243,0.5)] no-underline transition-colors duration-200 hover:text-[#c084fc]">
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
      className={`profile-root box-border flex min-h-[100dvh] justify-center px-5 pb-20 pt-12 font-['Source_Sans_3',sans-serif] text-[#f6f0ff] [background:radial-gradient(circle_at_top_left,rgba(192,132,252,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(103,232,249,0.14),transparent_30%),linear-gradient(180deg,#090b18_0%,#060714_100%)] [margin-left:var(--sidebar-current-width)] [transition:margin-left_0.35s_cubic-bezier(0.4,0,0.2,1),width_0.35s_cubic-bezier(0.4,0,0.2,1)] w-[calc(100%-var(--sidebar-current-width))] max-[768px]:ml-0 max-[768px]:w-full max-[768px]:px-[14px] max-[768px]:pb-[60px] max-[768px]:pt-6 ${sidebarCollapsed ? 'sidebar-collapsed !ml-0 !w-full' : ''}`}
    >
      <div className="profile-container flex w-[min(100%,600px)] flex-col gap-7">
        {/* Back link */}
        <Link to="/" className="profile-back-link inline-flex items-center gap-[6px] self-start font-['Inter',sans-serif] text-[13px] tracking-[0.06em] text-[rgba(226,217,243,0.5)] no-underline transition-colors duration-200 hover:text-[#c084fc]">
          <ArrowLeft size={14} />
          Back to Wiki
        </Link>

        {/* Header */}
        <div className="profile-header text-center">
          <span className="profile-badge mb-[14px] inline-flex items-center rounded-full border border-solid border-[rgba(192,132,252,0.3)] bg-[rgba(192,132,252,0.08)] px-[14px] py-[6px] font-['Inter',sans-serif] text-[11px] uppercase tracking-[0.18em] text-[#c084fc]">Profile Settings</span>
          <h1 className="profile-title m-0 font-['Inter',sans-serif] text-[clamp(26px,4vw,36px)] font-bold leading-[1.1] text-transparent [background:linear-gradient(135deg,#e2d9f3,#c084fc)] [background-clip:text] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">{currentUser.username}</h1>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`profile-toast flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] animate-[toast-in_0.3s_ease] ${toast.type === 'success' ? 'border border-solid border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.1)] text-[#4ade80]' : 'border border-solid border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.1)] text-[#f87171]'}`}>
            {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Avatar section */}
        <div className="profile-avatar-section flex flex-col items-center gap-[14px] rounded-[20px] border border-solid border-[rgba(192,132,252,0.15)] bg-[rgba(12,15,31,0.7)] p-7 [backdrop-filter:blur(14px)] [-webkit-backdrop-filter:blur(14px)] max-[768px]:rounded-2xl max-[768px]:px-4 max-[768px]:py-5">
          <div
            className={`profile-avatar-ring relative h-[100px] w-[100px] rounded-full p-[3px] [background:linear-gradient(135deg,rgba(192,132,252,0.5),rgba(103,232,249,0.4))] [transition:box-shadow_0.3s_ease] hover:shadow-[0_0_20px_rgba(192,132,252,0.3)] ${avatarUploading ? 'profile-avatar-ring--uploading animate-[avatar-pulse_1.2s_ease-in-out_infinite]' : ''}`}
          >
            <img
              src={avatarSrc}
              alt={currentUser.username}
              className="profile-avatar-image block h-full w-full rounded-full border-[3px] border-solid border-[#0a0b14] object-cover"
              onError={(e) => {
                e.target.src = DEFAULT_AVATAR
              }}
            />
            {avatarUploading && <div className="profile-avatar-spinner absolute -inset-[3px] rounded-full border-2 border-solid border-transparent border-t-[#c084fc] animate-[spin_0.8s_linear_infinite]" />}
          </div>

          <button
            type="button"
            className="profile-avatar-btn rounded-[10px] border border-solid border-[rgba(192,132,252,0.3)] bg-[rgba(192,132,252,0.08)] px-[18px] py-2 font-['Inter',sans-serif] text-[11px] uppercase tracking-[0.14em] text-[#c084fc] [transition:background_0.2s,border-color_0.2s,transform_0.15s] enabled:hover:-translate-y-px enabled:hover:border-[#c084fc] enabled:hover:bg-[rgba(192,132,252,0.18)] disabled:cursor-wait disabled:opacity-60"
            onClick={() => fileInputRef.current.click()}
            disabled={avatarUploading}
          >
            <Camera size={13} className="mr-1 inline" />
            {avatarUploading ? 'Uploading…' : 'Change Avatar'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Account Info (read-only) */}
        <div className="profile-card flex flex-col gap-[18px] rounded-[20px] border border-solid border-[rgba(192,132,252,0.15)] bg-[rgba(12,15,31,0.7)] p-6 [backdrop-filter:blur(14px)] [-webkit-backdrop-filter:blur(14px)] max-[768px]:rounded-2xl max-[768px]:px-4 max-[768px]:py-5">
          <h2 className="profile-card-title m-0 flex items-center gap-2 font-['Inter',sans-serif] text-[13px] uppercase tracking-[0.2em] text-[#c084fc] opacity-90 [&_svg]:opacity-70">
            <Shield size={14} />
            Account Info
          </h2>

          <div className="profile-info-row flex items-center justify-between rounded-[10px] border border-solid border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
            <span className="profile-info-label font-['Inter',sans-serif] text-xs uppercase tracking-[0.08em] text-[rgba(226,217,243,0.5)]">Role</span>
            <span
              className={`profile-role-badge inline-flex rounded-full px-[10px] py-1 font-['Inter',sans-serif] text-[10px] uppercase tracking-[0.14em] ${currentUser.role === 'admin' ? 'border border-solid border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.12)] text-[#fbbf24]' : currentUser.role === 'editor' ? 'border border-solid border-[rgba(103,232,249,0.3)] bg-[rgba(103,232,249,0.1)] text-[#67e8f9]' : 'border border-solid border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-[rgba(226,217,243,0.7)]'}`}
            >
              {currentUser.role}
            </span>
          </div>

          <div className="profile-info-row flex items-center justify-between rounded-[10px] border border-solid border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
            <span className="profile-info-label font-['Inter',sans-serif] text-xs uppercase tracking-[0.08em] text-[rgba(226,217,243,0.5)]">Member since</span>
            <span className="profile-info-value text-[14px] text-[#e2d9f3]">
              {formatVNDate(currentUser.createdAt)}
            </span>
          </div>
        </div>

        {/* Editable profile form */}
        <form className="profile-card flex flex-col gap-[18px] rounded-[20px] border border-solid border-[rgba(192,132,252,0.15)] bg-[rgba(12,15,31,0.7)] p-6 [backdrop-filter:blur(14px)] [-webkit-backdrop-filter:blur(14px)] max-[768px]:rounded-2xl max-[768px]:px-4 max-[768px]:py-5" onSubmit={rhfHandleSubmit(onSubmit)}>
          <h2 className="profile-card-title m-0 flex items-center gap-2 font-['Inter',sans-serif] text-[13px] uppercase tracking-[0.2em] text-[#c084fc] opacity-90 [&_svg]:opacity-70">
            <User size={14} />
            Edit Profile
          </h2>

          <div className="profile-field flex flex-col gap-[6px]">
            <label className="profile-field-label font-['Inter',sans-serif] text-xs uppercase tracking-[0.08em] text-[rgba(226,217,243,0.6)]">Username</label>
            <input
              type="text"
              className="profile-field-input box-border min-h-[46px] w-full rounded-xl border border-solid border-[rgba(255,255,255,0.08)] bg-[rgba(3,5,14,0.68)] px-[14px] py-0 text-[15px] text-[#f6f0ff] outline-none [font:inherit] [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] focus:border-[rgba(103,232,249,0.55)] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
              {...register('username')}
              disabled={saving}
            />
            {fieldErrors.username && (
              <p className="profile-field-error -mt-[2px] mb-0 text-xs leading-[1.3] text-[#f87171]">
                {fieldErrors.username.message}
              </p>
            )}
            <p className="profile-field-hint m-0 text-[11px] text-[rgba(226,217,243,0.4)]">3–20 characters</p>
          </div>

          <div className="profile-field flex flex-col gap-[6px]">
            <label className="profile-field-label font-['Inter',sans-serif] text-xs uppercase tracking-[0.08em] text-[rgba(226,217,243,0.6)]">Email</label>
            <input
              type="email"
              className="profile-field-input box-border min-h-[46px] w-full rounded-xl border border-solid border-[rgba(255,255,255,0.08)] bg-[rgba(3,5,14,0.68)] px-[14px] py-0 text-[15px] text-[#f6f0ff] outline-none [font:inherit] [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] focus:border-[rgba(103,232,249,0.55)] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
              {...register('email')}
              disabled={saving}
            />
            {fieldErrors.email && (
              <p className="profile-field-error -mt-[2px] mb-0 text-xs leading-[1.3] text-[#f87171]">{fieldErrors.email.message}</p>
            )}
          </div>

          <div className="profile-divider h-px bg-[rgba(192,132,252,0.1)] my-1" />

          <h2 className="profile-card-title m-0 flex items-center gap-2 font-['Inter',sans-serif] text-[13px] uppercase tracking-[0.2em] text-[#c084fc] opacity-90 [&_svg]:opacity-70">
            <Lock size={14} />
            Change Password
          </h2>
          <p className="profile-field-hint mt-[-8px] mb-0 text-[11px] text-[rgba(226,217,243,0.4)]">
            Leave blank to keep your current password
          </p>

          <div className="profile-field flex flex-col gap-[6px]">
            <label className="profile-field-label font-['Inter',sans-serif] text-xs uppercase tracking-[0.08em] text-[rgba(226,217,243,0.6)]">Current Password</label>
            <div className="profile-input-wrapper relative flex w-full">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                className="profile-field-input box-border min-h-[46px] w-full rounded-xl border border-solid border-[rgba(255,255,255,0.08)] bg-[rgba(3,5,14,0.68)] py-0 pl-[14px] pr-[46px] text-[15px] text-[#f6f0ff] outline-none [font:inherit] [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] focus:border-[rgba(103,232,249,0.55)] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                {...register('currentPassword')}
                placeholder="Required to change password"
                disabled={saving}
              />
              <button
                type="button"
                className="profile-password-toggle absolute bottom-0 right-0 top-0 flex w-[46px] items-center justify-center border-0 border-transparent bg-transparent text-[rgba(226,217,243,0.5)] transition-colors duration-200 hover:text-[#c084fc]"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                title={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.currentPassword && (
              <p className="profile-field-error -mt-[2px] mb-0 text-xs leading-[1.3] text-[#f87171]">
                {fieldErrors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="profile-field flex flex-col gap-[6px]">
            <label className="profile-field-label font-['Inter',sans-serif] text-xs uppercase tracking-[0.08em] text-[rgba(226,217,243,0.6)]">New Password</label>
            <div className="profile-input-wrapper relative flex w-full">
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="profile-field-input box-border min-h-[46px] w-full rounded-xl border border-solid border-[rgba(255,255,255,0.08)] bg-[rgba(3,5,14,0.68)] py-0 pl-[14px] pr-[46px] text-[15px] text-[#f6f0ff] outline-none [font:inherit] [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] focus:border-[rgba(103,232,249,0.55)] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                {...register('newPassword')}
                placeholder="Minimum 6 characters"
                disabled={saving}
              />
              <button
                type="button"
                className="profile-password-toggle absolute bottom-0 right-0 top-0 flex w-[46px] items-center justify-center border-0 border-transparent bg-transparent text-[rgba(226,217,243,0.5)] transition-colors duration-200 hover:text-[#c084fc]"
                onClick={() => setShowNewPassword((prev) => !prev)}
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.newPassword && (
              <p className="profile-field-error -mt-[2px] mb-0 text-xs leading-[1.3] text-[#f87171]">
                {fieldErrors.newPassword.message}
              </p>
            )}
          </div>

          <div className="profile-field flex flex-col gap-[6px]">
            <label className="profile-field-label font-['Inter',sans-serif] text-xs uppercase tracking-[0.08em] text-[rgba(226,217,243,0.6)]">Confirm New Password</label>
            <div className="profile-input-wrapper relative flex w-full">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="profile-field-input box-border min-h-[46px] w-full rounded-xl border border-solid border-[rgba(255,255,255,0.08)] bg-[rgba(3,5,14,0.68)] py-0 pl-[14px] pr-[46px] text-[15px] text-[#f6f0ff] outline-none [font:inherit] [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] focus:border-[rgba(103,232,249,0.55)] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                {...register('confirmPassword')}
                placeholder="Re-enter new password"
                disabled={saving}
              />
              <button
                type="button"
                className="profile-password-toggle absolute bottom-0 right-0 top-0 flex w-[46px] items-center justify-center border-0 border-transparent bg-transparent text-[rgba(226,217,243,0.5)] transition-colors duration-200 hover:text-[#c084fc]"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="profile-field-error -mt-[2px] mb-0 text-xs leading-[1.3] text-[#f87171]">
                {fieldErrors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="profile-actions flex flex-wrap gap-[10px] max-[768px]:flex-col">
            <button
              type="submit"
              className="profile-btn profile-btn--primary flex min-h-[46px] min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl border-0 border-solid bg-[linear-gradient(135deg,#c084fc,#818cf8)] font-['Inter',sans-serif] text-xs uppercase tracking-[0.1em] text-white [transition:all_0.25s_ease] enabled:hover:-translate-y-px enabled:hover:shadow-[0_4px_20px_rgba(192,132,252,0.3)] disabled:cursor-wait disabled:opacity-60"
              disabled={saving || !isDirty}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="profile-btn profile-btn--ghost flex min-h-[46px] min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl border border-solid border-[rgba(255,255,255,0.08)] bg-transparent font-['Inter',sans-serif] text-xs uppercase tracking-[0.1em] text-[rgba(226,217,243,0.6)] [transition:all_0.25s_ease] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#e2d9f3]"
              onClick={handleReset}
              disabled={saving}
            >
              Reset
            </button>
          </div>
        </form>

        {/* Delete Account Section */}
        <div className="profile-card mt-6 flex flex-col gap-[18px] rounded-[20px] border border-solid border-[rgba(239,68,68,0.2)] bg-[rgba(12,15,31,0.7)] p-6 [backdrop-filter:blur(14px)] [-webkit-backdrop-filter:blur(14px)] max-[768px]:rounded-2xl max-[768px]:px-4 max-[768px]:py-5">
          <h2 className="profile-card-title m-0 flex items-center gap-2 font-['Inter',sans-serif] text-[13px] uppercase tracking-[0.2em] text-[#ef4444] [&_svg]:opacity-70">
            <AlertTriangle size={14} />
            Danger Zone
          </h2>
          <p className="profile-field-hint mt-[-8px] mb-4 text-[11px] text-[rgba(226,217,243,0.4)]">
            Permanently delete your account and all of your data. This action cannot be undone.
          </p>
          
          {showDeleteConfirm ? (
            <div className="rounded-lg border border-solid border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)] p-4">
              <p className="mb-4 text-[14px] font-medium text-[#ef4444]">
                Are you absolutely sure? This will permanently delete your account.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="profile-btn flex min-h-[46px] min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl border border-solid border-[#ef4444] bg-[#ef4444] font-['Inter',sans-serif] text-xs uppercase tracking-[0.1em] text-white"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  type="button"
                  className="profile-btn profile-btn--ghost flex min-h-[46px] min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl border border-solid border-[rgba(255,255,255,0.08)] bg-transparent font-['Inter',sans-serif] text-xs uppercase tracking-[0.1em] text-[rgba(226,217,243,0.6)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#e2d9f3]"
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
              className="profile-btn flex min-h-[46px] min-w-[120px] flex-1 items-center justify-center gap-2 self-start rounded-xl border border-solid border-[rgba(239,68,68,0.3)] bg-transparent font-['Inter',sans-serif] text-xs uppercase tracking-[0.1em] text-[#ef4444]"
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
