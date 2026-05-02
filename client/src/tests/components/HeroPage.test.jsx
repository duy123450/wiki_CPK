import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HeroPage from '@/pages/HeroPage'

// Mock API
vi.mock('@/services/api', () => ({
    getMovieInfo: vi.fn(),
}))

import { getMovieInfo } from '@/services/api'

const renderHero = () =>
    render(
        <MemoryRouter>
            <HeroPage sidebarCollapsed={false} />
        </MemoryRouter>
    )

beforeEach(() => {
    vi.clearAllMocks()
})

describe('HeroPage', () => {
    it('shows shimmer loading state initially', () => {
        // Never resolve — stays in loading
        getMovieInfo.mockReturnValue(new Promise(() => {}))
        const { container } = renderHero()
        expect(container.querySelector('.hero-shimmer')).toBeInTheDocument()
    })

    it('shows error message on API failure', async () => {
        getMovieInfo.mockRejectedValueOnce(new Error('Network fail'))
        renderHero()

        await waitFor(() => {
            expect(screen.getByText('Failed to load movie data.')).toBeInTheDocument()
        })
    })

    it('shows movie title on success', async () => {
        getMovieInfo.mockResolvedValueOnce({
            title: 'Chou Kaguya Hime',
            tagline: 'A tale of the moon',
            details: { releaseDate: '2026-01-01', studio: 'FABTONE' },
        })
        renderHero()

        await waitFor(() => {
            expect(screen.getByText('Chou Kaguya Hime')).toBeInTheDocument()
        })
    })

    it('shows tagline in quotes', async () => {
        getMovieInfo.mockResolvedValueOnce({
            title: 'Test',
            tagline: 'Moon story',
            details: {},
        })
        renderHero()

        await waitFor(() => {
            expect(screen.getByText('"Moon story"')).toBeInTheDocument()
        })
    })

    it('shows release year and studio', async () => {
        getMovieInfo.mockResolvedValueOnce({
            title: 'Test',
            details: { releaseDate: '2026-06-15', studio: 'FABTONE' },
        })
        renderHero()

        await waitFor(() => {
            expect(screen.getByText('2026')).toBeInTheDocument()
            expect(screen.getByText('FABTONE')).toBeInTheDocument()
        })
    })

    it('renders "Explore Wiki" and "Movie Info" links', async () => {
        getMovieInfo.mockResolvedValueOnce({
            title: 'Test',
            details: {},
        })
        renderHero()

        await waitFor(() => {
            expect(screen.getByText('Explore Wiki')).toBeInTheDocument()
            expect(screen.getByText('Movie Info')).toBeInTheDocument()
        })

        const wikiLink = screen.getByText('Explore Wiki').closest('a')
        expect(wikiLink).toHaveAttribute('href', '/wiki/characters')

        const movieLink = screen.getByText('Movie Info').closest('a')
        expect(movieLink).toHaveAttribute('href', '/wiki/chou-kaguya-hime-overview')
    })

    it('renders stars field as aria-hidden', async () => {
        getMovieInfo.mockResolvedValueOnce({ title: 'Test', details: {} })
        const { container } = renderHero()

        await waitFor(() => {
            const stars = container.querySelector('.hero-stars')
            expect(stars).toHaveAttribute('aria-hidden', 'true')
        })
    })
})
