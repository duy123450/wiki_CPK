import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  BookOpen,
  Music,
  Users,
  Film,
  Scroll,
  Star,
  Map,
  Sparkles,
  Wand2,
  LogIn,
  LogOut,
  User,
  Bookmark,
  Shield,
} from "lucide-react";
import { getSidebar } from "../services/api";
import LiveUserCount from "./LiveUserCount";
import "../styles/Sidebar.css";

const LOGO_URL =
  "https://res.cloudinary.com/dvlaoxjzi/image/upload/q_auto/f_auto/v1775613442/661386943_1497013225103051_5810917340196605647_n_ta4cju.jpg";
const MOVIE_EXTERNAL_LINKS = [
  {
    title: "Xem Phim",
    url: "https://animevietsub.bz/phim/kaguya-cong-chua-vu-tru-a5875/xem-phim-111317.html",
  },
  {
    title: "Đọc Light Novel",
    url: "https://ln.hako.vn/truyen/24840-kaguya-cong-chua-vu-tru",
  },
];
const OPEN_CATEGORY_COOKIE = "cpkSidebarOpenCategory";

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const target = cookies.find((entry) => entry.startsWith(`${name}=`));
  return target
    ? decodeURIComponent(target.split("=").slice(1).join("="))
    : null;
}

function setCookie(name, value, maxAgeSeconds = 60 * 60 * 24 * 30) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

const ICON_MAP = {
  users: Users,
  music: Music,
  film: Film,
  "book-open": BookOpen,
  scroll: Scroll,
  star: Star,
  map: Map,
  sparkles: Sparkles,
  "file-text": BookOpen,
};

