import {
  MQTT_CONFIG,
  SIMULATION_CONFIG,
  AUTH_CONFIG,
  RATE_LIMIT_CONFIG,
} from '../../config/constants';

describe('constants', () => {
  describe('MQTT_CONFIG', () => {
    it('has expected connection settings', () => {
      expect(MQTT_CONFIG.CONNECT_TIMEOUT).toBe(15000);
      expect(MQTT_CONFIG.RECONNECT_PERIOD).toBe(0);
      expect(MQTT_CONFIG.KEEPALIVE).toBe(30);
      expect(MQTT_CONFIG.MAX_RECONNECT_ATTEMPTS).toBe(3);
      expect(MQTT_CONFIG.RECONNECT_BACKOFF_BASE).toBe(2000);
    });
  });

  describe('SIMULATION_CONFIG', () => {
    it('has expected defaults', () => {
      expect(SIMULATION_CONFIG.DEFAULT_UPDATE_FREQUENCY).toBe(60);
      expect(SIMULATION_CONFIG.DEFAULT_TIME_SCALE).toBe(1.0);
    });
  });

  describe('AUTH_CONFIG', () => {
    it('has expected values', () => {
      expect(AUTH_CONFIG.TOKEN_EXPIRATION).toBe('1d');
      expect(AUTH_CONFIG.BCRYPT_SALT_ROUNDS).toBe(10);
    });
  });

  describe('RATE_LIMIT_CONFIG', () => {
    it('has expected values', () => {
      expect(RATE_LIMIT_CONFIG.WINDOW_MS).toBe(900000);
      expect(RATE_LIMIT_CONFIG.MAX_REQUESTS).toBe(100);
    });
  });
});
