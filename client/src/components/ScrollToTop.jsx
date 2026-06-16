import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import '../styles/ScrollToTop.css'

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
      className={`scroll-to-top-btn${visible ? ' visible' : ''}`}
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
      <span className="scroll-to-top-ring" aria-hidden="true" />
    </button>
  )
}
