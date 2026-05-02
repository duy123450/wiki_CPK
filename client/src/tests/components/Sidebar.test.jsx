import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'

// Mock API
vi.mock('@/services/api', () => ({
    getSidebar: vi.fn(),
}))

import { getSidebar } from '@/services/api'

const defaultProps = {
    onCollapseChange: vi.fn(),
    onDragonCursorToggle: vi.fn(),
    dragonCursorEnabled: true,
    currentUser: null,
    onLogout: vi.fn(),
}

const renderSidebar = (overrides = {}) =>
    render(
        <MemoryRouter>
            <Sidebar {...defaultProps} {...overrides} />
        </MemoryRouter>
    )

beforeEach(() => {
    vi.clearAllMocks()
    // Default: resolve with empty
    getSidebar.mockResolvedValue([])
})

describe('Sidebar — Basic Rendering', () => {
    it('renders "Fan Wiki" text', async () => {
        renderSidebar()
        expect(screen.getByText('Fan Wiki')).toBeInTheDocument()
    })

    it('renders "Navigation" label', () => {
        renderSidebar()
        expect(screen.getByText('Navigation')).toBeInTheDocument()
    })

    it('renders CPK Wiki footer text', () => {
        renderSidebar()
        expect(screen.getByText('CPK Wiki')).toBeInTheDocument()
    })

    it('renders logo image', () => {
        renderSidebar()
        const logo = screen.getByAltText('Cosmic Princess Kaguya')
        expect(logo).toBeInTheDocument()
    })
})

describe('Sidebar — Loading & Data', () => {
    it('shows "No categories found" when API returns empty', async () => {
        getSidebar.mockResolvedValueOnce([])
        renderSidebar()

        await waitFor(() => {
            expect(screen.getByText('No categories found')).toBeInTheDocument()
        })
    })

    it('renders categories after fetch', async () => {
        getSidebar.mockResolvedValueOnce([
            {
                _id: '1',
                name: 'Characters',
                slug: 'characters',
                icon: 'users',
                pages: [{ slug: 'kaguya', title: 'Kaguya' }],
            },
        ])

        renderSidebar()

        await waitFor(() => {
            expect(screen.getByText('Characters')).toBeInTheDocument()
        })
    })

    it('handles API error gracefully', async () => {
        getSidebar.mockRejectedValueOnce(new Error('Network error'))
        renderSidebar()

        await waitFor(() => {
            expect(screen.getByText('No categories found')).toBeInTheDocument()
        })
    })
})

describe('Sidebar — Toggle', () => {
    it('toggle button collapses sidebar', async () => {
        const user = userEvent.setup()
        const { container } = renderSidebar()

        const toggleBtn = screen.getByTitle('Close sidebar')
        await user.click(toggleBtn)

        expect(container.querySelector('.cpk-sidebar')).toHaveClass('collapsed')
    })
})

describe('Sidebar — Category Interaction', () => {
    it('expands category on click', async () => {
        const user = userEvent.setup()
        getSidebar.mockResolvedValueOnce([
            {
                _id: '1',
                name: 'Characters',
                slug: 'characters',
                icon: 'users',
                pages: [
                    { slug: 'kaguya', title: 'Kaguya' },
                    { slug: 'iroha', title: 'Iroha' },
                ],
            },
        ])

        renderSidebar()

        await waitFor(() => {
            expect(screen.getByText('Characters')).toBeInTheDocument()
        })

        const categoryBtn = screen.getByText('Characters').closest('button')
        await user.click(categoryBtn)

        expect(screen.getByText('Kaguya')).toBeInTheDocument()
        expect(screen.getByText('Iroha')).toBeInTheDocument()
    })
})

describe('Sidebar — Auth State', () => {
    it('shows login button when no user', () => {
        renderSidebar({ currentUser: null })
        const loginBtn = screen.getByTitle('Login / Register')
        expect(loginBtn).toBeInTheDocument()
    })

    it('shows avatar when user is logged in', () => {
        const currentUser = {
            username: 'testuser',
            avatar: { url: 'http://img.com/a.png' },
            role: 'viewer',
        }
        renderSidebar({ currentUser })
        const avatarBtn = screen.getByTitle('testuser')
        expect(avatarBtn).toBeInTheDocument()
    })

    it('shows avatar flyout with Profile and Log Out on click', async () => {
        const user = userEvent.setup()
        const currentUser = {
            username: 'testuser',
            avatar: { url: 'http://img.com/a.png' },
            role: 'viewer',
        }
        renderSidebar({ currentUser })

        await user.click(screen.getByTitle('testuser'))

        await waitFor(() => {
            expect(screen.getByText('Profile')).toBeInTheDocument()
            expect(screen.getByText('Log Out')).toBeInTheDocument()
        })
    })

    it('shows Admin option for admin users', async () => {
        const user = userEvent.setup()
        const currentUser = {
            username: 'admin',
            avatar: { url: 'http://img.com/a.png' },
            role: 'admin',
        }
        renderSidebar({ currentUser })

        await user.click(screen.getByTitle('admin'))

        await waitFor(() => {
            expect(screen.getByText('Admin')).toBeInTheDocument()
        })
    })

    it('does NOT show Admin option for viewer users', async () => {
        const user = userEvent.setup()
        const currentUser = {
            username: 'viewer',
            avatar: { url: 'http://img.com/a.png' },
            role: 'viewer',
        }
        renderSidebar({ currentUser })

        await user.click(screen.getByTitle('viewer'))

        await waitFor(() => {
            expect(screen.getByText('Profile')).toBeInTheDocument()
            expect(screen.queryByText('Admin')).not.toBeInTheDocument()
        })
    })
})

describe('Sidebar — Dragon Cursor Toggle', () => {
    it('renders dragon cursor toggle button', () => {
        renderSidebar()
        const btn = screen.getByTitle('Disable dragon cursor')
        expect(btn).toBeInTheDocument()
        expect(btn).toHaveAttribute('aria-pressed', 'true')
    })

    it('calls onDragonCursorToggle on click', async () => {
        const user = userEvent.setup()
        const onToggle = vi.fn()
        renderSidebar({ onDragonCursorToggle: onToggle })

        await user.click(screen.getByTitle('Disable dragon cursor'))
        expect(onToggle).toHaveBeenCalled()
    })
})
