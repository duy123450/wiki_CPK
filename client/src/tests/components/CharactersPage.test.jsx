import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CharactersPage from '@/pages/CharactersPage'

// Mock API
vi.mock('@/services/api', () => ({
    getCharacters: vi.fn(),
}))

// Mock useMovieInfo hook
vi.mock('@/hooks/useMovieInfo', () => ({
    default: vi.fn(() => ({
        data: { title: '超かぐや姫', tagline: 'A tale of the moon' },
        loading: false,
        error: null,
    })),
}))

import { getCharacters } from '@/services/api'

const mockCharacters = [
    {
        _id: '1',
        name: 'Kaguya',
        slug: 'kaguya',
        role: 'Protagonist',
        voiceActor: 'Test VA',
        image: [{ url: 'http://img.com/kaguya.png' }],
        description: { summary: 'The moon princess' },
    },
    {
        _id: '2',
        name: 'Iroha',
        slug: 'iroha',
        role: 'Supporting',
        voiceActor: 'Another VA',
        image: [{ url: 'http://img.com/iroha.png' }],
        description: { summary: 'A loyal friend' },
    },
]

const mockResponse = {
    characters: mockCharacters,
    pagination: { total: 2, totalPages: 1, page: 1, limit: 12 },
}

const renderPage = () =>
    render(
        <MemoryRouter>
            <CharactersPage sidebarCollapsed={false} />
        </MemoryRouter>
    )

beforeEach(() => {
    vi.clearAllMocks()
    getCharacters.mockResolvedValue(mockResponse)
})

describe('CharactersPage', () => {
    it('shows header title from movie data', async () => {
        renderPage()
        expect(screen.getByText('超かぐや姫')).toBeInTheDocument()
        await screen.findByText('Kaguya')
    })

    it('renders character cards after loading', async () => {
        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Kaguya')).toBeInTheDocument()
            expect(screen.getByText('Iroha')).toBeInTheDocument()
        })
    })

    it('shows role badges', async () => {
        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Protagonist')).toBeInTheDocument()
            expect(screen.getByText('Supporting')).toBeInTheDocument()
        })
    })

    it('shows voice actor info', async () => {
        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Test VA')).toBeInTheDocument()
        })
    })

    it('shows character summary', async () => {
        renderPage()

        await waitFor(() => {
            expect(screen.getByText('The moon princess')).toBeInTheDocument()
        })
    })

    it('character cards link to detail page', async () => {
        renderPage()

        await waitFor(() => {
            const link = screen.getByText('Kaguya').closest('a')
            expect(link).toHaveAttribute('href', '/wiki/characters/kaguya')
        })
    })

    it('shows "View Profile" CTA on cards', async () => {
        renderPage()

        await waitFor(() => {
            const ctas = screen.getAllByText('View Profile')
            expect(ctas.length).toBeGreaterThanOrEqual(1)
        })
    })

    it('shows count of characters', async () => {
        renderPage()

        await waitFor(() => {
            // "Showing 2 of 2 characters" — look for the container text
            expect(screen.getByText(/Showing/)).toBeInTheDocument()
            const countEl = screen.getByText(/Showing/).closest('.chrs-count')
            expect(countEl).toHaveTextContent('Showing 2 of 2 characters')
        })
    })
})

describe('CharactersPage — Filter Bar', () => {
    it('renders search input', async () => {
        renderPage()
        const searchInput = screen.getByPlaceholderText('Search characters…')
        expect(searchInput).toBeInTheDocument()
        await screen.findByText('Kaguya')
    })

    it('renders role filter pills', async () => {
        renderPage()
        expect(screen.getByText('All')).toBeInTheDocument()
        await screen.findByText('Kaguya')
        // "Protagonist" appears both as a filter pill and as a role badge on a card
        const protagonistElements = screen.getAllByText('Protagonist')
        expect(protagonistElements.length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('Antagonist')).toBeInTheDocument()
        expect(screen.getByText('Cameo')).toBeInTheDocument()
    })

    it('clicking role pill triggers API call with role param', async () => {
        const user = userEvent.setup()
        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Kaguya')).toBeInTheDocument()
        })

        // Clear previous calls from initial load
        getCharacters.mockClear()
        getCharacters.mockResolvedValueOnce({
            characters: [mockCharacters[0]],
            pagination: { total: 1, totalPages: 1 },
        })

        await user.click(screen.getByText('Antagonist'))

        await waitFor(() => {
            expect(getCharacters).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'Antagonist', page: 1 })
            )
        })
    })
})

describe('CharactersPage — Empty & Error', () => {
    it('shows "No characters found" for empty results', async () => {
        getCharacters.mockResolvedValueOnce({
            characters: [],
            pagination: { total: 0, totalPages: 1 },
        })
        renderPage()

        await waitFor(() => {
            expect(screen.getByText('No characters found.')).toBeInTheDocument()
        })
    })

    it('shows retry button on error', async () => {
        getCharacters.mockRejectedValueOnce(new Error('Network error'))
        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Retry')).toBeInTheDocument()
        })
    })

    it('retry button re-fetches data', async () => {
        const user = userEvent.setup()
        getCharacters.mockRejectedValueOnce(new Error('fail'))
        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Retry')).toBeInTheDocument()
        })

        getCharacters.mockResolvedValueOnce(mockResponse)
        await user.click(screen.getByText('Retry'))

        await waitFor(() => {
            expect(screen.getByText('Kaguya')).toBeInTheDocument()
        })
    })
})

describe('CharactersPage — Pagination', () => {
    it('renders pagination when multiple pages exist', async () => {
        getCharacters.mockResolvedValueOnce({
            characters: mockCharacters,
            pagination: { total: 24, totalPages: 2, page: 1, limit: 12 },
        })
        renderPage()

        await waitFor(() => {
            const nextBtn = screen.getByLabelText('Next page')
            expect(nextBtn).toBeInTheDocument()
        })
    })

    it('does NOT render pagination for single page', async () => {
        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Kaguya')).toBeInTheDocument()
        })

        expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument()
    })
})
