import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminPage from '@/pages/AdminPage'

const { clearServerCache } = vi.hoisted(() => ({
  clearServerCache: vi.fn(),
}))

vi.mock('@/hooks/useRefreshData', () => ({
  useRefreshData: () => ({ clearServerCache }),
}))

describe('AdminPage', () => {
  beforeEach(() => {
    clearServerCache.mockReset()
  })

  it('calls the cache-clear helper with null and disables repeat submissions while pending', async () => {
    const user = userEvent.setup()
    let resolveRequest
    clearServerCache.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        })
    )

    render(<AdminPage />)

    const button = screen.getByRole('button', { name: 'Clear soundtrack cache' })
    await user.click(button)

    expect(clearServerCache).toHaveBeenCalledOnce()
    expect(clearServerCache).toHaveBeenCalledWith(null)
    expect(button).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Clearing the soundtrack cache'
    )

    await user.click(button)
    expect(clearServerCache).toHaveBeenCalledOnce()

    await act(async () => {
      resolveRequest()
    })

    expect(
      await screen.findByText('Soundtrack cache cleared successfully.')
    ).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('shows an error and allows retry when the request fails', async () => {
    const user = userEvent.setup()
    clearServerCache.mockRejectedValueOnce(new Error('request failed'))

    render(<AdminPage />)

    await user.click(screen.getByRole('button', { name: 'Clear soundtrack cache' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not clear the soundtrack cache. Please try again.'
    )
    expect(
      screen.getByRole('button', { name: 'Clear soundtrack cache' })
    ).toBeEnabled()
  })
})
