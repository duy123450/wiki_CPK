import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  loginUser,
  registerUser,
  getCurrentUser,
  updateProfile,
  uploadAvatar,
  AUTH_TOKEN_KEY,
} from '../../services/api'

// Async Thunks
export const login = createAsyncThunk(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await loginUser(payload)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await registerUser(payload)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
      if (!token) return null
      const user = await getCurrentUser()
      return { user, token }
    } catch (err) {
      window.localStorage.removeItem(AUTH_TOKEN_KEY)
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const updateProfileInfo = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await updateProfile(payload)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const updateAvatarImage = createAsyncThunk(
  'auth/updateAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const data = await uploadAvatar(file)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const initialState = {
  user: null,
  token: window.localStorage.getItem(AUTH_TOKEN_KEY) || null,
  isAuthenticated: false,
  // True while restoreSession is in-flight — prevents ProtectedRoute from
  // redirecting to /auth before we know if a valid session exists in storage.
  isRestoringSession: !!window.localStorage.getItem(AUTH_TOKEN_KEY),
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      window.localStorage.removeItem(AUTH_TOKEN_KEY)
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.status = 'idle'
      state.error = null
    },
    syncAvatar(state, action) {
      if (state.user) {
        state.user.avatar = action.payload
      }
    },
    syncProfile(state, action) {
      state.user = action.payload.user
      if (action.payload.token) {
        state.token = action.payload.token
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.accessToken || action.payload.token
        state.isAuthenticated = true
        window.localStorage.setItem(AUTH_TOKEN_KEY, state.token)
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Register
      .addCase(register.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.accessToken || action.payload.token
        state.isAuthenticated = true
        window.localStorage.setItem(AUTH_TOKEN_KEY, state.token)
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Restore Session
      .addCase(restoreSession.pending, (state) => {
        // Only set flag if a token actually exists (thunk will check)
        state.isRestoringSession = !!window.localStorage.getItem(AUTH_TOKEN_KEY)
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user
          state.token = action.payload.token
          state.isAuthenticated = true
        }
        state.isRestoringSession = false
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isRestoringSession = false
      })
      // Update Profile Info
      .addCase(updateProfileInfo.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(updateProfileInfo.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        if (action.payload.token) {
          state.token = action.payload.token
          window.localStorage.setItem(AUTH_TOKEN_KEY, action.payload.token)
        }
      })
      .addCase(updateProfileInfo.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Update Avatar
      .addCase(updateAvatarImage.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(updateAvatarImage.fulfilled, (state, action) => {
        state.status = 'succeeded'
        if (state.user) {
          state.user.avatar = action.payload.avatar
        }
      })
      .addCase(updateAvatarImage.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { logout, syncAvatar, syncProfile } = authSlice.actions
export default authSlice.reducer
