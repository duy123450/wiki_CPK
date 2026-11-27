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
      className={`fixed left-1/2 z-[99999] flex w-[min(720px,calc(100vw-32px))] -translate-x-1/2 translate-y-0 flex-wrap items-center gap-[18px] rounded-[14px] border border-solid border-[rgba(192,132,252,0.2)] bg-[rgba(10,14,26,0.92)] px-[22px] py-[18px] font-['Source_Sans_3','Segoe_UI',sans-serif] shadow-[0_8px_40px_rgba(0,0,0,0.55),0_0_0_1px_rgba(103,232,249,0.05)_inset] [backdrop-filter:blur(18px)_saturate(1.4)] [-webkit-backdrop-filter:blur(18px)_saturate(1.4)] bottom-[28px] ${hiding ? 'pointer-events-none animate-[cookieSlideOut_0.38s_cubic-bezier(0.4,0,0.2,1)_both]' : 'animate-[cookieSlideIn_0.45s_cubic-bezier(0.34,1.56,0.64,1)_both]'} max-[600px]:bottom-4 max-[600px]:gap-3 max-[600px]:rounded-xl max-[600px]:px-4 max-[600px]:py-[14px]`}
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      {/* Decorative gradient line */}
      <div
        className="absolute left-[10%] right-[10%] top-0 h-px rounded-full bg-[linear-gradient(to_right,transparent,rgba(192,132,252,0.5),rgba(103,232,249,0.4),transparent)]"
        aria-hidden="true"
      />

      <div
        className="shrink-0 text-[28px] leading-none [filter:drop-shadow(0_0_8px_rgba(192,132,252,0.4))] max-[600px]:text-[22px]"
        aria-hidden="true"
      >
        🍪
      </div>

      <div className="flex min-w-[180px] flex-1 flex-col gap-1">
        <p className="m-0 font-['Inter',sans-serif] text-[13.5px] font-bold tracking-[0.01em] text-[#e2d9f3]">
          We use cookies&nbsp;
          <span className="text-[11px] font-normal tracking-normal text-[#94a3b8]">
            / Chúng tôi dùng cookies
          </span>
        </p>
        <p className="m-0 text-xs leading-[1.65] text-[#64748b]">
          We use cookies to keep you signed in and improve your experience.
          You can accept or decline non-essential cookies.
          See our <Link to="/privacy" className="text-[#67e8f9] underline underline-offset-2 transition-colors duration-[180ms] hover:text-[#c084fc]">Privacy Policy</Link> and <Link to="/terms" className="text-[#67e8f9] underline underline-offset-2 transition-colors duration-[180ms] hover:text-[#c084fc]">Terms of Use</Link>.
        </p>
        <p className="m-0 border-l-2 border-solid border-l-[rgba(192,132,252,0.2)] pl-2 text-[11.5px] leading-[1.65] text-[#4a5568]">
          Chúng tôi dùng cookies để duy trì đăng nhập và cải thiện trải nghiệm.
          Bạn có thể chấp nhận hoặc từ chối cookies không thiết yếu.
          Xem <Link to="/privacy" className="text-[#67e8f9] underline underline-offset-2 transition-colors duration-[180ms] hover:text-[#c084fc]">Chính sách bảo mật</Link> và <Link to="/terms" className="text-[#67e8f9] underline underline-offset-2 transition-colors duration-[180ms] hover:text-[#c084fc]">Điều khoản sử dụng</Link>.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 max-[600px]:w-full max-[600px]:justify-end">
        <button
          id="cookie-reject-btn"
          className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border border-solid border-[rgba(148,163,184,0.2)] bg-transparent px-[18px] py-2 font-['Inter',sans-serif] text-xs font-semibold tracking-[0.02em] text-[#64748b] transition-[background_0.2s_ease,border-color_0.2s_ease,color_0.2s_ease,box-shadow_0.2s_ease,transform_0.15s_ease] active:scale-[0.96] hover:border-[rgba(148,163,184,0.35)] hover:bg-[rgba(148,163,184,0.07)] hover:text-[#94a3b8] max-[600px]:px-[14px] max-[600px]:py-[7px] max-[600px]:text-[11.5px]"
          onClick={handleReject}
        >
          Reject / Từ chối
        </button>
        <button
          id="cookie-accept-btn"
          className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border border-solid border-transparent bg-[linear-gradient(135deg,#7c3aed_0%,#0ea5e9_100%)] px-[18px] py-2 font-['Inter',sans-serif] text-xs font-semibold tracking-[0.02em] text-white shadow-[0_2px_12px_rgba(124,58,237,0.35)] transition-[background_0.2s_ease,border-color_0.2s_ease,color_0.2s_ease,box-shadow_0.2s_ease,transform_0.15s_ease] active:scale-[0.96] hover:bg-[linear-gradient(135deg,#6d28d9_0%,#0284c7_100%)] hover:shadow-[0_4px_18px_rgba(124,58,237,0.5)] max-[600px]:px-[14px] max-[600px]:py-[7px] max-[600px]:text-[11.5px]"
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
