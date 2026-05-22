import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import App from '@/App'

// Mock all API calls used by the app and its children
vi.mock('@/services/api', () => ({
  AUTH_TOKEN_KEY: 'testToken',
  getCurrentUser: vi.fn(),
  getMovieInfo: vi.fn(),
  getSidebar: vi.fn(),
  getCharacters: vi.fn(),
  fetchMovieInfo: vi.fn(),
  fetchSoundtracks: vi.fn(),
  fetchNextTrack: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  uploadAvatar: vi.fn(),
  updateProfile: vi.fn(),
  getPageBySlug: vi.fn(),
  getCharacterBySlug: vi.fn(),
}))

import {
  getCurrentUser,
  getMovieInfo,
  getSidebar,
  getCharacters,
  fetchMovieInfo,
  fetchSoundtracks,
} from '@/services/api'

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()

  // Default mocks so App doesn't crash
  getCurrentUser.mockRejectedValue(new Error('no token'))
  getMovieInfo.mockResolvedValue({ title: 'Test', details: {} })
  getSidebar.mockResolvedValue([])
  getCharacters.mockResolvedValue({
    characters: [],
    pagination: { total: 0, totalPages: 1 },
  })
  fetchMovieInfo.mockReturnValue(new Promise(() => {}))
  fetchSoundtracks.mockReturnValue(new Promise(() => {}))
})

// We need to wrap App with Provider since App uses useAuth → useAppDispatch
// but App has its own <Router>, so Provider goes around it
const renderApp = () =>
  render(
    <Provider store={makeStore()}>
      <App />
    </Provider>
  )

describe('App', () => {
  it('renders without crashing', async () => {
    renderApp()
    // Should at least render the sidebar
    await waitFor(() => {
      expect(screen.getByText('Fan Wiki')).toBeInTheDocument()
    })
    await screen.findByText('Explore Wiki')
  })

  it('renders hero page content on default route', async () => {
    renderApp()

    await waitFor(() => {
      // HeroPage shows "Explore Wiki" link when movie data loads
      expect(screen.getByText('Explore Wiki')).toBeInTheDocument()
    })
  })

  it('renders footer', async () => {
    renderApp()

    await waitFor(() => {
      expect(screen.getByText('超かぐや姫')).toBeInTheDocument()
    })
    await screen.findByText('Explore Wiki')
  })

  it('renders sidebar Navigation label', async () => {
    renderApp()
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    await screen.findByText('Explore Wiki')
  })

  it('restores user from localStorage token', async () => {
    window.localStorage.setItem('testToken', 'valid-token')
    getCurrentUser.mockResolvedValueOnce({
      username: 'restored',
      email: 'r@test.com',
      role: 'viewer',
    })

    renderApp()

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalled()
    })
  })

  it('clears token when getCurrentUser fails', async () => {
    window.localStorage.setItem('testToken', 'bad-token')
    getCurrentUser.mockRejectedValueOnce(new Error('invalid'))

    renderApp()

    await waitFor(() => {
      expect(window.localStorage.getItem('testToken')).toBeNull()
    })
  })
})
