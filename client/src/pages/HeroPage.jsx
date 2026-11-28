import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useMovieInfo from '../hooks/useMovieInfo'
import { generateStars } from '../utils/uiUtils'

// ─── stars ────────────────────────────────────────────────────────────────────
function Stars() {
  const [stars] = useState(() => generateStars(60))

  return (
    <div className="hero-stars absolute inset-0 z-[2] pointer-events-none" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="hero-star absolute rounded-full bg-white motion-safe:animate-hero-star-pulse motion-reduce:animate-none"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.dur,
          }}
        />
      ))}
    </div>
  )
}

// ─── shimmer ──────────────────────────────────────────────────────────────────
function Shimmer() {
  return (
    <div className="hero-shimmer flex flex-col items-center gap-4">
      <div className="shimmer-bar h-4 w-[240px] rounded-lg bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.04)_100%)] bg-[length:200%_100%] motion-safe:animate-hero-shimmer-slide motion-reduce:animate-none" />
      <div className="shimmer-bar h-4 w-[160px] rounded-lg bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.04)_100%)] bg-[length:200%_100%] motion-safe:animate-hero-shimmer-slide motion-reduce:animate-none" />
      <div className="shimmer-bar h-4 w-[200px] rounded-lg bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.04)_100%)] bg-[length:200%_100%] motion-safe:animate-hero-shimmer-slide motion-reduce:animate-none" />
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function HeroPage() {
  const { data: movie, loading, error } = useMovieInfo()
  const videoRef = useRef(null)
  const [videoReady, setVideoReady] = useState(false)

  const videoSrc = Array.isArray(movie?.heroVideo)
    ? movie.heroVideo[0]?.url
    : movie?.heroVideo?.url
  const title = movie?.title ?? '超かぐや姫'
  const tagline = movie?.tagline ?? "A tale of the moon and a heart's desire"
  const releaseDate = movie?.details?.releaseDate
    ? new Date(movie.details.releaseDate).getFullYear()
    : null
  const studio = movie?.details?.studio ?? null

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSrc) return
    video.muted = true
    video.load()
    video.play().catch(() => {})
  }, [videoSrc])

  return (
    <section className="hero-root relative box-border flex min-h-[100dvh] w-[calc(100%-var(--sidebar-current-width))] max-w-[100vw] items-center justify-center overflow-hidden bg-[#05040f] font-['Source_Sans_3',sans-serif] [margin-left:var(--sidebar-current-width)] [transition:width_0.35s_cubic-bezier(0.4,0,0.2,1),margin-left_0.35s_cubic-bezier(0.4,0,0.2,1)] max-[768px]:ml-0 max-[768px]:w-full">
      {/* ── video ── */}
      {videoSrc ? (
        <div className="hero-video-wrap absolute inset-0 z-0 bg-black">
          <video
            ref={videoRef}
            className={`hero-video block h-full w-full object-cover transition-opacity duration-[1400ms] ease-out ${videoReady ? 'opacity-100' : 'opacity-0'}`}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={movie?.poster?.url}
            onCanPlay={() => setVideoReady(true)}
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="hero-fallback-bg absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(192,132,252,0.18)_0%,transparent_55%),radial-gradient(ellipse_at_75%_80%,rgba(103,232,249,0.12)_0%,transparent_55%),#05040f]" />
      )}

      <div className="hero-overlay pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_bottom,rgba(5,4,15,0.55)_0%,rgba(5,4,15,0.1)_35%,rgba(5,4,15,0.1)_65%,rgba(5,4,15,0.8)_100%),linear-gradient(to_right,rgba(5,4,15,0.5)_0%,transparent_30%,transparent_70%,rgba(5,4,15,0.5)_100%)]" />
      <div className="hero-vignette pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,4,15,0.65)_100%)]" />
      <Stars />

      {/* ── content ── */}
      <div className="hero-content relative z-10 flex max-w-[min(760px,92vw)] flex-col items-center gap-[clamp(12px,3vw,24px)] px-[clamp(20px,8vw,80px)] py-[clamp(24px,6vw,60px)] text-center motion-safe:animate-hero-reveal motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0">
        {loading ? (
          <Shimmer />
        ) : error ? (
          <p className="hero-error font-['Inter',sans-serif] text-xs tracking-[0.1em] text-[rgba(255,100,100,0.8)]">Failed to load movie data.</p>
        ) : (
          <>
            <div className="hero-eyebrow inline-flex items-center gap-2 rounded-full border border-solid border-[rgba(232,201,122,0.35)] bg-[rgba(232,201,122,0.07)] px-[14px] py-[5px] font-['Inter',sans-serif] text-[clamp(9px,2vw,11px)] uppercase tracking-[0.25em] text-[#e8c97a] [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)] motion-safe:[animation-delay:150ms] motion-safe:animate-hero-reveal motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0">
              <span className="hero-eyebrow-dot h-[5px] w-[5px] rounded-full bg-[#e8c97a] shadow-[0_0_8px_#e8c97a] motion-safe:animate-hero-dot-pulse motion-reduce:animate-none" />
              Fan Wiki · Now Showing
            </div>

            <h1 className="hero-title m-0 font-['Inter',sans-serif] text-[clamp(28px,7vw,72px)] font-bold leading-[1.08] text-white [text-shadow:0_0_40px_rgba(192,132,252,0.45),0_0_80px_rgba(192,132,252,0.2),0_2px_4px_rgba(0,0,0,0.6)] max-[480px]:break-words motion-safe:[animation-delay:250ms] motion-safe:animate-hero-reveal motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0">{title}</h1>

            {tagline && <p className="hero-tagline m-0 font-['Source_Sans_3',sans-serif] text-[clamp(13px,3.2vw,18px)] font-light italic leading-normal tracking-[0.04em] text-[rgba(240,232,255,0.5)] motion-safe:[animation-delay:400ms] motion-safe:animate-hero-reveal motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0">"{tagline}"</p>}

            {(releaseDate || studio) && (
              <div className="hero-meta flex flex-wrap items-center justify-center gap-[10px] motion-safe:[animation-delay:500ms] motion-safe:animate-hero-reveal motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0">
                {releaseDate && (
                  <span className="hero-meta-chip font-['Inter',sans-serif] text-[clamp(9px,2vw,11px)] uppercase tracking-[0.15em] text-[#67e8f9] opacity-80">{releaseDate}</span>
                )}
                {releaseDate && studio && <span className="hero-meta-sep h-[3px] w-[3px] rounded-full bg-[#e8c97a] opacity-50" />}
                {studio && <span className="hero-meta-chip font-['Inter',sans-serif] text-[clamp(9px,2vw,11px)] uppercase tracking-[0.15em] text-[#67e8f9] opacity-80">{studio}</span>}
              </div>
            )}

            <div className="hero-actions flex flex-wrap justify-center gap-[clamp(10px,3vw,16px)] motion-safe:[animation-delay:600ms] motion-safe:animate-hero-reveal motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0">
              <Link
                to="/wiki/characters"
                className="hero-btn hero-btn-primary inline-flex items-center gap-2 rounded-md border-0 border-solid px-[clamp(20px,5vw,32px)] py-[clamp(10px,2vw,13px)] bg-[linear-gradient(135deg,#c084fc_0%,#818cf8_100%)] font-['Inter',sans-serif] text-[clamp(10px,2.5vw,12px)] uppercase tracking-[0.15em] text-white no-underline shadow-[0_4px_24px_rgba(192,132,252,0.4)] [transition:all_0.25s_ease] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(192,132,252,0.6)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#67e8f9]"
              >
                Explore Wiki
              </Link>
              <Link
                to="/wiki/chou-kaguya-hime-overview"
                className="hero-btn hero-btn-secondary inline-flex items-center gap-2 rounded-md border border-solid border-[rgba(232,201,122,0.4)] px-[clamp(20px,5vw,32px)] py-[clamp(10px,2vw,13px)] bg-transparent font-['Inter',sans-serif] text-[clamp(10px,2.5vw,12px)] uppercase tracking-[0.15em] text-[#e8c97a] no-underline [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)] [transition:all_0.25s_ease] hover:-translate-y-0.5 hover:border-[#e8c97a] hover:bg-[rgba(232,201,122,0.1)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#67e8f9]"
              >
                Movie Info
              </Link>
            </div>
          </>
        )}
      </div>

      {/* ── scroll cue ── */}
      <div className="hero-scroll-cue absolute bottom-[clamp(20px,5vw,36px)] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-[6px] motion-safe:[animation-delay:900ms] motion-safe:animate-hero-reveal motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0" aria-hidden="true">
        <div className="hero-scroll-line h-[clamp(30px,5vw,48px)] w-px bg-[linear-gradient(to_bottom,#e8c97a,transparent)] motion-safe:animate-hero-scroll-drop motion-reduce:animate-none" />
        <span className="hero-scroll-text font-['Inter',sans-serif] text-[8px] uppercase tracking-[0.3em] text-[#e8c97a] opacity-50">Scroll</span>
      </div>
    </section>
  )
}
