import authReducer, { logout, syncAvatar, syncProfile } from '../../store/slices/authSlice';
import * as api from '../../services/api';

// Mock the API module
vi.mock('../../services/api');

// Test data
const initialState = {
  user: null,
  isAuthenticated: false,
  isRestoringSession: true,
  status: 'idle',
  error: null,
};

describe('authSlice Reducer', () => {
  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle logout sync action', () => {
    const state = {
      ...initialState,
      user: { id: '123', username: 'testuser' },
      isAuthenticated: true,
      status: 'succeeded',
      error: 'some error',
    };

    const nextState = authReducer(state, logout());

    expect(nextState).toEqual({
      user: null,
      isAuthenticated: false,
      isRestoringSession: true,
      status: 'idle',
      error: null,
    });
  });

  it('should handle syncAvatar action', () => {
    const state = {
      ...initialState,
      user: { id: '123', avatar: { url: 'old.jpg' } },
    };

    const nextState = authReducer(state, syncAvatar({ url: 'new.jpg' }));

    expect(nextState.user.avatar).toEqual({ url: 'new.jpg' });
  });

  it('should handle syncProfile action', () => {
    const nextState = authReducer(initialState, syncProfile({
      user: { id: '123', username: 'updated' },
      token: 'fake-token'
    }));

    expect(nextState.user).toEqual({ id: '123', username: 'updated' });
    expect(nextState.isAuthenticated).toBe(true);
  });
});
