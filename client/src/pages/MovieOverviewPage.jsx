/* eslint-disable react-hooks/purity */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getMovieInfo } from "../services/api";
import "../styles/MovieOverviewPage.css";

// ─── Floating particles ───────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    delay: `${Math.random() * 8}s`,
    dur: `${Math.random() * 6 + 4}s`,
    drift: Math.random() * 60 - 30,
  }));
  return (
    <div className="mov-particles" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="mov-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.dur,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div className="mov-stat" style={{ "--accent": accent }}>
      <span className="mov-stat-value">{value || "—"}</span>
      <span className="mov-stat-label">{label}</span>
    </div>
  );
}

// ─── Scroll reveal hook ───────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`mov-reveal ${visible ? "mov-reveal--visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────
function Shimmer({ w, h }) {
  return <div className="mov-shimmer" style={{ width: w, height: h }} />;
}

// ─── Rating ring ──────────────────────────────────────────────────────────────
function RatingRing({ rating }) {
  const pct = (rating / 10) * 100;
  const circ = 2 * Math.PI * 44;
  return (
    <div className="mov-rating-ring">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="44" className="mov-ring-bg" />
        <circle
          cx="55"
          cy="55"
          r="44"
          className="mov-ring-fill"
          strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          transform="rotate(-90 55 55)"
        />
      </svg>
      <div className="mov-rating-inner">
        <span className="mov-rating-num">{rating?.toFixed(1) ?? "—"}</span>
        <span className="mov-rating-denom">/10</span>
      </div>
    </div>
  );
}

