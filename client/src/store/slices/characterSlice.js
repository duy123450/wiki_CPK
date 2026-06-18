import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getCharacterBySlug, getMovieInfo } from '../../services/api'

// Async Thunks
export const fetchCharacter = createAsyncThunk(
  'characters/fetchBySlug',
  async (slug, { rejectWithValue, getState }) => {
    // Check if character already loaded in cache
    const cached = getState().characters.bySlug[slug]
    if (cached) return cached

    try {
      const data = await getCharacterBySlug(slug)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchMovie = createAsyncThunk(
  'characters/fetchMovie',
  async (_, { rejectWithValue, getState }) => {
    // Return cached movie details if already loaded
    const cached = getState().characters.movie
    if (cached) return cached

    try {
      const data = await getMovieInfo()
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const initialState = {
  bySlug: {},
  status: {},
  error: {},
  movie: null,
  movieStatus: 'idle',
  movieError: null,
}

const characterSlice = createSlice({
  name: 'characters',
  initialState,
  reducers: {
    clearCharacterCache(state, action) {
      const slug = action.payload
      delete state.bySlug[slug]
      delete state.status[slug]
      delete state.error[slug]
    },
    clearMovieCache(state) {
      state.movie = null
      state.movieStatus = 'idle'
      state.movieError = null
    },
    clearAllCharacterCache(state) {
      state.bySlug = {}
      state.status = {}
      state.error = {}
      state.movie = null
      state.movieStatus = 'idle'
      state.movieError = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Characters
      .addCase(fetchCharacter.pending, (state, action) => {
        const slug = action.meta.arg
        state.status[slug] = 'loading'
        state.error[slug] = null
      })
      .addCase(fetchCharacter.fulfilled, (state, action) => {
        const slug = action.meta.arg
        state.bySlug[slug] = action.payload
        state.status[slug] = 'succeeded'
      })
      .addCase(fetchCharacter.rejected, (state, action) => {
        const slug = action.meta.arg
        state.status[slug] = 'failed'
        state.error[slug] = action.payload
      })
      // Movie
      .addCase(fetchMovie.pending, (state) => {
        state.movieStatus = 'loading'
        state.movieError = null
      })
      .addCase(fetchMovie.fulfilled, (state, action) => {
        state.movieStatus = 'succeeded'
        state.movie = action.payload
      })
      .addCase(fetchMovie.rejected, (state, action) => {
        state.movieStatus = 'failed'
        state.movieError = action.payload
      })
  },
})

export const { clearCharacterCache, clearMovieCache, clearAllCharacterCache } = characterSlice.actions
export default characterSlice.reducer
