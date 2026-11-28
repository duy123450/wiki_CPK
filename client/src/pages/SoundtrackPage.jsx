import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSoundtrack } from '../hooks/useSoundtrack'
import { generateParticles } from '../utils/uiUtils'
import { getYoutubeId } from '../utils/youtubeUtils'

// ─── Floating particles ────────────────────────────────────────────────────────
function Particles() {
  const [pts] = useState(() => generateParticles(30))
  return (
    <div className="strk-particles pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {pts.map((p) => (
        <span
          key={p.id}
          className="strk-particle absolute rounded-full bg-[rgba(192,132,252,0.7)] motion-safe:animate-soundtrack-particle motion-reduce:animate-none"
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

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, ornamentColor, children }) {
  return (
    <div className="strk-section-card rounded-[14px] border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.035)] p-[1.4rem_1.5rem] motion-safe:animate-soundtrack-fade-in motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0 transition-[border-color] duration-200 hover:border-[rgba(192,132,252,0.3)]">
      <div className="strk-section-head mb-4 flex items-center gap-[0.6rem]">
        <span
          className="strk-section-orn block h-[1.1em] w-1 shrink-0 rounded-[2px]"
          style={{
            background: ornamentColor ?? '#c084fc',
            boxShadow: `0 0 8px ${ornamentColor ?? '#c084fc'}`,
          }}
        />
        <h2 className="strk-section-title m-0 text-[0.85rem] font-bold uppercase tracking-[0.1em] text-[rgba(240,232,255,0.45)]">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Stat row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value }) {
  if (!value) return null
  return (
    <div className="strk-stat-row flex items-baseline justify-between gap-2 border-b border-solid border-b-[rgba(180,140,255,0.12)] pb-[0.55rem] last:border-b-0 last:pb-0">
      <dt className="strk-stat-label shrink-0 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[rgba(240,232,255,0.45)]">{label}</dt>
      <dd className="strk-stat-value m-0 text-right text-[0.85rem] font-medium text-[#f0e8ff]">{value}</dd>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="strk-skeleton relative z-[1] grid max-w-[1100px] grid-cols-[300px_1fr] items-start gap-10 max-[860px]:grid-cols-1">
      <div className="strk-skeleton-cover aspect-square rounded-[14px] bg-[linear-gradient(90deg,rgba(180,140,255,0.12)_25%,hsl(228,18%,16%)_50%,rgba(180,140,255,0.12)_75%)] bg-[length:200%_100%] motion-safe:animate-soundtrack-shimmer motion-reduce:animate-none" />
      <div className="strk-skeleton-body flex flex-col gap-3 pt-2">
        <div className="strk-skeleton-bar h-[0.85rem] rounded-md bg-[linear-gradient(90deg,rgba(180,140,255,0.12)_25%,hsl(228,18%,16%)_50%,rgba(180,140,255,0.12)_75%)] bg-[length:200%_100%] motion-safe:animate-soundtrack-shimmer motion-reduce:animate-none" style={{ width: '6rem' }} />
        <div className="strk-skeleton-bar rounded-md bg-[linear-gradient(90deg,rgba(180,140,255,0.12)_25%,hsl(228,18%,16%)_50%,rgba(180,140,255,0.12)_75%)] bg-[length:200%_100%] motion-safe:animate-soundtrack-shimmer motion-reduce:animate-none" style={{ width: '14rem', height: '2rem' }} />
        <div className="strk-skeleton-bar h-[0.85rem] rounded-md bg-[linear-gradient(90deg,rgba(180,140,255,0.12)_25%,hsl(228,18%,16%)_50%,rgba(180,140,255,0.12)_75%)] bg-[length:200%_100%] motion-safe:animate-soundtrack-shimmer motion-reduce:animate-none" style={{ width: '9rem' }} />
        <div className="strk-skeleton-bar h-[0.85rem] rounded-md bg-[linear-gradient(90deg,rgba(180,140,255,0.12)_25%,hsl(228,18%,16%)_50%,rgba(180,140,255,0.12)_75%)] bg-[length:200%_100%] motion-safe:animate-soundtrack-shimmer motion-reduce:animate-none" style={{ width: '12rem' }} />
      </div>
    </div>
  )
}

