/**
 * External dependencies
 */
import { useCallback, useEffect, useState } from 'react';
/**
 * internal dependencies
 */
import { MOBILE_BREAKPOINT } from '../constants';

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  const onChange = useCallback(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  }, []);

  useEffect(() => {
    const matchMedia = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    );

    matchMedia.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    return () => matchMedia.removeEventListener('change', onChange);
  }, [onChange]);

  return !!isMobile;
}
