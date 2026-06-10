import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getSoundtrackBySlug, fetchSoundtracks, fetchMovieInfo } from '../../services/api'

// Async Thunks
export const fetchSoundtrack = createAsyncThunk(
  'soundtracks/fetchBySlug',
  async (slug, { rejectWithValue, getState }) => {
    const cached = getState().soundtracks.bySlug[slug]
    if (cached) return cached
    try {
      const data = await getSoundtrackBySlug(slug)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchAllSoundtracks = createAsyncThunk(
  'soundtracks/fetchAll',
  async (movieId, { rejectWithValue, getState }) => {
    const cached = getState().soundtracks.all
    if (cached.length > 0) return cached
    try {
      const data = await fetchSoundtracks(movieId)
      // Handle both array (after validation normalization) and {tracks} format
      return Array.isArray(data) ? data : data.tracks || []
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchSoundtrackMovie = createAsyncThunk(
  'soundtracks/fetchMovie',
  async (_, { rejectWithValue, getState }) => {
    const cached = getState().soundtracks.movie
    if (cached) return cached
    try {
      const data = await fetchMovieInfo()
      return data.movie
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const initialState = {
  bySlug: {},
  status: {},
  error: {},
  all: [],
  allStatus: 'idle',
  allError: null,
  movie: null,
  movieStatus: 'idle',
}

const soundtrackSlice = createSlice({
  name: 'soundtracks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Single track by slug
      .addCase(fetchSoundtrack.pending, (state, action) => {
        state.status[action.meta.arg] = 'loading'
        state.error[action.meta.arg] = null
      })
      .addCase(fetchSoundtrack.fulfilled, (state, action) => {
        state.status[action.meta.arg] = 'succeeded'
        state.bySlug[action.meta.arg] = action.payload
      })
      .addCase(fetchSoundtrack.rejected, (state, action) => {
        state.status[action.meta.arg] = 'failed'
        state.error[action.meta.arg] = action.payload
      })
      // All tracks
      .addCase(fetchAllSoundtracks.pending, (state) => {
        state.allStatus = 'loading'
        state.allError = null
      })
      .addCase(fetchAllSoundtracks.fulfilled, (state, action) => {
        state.allStatus = 'succeeded'
        state.all = action.payload
      })
      .addCase(fetchAllSoundtracks.rejected, (state, action) => {
        state.allStatus = 'failed'
        state.allError = action.payload
      })
      // Movie
      .addCase(fetchSoundtrackMovie.pending, (state) => {
        state.movieStatus = 'loading'
      })
      .addCase(fetchSoundtrackMovie.fulfilled, (state, action) => {
        state.movieStatus = 'succeeded'
        state.movie = action.payload
      })
      .addCase(fetchSoundtrackMovie.rejected, (state) => {
        state.movieStatus = 'failed'
      })
  },
})

export default soundtrackSlice.reducer
