import { useState } from "react";
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
} from "lucide-react";
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

const MOCK_CATEGORIES = [
  {
    _id: "1",
    name: "Characters",
    icon: "users",
    slug: "characters",
    pages: [
      { title: "Princess Kaguya", slug: "princess-kaguya" },
      { title: "Yacchiyo", slug: "yacchiyo" },
      { title: "Iroha", slug: "iroha" },
      { title: "Roka", slug: "roka" },
    ],
  },
  {
    _id: "2",
    name: "Lore & World",
    icon: "scroll",
    slug: "lore",
    pages: [
      { title: "Lunar History", slug: "lunar-history" },
      { title: "The Moon Kingdom", slug: "moon-kingdom" },
      { title: "Earth Legends", slug: "earth-legends" },
    ],
  },
  {
    _id: "3",
    name: "Soundtrack",
    icon: "music",
    slug: "soundtrack",
    pages: [
      { title: "Opening Theme", slug: "opening-theme" },
      { title: "Ending Theme", slug: "ending-theme" },
      { title: "Full OST", slug: "full-ost" },
    ],
  },
  {
    _id: "4",
    name: "Film",
    icon: "film",
    slug: "film",
    pages: [
      { title: "Movie Overview", slug: "movie-overview" },
      { title: "Production Notes", slug: "production-notes" },
    ],
  },
  {
    _id: "5",
    name: "Locations",
    icon: "map",
    slug: "locations",
    pages: [
      { title: "The Lunar Palace", slug: "lunar-palace" },
      { title: "Bamboo Forest", slug: "bamboo-forest" },
    ],
  },
];

function CategoryItem({ category, activePage, onPageSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = ICON_MAP[category.icon] || BookOpen;
  const hasActivePage = category.pages?.some((p) => p.slug === activePage);

  return (
    <div className={`category-item ${hasActivePage ? "has-active" : ""}`}>
      <button
        className={`category-header ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
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

export default function Sidebar({ onCollapseChange }) {
  const [activePage, setActivePage] = useState("princess-kaguya");
  const [isCollapsed, setIsCollapsed] = useState(false);

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
        <div className="sidebar-logo">
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
          <span className="logo-subtitle">Official Wiki</span>
        </div>

        <div className="wiki-label">
          <span>Navigation</span>
        </div>

        <nav className="sidebar-nav">
          {MOCK_CATEGORIES.map((category, i) => (
            <div key={category._id}>
              <CategoryItem
                category={category}
                activePage={activePage}
                onPageSelect={setActivePage}
              />
              {i < MOCK_CATEGORIES.length - 1 && i % 2 === 1 && (
                <div className="nav-divider" />
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-orb" />
          <span className="footer-text">超かぐや姫 · CPK Wiki</span>
        </div>
      </aside>
    </>
  );
}
