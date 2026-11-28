import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  BookOpen,
  Wand2,
  LogIn,
  LogOut,
  User,
  Bookmark,
  Shield,
} from 'lucide-react'
import {
  ICON_MAP,
  LOGO_URL,
  DEFAULT_AVATAR,
  OPEN_CATEGORY_COOKIE as DEFAULT_COOKIE,
} from '../constants/ui.constants'
import { ROLES } from '../constants'
import { useAuthContext } from '../context/AuthContext'
import { getSidebar } from '../services/api'
import LiveUserCount from './LiveUserCount'

import { envConfig } from '../config/env.config'

const OPEN_CATEGORY_COOKIE =
  envConfig.VITE_OPEN_CATEGORY_COOKIE || DEFAULT_COOKIE

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split('; ') : []
  const target = cookies.find((entry) => entry.startsWith(`${name}=`))
  return target
    ? decodeURIComponent(target.split('=').slice(1).join('='))
    : null
}

function setCookie(name, value, maxAgeSeconds = 60 * 60 * 24 * 30) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`
}

// Categories that have their own index / listing page
const COLLECTION_CATEGORIES = {
  characters: '/wiki/characters',
  soundtrack: '/wiki/soundtrack',
}

function CategoryItem({
  category,
  activePage,
  onPageSelect,
  isOpen,
  onToggle,
  onNavigate,
}) {
  const Icon = ICON_MAP[category.icon] || BookOpen
  const hasActivePage = category.pages?.some((p) => p.slug === activePage)
  const indexPath = COLLECTION_CATEGORIES[category.slug]

  return (
    <div className={`category-item mb-0.5 ${hasActivePage ? 'has-active' : ''}`}>
      <button
        className={`category-header flex w-full appearance-none items-center gap-2 whitespace-nowrap rounded-lg border-0 bg-transparent px-[10px] py-2 text-left font-['Inter',sans-serif] text-[10.5px] font-semibold tracking-[0.08em] text-[#8b7da8] [transition:background_0.2s,color_0.2s] hover:bg-[rgba(192,132,252,0.08)] hover:text-[#c084fc] max-[768px]:min-h-[42px] ${isOpen ? 'open bg-[rgba(192,132,252,0.08)] text-[#c084fc]' : ''}`}
        onClick={() => onToggle(category.slug)}
        aria-expanded={isOpen}
      >
        <span className={`category-icon-wrap flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md transition-colors duration-200 ${isOpen ? 'bg-[rgba(192,132,252,0.2)]' : 'bg-[rgba(192,132,252,0.1)]'} group-hover:bg-[rgba(192,132,252,0.2)]`}>
          <Icon size={14} strokeWidth={1.8} />
        </span>
        <span className="category-name flex-1 overflow-hidden text-ellipsis">{category.name}</span>
        <ChevronDown
          size={12}
          className={`chevron shrink-0 opacity-50 [transition:transform_0.25s_ease,opacity_0.2s] ${isOpen ? 'rotated -rotate-180 opacity-100' : ''}`}
        />
      </button>

      <div className={`pages-list grid [grid-template-rows:0fr] [transition:grid-template-rows_0.28s_cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'expanded [grid-template-rows:1fr]' : ''}`}>
        <div className={`pages-inner overflow-hidden pb-0 pl-[30px] pr-1 [transition:padding-bottom_0.28s] ${isOpen ? 'pb-1' : ''}`}>
          {/* Index / listing page link for collection categories */}
          {indexPath && (
            <button
              className="page-link page-link--index flex w-full appearance-none items-center gap-2 overflow-hidden whitespace-nowrap rounded-md border-0 bg-transparent px-[10px] py-[6px] text-left font-['Source_Sans_3',sans-serif] text-[11px] font-medium italic tracking-[0.04em] text-[#c084fc] opacity-75 no-underline [-webkit-tap-highlight-color:transparent] [transition:all_0.2s] hover:bg-[rgba(192,132,252,0.1)] hover:opacity-100 max-[768px]:min-h-[44px] max-[768px]:py-2"
              onClick={() => onNavigate(indexPath)}
            >
              <span className="page-dot h-1 w-1 shrink-0 rounded-full bg-[#c084fc] opacity-60 [transition:opacity_0.2s]" />
              View All
            </button>
          )}
          {category.pages?.map((page) => (
            <button
              key={page.slug}
              className={`page-link flex w-full appearance-none items-center gap-2 overflow-hidden whitespace-nowrap rounded-md border-0 bg-transparent px-[10px] py-[6px] text-left font-['Source_Sans_3',sans-serif] text-xs font-light tracking-[0.02em] no-underline [-webkit-tap-highlight-color:transparent] [transition:all_0.2s] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#e2d9f3] max-[768px]:min-h-[44px] max-[768px]:py-2 ${activePage === page.slug ? 'active border-l-2 border-solid border-l-[#67e8f9] bg-[rgba(103,232,249,0.1)] pl-2 font-normal text-[#67e8f9]' : 'border-l-0 text-[#4a4060]'}`}
              onClick={() => onPageSelect(page.slug, category.slug)}
            >
              <span className={`page-dot h-1 w-1 shrink-0 rounded-full bg-current [transition:opacity_0.2s] ${activePage === page.slug ? 'opacity-100 shadow-[0_0_6px_currentColor]' : 'opacity-50'}`} />
              {page.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


// Placeholder for avatar if none provided

export default function Sidebar({
  onCollapseChange,
  dragonCursorEnabled,
}) {
  // Auth state sourced from AuthContext — not props.
  // Eliminates the INFERRED edge between App Component and Sidebar Navigation Component.
  const { authUser: currentUser, handleLogout } = useAuthContext()
  const [activePage, setActivePage] = useState('princess-kaguya')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [openCategorySlug, setOpenCategorySlug] = useState(() =>
    getCookie(OPEN_CATEGORY_COOKIE)
  )
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 })
  const avatarMenuRef = useRef(null)
  const avatarBtnRef = useRef(null)
  const hasMountedRef = useRef(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const applyCollapsedState = useCallback(
    (collapsed) => {
      setIsCollapsed(collapsed)
      document.documentElement.style.setProperty(
        '--sidebar-current-width',
        collapsed ? '0px' : '260px'
      )
      onCollapseChange?.(collapsed)
    },
    [onCollapseChange]
  )

  const handleCategoryToggle = (categorySlug) => {
    setOpenCategorySlug((prevSlug) => {
      const nextSlug = prevSlug === categorySlug ? null : categorySlug

      if (nextSlug) {
        setCookie(OPEN_CATEGORY_COOKIE, nextSlug)
      } else {
        setCookie(OPEN_CATEGORY_COOKIE, '')
      }

      return nextSlug
    })
  }

  const handlePageSelect = (pageSlug, categorySlug) => {
    setActivePage(pageSlug)
    if (categorySlug === 'characters') {
      navigate(`/wiki/characters/${pageSlug}`)
    } else if (categorySlug === 'soundtrack') {
      navigate(`/wiki/soundtrack/${pageSlug}`)
    } else {
      navigate(`/wiki/${pageSlug}`)
    }
  }

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const data = await getSidebar()
        setCategories(data || [])
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error)
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchSidebarData()
  }, [])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    applyCollapsedState(true)
  }, [pathname, applyCollapsedState])

  const handleToggle = () => {
    applyCollapsedState(!isCollapsed)
  }

  const handleAuthNavigate = () => {
    navigate('/auth')
    applyCollapsedState(true)
  }

  const handleLogoutClick = () => {
    handleLogout()
    setAvatarMenuOpen(false)
    navigate('/auth')
    applyCollapsedState(true)
  }

  const handleAvatarMenuNavigate = (path) => {
    setAvatarMenuOpen(false)
    navigate(path)
    applyCollapsedState(true)
  }

  // Compute flyout position when menu opens
  const toggleAvatarMenu = useCallback(() => {
    setAvatarMenuOpen((prev) => {
      const next = !prev
      if (next && avatarBtnRef.current) {
        const rect = avatarBtnRef.current.getBoundingClientRect()
        setFlyoutPos({
          top: rect.top,
          left: rect.right + 10,
        })
      }
      return next
    })
  }, [])

  // Close avatar menu on click outside
  useEffect(() => {
    if (!avatarMenuOpen) return
    const handleClickOutside = (e) => {
      if (
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(e.target) &&
        avatarBtnRef.current &&
        !avatarBtnRef.current.contains(e.target)
      ) {
        setAvatarMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [avatarMenuOpen])

  return (
    <>
      <button
        className={`sidebar-toggle fixed top-5 z-[200] flex h-7 w-7 items-center justify-center rounded-md border border-solid border-[rgba(180,140,255,0.15)] bg-[#0a0b14] text-[#8b7da8] [transition:left_0.35s_cubic-bezier(0.4,0,0.2,1),color_0.2s,background_0.2s] hover:bg-[rgba(192,132,252,0.1)] hover:text-[#c084fc] ${isCollapsed ? 'collapsed-btn left-3' : 'left-[calc(var(--sidebar-current-width)+12px)]'}`}
        onClick={handleToggle}
        title={isCollapsed ? 'Open sidebar' : 'Close sidebar'}
      >
        <div className="toggle-bars flex flex-col gap-1">
          <span className={`block h-[1.5px] rounded-full bg-current [transition:transform_0.25s,opacity_0.25s,width_0.25s] [transform-origin:left_center] ${isCollapsed ? 'w-[10px]' : 'w-[14px]'}`} />
          <span className="block h-[1.5px] w-[14px] rounded-full bg-current [transition:transform_0.25s,opacity_0.25s,width_0.25s] [transform-origin:left_center]" />
          <span className={`block h-[1.5px] rounded-full bg-current [transition:transform_0.25s,opacity_0.25s,width_0.25s] [transform-origin:left_center] ${isCollapsed ? 'w-[10px]' : 'w-[14px]'}`} />
        </div>
      </button>

      <aside className={`cpk-sidebar fixed bottom-0 left-0 top-0 z-[100] flex flex-col overflow-hidden border-r border-solid border-r-[rgba(180,140,255,0.15)] font-['Source_Sans_3',sans-serif] [background-color:#0a0b14] [background-image:radial-gradient(ellipse_at_20%_0%,rgba(192,132,252,0.06)_0%,transparent_60%),radial-gradient(ellipse_at_80%_100%,rgba(103,232,249,0.04)_0%,transparent_60%)] [transition:width_0.35s_cubic-bezier(0.4,0,0.2,1)] before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-sidebar-stars before:content-[''] ${isCollapsed ? 'collapsed w-0' : 'w-[260px]'}`}>
        <button
          className="sidebar-logo relative z-[1] flex shrink-0 appearance-none flex-col items-center gap-[10px] border-0 border-b border-solid border-b-[rgba(180,140,255,0.15)] bg-transparent px-4 pb-4 pt-5 [font:inherit] text-inherit [transition:opacity_0.2s_ease] hover:opacity-85"
          onClick={() => navigate('/')}
          title="Go to home"
        >
          <div className="logo-image-wrap relative w-full max-w-[200px] after:absolute after:-inset-1 after:-z-[1] after:rounded-[6px] after:bg-[linear-gradient(135deg,rgba(192,132,252,0.2),rgba(103,232,249,0.15))] after:blur-[8px] after:content-['']">
            <img
              src={LOGO_URL}
              alt="Cosmic Princess Kaguya"
              className="logo-img block h-auto w-full object-contain [filter:drop-shadow(0_0_12px_rgba(192,132,252,0.4))]"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
          <span className="logo-subtitle text-center font-['Inter',sans-serif] text-[8px] uppercase tracking-[0.25em] text-[#4a4060]">Fan Wiki</span>
        </button>

        <div className="wiki-label relative z-[1] shrink-0 px-4 pb-2 pt-[14px]">
          <span className="font-['Inter',sans-serif] text-[9px] uppercase tracking-[0.3em] text-[#c084fc] opacity-80">Navigation</span>
        </div>

        {!isCollapsed && (
          <div className="pb-3">
            <LiveUserCount />
          </div>
        )}

        <nav className="sidebar-nav relative z-[1] flex-1 overflow-x-hidden overflow-y-auto px-[10px] pb-4 [scrollbar-color:rgba(192,132,252,0.2)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(192,132,252,0.25)]">
          {loading ? (
            <div className="p-4 text-[14px] text-[#999]">
              Loading...
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-[14px] text-[#999]">
              No categories found
            </div>
          ) : (
            categories.map((category, i) => (
              <div key={category._id}>
                <CategoryItem
                  category={category}
                  activePage={activePage}
                  onPageSelect={handlePageSelect}
                  isOpen={openCategorySlug === category.slug}
                  onToggle={handleCategoryToggle}
                  onNavigate={navigate}
                />
                {i < categories.length - 1 && i % 2 === 1 && (
                  <div className="nav-divider h-px bg-[rgba(180,140,255,0.15)] mx-[10px] my-2" />
                )}
              </div>
            ))
          )}
        </nav>

        <div className="sidebar-footer relative z-[1] grid shrink-0 gap-3 border-t border-solid border-t-[rgba(180,140,255,0.15)] px-4 py-3">
          <div className="sidebar-avatar-area relative flex items-center">
            {currentUser ? (
              <>
                <button
                  ref={avatarBtnRef}
                  className={`sidebar-avatar-btn relative h-9 w-9 shrink-0 rounded-full border-2 border-solid border-[rgba(192,132,252,0.3)] bg-transparent p-0 [transition:border-color_0.3s_ease,box-shadow_0.3s_ease,transform_0.2s_ease] hover:scale-[1.08] hover:border-[#c084fc] hover:shadow-[0_0_12px_rgba(192,132,252,0.35),0_0_24px_rgba(192,132,252,0.15)] ${avatarMenuOpen ? 'active scale-[1.08] border-[#c084fc] shadow-[0_0_12px_rgba(192,132,252,0.35),0_0_24px_rgba(192,132,252,0.15)]' : ''}`}
                  onClick={toggleAvatarMenu}
                  title={currentUser.username}
                >
                  <img
                    src={currentUser.avatar?.url || DEFAULT_AVATAR}
                    alt={currentUser.username}
                    className="sidebar-avatar-img block h-full w-full rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = DEFAULT_AVATAR
                    }}
                  />
                  <span className="sidebar-avatar-status absolute bottom-0 right-0 h-[10px] w-[10px] rounded-full border-2 border-solid border-[#0a0b14] bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                </button>

                {createPortal(
                  <div
                    ref={avatarMenuRef}
                    className={`sidebar-avatar-flyout fixed z-[9999] flex flex-row items-stretch gap-0.5 whitespace-nowrap rounded-xl border border-solid border-[rgba(192,132,252,0.15)] bg-[rgba(14,16,28,0.92)] p-[5px] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(192,132,252,0.08),inset_0_1px_0_rgba(255,255,255,0.04)] [backdrop-filter:blur(16px)] [-webkit-backdrop-filter:blur(16px)] [transition:opacity_0.22s_ease,transform_0.22s_cubic-bezier(0.4,0,0.2,1)] ${
                      avatarMenuOpen ? 'open pointer-events-auto translate-x-0 scale-100 opacity-100' : 'pointer-events-none -translate-x-2 scale-[0.95] opacity-0'
                    }`}
                    style={{
                      top: `${flyoutPos.top}px`,
                      left: `${flyoutPos.left}px`,
                    }}
                  >
                    <button
                      className="flyout-item flex flex-col items-center justify-center gap-1 whitespace-nowrap rounded-lg border-0 border-solid bg-transparent px-[14px] py-2 font-['Inter',sans-serif] text-[9px] font-medium uppercase tracking-[0.06em] text-[#8b7da8] [transition:background_0.2s_ease,color_0.2s_ease,transform_0.15s_ease] hover:-translate-y-px hover:bg-[rgba(192,132,252,0.12)] hover:text-[#c084fc]"
                      onClick={() => handleAvatarMenuNavigate('/profile')}
                    >
                      <User size={14} strokeWidth={1.8} />
                      <span>Profile</span>
                    </button>
                    <button
                      className="flyout-item flex flex-col items-center justify-center gap-1 whitespace-nowrap rounded-lg border-0 border-solid bg-transparent px-[14px] py-2 font-['Inter',sans-serif] text-[9px] font-medium uppercase tracking-[0.06em] text-[#8b7da8] [transition:background_0.2s_ease,color_0.2s_ease,transform_0.15s_ease] hover:-translate-y-px hover:bg-[rgba(192,132,252,0.12)] hover:text-[#c084fc]"
                      onClick={() => handleAvatarMenuNavigate('/bookmarks')}
                    >
                      <Bookmark size={14} strokeWidth={1.8} />
                      <span>Bookmarks</span>
                    </button>
                    {currentUser.role === ROLES.ADMIN && (
                      <button
                        className="flyout-item flex flex-col items-center justify-center gap-1 whitespace-nowrap rounded-lg border-0 border-solid bg-transparent px-[14px] py-2 font-['Inter',sans-serif] text-[9px] font-medium uppercase tracking-[0.06em] text-[#8b7da8] [transition:background_0.2s_ease,color_0.2s_ease,transform_0.15s_ease] hover:-translate-y-px hover:bg-[rgba(192,132,252,0.12)] hover:text-[#c084fc]"
                        onClick={() => handleAvatarMenuNavigate('/admin')}
                      >
                        <Shield size={14} strokeWidth={1.8} />
                        <span>Admin</span>
                      </button>
                    )}
                    <div className="flyout-divider mx-0.5 my-1 w-px self-stretch bg-[rgba(192,132,252,0.15)]" />
                    <button
                      className="flyout-item flyout-item--danger flex flex-col items-center justify-center gap-1 whitespace-nowrap rounded-lg border-0 border-solid bg-transparent px-[14px] py-2 font-['Inter',sans-serif] text-[9px] font-medium uppercase tracking-[0.06em] text-[#8b7da8] [transition:background_0.2s_ease,color_0.2s_ease,transform_0.15s_ease] hover:-translate-y-px hover:bg-[rgba(239,68,68,0.12)] hover:text-[#f87171]"
                      onClick={handleLogoutClick}
                    >
                      <LogOut size={14} strokeWidth={1.8} />
                      <span>Log Out</span>
                    </button>
                  </div>,
                  document.body
                )}
              </>
            ) : (
              <button
                className="sidebar-login-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-solid border-[rgba(103,232,249,0.2)] bg-[rgba(103,232,249,0.06)] text-[#8b7da8] [transition:all_0.25s_ease] hover:scale-[1.08] hover:border-[rgba(103,232,249,0.4)] hover:bg-[rgba(103,232,249,0.12)] hover:text-[#67e8f9] hover:shadow-[0_0_10px_rgba(103,232,249,0.2)]"
                onClick={handleAuthNavigate}
                title="Login / Register"
              >
                <LogIn size={15} strokeWidth={1.8} />
              </button>
            )}
          </div>

          <div className="sidebar-footer-row flex items-center gap-2">
            <button
              className={`dragon-toggle-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-solid border-[#4a4060] bg-transparent p-0 text-[#8b7da8] [transition:all_0.3s_ease] hover:border-[#c084fc] hover:bg-[rgba(192,132,252,0.1)] hover:text-[#c084fc] ${dragonCursorEnabled ? 'active border-[#c084fc] bg-[rgba(192,132,252,0.15)] text-[#c084fc] shadow-[0_0_8px_rgba(192,132,252,0.3)]' : ''}`}
              onClick={() => {
                console.log(
                  'clicked, window.toggleDragonCursor exists?',
                  typeof window.toggleDragonCursor
                )
                if (
                  typeof window !== 'undefined' &&
                  window.toggleDragonCursor
                ) {
                  window.toggleDragonCursor()
                }
              }}
              title={
                dragonCursorEnabled
                  ? 'Disable dragon cursor'
                  : 'Enable dragon cursor'
              }
              aria-pressed={dragonCursorEnabled}
            >
              <Wand2 size={16} strokeWidth={2} />
            </button>
            <div className="footer-orb h-2 w-2 shrink-0 rounded-full bg-[#fbbf24] shadow-[0_0_8px_#fbbf24] animate-sidebar-pulse-orb" />
            <span className="footer-text font-['Source_Sans_3',sans-serif] text-[10px] tracking-[0.05em] text-[#4a4060]">CPK Wiki</span>
          </div>
        </div>
      </aside>
    </>
  )
}
