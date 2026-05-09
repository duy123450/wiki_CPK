import { useEffect, useRef, useState, useCallback } from "react";
import "../styles/Playlist.css";
import { fetchMovieInfo, fetchSoundtracks } from "../services/api";
import useYouTubePlayer from "../hooks/useYouTubePlayer";

const fmtTime = (s) => {
  s = Math.max(0, Math.floor(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function TipBtn({ label, onClick, className = "pl-icon-btn", children }) {
  const [show, setShow] = useState(false);
  const timer = useRef(null);
  const startHold = () => {
    timer.current = setTimeout(() => setShow(true), 400);
  };
  const endHold = () => {
    clearTimeout(timer.current);
    setShow(false);
  };
  return (
    <button
      className={`${className} pl-tip-wrap`}
      onClick={onClick}
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={endHold}
      onTouchStart={startHold}
      onTouchEnd={endHold}
    >
      {children}
      {show && <span className="pl-tooltip">{label}</span>}
    </button>
  );
}

const IconShuffle = ({ active }) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 3 21 3 21 8" stroke={active ? "#1DB954" : "#b3b3b3"} />
    <line
      x1="4"
      y1="20"
      x2="21"
      y2="3"
      stroke={active ? "#1DB954" : "#b3b3b3"}
    />
    <polyline
      points="21 16 21 21 16 21"
      stroke={active ? "#1DB954" : "#b3b3b3"}
    />
    <line
      x1="15"
      y1="15"
      x2="21"
      y2="21"
      stroke={active ? "#1DB954" : "#b3b3b3"}
    />
  </svg>
);

const IconLoop = ({ active }) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="17 1 21 5 17 9" stroke={active ? "#1DB954" : "#b3b3b3"} />
    <path
      d="M3 11V9a4 4 0 0 1 4-4h14"
      stroke={active ? "#1DB954" : "#b3b3b3"}
    />
    <polyline points="7 23 3 19 7 15" stroke={active ? "#1DB954" : "#b3b3b3"} />
    <path
      d="M21 13v2a4 4 0 0 1-4 4H3"
      stroke={active ? "#1DB954" : "#b3b3b3"}
    />
  </svg>
);

const IconPrev = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <polygon points="19 20 9 12 19 4 19 20" fill="#fff" />
    <line
      x1="5"
      y1="19"
      x2="5"
      y2="5"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconNext = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <polygon points="5 4 15 12 5 20 5 4" fill="#fff" />
    <line
      x1="19"
      y1="5"
      x2="19"
      y2="19"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconPlay = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#121212">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconPause = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#121212">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const IconChevronDown = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconChevronUp = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const IconVolume = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);

export default function Playlist() {
  const [movie, setMovie] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { movie: movieData } = await fetchMovieInfo();
        setMovie(movieData);
        const { tracks: trackData } = await fetchSoundtracks(movieData._id);
        setTracks(trackData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const {
    currentIdx,
    isPlaying,
    isShuffle,
    isLoop,
    progress,
    currentTime,
    volume,
    playTrackAtIndex,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleSeekChange,
    handleSeekCommit,
    handleShuffleToggle,
    handleLoopToggle,
    handleVolumeChange,
    isSeekingRef,
  } = useYouTubePlayer(tracks, movie);

  const currentTrack = tracks[currentIdx];
  const duration = currentTrack
    ? currentTrack.endTime - currentTrack.startTime
    : 0;

  if (error || loading || !currentTrack) return null;

  return (
    <>
      <div
        id="yt-hidden-mount"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          top: -9999,
        }}
      />

      {isExpanded && (
        <div
          className="pl-backdrop-overlay"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className="pl-container">
        {/* ── Collapsed bar ── */}
        {!isExpanded && (
          <div className="pl-sticky-bar" onClick={() => setIsExpanded(true)}>
            <div className="pl-sticky-cover">
              <img
                src={currentTrack.coverImage || null}
                alt={currentTrack.title}
                onError={(e) => {
                  e.target.style.background = "#282828";
                }}
              />
            </div>
            <div className="pl-sticky-info">
              <div className="pl-sticky-title">{currentTrack.title}</div>
              <div className="pl-sticky-artist">{currentTrack.vocal}</div>
            </div>
            <button
              className="pl-sticky-play"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
            >
              {isPlaying ? <IconPause size={16} /> : <IconPlay size={16} />}
            </button>
            <button
              className="pl-sticky-expand"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
            >
              <IconChevronUp />
            </button>
          </div>
        )}

        {/* ── Expanded panel ── */}
        {isExpanded && (
          <div className="pl-panel">
            {/* ─── PLAYER ─── */}
            <div className="pl-panel-player">
              <div className="pl-panel-header">
                <div className="pl-panel-handle" />
                <button
                  className="pl-panel-close"
                  onClick={() => setIsExpanded(false)}
                  style={{ position: "absolute", right: 12 }}
                >
                  <IconChevronDown />
                </button>
              </div>

              <div className="pl-panel-cover-wrap">
                <img
                  className="pl-panel-cover"
                  src={currentTrack.coverImage || null}
                  alt={currentTrack.title}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>

              <div className="pl-panel-meta">
                <div className="pl-panel-title">{currentTrack.title}</div>
                <div className="pl-panel-vocal">{currentTrack.vocal}</div>
                <div className="pl-panel-producer">
                  by {currentTrack.producer}
                </div>
              </div>

              <div className="pl-panel-progress">
                <input
                  type="range"
                  className="pl-slider"
                  min="0"
                  max="100"
                  value={progress}
                  step="0.1"
                  style={{
                    background: `linear-gradient(to right, #1DB954 ${progress}%, #404040 ${progress}%)`,
                  }}
                  onMouseDown={() => {
                    isSeekingRef.current = true;
                  }}
                  onTouchStart={() => {
                    isSeekingRef.current = true;
                  }}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekCommit}
                  onTouchEnd={handleSeekCommit}
                />
                <div className="pl-time-row">
                  <span className="pl-time">{fmtTime(currentTime)}</span>
                  <span className="pl-time">{fmtTime(duration)}</span>
                </div>
              </div>

              <div className="pl-controls-row">
                <TipBtn label="Shuffle" onClick={handleShuffleToggle}>
                  <IconShuffle active={isShuffle} />
                </TipBtn>
                <button className="pl-icon-btn" onClick={handlePrev}>
                  <IconPrev />
                </button>
                <button className="pl-play-btn" onClick={handlePlayPause}>
                  {isPlaying ? <IconPause /> : <IconPlay />}
                </button>
                <button className="pl-icon-btn" onClick={handleNext}>
                  <IconNext />
                </button>
                <TipBtn label="Loop" onClick={handleLoopToggle}>
                  <IconLoop active={isLoop} />
                </TipBtn>
              </div>

              <div className="pl-volume-row">
                <span className="pl-volume-icon" aria-hidden="true">
                  <IconVolume />
                </span>
                <input
                  type="range"
                  className="pl-slider pl-volume-slider"
                  min="0"
                  max="100"
                  value={volume}
                  step="1"
                  aria-label="Volume"
                  style={{
                    background: `linear-gradient(to right, #1DB954 ${volume}%, #404040 ${volume}%)`,
                  }}
                  onChange={handleVolumeChange}
                />
                <span className="pl-volume-value">{volume}</span>
              </div>
            </div>

            {/* ─── TRACK LIST ─── */}
            <div className="pl-panel-tracks">
              <div className="pl-tracks-header">
                <span>Tracks ({tracks.length})</span>
              </div>
              <div className="pl-track-list">
                {tracks.map((t, i) => (
                  <div
                    key={t._id}
                    className={`pl-track-row ${i === currentIdx ? "pl-track-row--active" : ""}`}
                    onClick={() => playTrackAtIndex(i)}
                  >
                    <span
                      className={`pl-track-num ${i === currentIdx ? "pl-track-num--playing" : ""}`}
                    >
                      {i === currentIdx
                        ? "▶"
                        : String(t.trackNumber).padStart(2, "0")}
                    </span>
                    <div className="pl-track-info">
                      <div
                        className={`pl-track-title ${i === currentIdx ? "pl-track-title--active" : ""}`}
                      >
                        {t.title}
                      </div>
                      <div className="pl-track-producer">{t.producer}</div>
                    </div>
                    <span className="pl-track-duration">
                      {fmtTime(t.endTime - t.startTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
