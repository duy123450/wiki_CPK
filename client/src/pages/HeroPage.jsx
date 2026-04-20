/* eslint-disable react-hooks/purity */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getMovieInfo } from "../services/api";
import "../styles/HeroPage.css";

// ─── fetch hook ───────────────────────────────────────────────────────────────
function useMovieInfo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMovieInfo()
      .then((movie) => setData(movie))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

// ─── stars ────────────────────────────────────────────────────────────────────
function Stars() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2.5 + 0.5,
    delay: `${Math.random() * 6}s`,
    dur: `${Math.random() * 4 + 3}s`,
  }));

  return (
    <div className="hero-stars" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="hero-star"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.dur,
          }}
        />
      ))}
    </div>
  );
}

// ─── shimmer ──────────────────────────────────────────────────────────────────
function Shimmer() {
  return (
    <div className="hero-shimmer">
      <div className="shimmer-bar w-60" />
      <div className="shimmer-bar w-40" />
      <div className="shimmer-bar w-52" />
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function HeroPage() {
  const { data: movie, loading, error } = useMovieInfo();
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);

  const videoSrc = Array.isArray(movie?.heroVideo)
    ? movie.heroVideo[0]?.url
    : movie?.heroVideo?.url;
  const title = movie?.title ?? "超かぐや姫";
  const tagline = movie?.tagline ?? "A tale of the moon and a heart's desire";
  const releaseDate = movie?.details?.releaseDate
    ? new Date(movie.details.releaseDate).getFullYear()
    : null;
  const studio = movie?.details?.studio ?? null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    video.muted = true;
    video.load();
    video.play().catch(() => {});
  }, [videoSrc]);

  return (
    <section className="hero-root">
      {/* ── video ── */}
      {videoSrc ? (
        <div className="hero-video-wrap">
          <video
            ref={videoRef}
            className={`hero-video${videoReady ? " ready" : ""}`}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={movie?.poster?.url}
            onCanPlay={() => setVideoReady(true)}
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="hero-fallback-bg" />
      )}

      <div className="hero-overlay" />
      <div className="hero-vignette" />
      <Stars />

      {/* ── content ── */}
      <div className="hero-content">
        {loading ? (
          <Shimmer />
        ) : error ? (
          <p className="hero-error">Failed to load movie data.</p>
        ) : (
          <>
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              Fan Wiki · Now Showing
            </div>

            <h1 className="hero-title">{title}</h1>

            <hr className="hero-rule" />

            {tagline && <p className="hero-tagline">"{tagline}"</p>}

            {(releaseDate || studio) && (
              <div className="hero-meta">
                {releaseDate && (
                  <span className="hero-meta-chip">{releaseDate}</span>
                )}
                {releaseDate && studio && <span className="hero-meta-sep" />}
                {studio && <span className="hero-meta-chip">{studio}</span>}
              </div>
            )}

            <div className="hero-actions">
              <Link
                to="/wiki/princess-kaguya"
                className="hero-btn hero-btn-primary"
              >
                Explore Wiki
              </Link>
              <Link
                to="/wiki/chou-kaguya-hime-overview"
                className="hero-btn hero-btn-secondary"
              >
                Movie Info
              </Link>
            </div>
          </>
        )}
      </div>

      {/* ── scroll cue ── */}
      <div className="hero-scroll-cue" aria-hidden="true">
        <div className="hero-scroll-line" />
        <span className="hero-scroll-text">Scroll</span>
      </div>
    </section>
  );
}
