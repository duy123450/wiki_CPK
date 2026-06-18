import { useCallback } from 'react'
import { useAppDispatch } from '../store/hooks'
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
 *   - refreshAll(): Refresh everything
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

    const refreshAll = useCallback(() => {
        dispatch(clearSoundtrackCacheAll())
        dispatch(clearAllCharacterCache())
    }, [dispatch])

    return {
        refreshAllSoundtracks,
        refreshSoundtrack,
        refreshSoundtrackMovie,
        refreshAllCharacters,
        refreshCharacter,
        refreshCharacterMovie,
        refreshAll,
    }
}
