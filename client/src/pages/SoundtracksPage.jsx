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
    <div className="relative w-full max-w-[420px]">
      <svg className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[var(--st-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        className="box-border w-full rounded-[99px] border border-solid border-[var(--st-border)] bg-[var(--st-surface)] py-[0.65rem] pl-[2.4rem] pr-[2.6rem] text-[0.875rem] text-[var(--st-text)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--st-purple)] focus:shadow-[0_0_0_3px_hsl(272,78%,62%,0.18)]"
        type="text"
        placeholder="Search tracks…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search tracks"
      />
      {value && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded border-0 bg-transparent px-1 py-[2px] text-[0.8rem] leading-none text-[var(--st-muted)] transition-colors duration-150 hover:text-[var(--st-text)]"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  )
}

// ─── Type filter pills ────────────────────────────────────────────────────────
const TYPES = ['All', ...Object.keys(TYPE_COLORS)]

function TypePills({ active, onSelect }) {
  return (
    <div className="flex flex-wrap justify-center gap-[0.4rem]">
      {TYPES.map((t) => (
        <button
          key={t}
          className={`cursor-pointer rounded-[99px] border border-solid border-[var(--st-border)] bg-[var(--st-surface)] px-[0.9rem] py-[0.3rem] text-[0.78rem] font-semibold text-[var(--st-muted)] transition-all duration-200 hover:border-[var(--st-purple)] hover:text-[var(--st-text)] ${active === t ? 'st-type-pill--active' : ''}`}
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
    <main
      className={`st-root relative box-border max-w-[100vw] overflow-x-hidden bg-[var(--st-bg)] p-[clamp(32px,5vw,60px)_clamp(16px,5vw,56px)_80px] font-['Source_Sans_3','Inter',sans-serif] text-[var(--st-text)] transition-[width,margin-left] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        sidebarCollapsed
          ? 'ml-0 w-full'
          : 'ml-[var(--sidebar-current-width,260px)] w-[calc(100%-var(--sidebar-current-width,260px))]'
      } max-[768px]:ml-0 max-[768px]:w-full max-[640px]:p-[1.25rem_1rem_3rem]`}
    >
      <Particles />

      {/* ── Header ── */}
      <header className="relative z-[1] mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[var(--st-muted)]">
          <span className="inline-block h-[6px] w-[6px] rounded-full bg-[var(--st-purple)] shadow-[0_0_8px_var(--st-purple)]" />
          Fan Wiki · Soundtrack
        </div>
        <h1 className="m-[0_0_0.4rem] bg-[linear-gradient(135deg,#fff_30%,var(--st-purple)_100%)] bg-clip-text text-[clamp(2rem,5vw,3.4rem)] font-extrabold tracking-[-0.02em] text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
          {movie?.title ?? '超かぐや姫'}
        </h1>
        <p className="m-[0_0_1.25rem] text-[0.9rem] tracking-[0.04em] text-[var(--st-muted)]">
          Original Soundtrack
        </p>
        <div className="mx-auto h-0.5 w-20 rounded-[2px] bg-[linear-gradient(90deg,transparent,var(--st-purple),transparent)]" />
      </header>

      {/* ── Filter bar ── */}
      <div className="relative z-[1] mb-10 flex flex-col items-center gap-4">
        <SearchBar value={search} onChange={handleSearch} />
        <TypePills active={typeFilter} onSelect={setTypeFilter} />
        <p className="m-0 text-[0.78rem] text-[var(--st-muted)]">
          Showing <strong>{filtered.length}</strong> of <strong>{publicTracks.length}</strong> tracks
        </p>
      </div>

      {/* ── Grid ── */}
      <div
        className={`relative z-[1] mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fill,minmax(var(--st-card-w),1fr))] gap-5 transition-opacity duration-[250ms] ${
          loading ? 'pointer-events-none opacity-50' : ''
        } max-[640px]:grid-cols-1`}
      >
        {loading ? (
          Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-3 px-4 py-16 text-center text-[var(--st-muted)]">
            <span className="text-5xl opacity-40">♩</span>
            <p>No tracks found.</p>
            {(search || typeFilter !== 'All') && (
              <button
                className="cursor-pointer rounded-[99px] border border-solid border-[var(--st-purple)] bg-transparent px-[1.2rem] py-2 text-[0.82rem] font-semibold text-[var(--st-purple)] transition-[background-color,color] duration-200 hover:bg-[var(--st-purple)] hover:text-white"
                onClick={() => { setSearch(''); setTypeFilter('All') }}
              >
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
