import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchNextTrack } from '../services/api'

import { loadYouTubeAPI } from '../utils/youtubeUtils'

export default function useYouTubePlayer(tracks, movie) {
  // Persist shuffle/loop state in localStorage to survive hook re-initialization
  const SHUFFLE_KEY = 'yt-player-shuffle'
  const LOOP_KEY = 'yt-player-loop'
  const VOLUME_KEY = 'yt-player-volume'

  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isShuffle, setIsShuffle] = useState(() => {
    try {
      return localStorage.getItem(SHUFFLE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [isLoop, setIsLoop] = useState(() => {
    try {
      return localStorage.getItem(LOOP_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(() => {
    try {
      const stored = localStorage.getItem(VOLUME_KEY)
      return stored ? parseFloat(stored) : 70
    } catch {
      return 70
    }
  })

  const ytPlayerRef = useRef(null)
  const ytReadyRef = useRef(false)
  const progressInterval = useRef(null)

  const currentIdxRef = useRef(0)
  const tracksRef = useRef([])
  const movieRef = useRef(null)
  const isLoopRef = useRef(false)
  const isShuffleRef = useRef(false)
  const isSeekingRef = useRef(false)
  const advanceInFlightRef = useRef(false)
  const volumeRef = useRef(70)

  // ── Shuffle history stack ──────────────────────────────────────────────────
  // Stores the index of every track played, so prev can walk it back.
  const shuffleHistoryRef = useRef([]) // array of track indices
  const shuffleHistoryCursorRef = useRef(-1) // pointer into that array

  useEffect(() => {
    currentIdxRef.current = currentIdx
  }, [currentIdx])
  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])
  useEffect(() => {
    movieRef.current = movie
  }, [movie])
  useEffect(() => {
    isLoopRef.current = isLoop
  }, [isLoop])
  useEffect(() => {
    isShuffleRef.current = isShuffle
  }, [isShuffle])
  useEffect(() => {
    volumeRef.current = volume
    try {
      localStorage.setItem(VOLUME_KEY, volume.toString())
    } catch {
      /**/
    }
  }, [volume])

  // ── Persist shuffle and loop modes to localStorage ────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(SHUFFLE_KEY, isShuffle.toString())
    } catch {
      /**/
    }
  }, [isShuffle])

  useEffect(() => {
    try {
      localStorage.setItem(LOOP_KEY, isLoop.toString())
    } catch {
      /**/
    }
  }, [isLoop])

  function resolveTrackIndex(trackId) {
    return tracksRef.current.findIndex(
      (track) => String(track._id) === String(trackId)
    )
  }

  const startProgressTick = useCallback(() => {
    clearInterval(progressInterval.current)
    let lastCheckTime = Date.now()

    progressInterval.current = setInterval(() => {
      const player = ytPlayerRef.current
      if (!ytReadyRef.current || !player || isSeekingRef.current) return
      const tracks = tracksRef.current
      const idx = currentIdxRef.current
      const track = tracks[idx]
      if (!track) return
      let cur
      try {
        cur = player.getCurrentTime()
      } catch {
        return
      }

      // ── Detect stuck/frozen playback ────────────────────────────────────
      // If player state is PLAYING but time hasn't changed in 2+ seconds,
      // the playback is stuck — try to recover
      const now = Date.now()
      const timeSinceLastCheck = (now - lastCheckTime) / 1000
      lastCheckTime = now

      try {
        const playerState = player.getPlayerState()
        if (playerState === window.YT.PlayerState.PLAYING && isPlaying) {
          // Should be advancing, check if we're actually progressing
          if (timeSinceLastCheck > 1.5) {
            // We haven't received new time data in a while
            // This might indicate a stuck player
            console.warn(
              'Player appears stuck: no time update for',
              timeSinceLastCheck.toFixed(1),
              'seconds'
            )
          }
        }
      } catch (e) {
        // Ignore errors checking player state
      }

      const elapsed = cur - track.startTime
      const duration = track.endTime - track.startTime
      setProgress(Math.min(100, Math.max(0, (elapsed / duration) * 100)))
      setCurrentTime(Math.max(0, Math.round(elapsed * 100) / 100))

      // When track ends, trigger auto-advance (with 0.5s buffer)
      if (cur >= track.endTime - 0.5) {
        clearInterval(progressInterval.current)
        // Ensure we don't trigger multiple auto-advances for the same track
        setIsPlaying(false)
        handleAutoAdvance()
      }
    }, 100)
  }, [handleAutoAdvance, isPlaying])

  const handleAutoAdvance = useCallback(async () => {
    if (advanceInFlightRef.current) return
    const tracks = tracksRef.current
    const movie = movieRef.current
    const idx = currentIdxRef.current
    if (!tracks.length || !movie) return
    const track = tracks[idx]
    if (!track) return
    const mode = isLoopRef.current
      ? 'infinite'
      : isShuffleRef.current
        ? 'shuffle'
        : 'sequential'

    advanceInFlightRef.current = true
    try {
      const data = await fetchNextTrack({
        currentTrackId: track._id,
        mode,
        movieId: movie._id,
      })

      if (!data?.track) {
        console.warn('Server returned no track data during auto-advance')
        handleAutoAdvanceFallback(mode, idx, tracks.length)
        return
      }

      const nextIdx = resolveTrackIndex(data.track._id)
      if (nextIdx !== -1) {
        playTrackAtIndex(nextIdx, /* pushHistory */ true)
      } else {
        // Track not found in local array — fallback to sequential navigation
        console.warn(
          'Next track not found in local array. Track ID:',
          data.track._id,
          'Falling back to sequential mode.'
        )
        handleAutoAdvanceFallback(mode, idx, tracks.length)
      }
    } catch (err) {
      console.error('Auto-advance failed:', err)
      // On error, fallback to sequential navigation
      handleAutoAdvanceFallback(mode, idx, tracks.length)
    } finally {
      advanceInFlightRef.current = false
    }
  }, [])

  // Fallback handler when the server response can't be resolved or API fails
  const handleAutoAdvanceFallback = useCallback((mode, currentIdx, tracksLength) => {
    if (!tracksLength) return
    let nextIdx

    if (mode === 'infinite') {
      // Loop mode: play current track again (or first if at end)
      nextIdx = currentIdx < tracksLength ? currentIdx : 0
    } else if (mode === 'shuffle') {
      // Shuffle mode: pick a random track
      nextIdx = Math.floor(Math.random() * tracksLength)
    } else {
      // Sequential: play next track (loop at end)
      nextIdx = (currentIdx + 1) % tracksLength
    }

    playTrackAtIndex(nextIdx, /* pushHistory */ true)
  }, [playTrackAtIndex])

  // pushHistory: whether to push this play onto the shuffle history stack.
  // When navigating *back* through history we pass false so we don't corrupt it.
  const playTrackAtIndex = useCallback(
    (idx, pushHistory = true) => {
      const tracks = tracksRef.current

      // Validate index bounds
      if (idx < 0 || idx >= tracks.length) {
        console.error(
          `Invalid track index: ${idx}. Valid range: 0-${tracks.length - 1}`
        )
        return
      }

      const track = tracks[idx]
      if (!track) {
        console.error(`Track at index ${idx} is null or undefined`)
        return
      }

      // Validate track has required YouTube data
      if (!track.youtubeId || track.startTime === undefined || track.endTime === undefined) {
        console.error(`Track at index ${idx} missing YouTube data:`, {
          youtubeId: track.youtubeId,
          startTime: track.startTime,
          endTime: track.endTime,
          title: track.title,
        })
        return
      }

      clearInterval(progressInterval.current)
      advanceInFlightRef.current = false
      currentIdxRef.current = idx
      setCurrentIdx(idx)
      setProgress(0)
      setCurrentTime(0)

      // ── Update shuffle history ───────────────────────────────────────────
      if (pushHistory) {
        // Discard any "future" entries that were ahead of the cursor
        // (happens when user pressed prev then next again).
        shuffleHistoryRef.current = shuffleHistoryRef.current.slice(
          0,
          shuffleHistoryCursorRef.current + 1
        )
        shuffleHistoryRef.current.push(idx)
        shuffleHistoryCursorRef.current = shuffleHistoryRef.current.length - 1
      }

      if (ytReadyRef.current && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.loadVideoById({
            videoId: track.youtubeId,
            startSeconds: track.startTime,
            endSeconds: track.endTime,
          })
          setIsPlaying(true)
          startProgressTick()
        } catch (err) {
          console.error('Error loading video:', err)
          // Try to continue anyway
          setIsPlaying(true)
          startProgressTick()
        }
      }
    },
    [startProgressTick]
  )

  useEffect(() => {
    if (!tracks.length) return
    loadYouTubeAPI()
    const initPlayer = () => {
      const mountEl = document.getElementById('yt-hidden-mount')
      if (!mountEl) return
      const old = document.getElementById('yt-player-node')
      if (old) old.remove()
      const div = document.createElement('div')
      div.id = 'yt-player-node'
      mountEl.appendChild(div)
      ytPlayerRef.current = new window.YT.Player('yt-player-node', {
        width: '1',
        height: '1',
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
            ytReadyRef.current = true
            ytPlayerRef.current?.setVolume(volumeRef.current)
          },
          onStateChange: (e) => {
            const state = e.data
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              startProgressTick()
            } else if (state === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
              clearInterval(progressInterval.current)
            } else if (state === window.YT.PlayerState.ENDED) {
              // Track naturally ended — trigger auto-advance
              clearInterval(progressInterval.current)
              setIsPlaying(false)
              handleAutoAdvance()
            } else if (state === window.YT.PlayerState.UNSTARTED || state === window.YT.PlayerState.BUFFERING) {
              // Video is loading/buffering — this is normal, let it continue
            } else if (state === window.YT.PlayerState.CUED) {
              // Video is cued but not playing — this is also normal
            }
          },
          onError: (e) => {
            console.error('YouTube Player Error:', e.data)
            // On error, try to auto-advance to next track
            handleAutoAdvance()
          },
        },
      })
    }
    if (window.YT && window.YT.Player) initPlayer()
    else window.onYouTubeIframeAPIReady = initPlayer
    return () => {
      clearInterval(progressInterval.current)
    }
  }, [tracks, startProgressTick, handleAutoAdvance])

  const handlePlayPause = useCallback(() => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return
    const player = ytPlayerRef.current
    try {
      const state = player.getPlayerState()
      if (state === window.YT.PlayerState.PLAYING) {
        player.pauseVideo()
      } else {
        if (state === window.YT.PlayerState.UNSTARTED || state === -1) {
          const track = tracksRef.current[currentIdxRef.current]
          if (track)
            player.loadVideoById({
              videoId: track.youtubeId,
              startSeconds: track.startTime,
              endSeconds: track.endTime,
            })
        } else {
          player.playVideo()
        }
        startProgressTick()
      }
    } catch (err) {
      console.error('PlayPause error:', err)
    }
  }, [startProgressTick])

  // ── Keyboard shortcut: Spacebar to play/pause ──────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ') {
        // Ignore if user is typing in an input field
        const target = e.target
        const tagName = target.tagName.toLowerCase()
        const isTextInput =
          tagName === 'input' &&
          !['range', 'checkbox', 'radio', 'button', 'submit'].includes(target.type)

        if (
          isTextInput ||
          tagName === 'textarea' ||
          target.isContentEditable
        ) {
          return
        }

        e.preventDefault()
        handlePlayPause()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlePlayPause])

  const handleNext = useCallback(async () => {
    const tracks = tracksRef.current
    const movie = movieRef.current
    if (!tracks.length) return

    if (isShuffleRef.current && movie) {
      // If there are future entries in the history (user pressed prev earlier),
      // walk forward through them instead of fetching a new random track.
      const history = shuffleHistoryRef.current
      const cursor = shuffleHistoryCursorRef.current
      if (cursor < history.length - 1) {
        const nextIdx = history[cursor + 1]
        shuffleHistoryCursorRef.current = cursor + 1
        playTrackAtIndex(nextIdx, /* pushHistory */ false)
        return
      }

      // No cached future — fetch a fresh random track.
      try {
        const track = tracks[currentIdxRef.current]
        if (!track) return
        const data = await fetchNextTrack({
          currentTrackId: track._id,
          mode: 'shuffle',
          movieId: movie._id,
        })

        if (!data?.track) {
          console.warn('Server returned no track during shuffle next')
          // Fallback: pick random track locally
          const randomIdx = Math.floor(Math.random() * tracks.length)
          playTrackAtIndex(randomIdx, /* pushHistory */ true)
          return
        }

        const nextIdx = resolveTrackIndex(data.track._id)
        if (nextIdx !== -1) {
          playTrackAtIndex(nextIdx, /* pushHistory */ true)
        } else {
          console.warn('Shuffle next track not found. Picking random local track.')
          // Fallback: pick random track locally
          const randomIdx = Math.floor(Math.random() * tracks.length)
          playTrackAtIndex(randomIdx, /* pushHistory */ true)
        }
      } catch (err) {
        console.error('Shuffle next failed:', err)
        // Fallback: just pick a random track locally
        const randomIdx = Math.floor(Math.random() * tracks.length)
        playTrackAtIndex(randomIdx, /* pushHistory */ true)
      }
      return
    }

    // Sequential: just go to next track
    playTrackAtIndex((currentIdxRef.current + 1) % tracks.length)
  }, [playTrackAtIndex])

  const handlePrev = useCallback(async () => {
    const tracks = tracksRef.current
    if (!tracks.length) return

    // If more than 3s into the track, restart it regardless of mode.
    if (ytReadyRef.current && ytPlayerRef.current) {
      let cur = 0
      try {
        cur = ytPlayerRef.current.getCurrentTime()
      } catch {
        /**/
      }
      const track = tracks[currentIdxRef.current]
      if (track && cur - track.startTime > 3) {
        ytPlayerRef.current.seekTo(track.startTime, true)
        setCurrentTime(0)
        setProgress(0)
        return
      }
    }

    // ── Shuffle mode: walk the history stack backwards ───────────────────────
    if (isShuffleRef.current) {
      const history = shuffleHistoryRef.current
      const cursor = shuffleHistoryCursorRef.current

      if (cursor > 0) {
        // Go back one step in history.
        const prevIdx = history[cursor - 1]
        if (prevIdx >= 0 && prevIdx < tracks.length) {
          shuffleHistoryCursorRef.current = cursor - 1
          playTrackAtIndex(prevIdx, /* pushHistory */ false)
        } else {
          console.warn('Invalid history index:', prevIdx)
          // Fallback: restart current track
          const track = tracks[currentIdxRef.current]
          if (track && ytReadyRef.current && ytPlayerRef.current) {
            ytPlayerRef.current.seekTo(track.startTime, true)
            setCurrentTime(0)
            setProgress(0)
          }
        }
      } else {
        // Nothing further back — just restart the current track.
        const track = tracks[currentIdxRef.current]
        if (track && ytReadyRef.current && ytPlayerRef.current) {
          ytPlayerRef.current.seekTo(track.startTime, true)
          setCurrentTime(0)
          setProgress(0)
        }
      }
      return
    }

    // ── Sequential / loop mode ───────────────────────────────────────────────
    const prevIdx = (currentIdxRef.current - 1 + tracks.length) % tracks.length
    if (prevIdx >= 0 && prevIdx < tracks.length) {
      playTrackAtIndex(prevIdx)
    } else {
      console.warn('Invalid prev index calculated:', prevIdx, 'tracks.length:', tracks.length)
    }
  }, [playTrackAtIndex])

  const handleSeekChange = useCallback((e) => {
    isSeekingRef.current = true
    const pct = parseFloat(e.target.value)
    const track = tracksRef.current[currentIdxRef.current]
    if (!track) return
    setProgress(pct)
    setCurrentTime((pct / 100) * (track.endTime - track.startTime))
  }, [])

  const handleSeekCommit = useCallback((e) => {
    const pct = parseFloat(e.target.value)
    const track = tracksRef.current[currentIdxRef.current]
    if (!track) return
    const seekTo =
      track.startTime + (pct / 100) * (track.endTime - track.startTime)
    if (ytReadyRef.current && ytPlayerRef.current)
      ytPlayerRef.current.seekTo(seekTo, true)
    isSeekingRef.current = false
  }, [])

  const handleShuffleToggle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev
      isShuffleRef.current = next
      if (next) {
        isLoopRef.current = false
        setIsLoop(false)
        // Seed the history with the currently playing track so prev works
        // immediately after enabling shuffle.
        shuffleHistoryRef.current = [currentIdxRef.current]
        shuffleHistoryCursorRef.current = 0
      }
      return next
    })
  }, [])

  const handleLoopToggle = useCallback(() => {
    setIsLoop((prev) => {
      const next = !prev
      isLoopRef.current = next
      if (next) {
        isShuffleRef.current = false
        setIsShuffle(false)
      }
      return next
    })
  }, [])

  const handleVolumeChange = useCallback((e) => {
    const nextVolume = parseFloat(e.target.value)
    setVolume(nextVolume)
    if (ytReadyRef.current && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(nextVolume)
    }
  }, [])

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
  }
}