function CategoryItem({
  category,
  activePage,
  onPageSelect,
  onExternalLinkClick,
  isOpen,
  onToggle,
}) {
  const Icon = ICON_MAP[category.icon] || BookOpen;
  const hasActivePage = category.pages?.some((p) => p.slug === activePage);
  const hasMovieLinks = category.slug === "movie";

  return (
    <div className={`category-item ${hasActivePage ? "has-active" : ""}`}>
      <button
        className={`category-header ${isOpen ? "open" : ""}`}
        onClick={() => onToggle(category.slug)}
        aria-expanded={isOpen}
      >
        <span className="category-icon-wrap">
          <Icon size={14} strokeWidth={1.8} />
        </span>
        <span className="category-name">{category.name}</span>
        <ChevronDown
          size={12}
          className={`chevron ${isOpen ? "rotated" : ""}`}
        />
      </button>

      <div className={`pages-list ${isOpen ? "expanded" : ""}`}>
        <div className="pages-inner">
          {category.pages?.map((page) => (
            <button
              key={page.slug}
              className={`page-link ${activePage === page.slug ? "active" : ""}`}
              onClick={() => onPageSelect(page.slug, category.slug)}
            >
              <span className="page-dot" />
              {page.title}
            </button>
          ))}
          {hasMovieLinks &&
            MOVIE_EXTERNAL_LINKS.map((link) => (
              <a
                key={link.url}
                className="page-link external-page-link"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onExternalLinkClick(category.slug)}
              >
                <span className="page-dot" />
                {link.title}
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dvlaoxjzi/image/upload/v1775612971/default-avatar-photo-placeholder-profile-icon-vector_c0iz1k.webp";

export default function Sidebar({
  onCollapseChange,
  dragonCursorEnabled,
  currentUser,
  onLogout,
}) {
  const [activePage, setActivePage] = useState("princess-kaguya");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCategorySlug, setOpenCategorySlug] = useState(() =>
    getCookie(OPEN_CATEGORY_COOKIE),
  );
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 });
  const avatarMenuRef = useRef(null);
  const avatarBtnRef = useRef(null);
  const hasMountedRef = useRef(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const applyCollapsedState = (collapsed) => {
    setIsCollapsed(collapsed);
    document.documentElement.style.setProperty(
      "--sidebar-current-width",
      collapsed ? "0px" : "260px",
    );
    onCollapseChange?.(collapsed);
  };

  const handleCategoryToggle = (categorySlug) => {
    setOpenCategorySlug((prevSlug) => {
      const nextSlug = prevSlug === categorySlug ? null : categorySlug;

      if (nextSlug) {
        setCookie(OPEN_CATEGORY_COOKIE, nextSlug);
      } else {
        setCookie(OPEN_CATEGORY_COOKIE, "");
      }

      return nextSlug;
    });
  };

  const handlePageSelect = (pageSlug, categorySlug) => {
    setActivePage(pageSlug);
    if (categorySlug === "characters") {
      navigate(`/wiki/characters/${pageSlug}`);
    } else {
      navigate(`/wiki/${pageSlug}`);
    }
  };

  const handleExternalLinkClick = (categorySlug) => {
    if (categorySlug) {
      setCookie(OPEN_CATEGORY_COOKIE, categorySlug);
      setOpenCategorySlug(categorySlug);
    }
    applyCollapsedState(true);
  };

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const data = await getSidebar();
        setCategories(data || []);
      } catch (error) {
        console.error("Failed to fetch sidebar data:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSidebarData();
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    applyCollapsedState(true);
  }, [pathname]);

  const handleToggle = () => {
    applyCollapsedState(!isCollapsed);
  };

  const handleAuthNavigate = () => {
    navigate("/auth");
    applyCollapsedState(true);
  };

  const handleLogoutClick = () => {
    onLogout?.();
    setAvatarMenuOpen(false);
    navigate("/auth");
    applyCollapsedState(true);
  };

  const handleAvatarMenuNavigate = (path) => {
    setAvatarMenuOpen(false);
    navigate(path);
    applyCollapsedState(true);
  };

  // Compute flyout position when menu opens
  const toggleAvatarMenu = useCallback(() => {
    setAvatarMenuOpen((prev) => {
      const next = !prev;
      if (next && avatarBtnRef.current) {
        const rect = avatarBtnRef.current.getBoundingClientRect();
        setFlyoutPos({
          top: rect.top,
          left: rect.right + 10,
        });
      }
      return next;
    });
  }, []);

  // Close avatar menu on click outside
  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handleClickOutside = (e) => {
      if (
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(e.target) &&
        avatarBtnRef.current &&
        !avatarBtnRef.current.contains(e.target)
      ) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarMenuOpen]);

  return (
    <>
      <button
        className={`sidebar-toggle ${isCollapsed ? "collapsed-btn" : ""}`}
        onClick={handleToggle}
        title={isCollapsed ? "Open sidebar" : "Close sidebar"}
      >
        <div className="toggle-bars">
          <span />
          <span />
          <span />
        </div>
      </button>

      <aside className={`cpk-sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <button
          className="sidebar-logo"
          onClick={() => navigate("/")}
          title="Go to home"
        >
          <div className="logo-image-wrap">
            <img
              src={LOGO_URL}
              alt="Cosmic Princess Kaguya"
              className="logo-img"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          <span className="logo-subtitle">Fan Wiki</span>
        </button>

        <div className="wiki-label">
          <span>Navigation</span>
        </div>

        {!isCollapsed && (
          <div style={{ paddingBottom: "12px" }}>
            <LiveUserCount />
          </div>
        )}

        <nav className="sidebar-nav">
          {loading ? (
            <div style={{ padding: "16px", color: "#999", fontSize: "14px" }}>
              Loading...
            </div>
          ) : categories.length === 0 ? (
            <div style={{ padding: "16px", color: "#999", fontSize: "14px" }}>
              No categories found
            </div>
          ) : (
            categories.map((category, i) => (
              <div key={category._id}>
                <CategoryItem
                  category={category}
                  activePage={activePage}
                  onPageSelect={handlePageSelect}
                  onExternalLinkClick={handleExternalLinkClick}
                  isOpen={openCategorySlug === category.slug}
                  onToggle={handleCategoryToggle}
                />
                {i < categories.length - 1 && i % 2 === 1 && (
                  <div className="nav-divider" />
                )}
              </div>
            ))
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-avatar-area">
            {currentUser ? (
              <>
                <button
                  ref={avatarBtnRef}
                  className={`sidebar-avatar-btn ${avatarMenuOpen ? "active" : ""}`}
                  onClick={toggleAvatarMenu}
                  title={currentUser.username}
                >
                  <img
                    src={currentUser.avatar?.url || DEFAULT_AVATAR}
                    alt={currentUser.username}
                    className="sidebar-avatar-img"
                    onError={(e) => {
                      e.target.src = DEFAULT_AVATAR;
                    }}
                  />
                  <span className="sidebar-avatar-status" />
                </button>

                {createPortal(
                  <div
                    ref={avatarMenuRef}
                    className={`sidebar-avatar-flyout ${
                      avatarMenuOpen ? "open" : ""
                    }`}
                    style={{
                      top: `${flyoutPos.top}px`,
                      left: `${flyoutPos.left}px`,
                    }}
                  >
                    <button
                      className="flyout-item"
                      onClick={() => handleAvatarMenuNavigate("/profile")}
                    >
                      <User size={14} strokeWidth={1.8} />
                      <span>Profile</span>
                    </button>
                    <button
                      className="flyout-item"
                      onClick={() => handleAvatarMenuNavigate("/bookmarks")}
                    >
                      <Bookmark size={14} strokeWidth={1.8} />
                      <span>Bookmarks</span>
                    </button>
                    {(currentUser.role === "admin" ||
                      currentUser.role === "editor") && (
                      <button
                        className="flyout-item"
                        onClick={() => handleAvatarMenuNavigate("/admin")}
                      >
                        <Shield size={14} strokeWidth={1.8} />
                        <span>Admin</span>
                      </button>
                    )}
                    <div className="flyout-divider" />
                    <button
                      className="flyout-item flyout-item--danger"
                      onClick={handleLogoutClick}
                    >
                      <LogOut size={14} strokeWidth={1.8} />
                      <span>Log Out</span>
                    </button>
                  </div>,
                  document.body,
                )}
              </>
            ) : (
              <button
                className="sidebar-login-btn"
                onClick={handleAuthNavigate}
                title="Login / Register"
              >
                <LogIn size={15} strokeWidth={1.8} />
              </button>
            )}
          </div>

          <div className="sidebar-footer-row">
            <button
              className={`dragon-toggle-btn ${dragonCursorEnabled ? "active" : ""}`}
              onClick={() => {
                console.log(
                  "clicked, window.toggleDragonCursor exists?",
                  typeof window.toggleDragonCursor,
                );
                if (
                  typeof window !== "undefined" &&
                  window.toggleDragonCursor
                ) {
                  window.toggleDragonCursor();
                }
              }}
              title={
                dragonCursorEnabled
                  ? "Disable dragon cursor"
                  : "Enable dragon cursor"
              }
              aria-pressed={dragonCursorEnabled}
            >
              <Wand2 size={16} strokeWidth={2} />
            </button>
            <div className="footer-orb" />
            <span className="footer-text">CPK Wiki</span>
          </div>
        </div>
      </aside>
    </>
  );
}
