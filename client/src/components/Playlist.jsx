import { useEffect, useRef, useState, useMemo } from 'react'
import useYouTubePlayer from '../hooks/useYouTubePlayer'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  fetchSoundtrackMovie,
  fetchAllSoundtracks,
} from '../store/slices/soundtrackSlice'

const fmtTime = (s) => {
  s = Math.max(0, Math.floor(s))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function TipBtn({ label, onClick, className = 'pl-icon-btn flex shrink-0 items-center justify-center rounded-full border-0 border-solid bg-transparent p-[7px] text-[#b3b3b3] [transition:color_0.15s,transform_0.1s] hover:text-white active:scale-90', children }) {
  const [show, setShow] = useState(false)
  const timer = useRef(null)
  const startHold = () => {
    timer.current = setTimeout(() => setShow(true), 400)
  }
  const endHold = () => {
    clearTimeout(timer.current)
    setShow(false)
  }
  return (
    <button
      className={`${className} pl-tip-wrap relative`}
      onClick={onClick}
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={endHold}
      onTouchStart={startHold}
      onTouchEnd={endHold}
    >
      {children}
      {show && <span className="pl-tooltip pointer-events-none absolute bottom-[calc(100%+7px)] left-1/2 z-10 whitespace-nowrap rounded-md bg-[rgba(30,30,30,0.95)] px-[9px] py-1 text-[10px] font-semibold tracking-[0.04em] text-white shadow-[0_2px_10px_rgba(0,0,0,0.4)] -translate-x-1/2 after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-[4px] after:border-transparent after:border-t-[rgba(30,30,30,0.95)] after:content-[''] animate-playlist-tooltip-in">{label}</span>}
    </button>
  )
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
    <polyline points="16 3 21 3 21 8" stroke={active ? '#1DB954' : '#b3b3b3'} />
    <line
      x1="4"
      y1="20"
      x2="21"
      y2="3"
      stroke={active ? '#1DB954' : '#b3b3b3'}
    />
    <polyline
      points="21 16 21 21 16 21"
      stroke={active ? '#1DB954' : '#b3b3b3'}
    />
    <line
      x1="15"
      y1="15"
      x2="21"
      y2="21"
      stroke={active ? '#1DB954' : '#b3b3b3'}
    />
  </svg>
)

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
    <polyline points="17 1 21 5 17 9" stroke={active ? '#1DB954' : '#b3b3b3'} />
    <path
      d="M3 11V9a4 4 0 0 1 4-4h14"
      stroke={active ? '#1DB954' : '#b3b3b3'}
    />
    <polyline points="7 23 3 19 7 15" stroke={active ? '#1DB954' : '#b3b3b3'} />
    <path
      d="M21 13v2a4 4 0 0 1-4 4H3"
      stroke={active ? '#1DB954' : '#b3b3b3'}
    />
  </svg>
)

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
)

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
)

const IconPlay = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#121212">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const IconPause = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#121212">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
)

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
)

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
)

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
)

