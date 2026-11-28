import { useState } from 'react';
import { Link } from 'react-router-dom';
import TrackTypeBadge from './TrackTypeBadge';

function TrackCard({ track, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={`/wiki/soundtrack/${track.slug}`}
      className="group relative flex animate-soundtracks-card-in flex-col overflow-hidden rounded-[12px] border border-solid border-soundtracks-border bg-soundtracks-surface text-inherit no-underline opacity-0 [transition:border-color_0.2s,transform_0.25s,box-shadow_0.25s] hover:-translate-y-1 hover:border-soundtracks-border-bright hover:shadow-[0_12px_40px_hsl(272,78%,62%,0.18)]"
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Track number disc */}
      <div className="absolute right-[10px] top-[10px] z-[2] flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-full border-2 border-solid border-soundtracks-border bg-[hsl(228,20%,6%)]">
        <span className="relative z-[2] text-[0.6rem] font-extrabold tracking-[-0.02em] text-soundtracks-text">
          #{track.trackNumber ?? index + 1}
        </span>
        <div
          className={`absolute inset-[-4px] rounded-full bg-[conic-gradient(#c084fc,#818cf8,#c084fc)] opacity-0 transition-opacity duration-300 group-hover:animate-soundtracks-spin group-hover:opacity-[0.55] ${
            hovered ? 'animate-soundtracks-spin opacity-[0.55]' : ''
          }`}
        />
      </div>

      {/* Cover art */}
      <div className="relative h-[160px] shrink-0 bg-[hsl(228,20%,6%)]">
        {track.coverImage ? (
          <img
            src={track.coverImage}
            alt={track.title}
            className="block h-full w-full object-cover transition-transform duration-[350ms] group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_70%,hsl(272,40%,14%)_0%,hsl(228,20%,6%)_100%)] text-soundtracks-muted">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}
        {/* Removed scrim overlay */}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-[0.35rem] px-4 pt-[0.9rem] pb-4">
        <TrackTypeBadge type={track.trackType} />
        <h2 className="m-[0.1rem_0_0] text-[1.05rem] font-bold leading-[1.3] text-soundtracks-text">
          {track.title}
        </h2>
        {track.vocal && (
          <p className="m-0 flex items-start gap-[0.4rem] text-[0.78rem] text-soundtracks-muted">
            <span className="shrink-0 text-[0.64rem] font-bold uppercase tracking-[0.08em] text-soundtracks-purple opacity-[0.85]">
              Vocal
            </span>
            {track.vocal}
          </p>
        )}
        {track.producer && (
          <p className="m-0 flex items-start gap-[0.4rem] text-[0.78rem] text-soundtracks-muted">
            <span className="shrink-0 text-[0.64rem] font-bold uppercase tracking-[0.08em] text-soundtracks-purple opacity-[0.85]">
              Music
            </span>
            {track.producer}
          </p>
        )}
        <span className="mt-auto flex translate-x-[-4px] items-center gap-[0.3rem] pt-[0.7rem] text-[0.78rem] font-semibold text-soundtracks-purple opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          View Track
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}

export default TrackCard;
