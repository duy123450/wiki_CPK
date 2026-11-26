import { useCallback } from 'react'
import { useAppDispatch } from '../store/hooks'
import { API_BASE_URL } from '../services/api'
import { getAccessToken } from '../services/tokenStore'
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

const ADMIN_API_BASE_URL = API_BASE_URL.replace(/\/wiki\/?$/, '/admin')

const validateMtdTokenArgument = (mtdToken) => {
    if (mtdToken === undefined) {
        throw new Error('Provide the MTD token, or null when MTD is disabled')
    }
    if (mtdToken !== null && (typeof mtdToken !== 'string' || !mtdToken)) {
        throw new TypeError('The MTD token must be a non-empty string or null')
    }
}

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
 *   - clearServerCache(mtdToken): Clear Redis cache (token when MTD is enabled, null otherwise)
 *   - refreshAll(mtdToken): Refresh everything locally
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

    const clearServerCache = useCallback(async (mtdToken) => {
        validateMtdTokenArgument(mtdToken)

        try {
            // Clear Redis cache on server (admin only)
            const tokenPath = mtdToken === null ? '' : `/${encodeURIComponent(mtdToken)}`
            const csrfToken = document.cookie
                .split('; ')
                .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
                ?.split('=')[1]
            const accessToken = getAccessToken()
            const response = await fetch(
                `${ADMIN_API_BASE_URL}${tokenPath}/soundtrack/cache/clear`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                        ...(csrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(csrfToken) } : {}),
                    },
                }
            )
            if (!response.ok) {
                throw new Error(`Server cache clear failed with status ${response.status}`)
            }
            console.log('Server-side Redis cache cleared')
        } catch (err) {
            console.error('Failed to clear server cache:', err)
            throw err
        }
    }, [])

    const refreshAll = useCallback(async (mtdToken) => {
        validateMtdTokenArgument(mtdToken)

        // Clear local Redux cache
        dispatch(clearSoundtrackCacheAll())
        dispatch(clearAllCharacterCache())

        // Clear Redis cache on server (if admin)
        await clearServerCache(mtdToken)
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
