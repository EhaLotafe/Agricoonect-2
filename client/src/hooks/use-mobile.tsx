// client/src/hooks/use-mobile.tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * 📱 USEISMOBILE (Approche Mobile-First)
 * Justification TFC : Optimise l'ergonomie du sondage pour les terminaux mobiles,
 * principal canal d'accès à l'information pour 2,7 millions de Lubumbashiens.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}