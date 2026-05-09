/**
 * @fileoverview Dragon cursor specific constants
 */

/** @type {number} Distance between dragon segments */
export const SEG_DIST = 55;

/** @type {string[]} Sparkle particles for the cursor trail */
export const SPARKLES = ["✦", "⋆", "✧", "·", "✩", "꩜"];

/** @type {string} LocalStorage key for dragon cursor toggle */
export const DRAGON_ENABLED_KEY = import.meta.env.VITE_DRAGON_ENABLED_KEY || "cpkDragonCursorEnabled";
