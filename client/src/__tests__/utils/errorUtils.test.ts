import { describe, it, expect } from 'vitest';

import { getErrorMessage } from '../../utils/errorUtils';

describe('getErrorMessage', () => {
  it('extracts message from Error object', () => {
    expect(getErrorMessage(new Error('test error'))).toBe('test error');
  });

  it('extracts message from plain object with message property', () => {
    expect(getErrorMessage({ message: 'custom error' })).toBe('custom error');
  });

  it('returns fallback for null', () => {
    expect(getErrorMessage(null)).toBe('An error occurred');
  });

  it('returns fallback for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('An error occurred');
  });

  it('returns fallback for string', () => {
    expect(getErrorMessage('some string')).toBe('An error occurred');
  });

  it('returns custom fallback', () => {
    expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });

  it('returns fallback when message is empty string', () => {
    expect(getErrorMessage({ message: '' })).toBe('An error occurred');
  });

  it('returns fallback for number', () => {
    expect(getErrorMessage(42)).toBe('An error occurred');
  });
});