// ─── YouTube embed ────────────────────────────────────────────────────────────
function YoutubeEmbed({ youtubeId, startTime }) {
  if (!youtubeId) return null
  const src = `https://www.youtube.com/embed/${youtubeId}${startTime ? `?start=${startTime}` : ''}`
  return (
    <div className="strk-yt-wrap relative w-full overflow-hidden rounded-[10px] bg-[hsl(228,20%,6%)] [padding-top:56.25%]">
      <iframe
        className="strk-yt-iframe absolute inset-0 h-full w-full border-0 rounded-[10px]"
        src={src}
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

// ─── Lyrics tabs ──────────────────────────────────────────────────────────────
const LYRIC_TABS = [
  { key: 'japanese', label: 'Japanese' },
  { key: 'romaji', label: 'Romaji' },
  { key: 'translation', label: 'Translation' },
]

function LyricsPanel({ lyrics }) {
  const [tab, setTab] = useState('romaji')
  const availableTabs = LYRIC_TABS.filter(({ key }) => !!lyrics?.[key]?.trim())
  if (!availableTabs.length) return null

  const activeTab = availableTabs.some(({ key }) => key === tab)
    ? tab
    : availableTabs[0].key
  const activeContent = lyrics[activeTab]

  return (
    <div className="strk-lyrics flex flex-col gap-3">
      <div className="strk-lyrics-tabs flex gap-[0.4rem]">
        {LYRIC_TABS.map(({ key, label }) => {
          const available = availableTabs.some((availableTab) => availableTab.key === key)
          if (!available) return null
          return (
            <button
              key={key}
              className={`strk-lyrics-tab rounded-[99px] border border-solid border-[rgba(180,140,255,0.12)] bg-transparent px-[0.9rem] py-[0.3rem] text-[0.78rem] font-semibold text-[rgba(240,232,255,0.45)] transition-[all] duration-200 hover:border-[#c084fc] hover:text-[#f0e8ff] ${activeTab === key ? 'strk-lyrics-tab--active border-[#c084fc] bg-[rgba(192,132,252,0.18)] text-[#c084fc]' : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          )
        })}
      </div>
      <pre className="strk-lyrics-body m-0 max-h-[480px] overflow-y-auto whitespace-pre-wrap rounded-[10px] border border-solid border-[rgba(180,140,255,0.12)] bg-[hsl(228,20%,6%)] px-[1.3rem] py-[1.1rem] font-['Inter',sans-serif] text-[0.9rem] leading-[1.9] text-[#f0e8ff] [scrollbar-color:rgba(180,140,255,0.12)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(180,140,255,0.12)]">{activeContent}</pre>
      {lyrics.translator && (
        <p className="strk-lyrics-credit m-0 text-[0.75rem] text-[rgba(240,232,255,0.45)]">Translation by <em>{lyrics.translator}</em></p>
      )}
    </div>
  )
}

// ─── Official links ────────────────────────────────────────────────────────────
function OfficialLinks({ links }) {
  if (!links?.length) return null
  return (
    <div className="strk-official-links flex flex-col gap-[0.4rem]">
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url ?? link}
          className="strk-official-link inline-flex items-center gap-[0.45rem] rounded-[8px] border border-solid border-[rgba(192,132,252,0.3)] bg-[rgba(192,132,252,0.08)] px-[0.75rem] py-[0.45rem] text-[0.8rem] font-semibold text-[#c084fc] no-underline transition-[background,border-color] duration-200 hover:border-[#c084fc] hover:bg-[rgba(192,132,252,0.18)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          {link.label ?? `Stream / Purchase`}
        </a>
      ))}
    </div>
  )
}


// ─── Main page ────────────────────────────────────────────────────────────────
export default function SoundtrackPage({ sidebarCollapsed }) {
  const { slug } = useParams()
  const { track, loading, error } = useSoundtrack(slug)
  const [selectedYtId, setSelectedYtId] = useState(null)
  const [selectedStartTime, setSelectedStartTime] = useState(0)

  // Tracks 16–27 are restricted from public-facing pages
  const isRestricted =
    track?.trackNumber != null &&
    track.trackNumber >= 16 &&
    track.trackNumber <= 27

  // Reset selected YT ID when track changes
  useEffect(() => {
    setSelectedYtId(null)
    setSelectedStartTime(0)
  }, [track?._id])

  const TYPE_COLORS = {
    'Opening': 'hsl(280, 80%, 65%)',
    'Ending': 'hsl(220, 75%, 65%)',
    'Insert Song': 'hsl(330, 70%, 62%)',
  }

  // Parse alternative YouTube sources
  const ytOptions = useMemo(() => {
    if (!track) return []
    const options = []
    const officialYtIds = new Set()

    if (track.officialUrl && Array.isArray(track.officialUrl)) {
      track.officialUrl.forEach((item) => {
        const urlStr = item.url || item
        const yid = getYoutubeId(urlStr)
        if (yid) {
          options.push({
            label: item.label || 'Alternative',
            youtubeId: yid,
            startTime: 0
          })
          officialYtIds.add(yid)
        }
      })
    }

    // Add main source if not already present
    if (track.youtubeId && !officialYtIds.has(track.youtubeId)) {
      options.unshift({
        label: 'Default',
        youtubeId: track.youtubeId,
        startTime: track.startTime || 0
      })
    }

    return options
  }, [track])

  const activeYtId = selectedYtId || (ytOptions[0]?.youtubeId ?? null)
  const activeStartTime = selectedYtId ? selectedStartTime : (ytOptions[0]?.startTime ?? 0)

  return (
    <main className={`strk-root relative box-border min-h-[100vh] min-h-[100dvh] max-w-[100vw] overflow-x-hidden bg-[#05040f] px-[clamp(16px,5vw,56px)] pb-20 pt-[clamp(24px,5vw,56px)] font-['Source_Sans_3','Inter',sans-serif] text-[#f0e8ff] transition-[width,margin-left] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? 'sidebar-collapsed ml-0 w-full' : 'ml-[var(--sidebar-current-width,260px)] w-[calc(100%-var(--sidebar-current-width,260px))]'} max-[860px]:ml-0 max-[860px]:w-full max-[560px]:px-4 max-[560px]:pb-12 max-[560px]:pt-5`}>
      <Particles />

      {/* Breadcrumb */}
      <div className="strk-breadcrumb relative z-[1] mb-7">
        <Link to="/wiki/soundtrack" className="strk-back-link inline-flex items-center gap-[0.3rem] text-[0.82rem] font-semibold text-[rgba(240,232,255,0.45)] no-underline transition-colors duration-200 hover:text-[#c084fc]">
          ← All Tracks
        </Link>
      </div>

      {loading ? (
        <Skeleton />
      ) : error || isRestricted ? (
        <div className="strk-error relative z-[1] flex flex-col items-center gap-3 px-4 py-20 text-center text-[rgba(240,232,255,0.45)]">
          <span className="strk-error-glyph text-[3.5rem] opacity-[0.35]">♩</span>
          <p>{isRestricted ? 'This track is not available.' : error}</p>
          <Link to="/wiki/soundtrack" className="strk-back-link inline-flex items-center gap-[0.3rem] text-[0.82rem] font-semibold text-[rgba(240,232,255,0.45)] no-underline transition-colors duration-200 hover:text-[#c084fc]">← Back to Soundtrack</Link>
        </div>
      ) : track ? (
        <div className="strk-layout relative z-[1] mx-auto grid max-w-[1100px] grid-cols-[300px_1fr] items-start gap-10 max-[860px]:grid-cols-1">
          {/* ── LEFT: cover + quick stats ── */}
          <aside className="strk-aside sticky top-8 flex flex-col gap-5 max-[860px]:static max-[860px]:grid max-[860px]:grid-cols-[200px_1fr] max-[860px]:items-start max-[860px]:gap-4">
            {/* Cover art / vinyl disc */}
            <div className="strk-cover-wrap aspect-square overflow-hidden rounded-[14px] border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.035)] max-[860px]:row-span-2">
              {track.coverImage ? (
                <img src={track.coverImage} alt={track.title} className="strk-cover-img block h-full w-full object-cover transition-transform duration-[400ms] hover:scale-[1.03]" />
              ) : (
                <div className="strk-cover-placeholder flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_60%,hsl(272,40%,12%)_0%,hsl(228,20%,6%)_100%)] motion-safe:animate-soundtrack-glow motion-reduce:animate-none">
                  <div className="strk-vinyl-disc relative flex h-[200px] w-[200px] items-center justify-center rounded-full bg-[hsl(228,20%,5%)] motion-safe:animate-soundtrack-spin motion-reduce:animate-none shadow-[0_0_0_2px_hsl(228,18%,18%),0_8px_32px_rgba(0,0,0,0.6)]">
                    <div className="strk-vinyl-ring strk-vinyl-ring--1 pointer-events-none absolute inset-[22px] rounded-full border border-solid border-[hsl(228,18%,20%)]" />
                    <div className="strk-vinyl-ring strk-vinyl-ring--2 pointer-events-none absolute inset-[44px] rounded-full border border-solid border-[hsl(272,40%,22%)]" />
                    <div className="strk-vinyl-ring strk-vinyl-ring--3 pointer-events-none absolute inset-[66px] rounded-full border border-solid border-[hsl(228,18%,20%)]" />
                    <div className="strk-vinyl-center h-7 w-7 rounded-full bg-[radial-gradient(circle,#c084fc_20%,hsl(272,60%,38%)_100%)] shadow-[0_0_14px_#c084fc]" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="strk-quick-stats flex flex-col gap-[0.9rem] rounded-[14px] border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.035)] px-[1.1rem] py-5">
              {track.trackType && (
                <span
                  className="strk-type-badge w-fit rounded-[99px] border border-solid px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.09em]"
                  style={{
                    color: TYPE_COLORS[track.trackType] ?? '#c084fc',
                    borderColor: TYPE_COLORS[track.trackType] ?? '#c084fc',
                    backgroundColor: 'rgba(192,132,252,0.16)',
                  }}
                >
                  {track.trackType}
                </span>
              )}

              <dl className="strk-stat-list m-0 flex flex-col gap-[0.55rem]">
                <StatRow label="Track #" value={track.trackNumber != null ? `#${track.trackNumber}` : null} />
                <StatRow label="Vocal" value={track.vocal} />
                <StatRow label="Music" value={track.producer} />
                <StatRow label="Movie" value={track.movie?.title} />
              </dl>

              <OfficialLinks links={track.officialUrl} />
            </div>
          </aside>

          {/* ── RIGHT: main content ── */}
          <div className="strk-main flex min-w-0 flex-col gap-6">
            <header className="strk-header mb-1">
              <div className="strk-eyebrow mb-[0.6rem] inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[rgba(240,232,255,0.45)]">
                <span className="strk-eyebrow-dot inline-block h-[6px] w-[6px] rounded-full bg-[#c084fc] shadow-[0_0_8px_#c084fc]" />
                Soundtrack · {track.movie?.title ?? 'CPK'}
              </div>
              <h1 className="strk-title m-0 mb-3 text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-transparent [background:linear-gradient(135deg,#fff_30%,#c084fc_100%)] [background-clip:text] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">{track.title}</h1>
              <div className="strk-header-rule h-[2px] w-[60px] rounded-[2px] bg-[linear-gradient(90deg,#c084fc,transparent)]" />
            </header>

            {/* YouTube embed */}
            {activeYtId && (
              <SectionCard title="Listen" ornamentColor="#ef4444">
                {ytOptions.length > 1 && (
                  <div className="strk-yt-selector mb-4 flex flex-wrap gap-2">
                    {ytOptions.map((opt) => (
                      <button
                        key={opt.youtubeId}
                        className={`strk-yt-selector-btn cursor-pointer rounded-md border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.035)] px-[0.85rem] py-[0.35rem] text-[0.75rem] font-semibold text-[rgba(240,232,255,0.45)] transition-[all] duration-200 hover:border-[#ef4444] hover:bg-[rgba(239,68,68,0.06)] hover:text-[#f0e8ff] ${
                          activeYtId === opt.youtubeId ? 'active border-[#ef4444] bg-[rgba(239,68,68,0.18)] text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''
                        }`}
                        onClick={() => {
                          setSelectedYtId(opt.youtubeId)
                          setSelectedStartTime(opt.startTime)
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
                <YoutubeEmbed youtubeId={activeYtId} startTime={activeStartTime} />
              </SectionCard>
            )}

            {/* Lyrics */}
            {(track.lyrics?.japanese?.trim() ||
              track.lyrics?.romaji?.trim() ||
              track.lyrics?.translation?.trim()) && (
              <SectionCard title="Lyrics" ornamentColor="#c084fc">
                <LyricsPanel lyrics={track.lyrics} />
                {track.lyrics.source && (
                  <p className="strk-lyrics-source m-0 mt-2 text-[0.72rem] text-[rgba(240,232,255,0.45)] opacity-70">Source: {track.lyrics.source}</p>
                )}
              </SectionCard>
            )}
          </div>
        </div>
      ) : null}
    </main>
  )
}
