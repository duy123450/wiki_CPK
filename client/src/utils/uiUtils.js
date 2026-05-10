/**
 * UI-related utility functions for animations and visual effects
 */

/**
 * Generates an array of random particle/star data
 * @param {number} count 
 * @returns {object[]}
 */
export const generateParticles = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2.5 + 0.8,
    delay: `${Math.random() * 8}s`,
    dur: `${Math.random() * 5 + 4}s`,
  }));
};

/**
 * Generates an array of random star data (specific to HeroPage)
 * @param {number} count 
 * @returns {object[]}
 */
export const generateStars = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2.5 + 0.5,
    delay: `${Math.random() * 6}s`,
    dur: `${Math.random() * 4 + 3}s`,
  }));
};
