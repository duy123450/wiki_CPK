import { useEffect, useRef, useState } from "react";
import axios from "axios";

// ─── tiny hook: fetch movie info once ───────────────────────────────────────
function useMovieInfo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("/api/v1/wiki/movie-info")
      .then((res) => setData(res.data.movie))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

// ─── particle sparkles (pure CSS, no canvas) ────────────────────────────────
function Stars() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2.5 + 0.5,
    delay: Math.random() * 6,
    dur: Math.random() * 4 + 3,
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
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── loading shimmer ─────────────────────────────────────────────────────────
function Shimmer() {
  return (
    <div className="hero-shimmer">
      <div className="shimmer-bar w-60" />
      <div className="shimmer-bar w-40" />
      <div className="shimmer-bar w-52" />
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function HeroPage() {
  const { data: movie, loading, error } = useMovieInfo();
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [muted, setMuted] = useState(true);

  const videoSrc = movie?.heroVideo?.url;
  const title = movie?.title ?? "超かぐや姫";
  const tagline = movie?.tagline ?? "A tale of the moon and a heart's desire";
  const releaseDate = movie?.details?.releaseDate
    ? new Date(movie.details.releaseDate).getFullYear()
    : null;
  const studio = movie?.details?.studio ?? null;

  // When data arrives, ensure video plays
  useEffect(() => {
    const video = videoRef.current;
    if (video && videoSrc) {
      video.muted = true; // Chắc chắn là muted
      const promise = video.play();
      
      if (promise !== undefined) {
        promise.catch((error) => {
          // Trình duyệt chặn autoplay
          console.log("Autoplay prevented. User interaction required.");
        });
      }
    }
  }, [videoSrc]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600&family=Lato:ital,wght@0,300;0,400;1,300&display=swap');

        :root {
          --hero-gold: #e8c97a;
          --hero-gold-dim: rgba(232,201,122,0.18);
          --hero-purple: #c084fc;
          --hero-teal: #67e8f9;
          --hero-bg: #05040f;
          --hero-text: #f0e8ff;
          --hero-muted: rgba(240,232,255,0.5);
        }

        /* ── layout ───────────────────────────────── */
        .hero-root {
          position: relative;
          width: 100%;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--hero-bg);
          overflow: hidden;
          font-family: 'Lato', sans-serif;
        }

        /* ── video bg ─────────────────────────────── */
        .hero-video-wrap {
          position: absolute;
          inset: 0;
          z-index: -1;
          background: black;
        }

        .hero-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 1;
        }

        .hero-video.ready {
          opacity: 1;
        }

        /* gradient overlays — top, bottom, sides */
        .hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to bottom,
              rgba(5,4,15,0.55) 0%,
              rgba(5,4,15,0.1) 35%,
              rgba(5,4,15,0.1) 65%,
              rgba(5,4,15,0.75) 100%),
            linear-gradient(to right,
              rgba(5,4,15,0.5) 0%,
              transparent 30%,
              transparent 70%,
              rgba(5,4,15,0.5) 100%);
          z-index: 1;
        }

        /* vignette ring */
        .hero-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center,
            transparent 40%,
            rgba(5,4,15,0.6) 100%);
          z-index: 1;
          pointer-events: none;
        }

        /* ── stars ────────────────────────────────── */
        .hero-stars {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
        }

        .hero-star {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          animation: starPulse var(--dur, 4s) ease-in-out infinite;
          animation-delay: var(--delay, 0s);
          opacity: 0.6;
        }

        @keyframes starPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%       { opacity: 0.9; transform: scale(1.6); }
        }

        /* ── content ──────────────────────────────── */
        .hero-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(12px, 3vw, 24px);
          padding: clamp(24px, 6vw, 60px) clamp(20px, 8vw, 80px);
          text-align: center;
          max-width: min(760px, 92vw);
          animation: heroReveal 1.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes heroReveal {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* eyebrow pill */
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 14px;
          border: 1px solid rgba(232,201,122,0.35);
          border-radius: 999px;
          background: rgba(232,201,122,0.07);
          backdrop-filter: blur(8px);
          font-family: 'Cinzel', serif;
          font-size: clamp(9px, 2vw, 11px);
          letter-spacing: 0.25em;
          color: var(--hero-gold);
          text-transform: uppercase;
          animation: heroReveal 1.6s 0.15s cubic-bezier(0.16,1,0.3,1) both;
        }

        .hero-eyebrow-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--hero-gold);
          box-shadow: 0 0 8px var(--hero-gold);
          animation: dotPulse 2s ease-in-out infinite;
        }

        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        /* main title */
        .hero-title {
          font-family: 'Cinzel Decorative', serif;
          font-weight: 700;
          font-size: clamp(28px, 7vw, 72px);
          line-height: 1.08;
          letter-spacing: -0.01em;
          color: #fff;
          text-shadow:
            0 0 40px rgba(192,132,252,0.45),
            0 0 80px rgba(192,132,252,0.2),
            0 2px 4px rgba(0,0,0,0.6);
          margin: 0;
          animation: heroReveal 1.6s 0.25s cubic-bezier(0.16,1,0.3,1) both;
        }

        /* gold decorative rule */
        .hero-rule {
          width: clamp(40px, 12vw, 100px);
          height: 1px;
          background: linear-gradient(to right, transparent, var(--hero-gold), transparent);
          border: none;
          animation: heroReveal 1.6s 0.35s both;
        }

        /* tagline */
        .hero-tagline {
          font-family: 'Lato', sans-serif;
          font-style: italic;
          font-weight: 300;
          font-size: clamp(13px, 3.2vw, 18px);
          color: var(--hero-muted);
          letter-spacing: 0.04em;
          margin: 0;
          animation: heroReveal 1.6s 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }

        /* meta row */
        .hero-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          animation: heroReveal 1.6s 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }

        .hero-meta-chip {
          font-family: 'Cinzel', serif;
          font-size: clamp(9px, 2vw, 11px);
          letter-spacing: 0.15em;
          color: var(--hero-teal);
          text-transform: uppercase;
          opacity: 0.8;
        }

        .hero-meta-sep {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--hero-gold);
          opacity: 0.5;
        }

        /* CTA buttons */
        .hero-actions {
          display: flex;
          gap: clamp(10px, 3vw, 16px);
          flex-wrap: wrap;
          justify-content: center;
          animation: heroReveal 1.6s 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        .hero-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: clamp(10px, 2vw, 13px) clamp(20px, 5vw, 32px);
          border-radius: 6px;
          font-family: 'Cinzel', serif;
          font-size: clamp(10px, 2.5vw, 12px);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s ease;
          text-decoration: none;
        }

        .hero-btn-primary {
          background: linear-gradient(135deg, #c084fc 0%, #818cf8 100%);
          border: none;
          color: #fff;
          box-shadow: 0 4px 24px rgba(192,132,252,0.4);
        }

        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(192,132,252,0.6);
        }

        .hero-btn-secondary {
          background: transparent;
          border: 1px solid rgba(232,201,122,0.4);
          color: var(--hero-gold);
          backdrop-filter: blur(8px);
        }

        .hero-btn-secondary:hover {
          background: rgba(232,201,122,0.1);
          border-color: var(--hero-gold);
          transform: translateY(-2px);
        }

        /* scroll cue */
        .hero-scroll-cue {
          position: absolute;
          bottom: clamp(20px, 5vw, 36px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          animation: heroReveal 1.6s 0.9s both;
        }

        .hero-scroll-line {
          width: 1px;
          height: clamp(30px, 5vw, 48px);
          background: linear-gradient(to bottom, var(--hero-gold), transparent);
          animation: scrollDrop 2s ease-in-out infinite;
        }

        @keyframes scrollDrop {
          0%   { transform: scaleY(0); transform-origin: top; opacity: 1; }
          50%  { transform: scaleY(1); transform-origin: top; opacity: 1; }
          100% { transform: scaleY(1); transform-origin: bottom; opacity: 0; }
        }

        .hero-scroll-text {
          font-family: 'Cinzel', serif;
          font-size: 8px;
          letter-spacing: 0.3em;
          color: var(--hero-gold);
          opacity: 0.5;
          text-transform: uppercase;
        }

        /* mute toggle */
        .hero-mute-btn {
          position: absolute;
          bottom: clamp(20px, 5vw, 36px);
          right: clamp(16px, 4vw, 32px);
          z-index: 10;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(5,4,15,0.5);
          backdrop-filter: blur(8px);
          cursor: pointer;
          color: rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          animation: heroReveal 1.6s 1s both;
        }

        .hero-mute-btn:hover {
          border-color: var(--hero-gold);
          color: var(--hero-gold);
        }

        /* fallback when no video */
        .hero-fallback-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(192,132,252,0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 75% 80%, rgba(103,232,249,0.12) 0%, transparent 55%),
            var(--hero-bg);
          z-index: 0;
        }

        /* shimmer loading */
        .hero-shimmer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .shimmer-bar {
          height: 16px;
          border-radius: 8px;
          background: linear-gradient(90deg,
            rgba(255,255,255,0.04) 0%,
            rgba(255,255,255,0.12) 50%,
            rgba(255,255,255,0.04) 100%);
          background-size: 200% 100%;
          animation: shimmerSlide 1.5s infinite;
        }

        .shimmer-bar.w-60 { width: 240px; }
        .shimmer-bar.w-40 { width: 160px; }
        .shimmer-bar.w-52 { width: 200px; }

        @keyframes shimmerSlide {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* error state */
        .hero-error {
          color: rgba(255,100,100,0.8);
          font-family: 'Cinzel', serif;
          font-size: 12px;
          letter-spacing: 0.1em;
        }

        /* ── responsive tweaks ────────────────────── */
        @media (max-width: 480px) {
          .hero-title {
            /* break long Japanese/English title gracefully */
            word-break: break-word;
          }

          .hero-mute-btn {
            bottom: 16px;
            right: 16px;
          }
        }

        /* respect reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .hero-star, .hero-scroll-line, .hero-eyebrow-dot {
            animation: none;
          }
          .hero-content, .hero-eyebrow, .hero-title, .hero-rule,
          .hero-tagline, .hero-meta, .hero-actions,
          .hero-scroll-cue, .hero-mute-btn {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <section className="hero-root">
        {/* Video Background */}
        {videoSrc ? (
          <div className="hero-video-wrap">
            <video
              ref={videoRef}
              key={videoSrc} 
              className={`hero-video ${videoReady ? "ready" : ""}`}
              autoPlay
              loop
              muted={muted}
              playsInline
              poster={movie?.poster?.url}
              onCanPlay={() => setVideoReady(true)}
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div className="hero-fallback-bg" />
        )}

        {/* Overlays & Content (Giữ nguyên phần Stars và Content bên dưới của bạn) */}
        <div className="hero-overlay" />
        <div className="hero-vignette" />
        <Stars />

        <div className="hero-content">
          {/* ... code hiển thị Title, Tagline của bạn ... */}
        </div>
      </section>
    </>
  );
}
