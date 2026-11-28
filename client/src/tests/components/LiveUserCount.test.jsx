import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LiveUserCount from '@/components/LiveUserCount'
import useLiveUserCount from '@/hooks/useLiveUserCount'

vi.mock('@/hooks/useLiveUserCount', () => ({
  default: vi.fn(),
}))

describe('LiveUserCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the initial live visitor count', () => {
    useLiveUserCount.mockReturnValue(0)

    render(<LiveUserCount />)

    expect(screen.getByText(/0 con dân CPK đang online/)).toBeInTheDocument()
  })

  it('renders socket hook count updates', () => {
    useLiveUserCount.mockReturnValue(12)

    const { rerender } = render(<LiveUserCount />)

    expect(screen.getByText(/12 con dân CPK đang online/)).toBeInTheDocument()

    useLiveUserCount.mockReturnValue(13)
    rerender(<LiveUserCount />)

    expect(screen.getByText(/13 con dân CPK đang online/)).toBeInTheDocument()
  })

  it('preserves the status indicator and pulse animation', () => {
    useLiveUserCount.mockReturnValue(3)

    const { container } = render(<LiveUserCount />)

    const indicator = container.querySelector('span.inline-block')
    expect(indicator).toHaveClass('animate-live-user-pulse')
    expect(container.querySelector('style')).not.toBeInTheDocument()
  })
})
