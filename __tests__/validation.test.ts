import { DURATION_OPTIONS } from '../src/domain/types';
import {
    MSG_RANGE, MSG_STEP, validateDate, validateDuration
} from '../src/domain/validation';

describe('validateDuration', () => {
  it.each([15, 60, 720])('accepts %i', (v) => expect(validateDuration(v)).toBeNull());
  it.each([0, 10, 14, 730, -15])('range error for %i', (v) =>
    expect(validateDuration(v)).toBe(MSG_RANGE));
  it.each([20, 100, 16, 22.5])('step error for %s', (v) =>
    expect(validateDuration(v)).toBe(MSG_STEP));
  it('rejects non-numbers', () => {
    expect(validateDuration('60')).toBe(MSG_RANGE);
    expect(validateDuration(NaN)).toBe(MSG_RANGE);
  });
  it('every picker option is valid', () => {
    expect(DURATION_OPTIONS).toHaveLength(48);
    DURATION_OPTIONS.forEach((v) => expect(validateDuration(v)).toBeNull());
  });
});

describe('validateDate', () => {
  it('accepts real dates', () => expect(validateDate('2026-06-01')).toBe(true));
  it('rejects bad formats and impossible dates', () => {
    ['2026-6-1', '2026-02-30', '2026-13-01', 'abc', ''].forEach((v) =>
      expect(validateDate(v)).toBe(false));
  });
});
