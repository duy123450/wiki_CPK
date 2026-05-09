import { useEffect, useRef, useState, useCallback } from "react";
import { fetchNextTrack } from "../services/api";

let ytApiLoaded = false;
const loadYouTubeAPI = () => {
  if (ytApiLoaded || window.YT) return;
  ytApiLoaded = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.body.appendChild(tag);
};

export default function useYouTubePlayer(tracks, movie) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);

  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const progressInterval = useRef(null);

  const currentIdxRef = useRef(0);
  const tracksRef = useRef([]);
  const movieRef = useRef(null);
  const isLoopRef = useRef(false);
  const isShuffleRef = useRef(false);
  const isSeekingRef = useRef(false);
  const advanceInFlightRef = useRef(false);
  const volumeRef = useRef(70);

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
    volumeRef.current = volume;
  }, [volume]);

  function resolveTrackIndex(trackId) {
    return tracksRef.current.findIndex(
      (track) => String(track._id) === String(trackId),
    );
  }

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
    if (advanceInFlightRef.current) return;
    const tracks = tracksRef.current;
    const movie = movieRef.current;
    const idx = currentIdxRef.current;
    if (!tracks.length || !movie) return;
    const track = tracks[idx];
    if (!track) return;
    const mode = isLoopRef.current
      ? "infinite"
      : isShuffleRef.current
        ? "shuffle"
        : "sequential";

    advanceInFlightRef.current = true;
    try {
      const data = await fetchNextTrack({
        currentTrackId: track._id,
        mode,
        movieId: movie._id,
      });
      const nextIdx = resolveTrackIndex(data.track._id);
      if (nextIdx !== -1) playTrackAtIndex(nextIdx, /* pushHistory */ true);
    } catch (err) {
      console.error("Auto-advance failed:", err);
    } finally {
      advanceInFlightRef.current = false;
    }
  }, []);

  // pushHistory: whether to push this play onto the shuffle history stack.
  // When navigating *back* through history we pass false so we don't corrupt it.
  const playTrackAtIndex = useCallback(
    (idx, pushHistory = true) => {
      const tracks = tracksRef.current;
      const track = tracks[idx];
      if (!track) return;
      clearInterval(progressInterval.current);
      advanceInFlightRef.current = false;
      currentIdxRef.current = idx;
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
    loadYouTubeAPI();
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
            ytPlayerRef.current?.setVolume(volumeRef.current);
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

  // ── Keyboard shortcut: Spacebar to play/pause ──────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " ") {
        // Ignore if user is typing in an input field
        const target = e.target;
        const tagName = target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
          return;
        }

        e.preventDefault();
        handlePlayPause();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePlayPause]);

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
        const nextIdx = resolveTrackIndex(data.track._id);
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

  const handleVolumeChange = useCallback((e) => {
    const nextVolume = parseFloat(e.target.value);
    setVolume(nextVolume);
    if (ytReadyRef.current && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(nextVolume);
    }
  }, []);

  return {
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
  };
}
