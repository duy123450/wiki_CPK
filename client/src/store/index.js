import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import characterReducer from './slices/characterSlice'
import soundtrackReducer from './slices/soundtrackSlice'

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      characters: characterReducer,
      soundtracks: soundtrackReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  })

export const store = makeStore()
