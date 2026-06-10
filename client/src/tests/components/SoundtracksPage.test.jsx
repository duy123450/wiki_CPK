import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import SoundtracksPage from '@/pages/SoundtracksPage'

// Mock API calls
vi.mock('@/services/api', () => ({
  AUTH_TOKEN_KEY: 'testToken',
  fetchMovieInfo: vi.fn(),
  fetchSoundtracks: vi.fn(),
  getSoundtrackBySlug: vi.fn(),
}))

import { fetchMovieInfo, fetchSoundtracks } from '@/services/api'

const mockMovie = {
  _id: 'movie-123',
  title: 'Chou Kaguya Hime',
}

const mockTracks = [
  {
    _id: 't1',
    slug: 'opening-theme',
    trackNumber: 1,
    title: 'Opening Theme',
    vocal: 'Vocaloid IA',
    producer: 'Producer Jin',
    trackType: 'Opening',
    youtubeId: 'yt123',
    startTime: 0,
    endTime: 90,
    coverImage: 'http://img.com/opening.jpg',
  },
  {
    _id: 't2',
    slug: 'ending-theme',
    trackNumber: 2,
    title: 'Ending Theme',
    vocal: 'Vocaloid Luka',
    producer: 'Producer Dixie',
    trackType: 'Ending',
    youtubeId: 'yt456',
    startTime: 0,
    endTime: 120,
    coverImage: null,
  },
]

const renderPage = (store) =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <SoundtracksPage sidebarCollapsed={false} />
      </MemoryRouter>
    </Provider>
  )

describe('SoundtracksPage', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    store = makeStore()
    fetchMovieInfo.mockResolvedValue({ movie: mockMovie })
    fetchSoundtracks.mockResolvedValue({ tracks: mockTracks })
  })

  it('renders header movie title and page details', async () => {
    renderPage(store)

    await waitFor(() => {
      expect(screen.getByText('Chou Kaguya Hime')).toBeInTheDocument()
      expect(screen.getByText('Original Soundtrack')).toBeInTheDocument()
    })
  })

  it('renders a list of track cards when loaded successfully', async () => {
    renderPage(store)

    await waitFor(() => {
      expect(screen.getByText('Opening Theme')).toBeInTheDocument()
      expect(screen.getByText('Ending Theme')).toBeInTheDocument()
    })

    expect(screen.getByText('Vocaloid IA')).toBeInTheDocument()
    expect(screen.getByText('Vocaloid Luka')).toBeInTheDocument()
    expect(screen.getAllByText('Music')[0]).toBeInTheDocument()
    expect(screen.getByText('Producer Jin')).toBeInTheDocument()
    expect(screen.getByText('Producer Dixie')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
  })

  it('shows skeleton cards during the loading phase', async () => {
    // Keep API calls pending to simulate loading
    fetchMovieInfo.mockReturnValue(new Promise(() => {}))
    fetchSoundtracks.mockReturnValue(new Promise(() => {}))

    const { container } = renderPage(store)

    // Check that skeleton cards are present
    const skeletons = container.querySelectorAll('.st-card--skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('filters tracks by search term (case-insensitive)', async () => {
    const user = userEvent.setup()
    renderPage(store)

    await waitFor(() => {
      expect(screen.getByText('Opening Theme')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search tracks…')

    // Search for vocal
    await user.type(searchInput, 'Luka')
    expect(screen.queryByText('Opening Theme')).not.toBeInTheDocument()
    expect(screen.getByText('Ending Theme')).toBeInTheDocument()

    // Clear search and search for producer
    await user.clear(searchInput)
    await user.type(searchInput, 'Jin')
    expect(screen.getByText('Opening Theme')).toBeInTheDocument()
    expect(screen.queryByText('Ending Theme')).not.toBeInTheDocument()
  })

  it('filters tracks by track type pills', async () => {
    const user = userEvent.setup()
    renderPage(store)

    await waitFor(() => {
      expect(screen.getByText('Opening Theme')).toBeInTheDocument()
    })

    const openingPill = screen.getByRole('button', { name: 'Opening' })
    const endingPill = screen.getByRole('button', { name: 'Ending' })

    // Click Ending filter pill
    await user.click(endingPill)
    expect(screen.queryByText('Opening Theme')).not.toBeInTheDocument()
    expect(screen.getByText('Ending Theme')).toBeInTheDocument()

    // Click Opening filter pill
    await user.click(openingPill)
    expect(screen.getByText('Opening Theme')).toBeInTheDocument()
    expect(screen.queryByText('Ending Theme')).not.toBeInTheDocument()
  })

  it('shows no tracks message when filters produce no results', async () => {
    const user = userEvent.setup()
    renderPage(store)

    await waitFor(() => {
      expect(screen.getByText('Opening Theme')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search tracks…')
    await user.type(searchInput, 'mismatching query')

    expect(screen.getByText('No tracks found.')).toBeInTheDocument()

    // Clicking "Clear filters" should reset input
    const clearBtn = screen.getByRole('button', { name: 'Clear filters' })
    await user.click(clearBtn)

    await waitFor(() => {
      expect(screen.getByText('Opening Theme')).toBeInTheDocument()
      expect(screen.getByText('Ending Theme')).toBeInTheDocument()
    })
  })

  it('renders track count info correctly', async () => {
    const user = userEvent.setup()
    renderPage(store)

    await waitFor(() => {
      expect(screen.getByText(/Showing/)).toBeInTheDocument()
    })

    const countEl = screen.getByText(/Showing/).closest('.st-count')
    expect(countEl).toHaveTextContent('Showing 2 of 2 tracks')

    // Filter to 1 track
    const searchInput = screen.getByPlaceholderText('Search tracks…')
    await user.type(searchInput, 'Opening')
    expect(countEl).toHaveTextContent('Showing 1 of 2 tracks')
  })
})
