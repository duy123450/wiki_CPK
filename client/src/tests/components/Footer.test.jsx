import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '@/components/Footer'

const renderFooter = (props = {}) =>
    render(
        <MemoryRouter>
            <Footer sidebarCollapsed={false} {...props} />
        </MemoryRouter>
    )

describe('Footer', () => {
    it('renders brand title', () => {
        renderFooter()
        expect(screen.getByText('超かぐや姫')).toBeInTheDocument()
    })

    it('renders "Fan Wiki" subtitle', () => {
        renderFooter()
        expect(screen.getByText('Chou Kaguya Hime! Wiki')).toBeInTheDocument()
    })

    it('renders all quick links', () => {
        renderFooter()
        expect(screen.getByText('Movie Info / Phim')).toBeInTheDocument()
        expect(screen.getByText('Characters / Nhân vật')).toBeInTheDocument()
        expect(screen.getByText('Music / Âm nhạc')).toBeInTheDocument()
        expect(screen.getByText('Lore & World / Thế giới')).toBeInTheDocument()
    })

    it('renders email contact link', () => {
        renderFooter()
        const emailLinks = screen.getAllByText('168daisuki8000@gmail.com')
        expect(emailLinks.length).toBeGreaterThanOrEqual(1)
    })

    it('renders GitHub link with target _blank', () => {
        renderFooter()
        const ghLink = screen.getByText('GitHub').closest('a')
        expect(ghLink).toHaveAttribute('target', '_blank')
        expect(ghLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('renders copyright with current year', () => {
        renderFooter()
        const year = new Date().getFullYear()
        expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument()
    })

    it('applies sidebar-collapsed class when sidebarCollapsed=true', () => {
        const { container } = render(
            <MemoryRouter>
                <Footer sidebarCollapsed={true} />
            </MemoryRouter>
        )
        expect(container.querySelector('.cpk-footer')).toHaveClass('sidebar-collapsed')
    })
})
