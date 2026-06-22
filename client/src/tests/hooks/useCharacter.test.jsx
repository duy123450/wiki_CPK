import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useCharacter } from '../../hooks/useCharacter';
import characterReducer from '../../store/slices/characterSlice';
import * as api from '../../services/api';
import { vi } from 'vitest';

vi.mock('../../services/api', () => ({
  getCharacterBySlug: vi.fn()
}));

const renderWithProvider = (ui, preloadedState = {}) => {
  const store = configureStore({
    reducer: { characters: characterReducer },
    preloadedState: {
      characters: {
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

describe('useCharacter Hook', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch character on mount if not cached', async () => {
    api.getCharacterBySlug.mockResolvedValueOnce({ name: 'Kaguya', slug: 'kaguya' });
    
    const { result } = renderWithProvider(() => useCharacter('kaguya'));
    // Initially loading
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.character).toEqual({ name: 'Kaguya', slug: 'kaguya' });
    expect(api.getCharacterBySlug).toHaveBeenCalledWith('kaguya');
  });

  it('should return cached character without fetching', async () => {
    const preloadedState = {
      bySlug: { 'fushi': { name: 'Fushi' } },
      status: { 'fushi': 'succeeded' }
    };

    const { result } = renderWithProvider(() => useCharacter('fushi'), preloadedState);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.character).toEqual({ name: 'Fushi' });
  });

  it('should handle error state', async () => {
    api.getCharacterBySlug.mockRejectedValueOnce({ response: { data: { message: 'Not Found' } } });

    const { result } = renderWithProvider(() => useCharacter('bad-slug'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Not Found');
  });

  it('should do nothing if slug is falsy', () => {
    renderWithProvider(() => useCharacter(null));
    expect(api.getCharacterBySlug).not.toHaveBeenCalled();
  });
});
