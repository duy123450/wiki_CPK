import { useEffect, useRef, useState, useCallback } from "react";
import "../styles/Playlist.css";
import {
  fetchMovieInfo,
  fetchSoundtracks,
  fetchNextTrack,
} from "../services/api";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const progressInterval = useRef(null);

  const currentIdxRef = useRef(0);
  const tracksRef = useRef([]);
  const movieRef = useRef(null);
  const isLoopRef = useRef(false);
  const isShuffleRef = useRef(false);
  const isSeekingRef = useRef(false);

  // ── Shuffle history stack ──────────────────────────────────────────────────
  // Stores the index of every track played, so prev can walk it back.
  const shuffleHistoryRef = useRef([]); // array of track indices
  const shuffleHistoryCursorRef = useRef(-1); // pointer into that array

  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);
  useEffect(() => {
    movieRef.current = movie;
  }, [movie]);
  useEffect(() => {
    isLoopRef.current = isLoop;
  }, [isLoop]);
  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

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

  const startProgressTick = useCallback(() => {
    clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!ytReadyRef.current || !player || isSeekingRef.current) return;
      const tracks = tracksRef.current;
      const idx = currentIdxRef.current;
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
      setCurrentTime(Math.max(0, elapsed));
      if (cur >= track.endTime - 0.5) {
        clearInterval(progressInterval.current);
        handleAutoAdvance();
      }
    }, 500);
  }, []);

  const handleAutoAdvance = useCallback(async () => {
    const tracks = tracksRef.current;
    const movie = movieRef.current;
    const idx = currentIdxRef.current;
    if (!tracks.length || !movie) return;
    const track = tracks[idx];
    const mode = isLoopRef.current
      ? "infinite"
      : isShuffleRef.current
        ? "shuffle"
        : "sequential";
    try {
      const data = await fetchNextTrack({
        currentTrackId: track._id,
        mode,
        movieId: movie._id,
      });
      const nextIdx = tracks.findIndex((t) => t._id === data.track._id);
      if (nextIdx !== -1) playTrackAtIndex(nextIdx, /* pushHistory */ true);
    } catch (err) {
      console.error("Auto-advance failed:", err);
    }
  }, []);

  // pushHistory: whether to push this play onto the shuffle history stack.
  // When navigating *back* through history we pass false so we don't corrupt it.
  const playTrackAtIndex = useCallback(
    (idx, pushHistory = true) => {
      const tracks = tracksRef.current;
      const track = tracks[idx];
      if (!track) return;
      setCurrentIdx(idx);
      setProgress(0);
      setCurrentTime(0);

      // ── Update shuffle history ───────────────────────────────────────────
      if (pushHistory) {
        // Discard any "future" entries that were ahead of the cursor
        // (happens when user pressed prev then next again).
        shuffleHistoryRef.current = shuffleHistoryRef.current.slice(
          0,
          shuffleHistoryCursorRef.current + 1,
        );
        shuffleHistoryRef.current.push(idx);
        shuffleHistoryCursorRef.current = shuffleHistoryRef.current.length - 1;
      }

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
    [startProgressTick],
  );

  useEffect(() => {
    if (!tracks.length) return;
    const initPlayer = () => {
      const mountEl = document.getElementById("yt-hidden-mount");
      if (!mountEl) return;
      const old = document.getElementById("yt-player-node");
      if (old) old.remove();
      const div = document.createElement("div");
      div.id = "yt-player-node";
      mountEl.appendChild(div);
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
              clearInterval(progressInterval.current);
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
  }, [tracks, startProgressTick, handleAutoAdvance]);

  const handlePlayPause = useCallback(() => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return;
    const player = ytPlayerRef.current;
    try {
      const state = player.getPlayerState();
      if (state === window.YT.PlayerState.PLAYING) {
        player.pauseVideo();
      } else {
        if (state === window.YT.PlayerState.UNSTARTED || state === -1) {
          const track = tracksRef.current[currentIdxRef.current];
          if (track)
            player.loadVideoById({
              videoId: track.youtubeId,
              startSeconds: track.startTime,
              endSeconds: track.endTime,
            });
        } else {
          player.playVideo();
        }
        startProgressTick();
      }
    } catch (err) {
      console.error("PlayPause error:", err);
    }
  }, [startProgressTick]);

  const handleNext = useCallback(async () => {
    const tracks = tracksRef.current;
    const movie = movieRef.current;
    if (!tracks.length) return;

    if (isShuffleRef.current && movie) {
      // If there are future entries in the history (user pressed prev earlier),
      // walk forward through them instead of fetching a new random track.
      const history = shuffleHistoryRef.current;
      const cursor = shuffleHistoryCursorRef.current;
      if (cursor < history.length - 1) {
        const nextIdx = history[cursor + 1];
        shuffleHistoryCursorRef.current = cursor + 1;
        playTrackAtIndex(nextIdx, /* pushHistory */ false);
        return;
      }

      // No cached future — fetch a fresh random track.
      try {
        const track = tracks[currentIdxRef.current];
        const data = await fetchNextTrack({
          currentTrackId: track._id,
          mode: "shuffle",
          movieId: movie._id,
        });
        const nextIdx = tracks.findIndex((t) => t._id === data.track._id);
        if (nextIdx !== -1) playTrackAtIndex(nextIdx, /* pushHistory */ true);
      } catch (err) {
        console.error("Shuffle next failed:", err);
      }
      return;
    }

    playTrackAtIndex((currentIdxRef.current + 1) % tracks.length);
  }, [playTrackAtIndex]);

  const handlePrev = useCallback(async () => {
    const tracks = tracksRef.current;
    if (!tracks.length) return;

    // If more than 3s into the track, restart it regardless of mode.
    if (ytReadyRef.current && ytPlayerRef.current) {
      let cur = 0;
      try {
        cur = ytPlayerRef.current.getCurrentTime();
      } catch {
        /**/
      }
      const track = tracks[currentIdxRef.current];
      if (track && cur - track.startTime > 3) {
        ytPlayerRef.current.seekTo(track.startTime, true);
        setCurrentTime(0);
        setProgress(0);
        return;
      }
    }

    // ── Shuffle mode: walk the history stack backwards ───────────────────────
    if (isShuffleRef.current) {
      const history = shuffleHistoryRef.current;
      const cursor = shuffleHistoryCursorRef.current;

      if (cursor > 0) {
        // Go back one step in history.
        const prevIdx = history[cursor - 1];
        shuffleHistoryCursorRef.current = cursor - 1;
        playTrackAtIndex(prevIdx, /* pushHistory */ false);
      } else {
        // Nothing further back — just restart the current track.
        const track = tracks[currentIdxRef.current];
        if (track && ytReadyRef.current && ytPlayerRef.current) {
          ytPlayerRef.current.seekTo(track.startTime, true);
          setCurrentTime(0);
          setProgress(0);
        }
      }
      return;
    }

    // ── Sequential / loop mode ───────────────────────────────────────────────
    playTrackAtIndex(
      (currentIdxRef.current - 1 + tracks.length) % tracks.length,
    );
  }, [playTrackAtIndex]);

  const handleSeekChange = useCallback((e) => {
    isSeekingRef.current = true;
    const pct = parseFloat(e.target.value);
    const track = tracksRef.current[currentIdxRef.current];
    if (!track) return;
    setProgress(pct);
    setCurrentTime((pct / 100) * (track.endTime - track.startTime));
  }, []);

  const handleSeekCommit = useCallback((e) => {
    const pct = parseFloat(e.target.value);
    const track = tracksRef.current[currentIdxRef.current];
    if (!track) return;
    const seekTo =
      track.startTime + (pct / 100) * (track.endTime - track.startTime);
    if (ytReadyRef.current && ytPlayerRef.current)
      ytPlayerRef.current.seekTo(seekTo, true);
    isSeekingRef.current = false;
  }, []);

  const handleShuffleToggle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      if (next) {
        setIsLoop(false);
        // Seed the history with the currently playing track so prev works
        // immediately after enabling shuffle.
        shuffleHistoryRef.current = [currentIdxRef.current];
        shuffleHistoryCursorRef.current = 0;
      }
      return next;
    });
  }, []);

  const handleLoopToggle = useCallback(() => {
    setIsLoop((prev) => {
      const next = !prev;
      if (next) setIsShuffle(false);
      return next;
    });
  }, []);

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
                  src={currentTrack.coverImage?.url || ""}
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
