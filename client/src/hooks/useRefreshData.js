import { useCallback } from 'react'
import { useAppDispatch } from '../store/hooks'
import { API_BASE_URL } from '../services/api'
import {
    clearAllSoundtracksCache,
    clearSoundtrackCache,
    clearMovieCache as clearSoundtrackMovieCache,
    clearSoundtrackCacheAll,
    fetchAllSoundtracks,
    fetchSoundtrackMovie,
} from '../store/slices/soundtrackSlice'
import {
    clearCharacterCache,
    clearMovieCache as clearCharacterMovieCache,
    clearAllCharacterCache,
    fetchCharacter,
    fetchMovie as fetchCharacterMovie,
} from '../store/slices/characterSlice'

/**
 * Hook to manually refresh data from the server and update the UI.
 * Use this when you've updated data in MongoDB Atlas and want to see the changes.
 * 
 * @returns {Object} Object with refresh methods:
 *   - refreshAllSoundtracks(): Refresh all soundtracks
 *   - refreshSoundtrack(slug): Refresh a single soundtrack
 *   - refreshSoundtrackMovie(): Refresh movie details
 *   - refreshAllCharacters(): Refresh all characters
 *   - refreshCharacter(slug): Refresh a single character
 *   - refreshCharacterMovie(): Refresh character movie details
 *   - clearServerCache(): Clear Redis cache on server (admin only)
 *   - refreshAll(): Refresh everything locally
 */
export function useRefreshData() {
    const dispatch = useAppDispatch()

    const refreshAllSoundtracks = useCallback(() => {
        dispatch(clearAllSoundtracksCache())
        // Note: You'll need to call fetchAllSoundtracks with proper params
        // This clears the cache; your component will handle the actual fetch
    }, [dispatch])

    const refreshSoundtrack = useCallback((slug) => {
        dispatch(clearSoundtrackCache(slug))
    }, [dispatch])

    const refreshSoundtrackMovie = useCallback(() => {
        dispatch(clearSoundtrackMovieCache())
        dispatch(fetchSoundtrackMovie())
    }, [dispatch])

    const refreshAllCharacters = useCallback(() => {
        dispatch(clearAllCharacterCache())
    }, [dispatch])

    const refreshCharacter = useCallback((slug) => {
        dispatch(clearCharacterCache(slug))
    }, [dispatch])

    const refreshCharacterMovie = useCallback(() => {
        dispatch(clearCharacterMovieCache())
        dispatch(fetchCharacterMovie())
    }, [dispatch])

    const clearServerCache = useCallback(async () => {
        try {
            // Clear Redis cache on server (admin only)
            await fetch(`${API_BASE_URL}/wiki/soundtrack/cache/clear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            })
            console.log('Server-side Redis cache cleared')
        } catch (err) {
            console.error('Failed to clear server cache:', err)
        }
    }, [])

    const refreshAll = useCallback(async () => {
        // Clear local Redux cache
        dispatch(clearSoundtrackCacheAll())
        dispatch(clearAllCharacterCache())

        // Clear Redis cache on server (if admin)
        await clearServerCache()
    }, [dispatch, clearServerCache])

    return {
        refreshAllSoundtracks,
        refreshSoundtrack,
        refreshSoundtrackMovie,
        refreshAllCharacters,
        refreshCharacter,
        refreshCharacterMovie,
        clearServerCache,
        refreshAll,
    }
}