// ─── Format runtime ───────────────────────────────────────────────────────────
function formatRuntime(minutes) {
  if (!minutes) return null;
  const mins = parseInt(minutes, 10);
  if (isNaN(mins)) return minutes;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours === 0) return `${remainingMins}m`;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MovieOverviewPage({ sidebarCollapsed }) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    getMovieInfo()
      .then(setMovie)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const releaseYear = movie?.details?.releaseDate
    ? new Date(movie.details.releaseDate).getFullYear()
    : null;
  const releaseFormatted = movie?.details?.releaseDate
    ? new Date(movie.details.releaseDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className={`mov-root ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Particles />

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <section className="mov-hero">
        <div className="mov-hero-bg">
          {movie?.poster?.[2]?.url && (
            <img
              src={movie.poster[2].url}
              alt=""
              className={`mov-hero-bg-img ${imgLoaded ? "loaded" : ""}`}
              onLoad={() => setImgLoaded(true)}
              aria-hidden="true"
            />
          )}
          <div className="mov-hero-scrim" />
        </div>

        <div className="mov-hero-content">
          {/* Poster */}
          <div className="mov-poster-wrap">
            {loading ? (
              <Shimmer w="200px" h="300px" />
            ) : movie?.poster?.[1]?.url ? (
              <img
                src={movie.poster[1].url}
                alt={`${movie.title} poster`}
                className="mov-poster"
              />
            ) : (
              <div className="mov-poster-placeholder">
                <span>超かぐや姫</span>
              </div>
            )}
            <div className="mov-poster-glow" />
          </div>

          {/* Title block */}
          <div className="mov-hero-text">
            <p className="mov-eyebrow">
              <span className="mov-eyebrow-dot" />
              Fan Wiki · Movie Overview
            </p>

            {loading ? (
              <>
                <Shimmer w="320px" h="48px" />
                <Shimmer w="200px" h="20px" />
              </>
            ) : error ? (
              <p className="mov-error">Could not load movie data.</p>
            ) : (
              <>
                <h1 className="mov-title">{movie?.title}</h1>
                {movie?.tagline && (
                  <p className="mov-tagline">"{movie.tagline}"</p>
                )}
                <div className="mov-chips">
                  {releaseYear && (
                    <span className="mov-chip">{releaseYear}</span>
                  )}
                  {movie?.details?.runtime && (
                    <span className="mov-chip">
                      {formatRuntime(movie.details.runtime)}
                    </span>
                  )}
                  {movie?.details?.studio && (
                    <span className="mov-chip">{movie.details.studio}</span>
                  )}
                </div>

                <div className="mov-hero-actions">
                  {movie?.details?.officialWebsite && (
                    <a
                      href={movie.details.officialWebsite}
                      className="mov-btn mov-btn--primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Official Site ↗
                    </a>
                  )}
                  <Link
                    to="/wiki/characters"
                    className="mov-btn mov-btn--ghost"
                  >
                    Meet the Cast
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="mov-body">
        {/* Stats row */}
        <Reveal delay={0}>
          <div className="mov-stats-row">
            <StatCard
              label="Release"
              value={releaseFormatted}
              accent="var(--mov-gold)"
            />
            <StatCard
              label="Runtime"
              value={formatRuntime(movie?.details?.runtime)}
              accent="var(--mov-teal)"
            />
            <StatCard
              label="Studio"
              value={movie?.details?.studio}
              accent="var(--mov-purple)"
            />
            <StatCard
              label="Director"
              value={movie?.details?.director}
              accent="var(--mov-rose)"
            />
          </div>
        </Reveal>

        {/* Synopsis + Rating */}
        <div className="mov-grid-two">
          <Reveal delay={80} className="mov-grid-two__main">
            <div className="mov-section-card">
              <header className="mov-section-header">
                <span className="mov-section-ornament" />
                <h2 className="mov-section-title">Synopsis</h2>
              </header>
              {loading ? (
                <div className="mov-syn-shimmer">
                  <Shimmer w="100%" h="16px" />
                  <Shimmer w="90%" h="16px" />
                  <Shimmer w="95%" h="16px" />
                  <Shimmer w="80%" h="16px" />
                </div>
              ) : (
                <p className="mov-synopsis">
                  {movie?.synopsis ?? "No synopsis available."}
                </p>
              )}
            </div>
          </Reveal>

          <Reveal delay={160} className="mov-grid-two__side">
            <div className="mov-section-card mov-rating-card">
              <header className="mov-section-header">
                <span className="mov-section-ornament" />
                <h2 className="mov-section-title">Rating</h2>
              </header>
              {loading ? (
                <Shimmer w="110px" h="110px" />
              ) : (
                <RatingRing rating={movie?.rating} />
              )}
              <p className="mov-rating-sub">Fan & critic aggregate</p>
            </div>
          </Reveal>
        </div>

        {/* Production Details */}
        <Reveal delay={120}>
          <div className="mov-section-card">
            <header className="mov-section-header">
              <span className="mov-section-ornament" />
              <h2 className="mov-section-title">Production Details</h2>
            </header>
            {loading ? (
              <Shimmer w="100%" h="80px" />
            ) : (
              <dl className="mov-details-grid">
                {[
                  ["Title", movie?.title],
                  ["Tagline", movie?.tagline],
                  ["Release Date", releaseFormatted],
                  ["Runtime", movie?.details?.runtime],
                  ["Studio", movie?.details?.studio],
                  ["Director", movie?.details?.director],
                  ["Official Website", movie?.details?.officialWebsite],
                ].map(([label, val]) =>
                  val ? (
                    <div key={label} className="mov-detail-row">
                      <dt className="mov-detail-label">{label}</dt>
                      <dd className="mov-detail-value">
                        {label === "Official Website" ? (
                          <a
                            href={val}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mov-detail-link"
                          >
                            {val} ↗
                          </a>
                        ) : label === "Runtime" ? (
                          formatRuntime(val)
                        ) : (
                          val
                        )}
                      </dd>
                    </div>
                  ) : null,
                )}
              </dl>
            )}
          </div>
        </Reveal>

        {/* Explore more */}
        <Reveal delay={200}>
          <div className="mov-explore">
            <h2 className="mov-explore-title">Explore the Wiki</h2>
            <p className="mov-explore-sub">
              Dive deeper into the world of 超かぐや姫
            </p>
            <div className="mov-explore-cards">
              {[
                {
                  href: "/wiki/characters",
                  label: "Characters",
                  kana: "人物",
                  icon: "✦",
                },
                {
                  href: "/wiki/soundtrack",
                  label: "Soundtrack",
                  kana: "音楽",
                  icon: "♪",
                },
                {
                  href: "/wiki/lore",
                  label: "Lore & World",
                  kana: "世界観",
                  icon: "⋆",
                },
              ].map((card) => (
                <a
                  key={card.href}
                  href={card.href}
                  className="mov-explore-card"
                >
                  <span className="mov-explore-icon">{card.icon}</span>
                  <span className="mov-explore-kana">{card.kana}</span>
                  <span className="mov-explore-card-label">{card.label}</span>
                  <span className="mov-explore-arrow">→</span>
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
