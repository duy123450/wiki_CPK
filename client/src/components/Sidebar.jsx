import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { getSidebar } from "../services/api";
import "../styles/Sidebar.css";

const LOGO_URL =
  "https://res.cloudinary.com/dvlaoxjzi/image/upload/q_auto/f_auto/v1775613442/661386943_1497013225103051_5810917340196605647_n_ta4cju.jpg";

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
  isOpen,
  onToggle,
}) {
  const Icon = ICON_MAP[category.icon] || BookOpen;
  const hasActivePage = category.pages?.some((p) => p.slug === activePage);

  return (
    <div className={`category-item ${hasActivePage ? "has-active" : ""}`}>
      <button
        className={`category-header ${isOpen ? "open" : ""}`}
        onClick={() => onToggle(category._id)}
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
              onClick={() => onPageSelect(page.slug)}
            >
              <span className="page-dot" />
              {page.title}
            </button>
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
}) {
  const [activePage, setActivePage] = useState("princess-kaguya");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCategoryId, setOpenCategoryId] = useState(null);
  const navigate = useNavigate();

  const handleCategoryToggle = (categoryId) => {
    setOpenCategoryId((prevId) => (prevId === categoryId ? null : categoryId));
  };

  const handlePageSelect = (pageSlug) => {
    setActivePage(pageSlug);
    // Navigate to the wiki page
    navigate(`/wiki/${pageSlug}`);
  };

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        console.log("Fetching sidebar data...");
        console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL);
        const data = await getSidebar();
        console.log("Sidebar data received:", data);
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

  const handleToggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    document.documentElement.style.setProperty(
      "--sidebar-current-width",
      next ? "0px" : "260px",
    );
    onCollapseChange?.(next);
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
                  isOpen={openCategoryId === category._id}
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
          <span className="footer-text">超かぐや姫 · CPK Wiki</span>
        </div>
      </aside>
    </>
  );
}
