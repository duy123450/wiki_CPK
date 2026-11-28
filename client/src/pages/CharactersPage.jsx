import { useEffect, useRef, useState, useCallback } from 'react'
import { getCharacters, getCharacterRoles } from '../services/api';
import CharacterCard from '../components/Character/CharacterCard';
import useMovieInfo from '../hooks/useMovieInfo'
import { ROLE_COLORS } from '../constants/ui.constants'

import { generateParticles } from '../utils/uiUtils'

const ROLE_BADGE_BACKGROUNDS = {
  Protagonist: 'rgba(232, 201, 122, 0.1)',
  Supporting: 'rgba(103, 232, 249, 0.1)',
  Antagonist: 'rgba(249, 168, 212, 0.1)',
  Cameo: 'rgba(240, 232, 255, 0.035)',
}

const ACTIVE_ROLE_BACKGROUNDS = {
  All: 'rgba(192, 132, 252, 0.12)',
  Protagonist: 'rgba(232, 201, 122, 0.12)',
  Supporting: 'rgba(103, 232, 249, 0.12)',
  Antagonist: 'rgba(249, 168, 212, 0.12)',
  Cameo: 'rgba(240, 232, 255, 0.042)',
}

// ─── Floating particles ───────────────────────────────────────────────────────
function Particles() {
  const [pts] = useState(() => generateParticles(35))
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      {pts.map((p) => (
        <span
          key={p.id}
          className="absolute animate-characters-particle-drift rounded-full bg-[rgba(192,132,252,0.7)]"
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

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const badgeColor = ROLE_COLORS[role] ?? 'var(--wiki-purple)'
  return (
    <span
      className="inline-flex w-fit items-center rounded-full border border-solid border-[var(--badge-color,#c084fc)] px-[10px] py-[3px] font-['Inter',sans-serif] text-[8.5px] uppercase tracking-[0.2em] text-[var(--badge-color,#c084fc)]"
      style={{
        '--badge-color': badgeColor,
        backgroundColor:
          ROLE_BADGE_BACKGROUNDS[role] ?? 'rgba(192, 132, 252, 0.1)',
      }}
    >
      {role}
    </span>
  )
}

// ─── Character card ───────────────────────────────────────────────────────────
// CharacterCard is now imported from components/Character/CharacterCard.jsx

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="pointer-events-none flex flex-col overflow-hidden rounded-xl border border-solid border-characters-border bg-characters-surface [animation:none]">
      <div className="aspect-[3/4] animate-characters-skeleton-slide bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%]" />
      <div className="flex flex-1 flex-col gap-[7px] px-[18px] pb-[18px] pt-4">
        <div className="mb-[2px] h-[14px] w-[24%] animate-characters-skeleton-slide rounded-[4px] bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%]" />
        <div className="mb-[2px] h-[14px] w-[48%] animate-characters-skeleton-slide rounded-[4px] bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%]" />
        <div className="mb-[2px] h-[14px] w-[36%] animate-characters-skeleton-slide rounded-[4px] bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%]" />
        <div className="mb-[2px] h-[14px] w-full animate-characters-skeleton-slide rounded-[4px] bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%]" />
        <div className="mb-[2px] h-[14px] w-3/4 animate-characters-skeleton-slide rounded-[4px] bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%]" />
      </div>
    </div>
  )
}

// ─── Filter / search bar ──────────────────────────────────────────────────────
/* duplicate roles state removed */

function FilterBar({ search, onSearch, role, onRole, roles, total, showing }) {
  return (
    <div className="relative z-[1] mx-auto mb-8 flex max-w-[1200px] flex-wrap items-center gap-[14px] max-[640px]:flex-col max-[640px]:items-stretch motion-safe:animate-characters-filter-reveal">
      {/* Search */}
      <div className="relative min-w-[200px] max-w-[320px] flex-1 max-[640px]:max-w-full">
        <svg
          className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-characters-subtle"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="box-border w-full rounded-[8px] border border-solid border-characters-border bg-characters-surface py-[9px] pl-[36px] pr-[36px] font-['Source_Sans_3',sans-serif] text-[13px] text-characters-text outline-none transition-[border-color,background] duration-[220ms] placeholder:text-characters-subtle focus:border-[rgba(192,132,252,0.4)] focus:bg-[rgba(255,255,255,0.05)]"
          type="text"
          placeholder="Search characters…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search characters"
        />
        {search && (
          <button
            className="absolute right-[10px] top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent px-[4px] py-[2px] font-['Source_Sans_3',sans-serif] text-[11px] text-characters-subtle transition-colors duration-[180ms] hover:text-characters-text"
            onClick={() => onSearch('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Role pills */}
      <div className="flex flex-wrap gap-[6px]">
        {roles.map((r) => (
          <button
            key={r}
            className={`cursor-pointer whitespace-nowrap rounded-[999px] border border-solid border-characters-border bg-characters-surface px-[14px] py-[6px] font-['Inter',sans-serif] text-[9.5px] uppercase tracking-[0.16em] text-characters-muted transition-all duration-200 hover:border-characters-border-bright hover:bg-characters-surface-hover hover:text-characters-text ${role === r ? 'border-[var(--pill-color,#c084fc)] text-[var(--pill-color,#c084fc)]' : ''}`}
            onClick={() => onRole(r)}
            style={
              role === r
                ? {
                    '--pill-color': ROLE_COLORS[r] ?? '#c084fc',
                    backgroundColor:
                      ACTIVE_ROLE_BACKGROUNDS[r] ??
                      'rgba(192, 132, 252, 0.12)',
                  }
                : undefined
            }
          >
            {r}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="ml-auto whitespace-nowrap text-[12px] italic text-characters-subtle max-[640px]:ml-0">
        Showing <strong className="font-semibold text-characters-muted">{showing}</strong> of <strong className="font-semibold text-characters-muted">{total}</strong>{' '}
        characters
      </p>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ current, total, onChange }) {
  if (total <= 1) return null

  const pages = Array.from({ length: total }, (_, i) => i + 1)
  const visible = pages.filter(
    (p) => p === 1 || p === total || Math.abs(p - current) <= 1
  )

  const rendered = []
  let prev = null
  for (const p of visible) {
    if (prev !== null && p - prev > 1) rendered.push('…')
    rendered.push(p)
    prev = p
  }

  return (
    <nav className="relative z-[1] mt-10 flex flex-wrap items-center justify-center gap-[6px]" aria-label="Character pages">
      <button
        className="min-w-[36px] cursor-pointer rounded-[6px] border border-solid border-characters-border bg-characters-surface px-[12px] py-[7px] font-['Inter',sans-serif] text-[11px] leading-none tracking-[0.1em] text-characters-muted transition-all duration-200 enabled:hover:border-characters-border-bright enabled:hover:bg-characters-surface-hover enabled:hover:text-characters-text disabled:cursor-not-allowed disabled:opacity-30"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        aria-label="Previous page"
      >
        ←
      </button>

      {rendered.map((item, i) =>
        item === '…' ? (
          <span key={`ellipsis-${i}`} className="select-none px-1 text-[13px] text-characters-subtle">
            …
          </span>
        ) : (
          <button
            key={item}
            className={`min-w-[36px] cursor-pointer rounded-[6px] border border-solid border-characters-border bg-characters-surface px-[12px] py-[7px] font-['Inter',sans-serif] text-[11px] leading-none tracking-[0.1em] text-characters-muted transition-all duration-200 hover:border-characters-border-bright hover:bg-characters-surface-hover hover:text-characters-text ${item === current ? 'border-characters-purple bg-[rgba(192,132,252,0.1)] text-characters-purple' : ''}`}
            onClick={() => onChange(item)}
            aria-current={item === current ? 'page' : undefined}
          >
            {item}
          </button>
        )
      )}

      <button
        className="min-w-[36px] cursor-pointer rounded-[6px] border border-solid border-characters-border bg-characters-surface px-[12px] py-[7px] font-['Inter',sans-serif] text-[11px] leading-none tracking-[0.1em] text-characters-muted transition-all duration-200 enabled:hover:border-characters-border-bright enabled:hover:bg-characters-surface-hover enabled:hover:text-characters-text disabled:cursor-not-allowed disabled:opacity-30"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const LIMIT = 12

export default function CharactersPage({ sidebarCollapsed }) {
  const { data: movie } = useMovieInfo()
  const headerTitle = movie?.title ?? '超かぐや姫'
  const headerSub = movie?.tagline ?? ''

  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('All')
  const [roles, setRoles] = useState(['All'])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

  const debounceRef = useRef(null)

  const load = useCallback(async (p, s, r) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page: p, limit: LIMIT }
      if (s) params.search = s
      if (r && r !== 'All') params.role = r

      const data = await getCharacters(params)
      setCharacters(data.characters ?? [])
      setPagination(data.pagination ?? { total: 0, totalPages: 1 })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    load(1, '', 'All')
  }, [load])

  // Fetch roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const fetched = await getCharacterRoles()
        if (Array.isArray(fetched)) {
          setRoles(['All', ...fetched])
        }
      } catch (e) {
        console.error('Failed to fetch roles', e)
      }
    }
    fetchRoles()
  }, [])

  // Debounced search
  const handleSearch = useCallback(
    (val) => {
      setSearch(val)
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setPage(1)
        load(1, val, role)
      }, 350)
    },
    [load, role]
  )

  const handleRole = useCallback(
    (r) => {
      setRole(r)
      setPage(1)
      load(1, search, r)
    },
    [load, search]
  )

  const handlePage = useCallback(
    (p) => {
      setPage(p)
      load(p, search, role)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [load, search, role]
  )

  return (
    <main
      className={`relative box-border min-h-screen max-w-[100vw] overflow-x-hidden bg-characters-bg p-[clamp(32px,5vw,60px)_clamp(16px,5vw,56px)_80px] font-['Source_Sans_3',sans-serif] text-characters-text transition-[width,margin-left] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] supports-[height:100dvh]:min-h-[100dvh] ${
        sidebarCollapsed
          ? 'ml-0 w-full'
          : 'ml-[var(--sidebar-current-width,260px)] w-[calc(100%-var(--sidebar-current-width,260px))]'
      } max-[768px]:ml-0 max-[768px]:w-full`}
    >
      <Particles />

      {/* ── Page header ── */}
      <header className="relative z-[1] mx-auto mb-10 flex max-w-[680px] flex-col items-center gap-[10px] text-center motion-safe:animate-characters-reveal">
        <div className="inline-flex items-center gap-[7px] font-['Inter',sans-serif] text-[10px] uppercase tracking-[0.28em] text-characters-gold opacity-[0.85]">
          <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-characters-gold shadow-[0_0_8px_#e8c97a] motion-safe:animate-characters-dot-pulse" />
          Fan Wiki · Characters
        </div>
        <h1 className="m-0 font-['Inter',sans-serif] text-[clamp(30px,5vw,56px)] font-bold leading-[1.1] text-white [text-shadow:0_0_50px_rgba(192,132,252,0.35),0_2px_4px_rgba(0,0,0,0.5)]">
          {headerTitle}
        </h1>
        {headerSub && (
          <p className="m-0 text-[clamp(12px,2vw,15px)] font-light italic tracking-[0.04em] text-characters-muted">
            {headerSub}
          </p>
        )}
        <div className="mt-1 h-px w-[clamp(40px,10vw,80px)] border-0 bg-[linear-gradient(to_right,transparent,#e8c97a,transparent)]" />
      </header>

      {/* ── Filter bar ── */}
      <FilterBar
        search={search}
        onSearch={handleSearch}
        role={role}
        onRole={handleRole}
        roles={roles}
        total={pagination.total}
        showing={characters.length}
      />

      {/* ── Content ── */}
      {error ? (
        <div className="relative z-[1] col-span-full flex flex-col items-center gap-[14px] px-5 py-20 text-center text-[14px] text-characters-muted">
          <span className="block text-[36px] text-characters-subtle">✦</span>
          <p>{error}</p>
          <button
            className="mt-1 cursor-pointer rounded-[6px] border border-solid border-characters-border-bright bg-[rgba(192,132,252,0.1)] px-5 py-2 font-['Inter',sans-serif] text-[10px] uppercase tracking-[0.18em] text-characters-purple transition-[background-color,border-color] duration-200 hover:border-characters-purple hover:bg-[rgba(192,132,252,0.18)]"
            onClick={() => load(page, search, role)}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div
            className={`relative z-[1] mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 transition-opacity duration-[250ms] ${
              loading ? 'pointer-events-none opacity-50' : ''
            } max-[640px]:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] max-[640px]:gap-[14px] max-[400px]:grid-cols-2`}
          >
            {loading ? (
              Array.from({ length: LIMIT }, (_, i) => <SkeletonCard key={i} />)
            ) : characters.length === 0 ? (
              <div className="relative z-[1] col-span-full flex flex-col items-center gap-[14px] px-5 py-20 text-center text-[14px] text-characters-muted">
                <span className="block text-[36px] text-characters-subtle">◈</span>
                <p>No characters found.</p>
                {(search || role !== 'All') && (
                  <button
                    className="mt-1 cursor-pointer rounded-[6px] border border-solid border-characters-border-bright bg-[rgba(192,132,252,0.1)] px-5 py-2 font-['Inter',sans-serif] text-[10px] uppercase tracking-[0.18em] text-characters-purple transition-[background-color,border-color] duration-200 hover:border-characters-purple hover:bg-[rgba(192,132,252,0.18)]"
                    onClick={() => {
                      setSearch('')
                      setRole('All')
                      setPage(1)
                      load(1, '', 'All')
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              characters.map((c, i) => (
                <CharacterCard key={c._id} character={c} index={i} />
              ))
            )}
          </div>

          {!loading && characters.length > 0 && (
            <Pagination
              current={page}
              total={pagination.totalPages}
              onChange={handlePage}
            />
          )}
        </>
      )}
    </main>
  )
}
