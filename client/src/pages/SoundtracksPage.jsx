import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchAllSoundtracks, fetchSoundtrackMovie } from '../store/slices/soundtrackSlice'
import { generateParticles } from '../utils/uiUtils'
import '../styles/SoundtracksPage.css'
import TrackCard from '../components/Track/TrackCard';
// ─── Floating particles ────────────────────────────────────────────────────────
function Particles() {
  const [pts] = useState(() => generateParticles(30))
  return (
    <div className="st-particles" aria-hidden="true">
      {pts.map((p) => (
        <span
          key={p.id}
          className="st-particle"
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

// ─── Track type badge ─────────────────────────────────────────────────────────
const TYPE_COLORS = {
  'Opening': 'hsl(280, 80%, 65%)',
  'Ending': 'hsl(220, 75%, 65%)',
  'Insert Song': 'hsl(330, 70%, 62%)',
}

function TrackTypeBadge({ type }) {
  const color = TYPE_COLORS[type] ?? 'var(--st-purple)'
  return (
    <span className="st-type-badge" style={{ '--badge-color': color }}>
      {type ?? 'Track'}
    </span>
  )
}

// ─── Track card ───────────────────────────────────────────────────────────────

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="st-card st-card--skeleton">
      <div className="st-card-disc st-skeleton-disc" />
      <div className="st-card-cover st-skeleton-cover" />
      <div className="st-card-body">
        <div className="st-skeleton-bar" style={{ width: '5rem' }} />
        <div className="st-skeleton-bar" style={{ width: '11rem' }} />
        <div className="st-skeleton-bar" style={{ width: '8rem' }} />
      </div>
    </div>
  )
}

// ─── Search bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange }) {
  return (
    <div className="st-search-wrap">
      <svg className="st-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        className="st-search"
        type="text"
        placeholder="Search tracks…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search tracks"
      />
      {value && (
        <button className="st-search-clear" onClick={() => onChange('')} aria-label="Clear search">✕</button>
      )}
    </div>
  )
}

// ─── Type filter pills ────────────────────────────────────────────────────────
const TYPES = ['All', ...Object.keys(TYPE_COLORS)]

function TypePills({ active, onSelect }) {
  return (
    <div className="st-type-pills">
      {TYPES.map((t) => (
        <button
          key={t}
          className={`st-type-pill ${active === t ? 'st-type-pill--active' : ''}`}
          onClick={() => onSelect(t)}
          style={active === t && t !== 'All' ? { '--pill-color': TYPE_COLORS[t] } : {}}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SoundtracksPage({ sidebarCollapsed }) {
  const dispatch = useAppDispatch()
  const tracks = useAppSelector((s) => s.soundtracks.all)
  const status = useAppSelector((s) => s.soundtracks.allStatus)
  const movie  = useAppSelector((s) => s.soundtracks.movie)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  useEffect(() => {
    dispatch(fetchSoundtrackMovie())
  }, [dispatch])

  useEffect(() => {
    if (movie?._id) dispatch(fetchAllSoundtracks(movie._id))
  }, [dispatch, movie])

  const handleSearch = useCallback((val) => {
    setSearch(val)
  }, [])

  // Tracks 16–27 are restricted from public-facing pages
  const publicTracks = tracks.filter(
    (t) => t.trackNumber < 16 || t.trackNumber > 27
  )

  const filtered = publicTracks.filter((t) => {
    const matchesSearch =
      !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.vocal?.toLowerCase().includes(search.toLowerCase()) ||
      t.producer?.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'All' || t.trackType === typeFilter
    return matchesSearch && matchesType
  })


  const loading = status === 'idle' || status === 'loading'

  return (
    <main className={`st-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Particles />

      {/* ── Header ── */}
      <header className="st-header">
        <div className="st-header-eyebrow">
          <span className="st-eyebrow-dot" />
          Fan Wiki · Soundtrack
        </div>
        <h1 className="st-header-title">{movie?.title ?? '超かぐや姫'}</h1>
        <p className="st-header-sub">Original Soundtrack</p>
        <div className="st-header-rule" />
      </header>

      {/* ── Filter bar ── */}
      <div className="st-filter-bar">
        <SearchBar value={search} onChange={handleSearch} />
        <TypePills active={typeFilter} onSelect={setTypeFilter} />
        <p className="st-count">
          Showing <strong>{filtered.length}</strong> of <strong>{publicTracks.length}</strong> tracks
        </p>
      </div>

      {/* ── Grid ── */}
      <div className={`st-grid ${loading ? 'st-grid--loading' : ''}`}>
        {loading ? (
          Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="st-empty">
            <span className="st-empty-glyph">♩</span>
            <p>No tracks found.</p>
            {(search || typeFilter !== 'All') && (
              <button className="st-retry-btn" onClick={() => { setSearch(''); setTypeFilter('All') }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((t, i) => <TrackCard key={t._id} track={t} index={i} />)
        )}
      </div>
    </main>
  )
}
