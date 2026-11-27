import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import ScrollToTop from '@/components/ScrollToTop'

function RouteControls() {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate('/second')}>
      Navigate
    </button>
  )
}

const setScrollY = (value) => {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value,
  })
}

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={['/first']}>
      <RouteControls />
      <ScrollToTop />
    </MemoryRouter>
  )

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  setScrollY(0)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ScrollToTop', () => {
  it('starts hidden and scrolls to top on route change after 50 ms', () => {
    renderComponent()

    const button = screen.getByRole('button', { name: 'Scroll to top' })
    expect(button).not.toHaveClass('pointer-events-auto')

    act(() => {
      vi.advanceTimersByTime(49)
    })
    expect(window.scrollTo).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  })

  it('shows only when scrollY is greater than 300 and hides at 300', () => {
    renderComponent()
    act(() => vi.advanceTimersByTime(50))

    const button = screen.getByRole('button', { name: 'Scroll to top' })

    setScrollY(300)
    fireEvent.scroll(window)
    expect(button).not.toHaveClass('pointer-events-auto')

    setScrollY(301)
    fireEvent.scroll(window)
    expect(button).toHaveClass('pointer-events-auto')
    expect(button).toHaveClass('opacity-100')

    setScrollY(300)
    fireEvent.scroll(window)
    expect(button).not.toHaveClass('pointer-events-auto')
  })

  it('scrolls to top when clicked', () => {
    renderComponent()
    act(() => vi.advanceTimersByTime(50))
    vi.clearAllMocks()

    fireEvent.click(screen.getByRole('button', { name: 'Scroll to top' }))

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    })
  })

  it('scrolls after pathname changes', () => {
    renderComponent()
    act(() => vi.advanceTimersByTime(50))
    vi.clearAllMocks()

    fireEvent.click(screen.getByRole('button', { name: 'Navigate' }))

    act(() => {
      vi.advanceTimersByTime(49)
    })
    expect(window.scrollTo).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  })

  it('preserves the accessible name, title, and focus styling', () => {
    renderComponent()
    const button = screen.getByRole('button', { name: 'Scroll to top' })

    expect(button).toHaveAttribute('title', 'Scroll to top')
    expect(button).not.toHaveClass('outline-none')
    expect(button).toHaveClass('focus-visible:outline-2')
    expect(button).toHaveClass('focus-visible:outline-offset-[3px]')
  })
})
