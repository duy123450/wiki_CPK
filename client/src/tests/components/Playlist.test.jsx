import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Playlist from '@/components/Playlist'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import useYouTubePlayer from '@/hooks/useYouTubePlayer'

vi.mock('@/store/hooks', () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}))

vi.mock('@/hooks/useYouTubePlayer', () => ({
  default: vi.fn(),
}))

const currentTrack = {
  _id: 'track-1',
  title: 'Test Track',
  vocal: 'Test Vocal',
  producer: 'Test Producer',
  trackNumber: 1,
  startTime: 0,
  endTime: 100,
  lyrics: {
    synced: [
      { time: 5, line: 'romaji first', lineJapanese: '日本語一', lineTranslation: 'Vietnamese one' },
      { time: 10, line: 'romaji active', lineJapanese: '日本語二', lineTranslation: 'Vietnamese two' },
    ],
  },
}

const playerState = {
  currentIdx: 0,
  isPlaying: false,
  isShuffle: false,
  isLoop: false,
  progress: 0,
  currentTime: 12,
  volume: 70,
  playTrackAtIndex: vi.fn(),
  handlePlayPause: vi.fn(),
  handleNext: vi.fn(),
  handlePrev: vi.fn(),
  handleSeekChange: vi.fn(),
  handleSeekCommit: vi.fn(),
  handleShuffleToggle: vi.fn(),
  handleLoopToggle: vi.fn(),
  handleVolumeChange: vi.fn(),
  isSeekingRef: { current: false },
}

const stateWithTrack = (track) => ({
  soundtracks: {
    movie: { _id: 'movie-1' },
    all: [track],
    allStatus: 'succeeded',
    allError: null,
    movieStatus: 'succeeded',
  },
  auth: { isRestoringSession: false },
})

describe('Playlist synchronized lyrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppDispatch.mockReturnValue(vi.fn())
    useAppSelector.mockImplementation((selector) => selector(stateWithTrack(currentTrack)))
    useYouTubePlayer.mockReturnValue(playerState)
  })

  it('renders Japanese, Romaji, and Vietnamese on the same active timestamp row', () => {
    const { container } = render(<Playlist />)

    fireEvent.click(container.querySelector('.pl-sticky-expand'))
    fireEvent.click(screen.getByRole('button', { name: 'Lyrics' }))

    const activeLine = container.querySelector('.pl-synced-line--active')
    expect(activeLine).toHaveTextContent('romaji active')
    expect(activeLine).toHaveTextContent('日本語二')
    expect(activeLine).toHaveTextContent('Vietnamese two')
    expect(container.querySelectorAll('.pl-synced-line--active')).toHaveLength(1)
  })

  it('renders other synchronized languages when Japanese is missing', () => {
    const trackWithoutJapanese = {
      ...currentTrack,
      lyrics: {
        synced: [{ time: 10, line: 'romaji active', lineTranslation: 'Vietnamese two' }],
      },
    }
    useAppSelector.mockImplementation((selector) => selector(stateWithTrack(trackWithoutJapanese)))

    const { container } = render(<Playlist />)

    fireEvent.click(container.querySelector('.pl-sticky-expand'))
    fireEvent.click(screen.getByRole('button', { name: 'Lyrics' }))

    const activeLine = container.querySelector('.pl-synced-line--active')
    expect(activeLine).toHaveTextContent('romaji active')
    expect(activeLine).toHaveTextContent('Vietnamese two')
    expect(activeLine).not.toHaveTextContent('日本語')
  })
})
