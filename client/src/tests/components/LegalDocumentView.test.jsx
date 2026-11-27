import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLegalDocument } from '@/hooks/useLegalDocument'
import LegalPage from '@/pages/LegalPage'

vi.mock('@/hooks/useLegalDocument', () => ({
  useLegalDocument: vi.fn(),
}))

const renderPage = (type = 'PRIVACY_POLICY') =>
  render(<LegalPage sidebarCollapsed={false} type={type} />)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('LegalPage', () => {
  it.each([
    ['loading', { data: null, loading: true, error: null }, 'Loading...'],
    ['error', { data: null, loading: false, error: 'Unavailable' }, 'Error: Unavailable'],
    ['missing document', { data: null, loading: false, error: null }, 'Document not found.'],
  ])('preserves the %s state and particle background', (_state, result, message) => {
    useLegalDocument.mockReturnValue(result)
    const { container } = renderPage()

    expect(screen.getByText(message)).toBeInTheDocument()
    expect(container.querySelector('.legal-particles')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    expect(container.querySelectorAll('.legal-particle')).toHaveLength(20)
  })

  it('renders document metadata and dynamic HTML while switching languages', async () => {
    const englishDocument = {
      version: '2.3',
      effectiveDate: '2024-01-15T00:00:00.000Z',
      summary: 'English summary.',
      content:
        '<h2>Scope</h2><p>Read the <a href="/privacy">privacy policy</a>.</p><ul><li>First item</li></ul>',
    }
    const vietnameseDocument = {
      version: '2.4',
      effectiveDate: '2024-02-01T00:00:00.000Z',
      content: '<h2>Phạm vi</h2><p>Nội dung bằng tiếng Việt.</p>',
    }
    useLegalDocument.mockImplementation((_type, lang) => ({
      data: lang === 'en' ? englishDocument : vietnameseDocument,
      loading: false,
      error: null,
    }))

    const user = userEvent.setup()
    const { container } = renderPage()

    expect(screen.getByRole('heading', { name: 'Privacy Policy', level: 1 }))
      .toBeInTheDocument()
    expect(screen.getByText('Version: 2.3')).toBeInTheDocument()
    expect(
      screen.getByText(
        `Effective: ${new Date(englishDocument.effectiveDate).toLocaleDateString()}`
      )
    ).toBeInTheDocument()
    expect(screen.getByText('English summary.')).toBeInTheDocument()

    const legalContent = container.querySelector('.legal-content')
    expect(legalContent).not.toBeNull()
    const content = within(legalContent)
    expect(content.getByRole('heading', { name: 'Scope', level: 2 })).toBeInTheDocument()
    expect(content.getByRole('link', { name: 'privacy policy' })).toHaveAttribute(
      'href',
      '/privacy'
    )
    expect(content.getByRole('listitem')).toHaveTextContent('First item')

    const englishButton = screen.getByRole('button', { name: 'English' })
    const vietnameseButton = screen.getByRole('button', { name: 'Tiếng Việt' })
    expect(englishButton).toBeDisabled()
    expect(vietnameseButton).toBeEnabled()

    await user.click(vietnameseButton)

    expect(useLegalDocument).toHaveBeenLastCalledWith('PRIVACY_POLICY', 'vi')
    expect(screen.getByRole('heading', { name: 'Chính sách bảo mật', level: 1 }))
      .toBeInTheDocument()
    expect(screen.getByText('Version: 2.4')).toBeInTheDocument()
    expect(screen.queryByText('Summary / Tóm tắt')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Phạm vi', level: 2 }))
      .toBeInTheDocument()
    expect(englishButton).toBeEnabled()
    expect(vietnameseButton).toBeDisabled()

    await user.click(englishButton)

    expect(useLegalDocument).toHaveBeenLastCalledWith('PRIVACY_POLICY', 'en')
    expect(screen.getByRole('heading', { name: 'Privacy Policy', level: 1 }))
      .toBeInTheDocument()
  })

  it('renders the Terms of Use title for terms documents', () => {
    useLegalDocument.mockReturnValue({
      data: { version: '1.0', effectiveDate: '2024-01-01', content: '' },
      loading: false,
      error: null,
    })

    renderPage('TERMS_OF_USE')

    expect(screen.getByRole('heading', { name: 'Terms of Use', level: 1 }))
      .toBeInTheDocument()
  })
})
