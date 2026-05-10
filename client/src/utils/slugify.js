/**
 * Converts a string to a URL-friendly slug.
 * @param {string} name - The name to slugify.
 * @returns {string} - The slugified string.
 */
export const nameToSlug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
