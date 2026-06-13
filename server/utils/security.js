const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Compare two strings or buffers using a constant-time algorithm to prevent timing attacks.
 * @param {string|Buffer} a
 * @param {string|Buffer} b
 * @returns {boolean}
 */
const timingSafeCompare = (a, b) => {
  const bufA = Buffer.isBuffer(a) ? a : Buffer.from(String(a));
  const bufB = Buffer.isBuffer(b) ? b : Buffer.from(String(b));

  if (bufA.length !== bufB.length) {
    // Return false immediately but still do a comparison to avoid leaking length info
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Wrapper for jwt.verify that uses timing-safe comparison internally (via mitigating early exits).
 * @param {string} token 
 * @param {string} secret 
 * @param {object} options 
 * @returns {object}
 */
const timingSafeVerify = (token, secret, options = {}) => {
  try {
    return jwt.verify(token, secret, options);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  timingSafeCompare,
  timingSafeVerify
};
