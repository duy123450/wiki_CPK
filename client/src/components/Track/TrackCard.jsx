import { useState } from 'react';
import { Link } from 'react-router-dom';
import TrackTypeBadge from './TrackTypeBadge';

function TrackCard({ track, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={`/wiki/soundtrack/${track.slug}`}
      className="st-card"
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Track number disc */}
      <div className="st-card-disc">
        <span className="st-disc-num">#{track.trackNumber ?? index + 1}</span>
        <div className={`st-disc-spin ${hovered ? 'st-disc-spin--active' : ''}`} />
      </div>

      {/* Cover art */}
      <div className="st-card-cover">
        {track.coverImage ? (
          <img src={track.coverImage} alt={track.title} className="st-card-img" loading="lazy" />
        ) : (
          <div className="st-card-img-placeholder">
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
      <div className="st-card-content">
        <TrackTypeBadge type={track.trackType} />
        <h2 className="st-card-title">{track.title}</h2>
        {track.vocal && (
          <p className="st-card-vocal">
            <span className="st-card-vocal-label">Vocal</span>
            {track.vocal}
          </p>
        )}
        {track.producer && (
          <p className="st-card-producer">
            <span className="st-card-producer-label">Music</span>
            {track.producer}
          </p>
        )}
        <span className="st-card-cta">
          View Track <span className="st-card-arrow">→</span>
        </span>
      </div>
    </Link>
  );
}

export default TrackCard;
