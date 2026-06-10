import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import SoundtrackPage from '@/pages/SoundtrackPage'
import { useSoundtrack } from '@/hooks/useSoundtrack'

// Mock useSoundtrack hook
vi.mock('@/hooks/useSoundtrack', () => ({
  useSoundtrack: vi.fn(),
}))

// Mock API calls that might be triggered by children/store (e.g. auth restore)
vi.mock('@/services/api', () => ({
  AUTH_TOKEN_KEY: 'testToken',
}))

const mockTrack = {
  _id: 'track-1',
  slug: 'test-track',
  trackNumber: 5,
  title: 'Test Soundtrack Title',
  vocal: 'Vocal Singer',
  producer: 'Music Producer',
  trackType: 'Insert Song',
  youtubeId: 'yt123456789',
  startTime: 10,
  endTime: 200,
  coverImage: 'http://img.com/cover.png',
  officialUrl: [
    { label: 'Spotify', url: 'https://spotify.com/test' },
    { label: 'YouTube Music', url: 'https://music.youtube.com/watch?v=diffYtId456' },
  ],
  lyrics: {
    romaji: 'Romaji lyrics go here\nLine 2',
    translation: 'English translation goes here\nLine 2',
    translator: 'Translating Editor',
    source: 'Official Booklet',
  },
  movie: {
    _id: 'movie-1',
    title: 'CPK Movie',
  },
}

const renderPage = (store) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/wiki/soundtrack/test-track']}>
        <Routes>
          <Route path="/wiki/soundtrack/:slug" element={<SoundtrackPage sidebarCollapsed={false} />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  )

describe('SoundtrackPage', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    store = makeStore()
  })

  it('renders track details correctly when loaded', async () => {
    useSoundtrack.mockReturnValue({
      track: mockTrack,
      loading: false,
      error: null,
    })

    renderPage(store)

    expect(screen.getByText('Test Soundtrack Title')).toBeInTheDocument()
    expect(screen.getByText('#5')).toBeInTheDocument()
    expect(screen.getByText('Vocal Singer')).toBeInTheDocument()
    expect(screen.getByText('Music Producer')).toBeInTheDocument()
    expect(screen.getByText('Insert Song')).toBeInTheDocument()
    expect(screen.getByAltText('Test Soundtrack Title')).toHaveAttribute('src', 'http://img.com/cover.png')

    // Check official links
    const spotifyLink = screen.getByText('Spotify')
    expect(spotifyLink).toBeInTheDocument()
    expect(spotifyLink).toHaveAttribute('href', 'https://spotify.com/test')
  })

  it('renders vinyl disc placeholder when coverImage is not provided', async () => {
    const trackNoCover = {
      ...mockTrack,
      coverImage: null,
    }
    useSoundtrack.mockReturnValue({
      track: trackNoCover,
      loading: false,
      error: null,
    })

    const { container } = renderPage(store)

    expect(screen.queryByAltText('Test Soundtrack Title')).not.toBeInTheDocument()
    const vinylDisc = container.querySelector('.strk-vinyl-disc')
    expect(vinylDisc).toBeInTheDocument()
  })

  it('renders YouTube iframe player and handles alternative sources', async () => {
    const user = userEvent.setup()
    useSoundtrack.mockReturnValue({
      track: mockTrack,
      loading: false,
      error: null,
    })

    const { container } = renderPage(store)

    // Check iframe rendering
    const iframe = container.querySelector('iframe')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/yt123456789?start=10')

    // Multiple sources selector buttons (we have Default and YouTube Music)
    const ytMusicButton = screen.getByRole('button', { name: 'YouTube Music' })
    const defaultButton = screen.getByRole('button', { name: 'Default' })
    expect(ytMusicButton).toBeInTheDocument()
    expect(defaultButton).toBeInTheDocument()

    // Click alternative source
    await user.click(ytMusicButton)
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/diffYtId456')
  })

  it('renders lyrics panel and allows switching tabs', async () => {
    const user = userEvent.setup()
    useSoundtrack.mockReturnValue({
      track: mockTrack,
      loading: false,
      error: null,
    })

    const { container } = renderPage(store)

    // Lyrics title section
    expect(screen.getByText('Lyrics')).toBeInTheDocument()
    // "Translation by <em>X</em>" is split across nodes — use toHaveTextContent on parent
    const creditEl = container.querySelector('.strk-lyrics-credit')
    expect(creditEl).toHaveTextContent('Translation by Translating Editor')
    expect(screen.getByText('Source: Official Booklet')).toBeInTheDocument()

    // Romaji lyrics active by default
    expect(screen.getByText(/Romaji lyrics go here/)).toBeInTheDocument()
    expect(screen.queryByText(/English translation goes here/)).not.toBeInTheDocument()

    // Switch to Translation tab
    const transTabBtn = screen.getByRole('button', { name: 'Translation' })
    await user.click(transTabBtn)

    expect(screen.queryByText(/Romaji lyrics go here/)).not.toBeInTheDocument()
    expect(screen.getByText(/English translation goes here/)).toBeInTheDocument()
  })

  it('shows skeleton loader when track is loading', async () => {
    useSoundtrack.mockReturnValue({
      track: null,
      loading: true,
      error: null,
    })

    const { container } = renderPage(store)

    const skeleton = container.querySelector('.strk-skeleton')
    expect(skeleton).toBeInTheDocument()
  })

  it('shows error banner when fetching fails', async () => {
    useSoundtrack.mockReturnValue({
      track: null,
      loading: false,
      error: 'Failed to fetch soundtrack from server',
    })

    renderPage(store)

    expect(screen.getByText('Failed to fetch soundtrack from server')).toBeInTheDocument()
    expect(screen.getByText('← Back to Soundtrack')).toBeInTheDocument()
  })
})
