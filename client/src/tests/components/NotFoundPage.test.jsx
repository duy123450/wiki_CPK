import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFoundPage from '@/pages/NotFoundPage'

const renderPage = (props = {}) =>
    render(
        <MemoryRouter>
            <NotFoundPage sidebarCollapsed={false} {...props} />
        </MemoryRouter>
    )

describe('NotFoundPage', () => {
    it('renders 404 code', () => {
        renderPage()
        // Multiple 404 elements exist (shadow + h1)
        const headings = screen.getAllByText('404')
        expect(headings.length).toBeGreaterThanOrEqual(1)
    })

    it('renders Vietnamese title', () => {
        renderPage()
        expect(screen.getByText('Không tìm thấy trang.')).toBeInTheDocument()
    })

    it('renders "Về Trang Chủ" link pointing to /', () => {
        renderPage()
        const homeLink = screen.getByText('Về Trang Chủ').closest('a')
        expect(homeLink).toHaveAttribute('href', '/')
    })

    it('renders "Xem Nhân Vật" link pointing to /wiki/characters', () => {
        renderPage()
        const charsLink = screen.getByText('Xem Nhân Vật').closest('a')
        expect(charsLink).toHaveAttribute('href', '/wiki/characters')
    })

    it('applies sidebar-collapsed class', () => {
        const { container } = render(
            <MemoryRouter>
                <NotFoundPage sidebarCollapsed={true} />
            </MemoryRouter>
        )
        expect(container.querySelector('.nf-root')).toHaveClass('sidebar-collapsed')
    })

    it('renders decorative orb field as aria-hidden', () => {
        const { container } = renderPage()
        const orbField = container.querySelector('.nf-orb-field')
        expect(orbField).toHaveAttribute('aria-hidden', 'true')
    })
})
