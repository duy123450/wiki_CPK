import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSoundtrack } from '../../hooks/useSoundtrack';
import soundtrackReducer from '../../store/slices/soundtrackSlice';
import * as api from '../../services/api';
import { vi } from 'vitest';

vi.mock('../../services/api', () => ({
  getSoundtrackBySlug: vi.fn()
}));

const renderWithProvider = (ui, preloadedState = {}) => {
  const store = configureStore({
    reducer: { soundtracks: soundtrackReducer },
    preloadedState: {
      soundtracks: {
        bySlug: {},
        status: {},
        error: {},
        ...preloadedState
      }
    }
  });
  const Wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
  return renderHook(() => ui(), { wrapper: Wrapper });
};

describe('useSoundtrack Hook', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch soundtrack on mount if not cached', async () => {
    api.getSoundtrackBySlug.mockResolvedValueOnce({ title: 'Theme', slug: 'theme' });

    const { result } = renderWithProvider(() => useSoundtrack('theme'));
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.track).toEqual({ title: 'Theme', slug: 'theme' });
    expect(api.getSoundtrackBySlug).toHaveBeenCalledWith('theme');
  });

  it('should return cached track without fetching', async () => {
    const preloadedState = {
      bySlug: { 'ost1': { title: 'OST 1' } },
      status: { 'ost1': 'succeeded' }
    };

    const { result } = renderWithProvider(() => useSoundtrack('ost1'), preloadedState);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.track).toEqual({ title: 'OST 1' });
  });

  it('should handle error state', async () => {
    api.getSoundtrackBySlug.mockRejectedValueOnce({ response: { data: { message: 'Not Found' } } });

    const { result } = renderWithProvider(() => useSoundtrack('bad-track'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Not Found');
  });

  it('should do nothing if slug is falsy', () => {
    renderWithProvider(() => useSoundtrack(null));
    expect(api.getSoundtrackBySlug).not.toHaveBeenCalled();
  });
});
