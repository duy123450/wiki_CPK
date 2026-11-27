import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import CookieConsent from '@/components/CookieConsent'

const renderCookieConsent = () =>
  render(
    <MemoryRouter>
      <CookieConsent />
    </MemoryRouter>
  )

describe('CookieConsent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('starts hidden and appears after 800 ms', () => {
    renderCookieConsent()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(799)
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByRole('dialog', { name: 'Cookie consent' })).toBeInTheDocument()
  })

  it.each(['accepted', 'rejected'])(
    'does not appear when consent is already %s',
    (consent) => {
      localStorage.setItem('cookie_consent', consent)

      renderCookieConsent()

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    }
  )

  it('stores accepted and dismisses after the exit transition', () => {
    renderCookieConsent()
    act(() => {
      vi.advanceTimersByTime(800)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Accept all / Chấp nhận' }))

    expect(localStorage.getItem('cookie_consent')).toBe('accepted')
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(399)
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('stores rejected and dismisses after the exit transition', () => {
    renderCookieConsent()
    act(() => {
      vi.advanceTimersByTime(800)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Reject / Từ chối' }))

    expect(localStorage.getItem('cookie_consent')).toBe('rejected')
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps Privacy and Terms links available in both languages', () => {
    renderCookieConsent()
    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy'
    )
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute(
      'href',
      '/terms'
    )
    expect(screen.getByRole('link', { name: 'Chính sách bảo mật' })).toHaveAttribute(
      'href',
      '/privacy'
    )
    expect(screen.getByRole('link', { name: 'Điều khoản sử dụng' })).toHaveAttribute(
      'href',
      '/terms'
    )
  })
})
