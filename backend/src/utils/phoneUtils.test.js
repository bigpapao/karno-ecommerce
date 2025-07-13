import { normalizePhoneNumber, formatPhoneNumber, isValidIranianMobile } from './phoneUtils.js';

describe('phoneUtils', () => {
  describe('normalizePhoneNumber', () => {
    test('removes country code and leading zero', () => {
      expect(normalizePhoneNumber('989121234567')).toBe('9121234567');
      expect(normalizePhoneNumber('09121234567')).toBe('9121234567');
      expect(normalizePhoneNumber('+989121234567')).toBe('9121234567');
      expect(normalizePhoneNumber('00989121234567')).toBe('9121234567');
    });

    test('returns the phone if invalid', () => {
      expect(normalizePhoneNumber('abc')).toBe('abc');
    });
  });

  describe('formatPhoneNumber', () => {
    test('formats valid phone number', () => {
      expect(formatPhoneNumber('09121234567')).toBe('09121 234 567');
    });

    test('returns original for invalid numbers', () => {
      expect(formatPhoneNumber('abc')).toBe('abc');
    });
  });

  describe('isValidIranianMobile', () => {
    test('detects valid numbers', () => {
      expect(isValidIranianMobile('09121234567')).toBe(true);
      expect(isValidIranianMobile('00989121234567')).toBe(true);
    });

    test('detects invalid numbers', () => {
      expect(isValidIranianMobile('12345')).toBe(false);
    });
  });
});
