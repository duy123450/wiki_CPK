import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchSoundtrack } from '../store/slices/soundtrackSlice'

export function useSoundtrack(slug) {
  const dispatch = useAppDispatch()
  const track = useAppSelector((state) => state.soundtracks.bySlug[slug] || null)
  const status = useAppSelector((state) => state.soundtracks.status[slug] || 'idle')
  const error = useAppSelector((state) => state.soundtracks.error[slug] || null)

  useEffect(() => {
    if (slug) dispatch(fetchSoundtrack(slug))
  }, [dispatch, slug])

  return {
    track,
    loading: status === 'loading' || status === 'idle',
    error,
  }
}
