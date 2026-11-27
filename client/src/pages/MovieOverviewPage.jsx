/* eslint-disable react-hooks/purity */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import useMovieInfo from '../hooks/useMovieInfo'
import useReveal from '../hooks/useReveal'
import { getYoutubeId } from '../utils/youtubeUtils'
import '../styles/MovieOverviewPage.css'

// ─── Floating particles ───────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    delay: `${Math.random() * 8}s`,
    dur: `${Math.random() * 5 + 5}s`,
  }))
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-[rgba(192,132,252,0.7)] animate-[particleDrift_var(--dur,6s)_ease-in-out_infinite]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div
      className="relative flex flex-col gap-[6px] overflow-hidden rounded-[10px] border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.035)] p-5 px-[18px] [transition:border-color_0.2s,background_0.2s] before:absolute before:left-0 before:right-0 before:top-0 before:h-0.5 before:rounded-sm before:bg-[var(--accent,#c084fc)] before:content-[''] hover:border-[rgba(192,132,252,0.3)] hover:bg-[rgba(255,255,255,0.06)]"
      style={{ '--accent': accent }}
    >
      <span className="font-['Inter',sans-serif] text-[clamp(11px,2vw,14px)] font-semibold leading-[1.3] text-[#f0e8ff]">{value || '—'}</span>
      <span className="font-['Inter',sans-serif] text-[10px] uppercase tracking-[0.2em] text-[rgba(240,232,255,0.2)]">{label}</span>
    </div>
  )
}

