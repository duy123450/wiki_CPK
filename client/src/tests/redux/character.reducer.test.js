import characterReducer, { clearCharacterCache, clearMovieCache, clearAllCharacterCache } from '../../store/slices/characterSlice';

const initialState = {
  bySlug: {},
  status: {},
  error: {},
  movie: null,
  movieStatus: 'idle',
  movieError: null,
};

describe('characterSlice Reducer', () => {
  it('should return the initial state', () => {
    expect(characterReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle clearCharacterCache', () => {
    const state = {
      ...initialState,
      bySlug: { kaguya: { name: 'Kaguya' } },
      status: { kaguya: 'succeeded' },
      error: { kaguya: null },
    };
    
    const nextState = characterReducer(state, clearCharacterCache('kaguya'));
    expect(nextState.bySlug).toEqual({});
    expect(nextState.status).toEqual({});
    expect(nextState.error).toEqual({});
  });

  it('should handle clearMovieCache', () => {
    const state = {
      ...initialState,
      movie: { title: 'Test Movie' },
      movieStatus: 'succeeded',
      movieError: 'some error',
    };
    
    const nextState = characterReducer(state, clearMovieCache());
    expect(nextState.movie).toBeNull();
    expect(nextState.movieStatus).toBe('idle');
    expect(nextState.movieError).toBeNull();
  });

  it('should handle clearAllCharacterCache', () => {
    const state = {
      bySlug: { kaguya: { name: 'Kaguya' } },
      status: { kaguya: 'succeeded' },
      error: { kaguya: null },
      movie: { title: 'Test Movie' },
      movieStatus: 'succeeded',
      movieError: null,
    };
    
    const nextState = characterReducer(state, clearAllCharacterCache());
    expect(nextState).toEqual(initialState);
  });

  // Async Thunk actions (pending, fulfilled, rejected) can be tested 
  // by dispatching the exported action creators with mock data
  describe('fetchCharacter Extra Reducers', () => {
    it('should handle pending state', () => {
      const action = { type: 'characters/fetchBySlug/pending', meta: { arg: 'kaguya' } };
      const nextState = characterReducer(initialState, action);
      expect(nextState.status['kaguya']).toBe('loading');
      expect(nextState.error['kaguya']).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const action = { 
        type: 'characters/fetchBySlug/fulfilled', 
        meta: { arg: 'kaguya' },
        payload: { name: 'Kaguya' }
      };
      const nextState = characterReducer(initialState, action);
      expect(nextState.bySlug['kaguya']).toEqual({ name: 'Kaguya' });
      expect(nextState.status['kaguya']).toBe('succeeded');
    });

    it('should handle rejected state', () => {
      const action = { 
        type: 'characters/fetchBySlug/rejected', 
        meta: { arg: 'kaguya' },
        payload: 'Not Found'
      };
      const nextState = characterReducer(initialState, action);
      expect(nextState.status['kaguya']).toBe('failed');
      expect(nextState.error['kaguya']).toBe('Not Found');
    });
  });

  describe('fetchMovie Extra Reducers', () => {
    it('should handle pending state', () => {
      const action = { type: 'characters/fetchMovie/pending' };
      const nextState = characterReducer(initialState, action);
      expect(nextState.movieStatus).toBe('loading');
      expect(nextState.movieError).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const action = { 
        type: 'characters/fetchMovie/fulfilled', 
        payload: { title: 'Chou Kaguya Hime' }
      };
      const nextState = characterReducer(initialState, action);
      expect(nextState.movie).toEqual({ title: 'Chou Kaguya Hime' });
      expect(nextState.movieStatus).toBe('succeeded');
    });

    it('should handle rejected state', () => {
      const action = { 
        type: 'characters/fetchMovie/rejected', 
        payload: 'Server Error'
      };
      const nextState = characterReducer(initialState, action);
      expect(nextState.movieStatus).toBe('failed');
      expect(nextState.movieError).toBe('Server Error');
    });
  });
});
