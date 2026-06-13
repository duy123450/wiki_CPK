import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  loginUser,
  registerUser,
  getCurrentUser,
  updateProfile,
  uploadAvatar,
  logoutApi,
  deleteAccountApi,
} from '../../services/api'
import { setAccessToken, clearAccessToken } from '../../services/tokenStore'

export const login = createAsyncThunk(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await loginUser(payload)
      setAccessToken(data.accessToken || data.token)
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
      setAccessToken(data.accessToken || data.token)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

/**
 * Silent refresh on app load / page refresh.
 *
 * No localStorage check — access token lives in memory only.
 * Calls GET /auth/me directly. If the access token is null the request
 * returns 401, the Axios response interceptor automatically calls
 * POST /auth/refresh (sending the httpOnly refresh cookie), stores the
 * new access token in tokenStore, then retries GET /auth/me.
 * If no valid refresh cookie exists the retry also fails → rejected.
 */
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const user = await getCurrentUser()
      return { user }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const updateProfileInfo = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await updateProfile(payload)
      if (data.accessToken || data.token) {
        setAccessToken(data.accessToken || data.token)
      }
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

export const logoutUserThunk = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi()
      return true
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const deleteAccountThunk = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      await deleteAccountApi()
      return true
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const initialState = {
  user: null,
  isAuthenticated: false,
  // Always true on init — we always attempt a silent refresh on mount.
  // ProtectedRoute waits for this to be false before rendering.
  isRestoringSession: true,
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      clearAccessToken()
      state.user = null
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
        setAccessToken(action.payload.token)
      }
      state.isAuthenticated = !!action.payload.user
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
        state.isAuthenticated = true
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
        state.isAuthenticated = true
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Restore Session
      .addCase(restoreSession.pending, (state) => {
        state.isRestoringSession = true
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user
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
      // Logout User
      .addCase(logoutUserThunk.fulfilled, (state) => {
        clearAccessToken()
        state.user = null
        state.isAuthenticated = false
        state.status = 'idle'
        state.error = null
      })
      // Delete Account
      .addCase(deleteAccountThunk.fulfilled, (state) => {
        clearAccessToken()
        state.user = null
        state.isAuthenticated = false
        state.status = 'idle'
        state.error = null
      })
  },
})

export const { logout, syncAvatar, syncProfile } = authSlice.actions
export default authSlice.reducer
