/* ── CARAXES — Mobile detection hook ── */
import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e) => setIsMobile(e.matches)

    // Set initial value
    setIsMobile(mq.matches)

    // Listen for changes
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}

export function useIsTablet() {
  return useIsMobile(TABLET_BREAKPOINT)
}

export { MOBILE_BREAKPOINT, TABLET_BREAKPOINT }
export default useIsMobile
