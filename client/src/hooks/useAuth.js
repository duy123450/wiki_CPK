import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  restoreSession,
  logoutUserThunk,
  syncAvatar,
  syncProfile,
} from '../store/slices/authSlice'

export default function useAuth() {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    dispatch(restoreSession())
  }, [dispatch])

  const handleAuthSuccess = useCallback(
    ({ user, token, accessToken }) => {
      dispatch(syncProfile({ user, token: accessToken || token }))
    },
    [dispatch]
  )

  const handleAvatarUpdate = useCallback(
    (avatar) => {
      dispatch(syncAvatar(avatar))
    },
    [dispatch]
  )

  const handleLogout = useCallback(() => {
    dispatch(logoutUserThunk())
  }, [dispatch])

  const handleProfileUpdate = useCallback(
    (user, token) => {
      dispatch(syncProfile({ user, token }))
    },
    [dispatch]
  )

  return {
    authUser,
    handleAuthSuccess,
    handleAvatarUpdate,
    handleLogout,
    handleProfileUpdate,
  }
}
