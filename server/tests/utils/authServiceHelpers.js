/**
 * Auth Service Test Helpers
 * Pure functions extracted from auth.service.js for unit testing
 */

/**
 * Build auth response object - filters out sensitive fields
 */
function buildAuthResponse(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
    };
}

module.exports = {
    buildAuthResponse,
};
