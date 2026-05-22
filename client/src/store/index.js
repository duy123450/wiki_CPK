import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import characterReducer from './slices/characterSlice'

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      characters: characterReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  })

export const store = makeStore()
