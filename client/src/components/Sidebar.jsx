import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { getSidebar } from "../services/api";
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
  return target ? decodeURIComponent(target.split("=").slice(1).join("=")) : null;
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

export default function Sidebar({
  onCollapseChange,
  onDragonCursorToggle,
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
    navigate("/auth");
    applyCollapsedState(true);
  };

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
          <div className="sidebar-auth-panel">
            <button
              className="sidebar-auth-btn"
              onClick={handleAuthNavigate}
              title={currentUser ? "Open account" : "Open login and register"}
            >
              <LogIn size={15} strokeWidth={1.8} />
              <span className="sidebar-auth-copy">
                {currentUser ? currentUser.username : "Login / Register"}
              </span>
            </button>
            {currentUser && (
              <button
                className="sidebar-auth-btn sidebar-auth-btn--ghost"
                onClick={handleLogoutClick}
                title="Log out"
              >
                <LogOut size={15} strokeWidth={1.8} />
                <span className="sidebar-auth-copy">Log Out</span>
              </button>
            )}
          </div>

          <div className="sidebar-footer-row">
            <button
              className={`dragon-toggle-btn ${dragonCursorEnabled ? "active" : ""}`}
              onClick={onDragonCursorToggle}
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
