/**
 * External dependencies
 */
import { isEqual } from 'lodash-es';

export const shallowEqual = (a: unknown, b: unknown): boolean => {
  return isEqual(a, b);
};
