/**
 * Application-wide constants
 */

export const MQTT_CONFIG = {
  // Connection settings
  CONNECT_TIMEOUT: 15000, // 15 seconds
  RECONNECT_PERIOD: 0, // Disable auto-reconnect (manual control)
  KEEPALIVE: 30, // 30 seconds
  PROTOCOL_VERSION: 4,

  // Reconnection settings
  MAX_RECONNECT_ATTEMPTS: 3,
  RECONNECT_BACKOFF_BASE: 2000, // 2 seconds base delay
} as const;

export const SIMULATION_CONFIG = {
  // Default update frequency in Hz
  DEFAULT_UPDATE_FREQUENCY: 60,

  // Time scale default
  DEFAULT_TIME_SCALE: 1.0,
} as const;

export const AUTH_CONFIG = {
  // JWT token expiration
  TOKEN_EXPIRATION: '1d',

  // bcrypt salt rounds
  BCRYPT_SALT_ROUNDS: 10,
} as const;

export const RATE_LIMIT_CONFIG = {
  // Default rate limit window (15 minutes)
  WINDOW_MS: 15 * 60 * 1000,

  // Default max requests per window
  MAX_REQUESTS: 100,
} as const;
