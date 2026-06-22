import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import useAuth from '../../hooks/useAuth';
import authReducer from '../../store/slices/authSlice';
import { vi } from 'vitest';

// Mock the API services called by thunks
vi.mock('../../services/api', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ id: '1', username: 'test' }),
  logoutApi: vi.fn().mockResolvedValue(true),
}));

const renderWithProvider = (ui, preloadedState = {}) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        isRestoringSession: false,
        status: 'idle',
        error: null,
        ...preloadedState
      }
    }
  });
  const Wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
  return renderHook(() => ui(), { wrapper: Wrapper });
};

describe('useAuth Hook', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should restore session on mount', async () => {
    const { result } = renderWithProvider(useAuth);
    await waitFor(() => {
      // The mock returns user 1 test
      expect(result.current.authUser).toEqual({ id: '1', username: 'test' });
    });
  });

  it('should handle auth success', async () => {
    const { result } = renderWithProvider(useAuth);
    
    await waitFor(() => {
      expect(result.current.authUser).toEqual({ id: '1', username: 'test' });
    });

    act(() => {
      result.current.handleAuthSuccess({
        user: { id: '123', username: 'newuser' },
        token: 'fake-jwt'
      });
    });

    expect(result.current.authUser).toEqual({ id: '123', username: 'newuser' });
  });

  it('should handle avatar update', async () => {
    const { result } = renderWithProvider(useAuth, { user: { id: '1', avatar: null } });
    
    await waitFor(() => {
      expect(result.current.authUser).toEqual({ id: '1', username: 'test' });
    });

    act(() => {
      result.current.handleAvatarUpdate({ url: 'avatar.jpg' });
    });

    expect(result.current.authUser.avatar).toEqual({ url: 'avatar.jpg' });
  });

  it('should handle profile update', async () => {
    const { result } = renderWithProvider(useAuth, { user: { id: '1', username: 'old' } });
    
    await waitFor(() => {
      expect(result.current.authUser).toEqual({ id: '1', username: 'test' });
    });

    act(() => {
      result.current.handleProfileUpdate({ id: '1', username: 'updated' }, 'new-token');
    });

    expect(result.current.authUser).toEqual({ id: '1', username: 'updated' });
  });

  it('should handle logout dispatch', async () => {
    const { result } = renderWithProvider(useAuth, { user: { id: '1' }, isAuthenticated: true });
    
    await waitFor(() => {
      expect(result.current.authUser).toEqual({ id: '1', username: 'test' });
    });

    act(() => {
      result.current.handleLogout();
    });

    await waitFor(() => {
      expect(result.current.authUser).toBeNull();
    });
  });
});
