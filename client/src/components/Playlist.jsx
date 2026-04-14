import { useEffect, useRef, useState, useCallback } from "react";
import "../styles/Playlist.css";
import {
  fetchMovieInfo,
  fetchSoundtracks,
  fetchNextTrack,
} from "../services/api";

// ─── YouTube IFrame API loader ────────────────────────────────────────────────
let ytApiLoaded = false;
const loadYouTubeAPI = () => {
  if (ytApiLoaded || window.YT) return;
  ytApiLoaded = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.body.appendChild(tag);
};

const fmtTime = (s) => {
  s = Math.max(0, Math.floor(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// ─── Tooltip button — hold 400ms to reveal label ─────────────────────────────
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

// ─── Icons ────────────────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function Playlist() {
  const [movie, setMovie] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTrackList, setShowTrackList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSeeking, setIsSeeking] = useState(false);

  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const progressInterval = useRef(null);
  const currentIdxRef = useRef(0);

  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

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
    loadYouTubeAPI();
  }, []);

  useEffect(() => {
    if (!tracks.length) return;
    const initPlayer = () => {
      const div = document.createElement("div");
      div.id = "yt-player-node";
      document.getElementById("yt-hidden-mount")?.appendChild(div);
      ytPlayerRef.current = new window.YT.Player("yt-player-node", {
        width: "1",
        height: "1",
        videoId: tracks[0].youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
        },
        events: {
          onReady: () => {
            ytReadyRef.current = true;
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startProgressTick();
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              clearInterval(progressInterval.current);
            } else if (e.data === window.YT.PlayerState.ENDED) {
              handleAutoAdvance();
            }
          },
        },
      });
    };
    if (window.YT && window.YT.Player) initPlayer();
    else window.onYouTubeIframeAPIReady = initPlayer;
    return () => {
      clearInterval(progressInterval.current);
    };
  }, [tracks]);

  const startProgressTick = useCallback(() => {
    clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      const player = ytPlayerRef.current;
      const idx = currentIdxRef.current;
      if (!ytReadyRef.current || !player || isSeeking) return;
      const track = tracks[idx];
      if (!track) return;
      let cur;
      try {
        cur = player.getCurrentTime();
      } catch {
        return;
      }
      const elapsed = cur - track.startTime;
      const duration = track.endTime - track.startTime;
      setProgress(Math.min(100, Math.max(0, (elapsed / duration) * 100)));
      setCurrentTime(elapsed);
      if (cur >= track.endTime - 0.5) {
        clearInterval(progressInterval.current);
        handleAutoAdvance();
      }
    }, 500);
  }, [tracks, isSeeking]);

  const handleAutoAdvance = useCallback(async () => {
    const idx = currentIdxRef.current;
    if (!tracks.length || !movie) return;
    const track = tracks[idx];
    const mode = isLoop ? "infinite" : isShuffle ? "shuffle" : "sequential";
    try {
      const data = await fetchNextTrack({
        currentTrackId: track._id,
        mode,
        movieId: movie._id,
      });
      const nextIdx = tracks.findIndex((t) => t._id === data.track._id);
      if (nextIdx !== -1) playTrackAtIndex(nextIdx);
    } catch (err) {
      console.error("Auto-advance failed:", err);
    }
  }, [tracks, movie, isLoop, isShuffle]);

  const playTrackAtIndex = useCallback(
    (idx) => {
      const track = tracks[idx];
      if (!track) return;
      setCurrentIdx(idx);
      setProgress(0);
      setCurrentTime(0);
      if (ytReadyRef.current && ytPlayerRef.current) {
        ytPlayerRef.current.loadVideoById({
          videoId: track.youtubeId,
          startSeconds: track.startTime,
          endSeconds: track.endTime,
        });
        setIsPlaying(true);
        startProgressTick();
      }
    },
    [tracks, startProgressTick],
  );

  const handlePlayPause = () => {
    if (!ytReadyRef.current) return;
    if (isPlaying) {
      ytPlayerRef.current.pauseVideo();
    } else {
      if (currentTime === 0)
        ytPlayerRef.current.loadVideoById({
          videoId: tracks[currentIdx].youtubeId,
          startSeconds: tracks[currentIdx].startTime,
        });
      ytPlayerRef.current.playVideo();
    }
  };

  const handleNext = () => playTrackAtIndex((currentIdx + 1) % tracks.length);
  const handlePrev = () => {
    if (ytReadyRef.current && currentTime > 3) {
      ytPlayerRef.current.seekTo(tracks[currentIdx].startTime, true);
      setCurrentTime(0);
      setProgress(0);
      return;
    }
    playTrackAtIndex((currentIdx - 1 + tracks.length) % tracks.length);
  };

  const handleSeek = (e) => {
    const pct = parseFloat(e.target.value);
    setProgress(pct);
    setCurrentTime(
      (pct / 100) * (tracks[currentIdx].endTime - tracks[currentIdx].startTime),
    );
  };

  const handleSeekCommit = (e) => {
    const pct = parseFloat(e.target.value);
    const track = tracks[currentIdx];
    if (ytReadyRef.current)
      ytPlayerRef.current.seekTo(
        track.startTime + (pct / 100) * (track.endTime - track.startTime),
        true,
      );
    setIsSeeking(false);
  };

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
                src={currentTrack.coverImage?.url || ""}
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
            {/* ─── Left: Track List ─── */}
            <div className="pl-panel-tracks">
              <div className="pl-tracks-header">
                <span>Tracks ({tracks.length})</span>
                <button
                  className="pl-panel-close"
                  onClick={() => setIsExpanded(false)}
                >
                  <IconChevronDown />
                </button>
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

            {/* ─── Right: Player ─── */}
            <div className="pl-panel-player">
              {/* Handle */}
              <div className="pl-panel-header">
                <div className="pl-panel-handle" />
              </div>

              {/* Cover */}
              <div className="pl-panel-cover-wrap">
                <img
                  className="pl-panel-cover"
                  src={currentTrack.coverImage?.url || ""}
                  alt={currentTrack.title}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>

              {/* Meta */}
              <div className="pl-panel-meta">
                <div className="pl-panel-title">{currentTrack.title}</div>
                <div className="pl-panel-vocal">{currentTrack.vocal}</div>
                <div className="pl-panel-producer">
                  by {currentTrack.producer}
                </div>
              </div>

              {/* Progress */}
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
                  onMouseDown={() => setIsSeeking(true)}
                  onTouchStart={() => setIsSeeking(true)}
                  onChange={handleSeek}
                  onMouseUp={handleSeekCommit}
                  onTouchEnd={handleSeekCommit}
                />
                <div className="pl-time-row">
                  <span className="pl-time">{fmtTime(currentTime)}</span>
                  <span className="pl-time">{fmtTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="pl-controls-row">
                <button
                  className="pl-icon-btn"
                  onClick={() =>
                    setIsShuffle((p) => {
                      if (!p) setIsLoop(false);
                      return !p;
                    })
                  }
                >
                  <IconShuffle active={isShuffle} />
                </button>
                <button className="pl-icon-btn" onClick={handlePrev}>
                  <IconPrev />
                </button>
                <button className="pl-play-btn" onClick={handlePlayPause}>
                  {isPlaying ? <IconPause /> : <IconPlay />}
                </button>
                <button className="pl-icon-btn" onClick={handleNext}>
                  <IconNext />
                </button>
                <button
                  className="pl-icon-btn"
                  onClick={() =>
                    setIsLoop((p) => {
                      if (!p) setIsShuffle(false);
                      return !p;
                    })
                  }
                >
                  <IconLoop active={isLoop} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
