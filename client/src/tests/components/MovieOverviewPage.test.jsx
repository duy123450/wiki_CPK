import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import useMovieInfo from '@/hooks/useMovieInfo'
import MovieOverviewPage from '@/pages/MovieOverviewPage'

vi.mock('@/hooks/useMovieInfo', () => ({
  default: vi.fn(),
}))

const movie = {
  title: 'Moon Princess',
  tagline: 'A story among the stars.',
  synopsis: 'A princess travels to Earth.',
  rating: 8.6,
  poster: [{}, { url: '/poster.jpg' }, { url: '/backdrop.jpg' }],
  details: {
    releaseDate: '2024-01-15',
    runtime: '120',
    studio: 'Moon Studio',
    director: 'A. Director',
    officialWebsite: 'https://example.com',
    trailerUrl: [
      { label: 'First Trailer', url: 'https://youtu.be/abc12345678' },
      { label: 'Second Trailer', url: 'https://youtu.be/xyz12345678' },
    ],
  },
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <MovieOverviewPage sidebarCollapsed={false} />
    </MemoryRouter>
  )

afterEach(() => {
  vi.clearAllMocks()
})

describe('MovieOverviewPage', () => {
  it('preserves the loading state', () => {
    useMovieInfo.mockReturnValue({ data: null, loading: true, error: null })

    renderPage()

    expect(screen.getByText('Fan Wiki · Movie Overview')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Moon Princess' })).toBeNull()
  })

  it('preserves error and missing-poster fallback states', () => {
    useMovieInfo.mockReturnValue({
      data: null,
      loading: false,
      error: 'Request failed',
    })

    renderPage()

    expect(screen.getByText('Could not load movie data.')).toBeInTheDocument()
    expect(screen.getByText('超かぐや姫')).toBeInTheDocument()
    expect(screen.getByText('No synopsis available.')).toBeInTheDocument()
  })

  it('renders movie details, destinations, and selectable trailer embeds', () => {
    useMovieInfo.mockReturnValue({ data: movie, loading: false, error: null })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Moon Princess' })).toBeInTheDocument()
    expect(screen.getByText('A princess travels to Earth.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Official Site ↗' })).toHaveAttribute(
      'href',
      'https://example.com'
    )
    expect(screen.getByRole('link', { name: 'Official Site ↗' })).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    )
    expect(screen.getByRole('link', { name: 'Meet the Cast' })).toHaveAttribute(
      'href',
      '/wiki/characters'
    )
    expect(screen.getByTitle('First Trailer')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/abc12345678'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Second Trailer' }))

    expect(screen.getByTitle('Second Trailer')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/xyz12345678'
    )
  })
})
