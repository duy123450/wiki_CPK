import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import useYouTubePlayer from '@/hooks/useYouTubePlayer'
import { fetchNextTrack } from '@/services/api'

vi.mock('@/services/api', () => ({
  fetchNextTrack: vi.fn(),
}))

vi.mock('@/utils/youtubeUtils', () => ({
  loadYouTubeAPI: vi.fn(),
}))

const tracks = [
  {
    _id: 'track-1',
    youtubeId: 'video-1',
    startTime: 0,
    endTime: 90,
  },
  {
    _id: 'track-2',
    youtubeId: 'video-2',
    startTime: 0,
    endTime: 90,
  },
]

const movie = { _id: 'movie-1' }

describe('useYouTubePlayer playback modes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses shuffle mode when shuffle is enabled and next is clicked immediately', async () => {
    fetchNextTrack.mockResolvedValueOnce({ track: tracks[1] })

    const { result } = renderHook(() => useYouTubePlayer(tracks, movie))

    await act(async () => {
      result.current.handleShuffleToggle()
      await result.current.handleNext()
    })

    expect(fetchNextTrack).toHaveBeenCalledWith({
      currentTrackId: 'track-1',
      mode: 'shuffle',
      movieId: 'movie-1',
    })
  })
})
