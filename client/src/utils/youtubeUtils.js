/**
 * YouTube-related utility functions
 */

let ytApiLoaded = false;

/**
 * Loads the YouTube IFrame API script if not already loaded
 */
export const loadYouTubeAPI = () => {
  if (ytApiLoaded || window.YT) return;
  ytApiLoaded = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.body.appendChild(tag);
};
