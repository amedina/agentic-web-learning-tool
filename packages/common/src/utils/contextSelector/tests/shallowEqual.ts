/**
 * Internal dependencies
 */
import { shallowEqual } from '../shallowEqual';

describe('shallowEqual', () => {
  it('should return true if the objects are equal', () => {
    const a = { a: 1, b: 2 };
    const b = { a: 1, b: 2 };
    expect(shallowEqual(a, b)).toBe(true);
  });

  it('should return false if the objects are not equal', () => {
    const a = { a: 1, b: 2 };
    const b = { a: 1, b: 3 };
    expect(shallowEqual(a, b)).toBe(false);
  });

  it('should return true if the arrays are equal', () => {
    const a = [1, 2, 3];
    const b = [1, 2, 3];
    expect(shallowEqual(a, b)).toBe(true);
  });

  it('should return false if the arrays are not equal', () => {
    const a = [1, 2, 3];
    const b = [1, 2, 4];
    expect(shallowEqual(a, b)).toBe(false);
  });

  it('should return true if the arrays of objects are equal', () => {
    const a = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    const b = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    expect(shallowEqual(a, b)).toBe(true);
  });

  it('should return false if the arrays of objects are not equal', () => {
    const a = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    const b = [
      { a: 1, b: 2 },
      { a: 3, b: 5 },
    ];
    expect(shallowEqual(a, b)).toBe(false);
  });

  it('should return false if the arrays of objects are not equal', () => {
    const a = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    const b = [
      { a: 1, b: 2 },
      { a: 3, b: 5 },
    ];
    expect(shallowEqual(a, b)).toBe(false);
  });
});
