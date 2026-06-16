/**
 * CookieConsent — GDPR-style cookie banner.
 *
 * - Shows once per browser session until the user makes a choice.
 * - "Accept" → sets cookie_consent=accepted in localStorage, allows cookies.
 * - "Reject" → sets cookie_consent=rejected in localStorage, skips optional cookies.
 * - Once a choice is stored the banner never shows again.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/CookieConsent.css'

const STORAGE_KEY = 'cookie_consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [hiding,  setHiding]  = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // Slight delay so it doesn't flash immediately on mount
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = (choice) => {
    localStorage.setItem(STORAGE_KEY, choice)
    setHiding(true)
    setTimeout(() => setVisible(false), 400) // wait for slide-out animation
  }

  const handleAccept = () => dismiss('accepted')
  const handleReject = () => dismiss('rejected')

  if (!visible) return null

  return (
    <div
      id="cookie-consent-banner"
      className={`cookie-consent${hiding ? ' cookie-consent--hiding' : ''}`}
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      {/* Decorative gradient line */}
      <div className="cookie-consent__glow" aria-hidden="true" />

      <div className="cookie-consent__icon" aria-hidden="true">🍪</div>

      <div className="cookie-consent__body">
        <p className="cookie-consent__title">
          We use cookies&nbsp;
          <span className="cookie-consent__title-vn">/ Chúng tôi dùng cookies</span>
        </p>
        <p className="cookie-consent__desc">
          We use cookies to keep you signed in and improve your experience.
          You can accept or decline non-essential cookies.
          See our <Link to="/privacy" className="cookie-consent__link">Privacy Policy</Link> and <Link to="/terms" className="cookie-consent__link">Terms of Use</Link>.
        </p>
        <p className="cookie-consent__desc cookie-consent__desc--vn">
          Chúng tôi dùng cookies để duy trì đăng nhập và cải thiện trải nghiệm.
          Bạn có thể chấp nhận hoặc từ chối cookies không thiết yếu.
          Xem <Link to="/privacy" className="cookie-consent__link">Chính sách bảo mật</Link> và <Link to="/terms" className="cookie-consent__link">Điều khoản sử dụng</Link>.
        </p>
      </div>

      <div className="cookie-consent__actions">
        <button
          id="cookie-reject-btn"
          className="cookie-consent__btn cookie-consent__btn--reject"
          onClick={handleReject}
        >
          Reject / Từ chối
        </button>
        <button
          id="cookie-accept-btn"
          className="cookie-consent__btn cookie-consent__btn--accept"
          onClick={handleAccept}
        >
          Accept all / Chấp nhận
        </button>
      </div>
    </div>
  )
}

/**
 * Helper — call this anywhere in the app to check the user's cookie preference.
 * Returns 'accepted' | 'rejected' | null (not yet chosen).
 */
export function getCookieConsent() {
  return localStorage.getItem(STORAGE_KEY)
}