export default function Playlist() {
  const dispatch = useAppDispatch()

  // Read from the shared Redux store — avoids duplicate fetch & race conditions
  const movie = useAppSelector((s) => s.soundtracks.movie)
  const tracks = useAppSelector((s) => s.soundtracks.all) || []
  const allStatus = useAppSelector((s) => s.soundtracks.allStatus)
  const allError = useAppSelector((s) => s.soundtracks.allError)
  const movieStatus = useAppSelector((s) => s.soundtracks.movieStatus)
  const isRestoringSession = useAppSelector((s) => s.auth.isRestoringSession)

  // accessibleTracks: use all tracks returned by the server.
  // The server already handles access control (dev mode / admin role).
  const accessibleTracks = tracks

  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('cover')

  // Kick off fetches on mount (thunks bail early if data already cached)
  useEffect(() => {
    dispatch(fetchSoundtrackMovie())
  }, [dispatch])

  useEffect(() => {
    if (movie?._id && !isRestoringSession) {
      dispatch(fetchAllSoundtracks({ movieId: movie._id, accessTier: 'privileged' }))
    }
  }, [dispatch, movie?._id, isRestoringSession])


  useEffect(() => {
    if (!isExpanded) return undefined

    const setViewportHeight = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      document.documentElement.style.setProperty(
        '--pl-viewport-height',
        `${viewportHeight}px`
      )
    }

    setViewportHeight()
    window.addEventListener('resize', setViewportHeight)
    window.visualViewport?.addEventListener('resize', setViewportHeight)
    window.visualViewport?.addEventListener('scroll', setViewportHeight)

    return () => {
      window.removeEventListener('resize', setViewportHeight)
      window.visualViewport?.removeEventListener('resize', setViewportHeight)
      window.visualViewport?.removeEventListener('scroll', setViewportHeight)
      document.documentElement.style.removeProperty('--pl-viewport-height')
    }
  }, [isExpanded])

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
  } = useYouTubePlayer(accessibleTracks, movie)

  const currentTrack = accessibleTracks[currentIdx]
  const duration = currentTrack
    ? currentTrack.endTime - currentTrack.startTime
    : 0

  const activeLineIdx = useMemo(() => {
    const synced = currentTrack?.lyrics?.synced
    if (!synced?.length) return -1
    let idx = -1
    for (let i = 0; i < synced.length; i++) {
      const item = synced[i]
      if (
        item &&
        typeof item === 'object' &&
        'time' in item &&
        item.time <= currentTime
      )
        idx = i
      else break
    }
    return idx
  }, [currentTrack?.lyrics?.synced, currentTime])

  const VISIBLE_COUNT = 5
  const visibleLines = useMemo(() => {
    const synced = currentTrack?.lyrics?.synced
    if (!synced?.length) return []
    let start = Math.max(0, activeLineIdx - 2)
    let end = Math.min(synced.length, start + VISIBLE_COUNT)
    if (end === synced.length) start = Math.max(0, end - VISIBLE_COUNT)
    return synced.slice(start, end).map((l, i) => ({
      ...l,
      originalIdx: start + i,
    }))
  }, [currentTrack?.lyrics?.synced, activeLineIdx])

  // Keep activeLine for karaoke subtitle on cover tab
  const activeLine =
    activeLineIdx >= 0 && currentTrack?.lyrics?.synced?.[activeLineIdx]
      ? currentTrack.lyrics.synced[activeLineIdx]
      : null

  const loading =
    allStatus === 'idle' ||
    allStatus === 'loading' ||
    movieStatus === 'loading' ||
    movieStatus === 'idle'

  // While loading, render nothing — player will appear once data arrives
  if (loading && !currentTrack) return null

  // On error: show a small persistent error bar so the player doesn't silently vanish
  if ((allStatus === 'failed' || allError) && !currentTrack) {
    return (
      <div className="pl-container fixed bottom-[20px] right-[20px] z-[999] font-['Source_Sans_3','Segoe_UI',sans-serif] max-[480px]:bottom-[14px] max-[480px]:right-[14px]">
        <div className="pl-sticky-bar pl-sticky-bar--error flex max-w-[280px] items-center gap-2 rounded-[10px] bg-[linear-gradient(135deg,#1DB954,#1ed760)] px-[10px] py-[6px] shadow-[0_6px_20px_rgba(0,0,0,0.4)] animate-playlist-slide-in [transition:transform_0.2s,box-shadow_0.2s] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.5)] max-[480px]:max-w-[260px]">
          <span
            className="pl-sticky-info min-w-0 flex-1 text-[0.75rem] text-[#ff6b6b]"
          >
            ♩ Could not load tracks
          </span>
          <button
            className="pl-sticky-play flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-0 border-solid bg-[rgba(18,18,18,0.18)] text-[0.65rem] text-[#121212] [padding:0.25rem_0.5rem] active:scale-[0.93] active:bg-[rgba(18,18,18,0.32)]"
            onClick={() => {
              dispatch(fetchSoundtrackMovie())
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!currentTrack) return null

  return (
    <>
      <div
        id="yt-hidden-mount"
        className="absolute top-[-9999px] h-px w-px opacity-0"
      />

      {isExpanded && (
        <div
          className="pl-backdrop-overlay fixed inset-0 z-[998] bg-[rgba(0,0,0,0.5)] animate-playlist-fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className="pl-container fixed bottom-[20px] right-[20px] z-[999] font-['Source_Sans_3','Segoe_UI',sans-serif] max-[480px]:bottom-[14px] max-[480px]:right-[14px]">
        {/* ── Collapsed bar ── */}
        {!isExpanded && (
          <div className="pl-sticky-bar flex max-w-[280px] cursor-pointer items-center gap-2 rounded-[10px] bg-[linear-gradient(135deg,#1DB954,#1ed760)] px-[10px] py-[6px] shadow-[0_6px_20px_rgba(0,0,0,0.4)] animate-playlist-slide-in [transition:transform_0.2s,box-shadow_0.2s] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.5)] max-[480px]:max-w-[260px]" onClick={() => setIsExpanded(true)}>
            <div className="pl-sticky-cover h-[34px] w-[34px] shrink-0 overflow-hidden rounded-[5px] bg-[#282828]">
              <img
                className="h-full w-full object-cover"
                src={currentTrack.coverImage || null}
                alt={currentTrack.title}
                onError={(e) => {
                  e.target.style.background = '#282828'
                }}
              />
            </div>
            <div className="pl-sticky-info min-w-0 flex-1">
              <div className="pl-sticky-title overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-bold text-[#121212]">{currentTrack.title}</div>
              <div className="pl-sticky-artist overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-[rgba(18,18,18,0.65)]">{currentTrack.vocal}</div>
            </div>
            <button
              className="pl-sticky-play flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-0 border-solid bg-[rgba(18,18,18,0.18)] text-[#121212] [transition:background_0.15s,transform_0.1s] active:scale-[0.93] active:bg-[rgba(18,18,18,0.32)]"
              onClick={(e) => {
                e.stopPropagation()
                handlePlayPause()
              }}
            >
              {isPlaying ? <IconPause size={16} /> : <IconPlay size={16} />}
            </button>
            <button
              className="pl-sticky-expand flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-0 border-solid bg-[rgba(18,18,18,0.18)] text-[#121212] [transition:background_0.15s,transform_0.1s] active:scale-[0.93] active:bg-[rgba(18,18,18,0.32)]"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
            >
              <IconChevronUp />
            </button>
          </div>
        )}

        {/* ── Expanded panel ── */}
        {isExpanded && (
          <div className="pl-panel pointer-events-auto fixed bottom-0 right-0 z-[2] flex h-[88vh] h-[88dvh] h-[calc(var(--pl-viewport-height,100vh)*0.88)] w-full flex-col overflow-hidden rounded-t-[18px] bg-[#121212] shadow-[0_-6px_28px_rgba(0,0,0,0.75)] animate-playlist-slide-up max-[480px]:h-[92vh] max-[480px]:h-[92dvh] max-[480px]:h-[calc(var(--pl-viewport-height,100vh)*0.92)] min-[769px]:bottom-5 min-[769px]:right-5 min-[769px]:h-auto min-[769px]:max-h-[calc(100vh-40px)] min-[769px]:w-[700px] min-[769px]:flex-row min-[769px]:rounded-[14px]">
            {/* ─── PLAYER ─── */}
            <div className="pl-panel-player flex min-h-0 flex-col max-[768px]:flex-[0_1_60%] max-[768px]:overflow-hidden max-[768px]:border-b max-[768px]:border-solid max-[768px]:border-b-[#282828] min-[769px]:flex-1 min-[769px]:overflow-y-auto">
              <div className="pl-panel-header relative flex shrink-0 items-center justify-center px-3 pb-1 pt-2">
                <div className="pl-player-tabs ml-3 mr-auto flex gap-4">
                  <button
                    className={`pl-tab-btn relative cursor-pointer border-0 border-solid bg-transparent px-2 py-1 text-[13px] font-semibold transition-colors duration-200 ${activeTab === 'cover' ? "pl-tab-btn--active text-[#1DB954] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:rounded-[2px] after:bg-[#1DB954] after:content-['']" : 'text-[#888] hover:text-[#ccc]'}`}
                    onClick={() => setActiveTab('cover')}
                  >
                    Player
                  </button>
                  <button
                    className={`pl-tab-btn relative cursor-pointer border-0 border-solid bg-transparent px-2 py-1 text-[13px] font-semibold transition-colors duration-200 ${activeTab === 'lyrics' ? "pl-tab-btn--active text-[#1DB954] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:rounded-[2px] after:bg-[#1DB954] after:content-['']" : 'text-[#888] hover:text-[#ccc]'}`}
                    onClick={() => setActiveTab('lyrics')}
                  >
                    Lyrics
                  </button>
                </div>
                <button
                  className="pl-panel-close absolute right-3 flex items-center border-0 border-solid bg-transparent p-1 text-[#888] [transition:color_0.2s] hover:text-white"
                  onClick={() => setIsExpanded(false)}
                >
                  <IconChevronDown />
                </button>
              </div>

              <div className="pl-panel-cover-wrap relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-3 py-1 [transform:translate3d(0,0,0)] min-[769px]:flex-none min-[769px]:px-3 min-[769px]:pb-3 min-[769px]:pt-[14px]">
                {activeTab === 'lyrics' ? (
                  <div className="pl-panel-lyrics-wrap flex h-full min-h-0 w-full flex-col justify-center gap-0 overflow-hidden px-[10px] [transform:translate3d(0,0,0)] max-[768px]:absolute max-[768px]:inset-[4px_12px] max-[768px]:h-auto max-[768px]:w-auto max-[480px]:px-2">
                    {visibleLines.length > 0 ? (
                      visibleLines.map((l) => (
                        <div
                          key={l.originalIdx}
                          className={`pl-synced-line flex min-h-0 cursor-pointer flex-col overflow-hidden rounded px-2 py-[3px] opacity-35 [transition:all_0.25s_ease] hover:opacity-60 max-[480px]:px-2 max-[480px]:py-[2px] ${l.originalIdx === activeLineIdx ? 'pl-synced-line--active bg-[rgba(29,185,84,0.08)] opacity-100' : ''}`}
                        >
                          <span className={`pl-synced-text overflow-hidden text-[18px] font-bold leading-[1.4] [display:-webkit-box] [overflow-wrap:anywhere] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [line-clamp:2] [transition:color_0.25s] max-[480px]:text-[clamp(14px,4.4vw,18px)] max-[480px]:leading-[1.25] ${l.originalIdx === activeLineIdx ? 'text-[#1DB954]' : 'text-white'}`}>{l.line}</span>
                          {typeof l.lineJapanese === 'string' && l.lineJapanese.trim() && (
                            <span className="pl-synced-translation mt-px overflow-hidden text-ellipsis whitespace-nowrap text-[11px] leading-[1.3] text-[#888]">
                              {l.lineJapanese}
                            </span>
                          )}
                          {l.lineTranslation && (
                            <span className="pl-synced-translation mt-px overflow-hidden text-ellipsis whitespace-nowrap text-[11px] leading-[1.3] text-[#888]">
                              {l.lineTranslation}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="pl-no-lyrics mt-10 text-center text-[13px] text-[#888]">
                        No lyrics available for this track.
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <img
                      className="pl-panel-cover h-full w-full object-contain [filter:drop-shadow(0_6px_24px_rgba(0,0,0,0.55))] min-[769px]:h-[200px]"
                      src={currentTrack.coverImage || null}
                      alt={currentTrack.title}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    {activeLine && (
                      <div className="pl-karaoke-sub mt-3 max-w-[90%] rounded-lg bg-[rgba(0,0,0,0.6)] px-3 py-2 text-center animate-playlist-karaoke-in">
                        <div className="pl-karaoke-line text-[14px] font-semibold text-white">{activeLine.line}</div>
                        {typeof activeLine.lineJapanese === 'string' &&
                          activeLine.lineJapanese.trim() && (
                            <div className="pl-karaoke-japanese mt-0.5 text-xs text-[#1DB954]">
                              {activeLine.lineJapanese}
                            </div>
                          )}
                        {activeLine.lineTranslation && (
                          <div className="pl-karaoke-romaji mt-0.5 text-xs text-[#1DB954]">
                            {activeLine.lineTranslation}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="pl-panel-meta shrink-0 px-3 py-1 text-center max-[480px]:px-[10px] max-[480px]:py-[2px] min-[769px]:px-3 min-[769px]:pb-2 min-[769px]:pt-0">
                <div className="pl-panel-title mb-px overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-bold text-white min-[769px]:mb-0.5 min-[769px]:text-[14px]">{currentTrack.title}</div>
                <div className="pl-panel-vocal mb-px overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[#1DB954]">{currentTrack.vocal}</div>
                <div className="pl-panel-producer overflow-hidden text-ellipsis whitespace-nowrap text-[10px] italic text-[#626262]">
                  by {currentTrack.producer}
                </div>
              </div>

              <div className="pl-panel-progress shrink-0 px-3 pb-[6px] max-[480px]:px-[10px] max-[480px]:pb-1">
                <input
                  type="range"
                  className="pl-slider mb-1 h-1 w-full cursor-pointer rounded-[2px] outline-none [-webkit-appearance:none] [appearance:none] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1DB954] [&::-webkit-slider-thumb]:[-webkit-appearance:none] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_1px_6px_rgba(29,185,84,0.45)] [&::-moz-range-thumb]:h-[12px] [&::-moz-range-thumb]:w-[12px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#1DB954] [&::-moz-range-thumb]:cursor-pointer"
                  min="0"
                  max="100"
                  value={progress}
                  step="0.1"
                  style={{
                    background: `linear-gradient(to right, #1DB954 ${progress}%, #404040 ${progress}%)`,
                  }}
                  onMouseDown={() => {
                    isSeekingRef.current = true
                  }}
                  onTouchStart={() => {
                    isSeekingRef.current = true
                  }}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekCommit}
                  onTouchEnd={handleSeekCommit}
                />
                <div className="pl-time-row flex justify-between text-[10px] text-[#888]">
                  <span className="pl-time tabular-nums">{fmtTime(currentTime)}</span>
                  <span className="pl-time tabular-nums">{fmtTime(duration)}</span>
                </div>
              </div>

              <div className="pl-controls-row flex shrink-0 items-center justify-center gap-2 px-3 pb-[6px] pt-0.5 max-[480px]:gap-1 max-[480px]:px-[10px] max-[480px]:pb-1">
                <TipBtn label="Shuffle" onClick={handleShuffleToggle}>
                  <IconShuffle active={isShuffle} />
                </TipBtn>
                <button className="pl-icon-btn flex shrink-0 items-center justify-center rounded-full border-0 border-solid bg-transparent p-[7px] text-[#b3b3b3] [transition:color_0.15s,transform_0.1s] hover:text-white active:scale-90" onClick={handlePrev}>
                  <IconPrev />
                </button>
                <button className="pl-play-btn flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-0 border-solid bg-[#1DB954] [transition:background_0.2s,transform_0.15s] hover:scale-[1.06] hover:bg-[#1ed760] active:scale-[0.96] max-[480px]:h-9 max-[480px]:w-9" onClick={handlePlayPause}>
                  {isPlaying ? <IconPause /> : <IconPlay />}
                </button>
                <button className="pl-icon-btn flex shrink-0 items-center justify-center rounded-full border-0 border-solid bg-transparent p-[7px] text-[#b3b3b3] [transition:color_0.15s,transform_0.1s] hover:text-white active:scale-90" onClick={handleNext}>
                  <IconNext />
                </button>
                <TipBtn label="Loop" onClick={handleLoopToggle}>
                  <IconLoop active={isLoop} />
                </TipBtn>
              </div>

              <div className="pl-volume-row flex shrink-0 items-center gap-[10px] px-3 pb-[10px] max-[480px]:gap-2 max-[480px]:px-[10px] max-[480px]:pb-2">
                <span className="pl-volume-icon flex shrink-0 items-center justify-center text-[#b3b3b3]" aria-hidden="true">
                  <IconVolume />
                </span>
                <input
                  type="range"
                  className="pl-slider pl-volume-slider mb-0 h-1 flex-1 cursor-pointer rounded-[2px] outline-none [-webkit-appearance:none] [appearance:none] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1DB954] [&::-webkit-slider-thumb]:[-webkit-appearance:none] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_1px_6px_rgba(29,185,84,0.45)] [&::-moz-range-thumb]:h-[12px] [&::-moz-range-thumb]:w-[12px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#1DB954] [&::-moz-range-thumb]:cursor-pointer"
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
                <span className="pl-volume-value min-w-[30px] shrink-0 text-right text-[10px] tabular-nums text-[#888]">{volume}</span>
              </div>
            </div>

            {/* ─── TRACK LIST ─── */}
            <div className="pl-panel-tracks flex min-h-0 flex-col overflow-hidden max-[768px]:min-h-0 max-[768px]:flex-[1_1_40%] min-[769px]:flex-[0_0_35%] min-[769px]:border-r min-[769px]:border-solid min-[769px]:border-r-[#282828]">
              <div className="pl-tracks-header flex shrink-0 items-center justify-between border-b border-solid border-b-[#282828] px-4 py-3 text-xs font-bold uppercase tracking-[0.5px] text-[#b3b3b3]">
                <span>Tracks ({accessibleTracks.length})</span>
              </div>
              <div className="pl-track-list min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-[max(16px,env(safe-area-inset-bottom,0px))] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-[#404040] [&::-webkit-scrollbar-thumb:hover]:bg-[#555]">
                {accessibleTracks.map((t, i) => (
                  <div
                    key={t._id}
                    className={`pl-track-row flex cursor-pointer items-center gap-[10px] px-4 py-[7px] [transition:background_0.12s] hover:bg-[rgba(255,255,255,0.05)] ${i === currentIdx ? 'pl-track-row--active bg-[rgba(29,185,84,0.12)]' : ''}`}
                    onClick={() => playTrackAtIndex(i)}
                  >
                    <span
                      className={`pl-track-num w-[22px] shrink-0 text-center text-[11px] font-semibold ${i === currentIdx ? 'pl-track-num--playing text-[#1DB954]' : 'text-[#555]'}`}
                    >
                      {i === currentIdx
                        ? '▶'
                        : String(t.trackNumber).padStart(2, '0')}
                    </span>
                    <div className="pl-track-info min-w-0 flex-1">
                      <div
                        className={`pl-track-title overflow-hidden text-ellipsis whitespace-nowrap text-[12px] ${i === currentIdx ? 'pl-track-title--active font-semibold text-[#1DB954]' : 'font-medium text-[#ddd]'}`}
                      >
                        {t.title}
                      </div>
                      <div className="pl-track-producer mt-px overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-[#555]">{t.producer}</div>
                    </div>
                    <span className="pl-track-duration shrink-0 tabular-nums text-[10px] text-[#555]">
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
  )
}
