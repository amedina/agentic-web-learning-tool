/**
 * External dependencies
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const splitLines = (code: string): string[] => code.split(/\r?\n/);

export const joinLines = (lines: string[]): string => lines.join('\n');

export const isEmptyOrWhitespace = (line: string): boolean =>
  !line || line.trim() === '';

export const isComment = (line: string): boolean => {
  const trimmed = line.trim();
  return trimmed.startsWith('//') || trimmed.startsWith('/*');
};
