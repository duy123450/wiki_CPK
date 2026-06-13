const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const SECURITY_LOG_FILE = path.join(LOG_DIR, 'security.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Log a security event.
 * @param {string} eventName - Name of the event (e.g., 'AUTH_FAILURE', 'RATE_LIMIT')
 * @param {object} details - Additional details (e.g., ip, userId, reason)
 */
const logSecurityEvent = (eventName, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event: eventName,
    ...details
  };

  const logString = JSON.stringify(logEntry);

  if (process.env.NODE_ENV === 'production') {
    fs.appendFile(SECURITY_LOG_FILE, logString + '\n', (err) => {
      if (err) console.error('Failed to write security log:', err);
    });
  } else {
    console.warn(`[SECURITY EVENT] ${eventName}:`, details);
  }
};

module.exports = {
  logSecurityEvent
};
