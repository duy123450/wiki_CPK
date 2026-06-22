import soundtrackReducer, { 
  clearAllSoundtracksCache, 
  clearSoundtrackCache, 
  clearMovieCache, 
  clearSoundtrackCacheAll 
} from '../../store/slices/soundtrackSlice';

const initialState = {
  bySlug: {},
  status: {},
  error: {},
  all: [],
  allStatus: 'idle',
  allError: null,
  allAccessTier: null,
  movie: null,
  movieStatus: 'idle',
};

describe('soundtrackSlice Reducer', () => {
  it('should return the initial state', () => {
    expect(soundtrackReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle clearAllSoundtracksCache', () => {
    const state = {
      ...initialState,
      all: [{ id: 1, title: 'Track 1' }],
      allStatus: 'succeeded',
      allError: 'error',
    };
    
    const nextState = soundtrackReducer(state, clearAllSoundtracksCache());
    expect(nextState.all).toEqual([]);
    expect(nextState.allStatus).toBe('idle');
    expect(nextState.allError).toBeNull();
  });

  it('should handle clearSoundtrackCache', () => {
    const state = {
      ...initialState,
      bySlug: { ost1: { title: 'OST 1' } },
      status: { ost1: 'succeeded' },
      error: { ost1: null },
    };
    
    const nextState = soundtrackReducer(state, clearSoundtrackCache('ost1'));
    expect(nextState.bySlug).toEqual({});
    expect(nextState.status).toEqual({});
    expect(nextState.error).toEqual({});
  });

  it('should handle clearMovieCache', () => {
    const state = {
      ...initialState,
      movie: { title: 'Movie 1' },
      movieStatus: 'succeeded',
    };
    
    const nextState = soundtrackReducer(state, clearMovieCache());
    expect(nextState.movie).toBeNull();
    expect(nextState.movieStatus).toBe('idle');
  });

  it('should handle clearSoundtrackCacheAll', () => {
    const state = {
      bySlug: { ost1: { title: 'OST 1' } },
      status: { ost1: 'succeeded' },
      error: { ost1: null },
      all: [{ id: 1 }],
      allStatus: 'succeeded',
      allError: null,
      allAccessTier: 'public',
      movie: { title: 'Movie 1' },
      movieStatus: 'succeeded',
    };
    
    const nextState = soundtrackReducer(state, clearSoundtrackCacheAll());
    // Note: clearSoundtrackCacheAll doesn't reset allAccessTier based on the reducer code
    expect(nextState.bySlug).toEqual({});
    expect(nextState.all).toEqual([]);
    expect(nextState.movie).toBeNull();
  });

  describe('fetchAllSoundtracks Extra Reducers', () => {
    it('should handle pending state', () => {
      const action = { type: 'soundtracks/fetchAll/pending' };
      const nextState = soundtrackReducer(initialState, action);
      expect(nextState.allStatus).toBe('loading');
      expect(nextState.allError).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const action = { 
        type: 'soundtracks/fetchAll/fulfilled', 
        payload: { tracks: [{ id: 1, title: 'Track 1' }], accessTier: 'premium' }
      };
      const nextState = soundtrackReducer(initialState, action);
      expect(nextState.all).toEqual([{ id: 1, title: 'Track 1' }]);
      expect(nextState.allStatus).toBe('succeeded');
      expect(nextState.allAccessTier).toBe('premium');
    });

    it('should handle rejected state', () => {
      const action = { 
        type: 'soundtracks/fetchAll/rejected', 
        payload: 'Failed to fetch tracks'
      };
      const nextState = soundtrackReducer(initialState, action);
      expect(nextState.allStatus).toBe('failed');
      expect(nextState.allError).toBe('Failed to fetch tracks');
    });
  });

  describe('fetchSoundtrack Extra Reducers', () => {
    it('should handle pending state', () => {
      const action = { type: 'soundtracks/fetchBySlug/pending', meta: { arg: 'ost1' } };
      const nextState = soundtrackReducer(initialState, action);
      expect(nextState.status['ost1']).toBe('loading');
    });

    it('should handle fulfilled state', () => {
      const action = { 
        type: 'soundtracks/fetchBySlug/fulfilled', 
        meta: { arg: 'ost1' },
        payload: { title: 'OST 1' }
      };
      const nextState = soundtrackReducer(initialState, action);
      expect(nextState.bySlug['ost1']).toEqual({ title: 'OST 1' });
      expect(nextState.status['ost1']).toBe('succeeded');
    });
  });
});
