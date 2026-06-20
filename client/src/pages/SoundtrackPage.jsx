import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSoundtrack } from '../hooks/useSoundtrack'
import { generateParticles } from '../utils/uiUtils'
import { getYoutubeId } from '../utils/youtubeUtils'
import '../styles/SoundtrackPage.css'

// ─── Floating particles ────────────────────────────────────────────────────────
function Particles() {
  const [pts] = useState(() => generateParticles(30))
  return (
    <div className="strk-particles" aria-hidden="true">
      {pts.map((p) => (
        <span
          key={p.id}
          className="strk-particle"
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
    <div className="strk-section-card">
      <div className="strk-section-head">
        <span className="strk-section-orn" style={{ '--orn-color': ornamentColor ?? 'var(--strk-purple)' }} />
        <h2 className="strk-section-title">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Stat row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value }) {
  if (!value) return null
  return (
    <div className="strk-stat-row">
      <dt className="strk-stat-label">{label}</dt>
      <dd className="strk-stat-value">{value}</dd>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="strk-skeleton">
      <div className="strk-skeleton-cover" />
      <div className="strk-skeleton-body">
        <div className="strk-skeleton-bar" style={{ width: '6rem' }} />
        <div className="strk-skeleton-bar" style={{ width: '14rem', height: '2rem' }} />
        <div className="strk-skeleton-bar" style={{ width: '9rem' }} />
        <div className="strk-skeleton-bar" style={{ width: '12rem' }} />
      </div>
    </div>
  )
}

// ─── YouTube embed ────────────────────────────────────────────────────────────
function YoutubeEmbed({ youtubeId, startTime }) {
  if (!youtubeId) return null
  const src = `https://www.youtube.com/embed/${youtubeId}${startTime ? `?start=${startTime}` : ''}`
  return (
    <div className="strk-yt-wrap">
      <iframe
        className="strk-yt-iframe"
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
  { key: 'romaji', label: 'Romaji' },
  { key: 'translation', label: 'Translation' },
]

function LyricsPanel({ lyrics }) {
  const [tab, setTab] = useState('romaji')
  const hasRomaji = !!lyrics?.romaji?.trim()
  const hasTrans  = !!lyrics?.translation?.trim()
  if (!hasRomaji && !hasTrans) return null

  const activeContent = tab === 'romaji' ? lyrics.romaji : lyrics.translation

  return (
    <div className="strk-lyrics">
      <div className="strk-lyrics-tabs">
        {LYRIC_TABS.map(({ key, label }) => {
          const available = key === 'romaji' ? hasRomaji : hasTrans
          if (!available) return null
          return (
            <button
              key={key}
              className={`strk-lyrics-tab ${tab === key ? 'strk-lyrics-tab--active' : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          )
        })}
      </div>
      <pre className="strk-lyrics-body">{activeContent}</pre>
      {lyrics.translator && (
        <p className="strk-lyrics-credit">Translation by <em>{lyrics.translator}</em></p>
      )}
    </div>
  )
}

// ─── Official links ────────────────────────────────────────────────────────────
function OfficialLinks({ links }) {
  if (!links?.length) return null
  return (
    <div className="strk-official-links">
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url ?? link}
          className="strk-official-link"
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
    <main className={`strk-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Particles />

      {/* Breadcrumb */}
      <div className="strk-breadcrumb">
        <Link to="/wiki/soundtrack" className="strk-back-link">
          ← All Tracks
        </Link>
      </div>

      {loading ? (
        <Skeleton />
      ) : error || isRestricted ? (
        <div className="strk-error">
          <span className="strk-error-glyph">♩</span>
          <p>{isRestricted ? 'This track is not available.' : error}</p>
          <Link to="/wiki/soundtrack" className="strk-back-link">← Back to Soundtrack</Link>
        </div>
      ) : track ? (
        <div className="strk-layout">
          {/* ── LEFT: cover + quick stats ── */}
          <aside className="strk-aside">
            {/* Cover art / vinyl disc */}
            <div className="strk-cover-wrap">
              {track.coverImage ? (
                <img src={track.coverImage} alt={track.title} className="strk-cover-img" />
              ) : (
                <div className="strk-cover-placeholder">
                  <div className="strk-vinyl-disc">
                    <div className="strk-vinyl-ring strk-vinyl-ring--1" />
                    <div className="strk-vinyl-ring strk-vinyl-ring--2" />
                    <div className="strk-vinyl-ring strk-vinyl-ring--3" />
                    <div className="strk-vinyl-center" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="strk-quick-stats">
              {track.trackType && (
                <span
                  className="strk-type-badge"
                  style={{ '--badge-color': TYPE_COLORS[track.trackType] ?? 'var(--strk-purple)' }}
                >
                  {track.trackType}
                </span>
              )}

              <dl className="strk-stat-list">
                <StatRow label="Track #" value={track.trackNumber != null ? `#${track.trackNumber}` : null} />
                <StatRow label="Vocal" value={track.vocal} />
                <StatRow label="Music" value={track.producer} />
                <StatRow label="Movie" value={track.movie?.title} />
              </dl>

              <OfficialLinks links={track.officialUrl} />
            </div>
          </aside>

          {/* ── RIGHT: main content ── */}
          <div className="strk-main">
            <header className="strk-header">
              <div className="strk-eyebrow">
                <span className="strk-eyebrow-dot" />
                Soundtrack · {track.movie?.title ?? 'CPK'}
              </div>
              <h1 className="strk-title">{track.title}</h1>
              <div className="strk-header-rule" />
            </header>

            {/* YouTube embed */}
            {activeYtId && (
              <SectionCard title="Listen" ornamentColor="var(--strk-red)">
                {ytOptions.length > 1 && (
                  <div className="strk-yt-selector">
                    {ytOptions.map((opt) => (
                      <button
                        key={opt.youtubeId}
                        className={`strk-yt-selector-btn ${
                          activeYtId === opt.youtubeId ? 'active' : ''
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
            {(track.lyrics?.romaji || track.lyrics?.translation) && (
              <SectionCard title="Lyrics" ornamentColor="var(--strk-purple)">
                <LyricsPanel lyrics={track.lyrics} />
                {track.lyrics.source && (
                  <p className="strk-lyrics-source">Source: {track.lyrics.source}</p>
                )}
              </SectionCard>
            )}
          </div>
        </div>
      ) : null}
    </main>
  )
}
