/**
 * External dependencies
 */
import { createContext as createContextOrig } from 'use-context-selector';

const createContext = <T>(defaultValue: T) => {
  return createContextOrig(defaultValue);
};

export default createContext;
