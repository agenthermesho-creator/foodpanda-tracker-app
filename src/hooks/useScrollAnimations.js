import { useEffect, useRef } from "react";
import { sectionTransition01 } from "../lib/section-transitions";
import { textReveal02 } from "../lib/text-reveal";

/**
 * useScrollAnimations — initialize GSAP section transitions + text reveal
 *
 * Usage:
 *   import { useScrollAnimations } from "../hooks/useScrollAnimations";
 *   function MyPage() {
 *     const ref = useScrollAnimations();
 *     return (
 *       <div ref={ref}>
 *         <section data-st-01="parallax" data-st-y="300">...</section>
 *         <p data-reveal-02="words" data-scroll>...</p>
 *       </div>
 *     );
 *   }
 */
export function useScrollAnimations(delay = 0) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    sectionTransition01(ref.current);
    textReveal02(ref.current, delay);

    return () => {
      // GSAP context handles cleanup via revert()
    };
  }, [delay]);

  return ref;
}

/**
 * useGSAPTextReveal — text reveal only (no section transitions)
 *
 * Usage:
 *   const ref = useGSAPTextReveal();
 *   // or with fonts ready:
 *   const ref = useGSAPTextReveal(0, true);
 */
export function useGSAPTextReveal(delay = 0, waitForFonts = false) {
  const ref = useRef(null);

  useEffect(() => {
    const run = () => {
      if (ref.current) textReveal02(ref.current, delay);
    };
    if (waitForFonts) {
      document.fonts.ready.then(run);
    } else {
      run();
    }
  }, [delay, waitForFonts]);

  return ref;
}

/**
 * useGSAPSectionTransitions — section transitions only (no text reveal)
 */
export function useGSAPSectionTransitions() {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) sectionTransition01(ref.current);
  }, []);

  return ref;
}
