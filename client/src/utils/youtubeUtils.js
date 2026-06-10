/**
 * YouTube-related utility functions
 */

let ytApiLoaded = false

/**
 * Loads the YouTube IFrame API script if not already loaded
 */
export const loadYouTubeAPI = () => {
  if (ytApiLoaded || window.YT) return
  ytApiLoaded = true
  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  document.body.appendChild(tag)
}

/**
 * Extract YouTube Video ID from URL
 */
export function getYoutubeId(url) {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = String(url).match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}
