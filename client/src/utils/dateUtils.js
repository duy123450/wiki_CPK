/**
 * Date-related utility functions
 */

/**
 * Formats a date string to a localized Vietnamese format
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatVNDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