// ─── Scroll reveal hook (imported from hooks/useReveal) ──────────────────────

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-6 transition-[opacity,transform] duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${visible ? 'translate-y-0 opacity-100' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────
function Shimmer({ w, h }) {
  return (
    <div
      className="rounded-md bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.09)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%] animate-[shimmerSlide_1.6s_infinite]"
      style={{ width: w, height: h }}
    />
  )
}

// ─── Rating ring ──────────────────────────────────────────────────────────────
function RatingRing({ rating }) {
  const pct = (rating / 10) * 100
  const circ = 2 * Math.PI * 44
  return (
    <div className="relative h-[110px] w-[110px]">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="55"
          cy="55"
          r="44"
          fill="none"
          stroke="#c084fc"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          transform="rotate(-90 55 55)"
          className="[transition:stroke-dashoffset_1.2s_cubic-bezier(0.16,1,0.3,1)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-['Inter',sans-serif] text-[26px] font-bold leading-none text-white">{rating?.toFixed(1) ?? '—'}</span>
        <span className="font-['Inter',sans-serif] text-[10px] tracking-[0.1em] text-[rgba(240,232,255,0.45)]">/10</span>
      </div>
    </div>
  )
}

// ─── Format runtime ───────────────────────────────────────────────────────────
function formatRuntime(minutes) {
  if (!minutes) return null
  const mins = parseInt(minutes, 10)
  if (isNaN(mins)) return minutes
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  if (hours === 0) return `${remainingMins}m`
  if (remainingMins === 0) return `${hours}h`
  return `${hours}h ${remainingMins}m`
}

const TRAILER_LABELS = [
  'Official Trailer #1',
  'Official Trailer #2',
  'Special Trailer',
]

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MovieOverviewPage({ sidebarCollapsed }) {
  const { data: movie, loading, error } = useMovieInfo()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [selectedTrailer, setSelectedTrailer] = useState(0)

  const trailers = useMemo(() => {
    const urls = movie?.details?.trailerUrl ?? []
    return urls
      .map((t, i) => ({
        label: t?.label || TRAILER_LABELS[i] || `Trailer #${i + 1}`,
        ytId: getYoutubeId(t?.url),
      }))
      .filter((t) => t.ytId)
  }, [movie])

  const releaseYear = movie?.details?.releaseDate
    ? new Date(movie.details.releaseDate).getFullYear()
    : null
  const releaseFormatted = movie?.details?.releaseDate
    ? new Date(movie.details.releaseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <main className={`mov-viewport relative box-border max-w-[100vw] overflow-x-hidden bg-[#05040f] font-['Source_Sans_3',sans-serif] text-[#f0e8ff] w-[calc(100%_-_var(--sidebar-current-width,260px))] ml-[var(--sidebar-current-width,260px)] [transition:width_0.35s_cubic-bezier(0.4,0,0.2,1),margin-left_0.35s_cubic-bezier(0.4,0,0.2,1)] max-[768px]:ml-0 max-[768px]:w-full ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Particles />

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[60vh] items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          {movie?.poster?.[2]?.url && (
            <img
              src={movie.poster[2].url}
              alt=""
              className={`h-full w-full scale-[1.05] object-cover object-top blur-[2px] saturate-[0.7] transition-opacity duration-[1200ms] ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              aria-hidden="true"
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,4,15,0.3)_0%,rgba(5,4,15,0.5)_50%,rgba(5,4,15,0.97)_100%),linear-gradient(to_right,rgba(5,4,15,0.6)_0%,transparent_40%)]" />
        </div>

        <div className="relative z-[2] mx-auto flex w-full max-w-[1200px] items-end gap-[clamp(24px,5vw,56px)] px-[clamp(20px,6vw,72px)] pb-[clamp(36px,6vw,60px)] pt-[clamp(80px,14vw,160px)] animate-[heroFade_1.2s_cubic-bezier(0.16,1,0.3,1)_both] max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-5">
          {/* Poster */}
          <div className="relative shrink-0">
            {loading ? (
              <Shimmer w="200px" h="300px" />
            ) : movie?.poster?.[1]?.url ? (
              <img
                src={movie.poster[1].url}
                alt={`${movie.title} poster`}
                className="block aspect-[2/3] w-[clamp(120px,18vw,200px)] rounded-[10px] border border-solid border-[rgba(192,132,252,0.2)] object-cover shadow-[0_20px_60px_rgba(0,0,0,0.7)] max-[600px]:w-[110px]"
              />
            ) : (
              <div className="flex aspect-[2/3] w-[clamp(120px,18vw,200px)] items-center justify-center rounded-[10px] border border-solid border-[rgba(180,140,255,0.12)] bg-[linear-gradient(135deg,#1a1030,#0d0820)] p-4 text-center font-['Inter',sans-serif] text-[13px] text-[rgba(240,232,255,0.45)] max-[600px]:w-[110px]">
                <span>超かぐや姫</span>
              </div>
            )}
            <div className="pointer-events-none absolute -inset-5 -z-[1] rounded-2xl bg-[radial-gradient(ellipse_at_center,rgba(192,132,252,0.2)_0%,transparent_70%)]" />
          </div>

          {/* Title block */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <p className="m-0 inline-flex items-center gap-[7px] font-['Inter',sans-serif] text-[clamp(9px,1.8vw,11px)] uppercase tracking-[0.25em] text-[#e8c97a] opacity-[0.85]">
              <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#e8c97a] shadow-[0_0_8px_#e8c97a] animate-[dotPulse_2.5s_ease-in-out_infinite]" />
              Fan Wiki · Movie Overview
            </p>

            {loading ? (
              <>
                <Shimmer w="320px" h="48px" />
                <Shimmer w="200px" h="20px" />
              </>
            ) : error ? (
              <p className="font-['Inter',sans-serif] text-[13px] tracking-[0.1em] text-[rgba(255,100,100,0.8)]">Could not load movie data.</p>
            ) : (
              <>
                <h1 className="m-0 font-['Inter',sans-serif] text-[clamp(26px,5.5vw,58px)] font-bold leading-[1.1] text-white [text-shadow:0_0_60px_rgba(192,132,252,0.35),0_2px_4px_rgba(0,0,0,0.5)]">{movie?.title}</h1>
                {movie?.tagline && (
                  <p className="m-0 text-[clamp(12px,2.5vw,16px)] font-light italic tracking-[0.04em] text-[rgba(240,232,255,0.45)]">"{movie.tagline}"</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {releaseYear && (
                    <span className="rounded border border-solid border-[rgba(103,232,249,0.25)] px-[10px] py-1 font-['Inter',sans-serif] text-[10px] uppercase tracking-[0.15em] text-[#67e8f9] opacity-[0.85]">{releaseYear}</span>
                  )}
                  {movie?.details?.runtime && (
                    <span className="rounded border border-solid border-[rgba(103,232,249,0.25)] px-[10px] py-1 font-['Inter',sans-serif] text-[10px] uppercase tracking-[0.15em] text-[#67e8f9] opacity-[0.85]">
                      {formatRuntime(movie.details.runtime)}
                    </span>
                  )}
                  {movie?.details?.studio && (
                    <span className="rounded border border-solid border-[rgba(103,232,249,0.25)] px-[10px] py-1 font-['Inter',sans-serif] text-[10px] uppercase tracking-[0.15em] text-[#67e8f9] opacity-[0.85]">{movie.details.studio}</span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap gap-3">
                  {movie?.details?.officialWebsite && (
                    <a
                      href={movie.details.officialWebsite}
                      className="inline-flex items-center gap-[6px] rounded-md bg-[linear-gradient(135deg,#c084fc,#818cf8)] px-6 py-[10px] font-['Inter',sans-serif] text-[11px] uppercase tracking-[0.15em] text-white no-underline shadow-[0_4px_20px_rgba(192,132,252,0.4)] [transition:all_0.22s_ease] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(192,132,252,0.55)]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Official Site ↗
                    </a>
                  )}
                  <Link
                    to="/wiki/characters"
                    className="inline-flex items-center gap-[6px] rounded-md border border-solid border-[rgba(232,201,122,0.35)] bg-transparent px-6 py-[10px] font-['Inter',sans-serif] text-[11px] uppercase tracking-[0.15em] text-[#e8c97a] no-underline [transition:all_0.22s_ease] hover:-translate-y-0.5 hover:border-[#e8c97a] hover:bg-[rgba(232,201,122,0.08)]"
                  >
                    Meet the Cast
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="relative z-[1] mx-auto flex max-w-[1100px] flex-col gap-[clamp(24px,4vw,40px)] px-[clamp(20px,5vw,60px)] pb-20 pt-[clamp(32px,5vw,60px)]">
        {/* Stats row */}
        <Reveal delay={0}>
          <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2">
            <StatCard
              label="Release"
              value={releaseFormatted}
              accent="#e8c97a"
            />
            <StatCard
              label="Runtime"
              value={formatRuntime(movie?.details?.runtime)}
              accent="#67e8f9"
            />
            <StatCard
              label="Studio"
              value={movie?.details?.studio}
              accent="#c084fc"
            />
            <StatCard
              label="Director"
              value={movie?.details?.director}
              accent="#f9a8d4"
            />
          </div>
        </Reveal>

        {/* Synopsis + Rating */}
        <div className="grid grid-cols-[1fr_280px] items-start gap-5 max-[768px]:grid-cols-1">
          <Reveal delay={80}>
            <div className="relative overflow-hidden rounded-xl border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.035)] p-[clamp(20px,4vw,32px)] [transition:border-color_0.25s] after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:bg-[radial-gradient(ellipse_at_0%_0%,rgba(192,132,252,0.04)_0%,transparent_60%)] after:content-[''] hover:border-[rgba(192,132,252,0.3)]">
              <header className="mb-5 flex items-center gap-[10px]">
                <span className="h-[18px] w-[3px] shrink-0 rounded-[2px] bg-[linear-gradient(to_bottom,#c084fc,#67e8f9)]" />
                <h2 className="m-0 font-['Inter',sans-serif] text-[13px] font-semibold uppercase tracking-[0.2em] text-[#c084fc]">Synopsis</h2>
              </header>
              {loading ? (
                <div className="flex flex-col gap-[10px]">
                  <Shimmer w="100%" h="16px" />
                  <Shimmer w="90%" h="16px" />
                  <Shimmer w="95%" h="16px" />
                  <Shimmer w="80%" h="16px" />
                </div>
              ) : (
                <p className="m-0 text-[14px] font-light leading-[1.85] text-[rgba(240,232,255,0.75)]">
                  {movie?.synopsis ?? 'No synopsis available.'}
                </p>
              )}
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-xl border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.035)] p-[clamp(20px,4vw,32px)] text-center [transition:border-color_0.25s] after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:bg-[radial-gradient(ellipse_at_0%_0%,rgba(192,132,252,0.04)_0%,transparent_60%)] after:content-[''] hover:border-[rgba(192,132,252,0.3)]">
              <header className="mb-5 flex w-full items-center gap-[10px]">
                <span className="h-[18px] w-[3px] shrink-0 rounded-[2px] bg-[linear-gradient(to_bottom,#c084fc,#67e8f9)]" />
                <h2 className="m-0 font-['Inter',sans-serif] text-[13px] font-semibold uppercase tracking-[0.2em] text-[#c084fc]">Rating</h2>
              </header>
              {loading ? (
                <Shimmer w="110px" h="110px" />
              ) : (
                <RatingRing rating={movie?.rating} />
              )}
              <p className="m-0 text-[11px] italic tracking-[0.08em] text-[rgba(240,232,255,0.2)]">Fan & critic aggregate</p>
            </div>
          </Reveal>
        </div>

        {/* Production Details */}
        <Reveal delay={120}>
          <div className="relative overflow-hidden rounded-xl border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.035)] p-[clamp(20px,4vw,32px)] [transition:border-color_0.25s] after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:bg-[radial-gradient(ellipse_at_0%_0%,rgba(192,132,252,0.04)_0%,transparent_60%)] after:content-[''] hover:border-[rgba(192,132,252,0.3)]">
            <header className="mb-5 flex items-center gap-[10px]">
              <span className="h-[18px] w-[3px] shrink-0 rounded-[2px] bg-[linear-gradient(to_bottom,#c084fc,#67e8f9)]" />
              <h2 className="m-0 font-['Inter',sans-serif] text-[13px] font-semibold uppercase tracking-[0.2em] text-[#c084fc]">Production Details</h2>
            </header>
            {loading ? (
              <Shimmer w="100%" h="80px" />
            ) : (
              <dl className="m-0 grid grid-cols-2 max-[600px]:grid-cols-1">
                {[
                  ['Title', movie?.title],
                  ['Tagline', movie?.tagline],
                  ['Release Date', releaseFormatted],
                  ['Runtime', movie?.details?.runtime],
                  ['Studio', movie?.details?.studio],
                  ['Director', movie?.details?.director],
                  ['Official Website', movie?.details?.officialWebsite],
                ].map(([label, val]) =>
                  val ? (
                    <div key={label} className="flex flex-col gap-1 border-b border-solid border-[rgba(255,255,255,0.04)] py-[14px] odd:pr-8">
                      <dt className="font-['Inter',sans-serif] text-[9px] uppercase tracking-[0.25em] text-[#c084fc] opacity-[0.75]">{label}</dt>
                      <dd className="m-0 text-[13.5px] leading-[1.5] text-[rgba(240,232,255,0.8)]">
                        {label === 'Official Website' ? (
                          <a
                            href={val}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#67e8f9] no-underline transition-colors duration-200 hover:text-[#c084fc]"
                          >
                            {val} ↗
                          </a>
                        ) : label === 'Runtime' ? (
                          formatRuntime(val)
                        ) : (
                          val
                        )}
                      </dd>
                    </div>
                  ) : null
                )}
              </dl>
            )}
          </div>
        </Reveal>

        {/* Trailers */}
        {!loading && trailers.length > 0 && (
          <Reveal delay={160}>
            <div className="relative overflow-hidden rounded-xl border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.035)] p-[clamp(20px,4vw,32px)] [transition:border-color_0.25s] after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:bg-[radial-gradient(ellipse_at_0%_0%,rgba(192,132,252,0.04)_0%,transparent_60%)] after:content-[''] hover:border-[rgba(192,132,252,0.3)]">
              <header className="mb-5 flex items-center gap-[10px]">
                <span className="h-[18px] w-[3px] shrink-0 rounded-[2px] bg-[linear-gradient(to_bottom,#c084fc,#67e8f9)]" />
                <h2 className="m-0 font-['Inter',sans-serif] text-[13px] font-semibold uppercase tracking-[0.2em] text-[#c084fc]">Trailers</h2>
              </header>
              <div className="mb-5 flex flex-wrap gap-2">
                {trailers.map((t, i) => (
                  <button
                    key={i}
                    className={`rounded-full border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.035)] px-4 py-2 text-[0.8rem] font-semibold text-[rgba(240,232,255,0.45)] transition-all duration-200 hover:border-[#c084fc] hover:text-[#f0e8ff] ${
                      selectedTrailer === i
                        ? 'border-[#c084fc] bg-[rgba(192,132,252,0.2)] text-[#c084fc] shadow-[0_0_12px_rgba(192,132,252,0.3)]'
                        : ''
                    }`}
                    onClick={() => setSelectedTrailer(i)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="relative w-full overflow-hidden rounded-lg border border-solid border-[rgba(180,140,255,0.12)] bg-black pt-[56.25%]">
                <iframe
                  key={trailers[selectedTrailer]?.ytId}
                  src={`https://www.youtube.com/embed/${trailers[selectedTrailer]?.ytId}`}
                  title={trailers[selectedTrailer]?.label}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute left-0 top-0 h-full w-full border-0"
                />
              </div>
            </div>
          </Reveal>
        )}

        {/* Explore more */}
        <Reveal delay={200}>
          <div className="pt-10 text-center">
            <h2 className="m-0 mb-2 font-['Inter',sans-serif] text-[clamp(18px,3.5vw,28px)] text-white [text-shadow:0_0_40px_rgba(192,132,252,0.3)]">Explore the Wiki</h2>
            <p className="mb-8 mt-0 text-[13px] italic tracking-[0.04em] text-[rgba(240,232,255,0.45)]">
              Dive deeper into the world of 超かぐや姫
            </p>
            <div className="grid grid-cols-3 gap-[14px] max-[768px]:grid-cols-2">
              {[
                {
                  href: '/wiki/characters',
                  label: 'Characters',
                  kana: '人物',
                  icon: '✦',
                },
                {
                  href: '/wiki/soundtrack',
                  label: 'Soundtrack',
                  kana: '音楽',
                  icon: '♪',
                },
                {
                  href: '/wiki/lore',
                  label: 'Lore & World',
                  kana: '世界観',
                  icon: '⋆',
                },
              ].map((card) => (
                <a
                  key={card.href}
                  href={card.href}
                  className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-[10px] border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.035)] px-4 py-6 text-inherit no-underline transition-all duration-[250ms] ease-out before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(192,132,252,0.06),rgba(103,232,249,0.04))] before:opacity-0 before:transition-opacity before:duration-[250ms] before:content-[''] hover:-translate-y-1 hover:border-[rgba(192,132,252,0.4)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.4),0_0_0_1px_rgba(192,132,252,0.15)] hover:before:opacity-100"
                >
                  <span className="relative z-[1] text-[22px] leading-none text-[#e8c97a]">{card.icon}</span>
                  <span className="relative z-[1] font-['Inter',sans-serif] text-[10px] tracking-[0.1em] text-[rgba(240,232,255,0.45)]">{card.kana}</span>
                  <span className="relative z-[1] font-['Inter',sans-serif] text-[12px] uppercase tracking-[0.12em] text-[#f0e8ff]">{card.label}</span>
                  <span className="relative z-[1] translate-x-[-4px] text-[14px] text-[#c084fc] opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100">→</span>
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  )
}
