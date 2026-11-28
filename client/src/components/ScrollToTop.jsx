import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)

  /* ── Scroll-to-top on route change ── */
  useEffect(() => {
    const id = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }, 50)
    return () => clearTimeout(id)
  }, [pathname])

  /* ── Show button after scrolling 300 px ── */
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      id="scroll-to-top-btn"
      className={`fixed bottom-[88px] right-8 z-[500] flex h-11 w-11 cursor-pointer items-center justify-center rounded-[12px] border border-solid border-[rgba(192,132,252,0.25)] bg-[rgba(10,11,20,0.75)] text-[var(--accent-purple,#c084fc)] backdrop-blur-[14px] [-webkit-backdrop-filter:blur(14px)] opacity-0 translate-y-4 scale-90 pointer-events-none [transition:opacity_300ms_cubic-bezier(0.4,0,0.2,1),transform_300ms_cubic-bezier(0.4,0,0.2,1),border-color_250ms_ease,box-shadow_250ms_ease,background_250ms_ease] hover:border-[rgba(192,132,252,0.6)] hover:bg-[rgba(192,132,252,0.12)] hover:shadow-[0_0_14px_rgba(192,132,252,0.35),0_4px_20px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.05] active:translate-y-0 active:scale-[0.96] active:shadow-[0_0_8px_rgba(192,132,252,0.2)] focus-visible:outline-2 focus-visible:outline-[var(--accent-purple,#c084fc)] focus-visible:outline-offset-[3px] max-[768px]:bottom-[80px] max-[768px]:right-[20px] max-[768px]:h-10 max-[768px]:w-10 max-[768px]:rounded-[10px] ${
        visible ? 'visible translate-y-0 scale-100 opacity-100 pointer-events-auto' : ''
      }`}
      onClick={handleClick}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      {/* Chevron up icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>

      {/* Animated glow ring */}
      <span
        className={`absolute -inset-1 rounded-[14px] border border-solid border-[rgba(192,132,252,0.18)] transition-opacity duration-[250ms] pointer-events-none animate-scroll-to-top-pulse ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}
