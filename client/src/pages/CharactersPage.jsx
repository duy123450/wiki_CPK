/* eslint-disable react-hooks/purity */
import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getCharacters, getCharacterRoles } from '../services/api';
import CharacterCard from '../components/Character/CharacterCard';
import useMovieInfo from '../hooks/useMovieInfo'
import { ROLE_COLORS } from '../constants/ui.constants'
import '../styles/CharactersPage.css'

import { nameToSlug } from '../utils/characterUtils'

import { generateParticles } from '../utils/uiUtils'

// ─── Floating particles ───────────────────────────────────────────────────────
function Particles() {
  const [pts] = useState(() => generateParticles(35))
  return (
    <div className="chrs-particles" aria-hidden="true">
      {pts.map((p) => (
        <span
          key={p.id}
          className="chrs-particle"
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
  return (
    <span
      className="chrs-role-badge"
      style={{ '--badge-color': ROLE_COLORS[role] ?? 'var(--wiki-purple)' }}
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
    <div className="chrs-card chrs-card--skeleton">
      <div className="chrs-card-img-wrap chrs-skeleton-img" />
      <div className="chrs-card-body">
        <div className="chrs-skeleton-bar w-24" />
        <div className="chrs-skeleton-bar w-48" />
        <div className="chrs-skeleton-bar w-36" />
        <div className="chrs-skeleton-bar w-full" />
        <div className="chrs-skeleton-bar w-3/4" />
      </div>
    </div>
  )
}

// ─── Filter / search bar ──────────────────────────────────────────────────────
/* duplicate roles state removed */

function FilterBar({ search, onSearch, role, onRole, roles, total, showing }) {
  return (
    <div className="chrs-filter-bar">
      {/* Search */}
      <div className="chrs-search-wrap">
        <svg
          className="chrs-search-icon"
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
          className="chrs-search"
          type="text"
          placeholder="Search characters…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search characters"
        />
        {search && (
          <button
            className="chrs-search-clear"
            onClick={() => onSearch('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Role pills */}
      <div className="chrs-role-pills">
        {roles.map((r) => (
          <button
            key={r}
            className={`chrs-role-pill ${role === r ? 'chrs-role-pill--active' : ''}`}
            onClick={() => onRole(r)}
            style={
              role === r && r !== 'All'
                ? { '--pill-color': ROLE_COLORS[r] ?? 'var(--chrs-purple)' }
                : {}
            }
          >
            {r}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="chrs-count">
        Showing <strong>{showing}</strong> of <strong>{total}</strong>{' '}
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
    <nav className="chrs-pagination" aria-label="Character pages">
      <button
        className="chrs-page-btn"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        aria-label="Previous page"
      >
        ←
      </button>

      {rendered.map((item, i) =>
        item === '…' ? (
          <span key={`ellipsis-${i}`} className="chrs-page-ellipsis">
            …
          </span>
        ) : (
          <button
            key={item}
            className={`chrs-page-btn ${item === current ? 'chrs-page-btn--active' : ''}`}
            onClick={() => onChange(item)}
            aria-current={item === current ? 'page' : undefined}
          >
            {item}
          </button>
        )
      )}

      <button
        className="chrs-page-btn"
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
      className={`chrs-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      <Particles />

      {/* ── Page header ── */}
      <header className="chrs-header">
        <div className="chrs-header-eyebrow">
          <span className="chrs-eyebrow-dot" />
          Fan Wiki · Characters
        </div>
        <h1 className="chrs-header-title">{headerTitle}</h1>
        {headerSub && <p className="chrs-header-sub">{headerSub}</p>}
        <div className="chrs-header-rule" />
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
        <div className="chrs-error">
          <span className="chrs-error-glyph">✦</span>
          <p>{error}</p>
          <button
            className="chrs-retry-btn"
            onClick={() => load(page, search, role)}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className={`chrs-grid ${loading ? 'chrs-grid--loading' : ''}`}>
            {loading ? (
              Array.from({ length: LIMIT }, (_, i) => <SkeletonCard key={i} />)
            ) : characters.length === 0 ? (
              <div className="chrs-empty">
                <span className="chrs-empty-glyph">◈</span>
                <p>No characters found.</p>
                {(search || role !== 'All') && (
                  <button
                    className="chrs-retry-btn"
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
