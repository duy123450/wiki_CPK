import axios from 'axios'
import { envConfig } from '../config/env.config'
import { validateData } from '../utils/api-validator'
import { loginSchema, registerRequestSchema } from '../schemas/authSchemas'
import { profileRequestSchema as updateProfileSchema } from '../schemas/profileSchemas'
import {
  soundtrackListResponseSchema,
  soundtrackDetailResponseSchema,
  soundtrackNextResponseSchema,
} from '../schemas/soundtrackSchemas'
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore'

export const API_BASE_URL = envConfig.VITE_API_BASE_URL

const redirectToLogin = () => {
  clearAccessToken()
  window.location.assign('/auth')
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest._skipAuthRefresh
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const refreshResponse = await api.post('/auth/refresh', undefined, {
        _skipAuthRefresh: true,
      })
      const accessToken = refreshResponse.data?.accessToken

      if (!accessToken) {
        throw new Error('Refresh response did not include an access token')
      }

      setAccessToken(accessToken)
      originalRequest.headers = originalRequest.headers ?? {}
      originalRequest.headers.Authorization = `Bearer ${accessToken}`

      return api.request(originalRequest)
    } catch (refreshError) {
      const refreshStatus = refreshError.response?.status
      if (refreshStatus === 401 || refreshStatus === 403 || !refreshStatus) {
        redirectToLogin()
      }
      return Promise.reject(refreshError)
    }
  }
)

export const getMovieInfo = () =>
  api.get('/movie-info').then((res) => res.data.movie)
export const getSidebar = () =>
  api.get('/sidebar').then((res) => res.data.categories)
export const getPageBySlug = (slug) =>
  api.get(`/page/${slug}`).then((res) => res.data)

// ─── Soundtrack ───────────────────────────────────────────────────────────────

export const fetchSoundtracks = async (movieId) => {
  const res = await api.get('/soundtrack', { params: { movieId } })
  const result = soundtrackListResponseSchema.safeParse(res.data)
  if (!result.success) {
    console.warn('[fetchSoundtracks] Zod validation issues:', result.error.issues)
    return res.data
  }
  return result.data
}

export const fetchNextTrack = async ({ currentTrackId, mode, movieId }) => {
  const params = { currentTrackId, mode, movieId }
  if (mode === 'shuffle') {
    params._t = Date.now()
  }
  const res = await api.get('/soundtrack/next', { params })
  return soundtrackNextResponseSchema.parse(res.data)
}

export const getSoundtrackBySlug = async (slug) => {
  const res = await api.get(`/soundtrack/${slug}`)
  return soundtrackDetailResponseSchema.parse(res.data).track
}

export const fetchMovieInfo = async () => {
  const res = await api.get('/movie-info')
  return res.data
}

// ─── Characters ───────────────────────────────────────────────────────────────

export const getCharacters = (params = {}) =>
  api.get('/characters', { params }).then((res) => res.data)

export const getCharacterRoles = () =>
  api.get('/characters/roles').then((res) => res.data.roles)

export const getCharacterBySlug = (slug) =>
  api.get(`/characters/${slug}`).then((res) => res.data.character)

// ─── Authentication ─────────────────────────────────────────────────────────

export const registerUser = (payload) => {
  const validated = validateData(registerRequestSchema, payload, 'Register')
  return api.post('/auth/register', validated).then((res) => res.data)
}

export const loginUser = (payload) => {
  const validated = validateData(loginSchema, payload, 'Login')
  return api.post('/auth/login', validated).then((res) => res.data)
}

export const getCurrentUser = () =>
  api.get('/auth/me').then((res) => res.data.user)

export const refreshAccessToken = () =>
  api
    .post('/auth/refresh', undefined, { _skipAuthRefresh: true })
    .then((res) => {
      const accessToken = res.data?.accessToken
      if (accessToken) setAccessToken(accessToken)
      return res.data
    })

export const uploadAvatar = async (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  const res = await api.put('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const updateProfile = async (payload) => {
  const validated = validateData(updateProfileSchema, payload, 'Profile Update')
  const res = await api.put('/auth/profile', validated)
  return res.data
}

export const logoutApi = async () => {
  const res = await api.post('/auth/logout')
  return res.data
}

export const deleteAccountApi = async () => {
  const res = await api.delete('/auth/me')
  return res.data
}

// ─── Google OAuth ───────────────────────────────────────────────────────────

export const getGoogleLoginUrl = () => `${API_BASE_URL}/auth/google`

// ─── Twitter OAuth ──────────────────────────────────────────────────────

export const getTwitterLoginUrl = () => `${API_BASE_URL}/auth/x`

// ─── Discord OAuth ──────────────────────────────────────────────────────

export const getDiscordLoginUrl = () => `${API_BASE_URL}/auth/discord`

// ─── GitHub OAuth ───────────────────────────────────────────────────────

export const getGithubLoginUrl = () => `${API_BASE_URL}/auth/github`
