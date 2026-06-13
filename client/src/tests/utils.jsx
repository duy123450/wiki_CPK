/**
 * renderWithProviders — shared test utility.
 *
 * Wraps a component with all necessary providers so individual component tests
 * don't need to hand-wire mocks. Add providers here as the app grows.
 *
 * Usage:
 *   import { renderWithProviders } from '../utils'
 *   renderWithProviders(<MyComponent />, { authState: { authUser: mockUser } })
 */
import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'

const DEFAULT_AUTH_STATE = {
  authUser: null,
  handleAuthSuccess: vi.fn(),
  handleAvatarUpdate: vi.fn(),
  handleLogout: vi.fn(),
  handleProfileUpdate: vi.fn(),
}

/**
 * @param {React.ReactElement} ui - Component to render
 * @param {object} options
 * @param {object} [options.authState] - Override default AuthContext value
 * @param {string[]} [options.routes] - Initial entries for MemoryRouter (default: ['/'])
 * @returns RTL render result
 */
export function renderWithProviders(ui, { authState = {}, routes = ['/'] } = {}) {
  const contextValue = { ...DEFAULT_AUTH_STATE, ...authState }

  return render(
    <MemoryRouter initialEntries={routes}>
      <AuthContext.Provider value={contextValue}>
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>
  )
}
