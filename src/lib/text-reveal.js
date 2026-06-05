/**
 * textReveal02 — GSAP + SplitText text reveal system
 * ===================================================
 *
 * Opts text elements into the effect with data-reveal-02.
 * Splits into lines/words/chars with SplitText, fades each
 * piece in from opacity: 0.1.
 *
 * Supported modes:
 *   data-reveal-02="lines" — split into lines
 *   data-reveal-02="words" — split into words + lines
 *   data-reveal-02="chars" — split into chars + words + lines
 *
 * Scroll options (add alongside data-reveal-02):
 *   data-scroll            — threshold scroll trigger (plays once by default)
 *   data-scroll="scrub"    — scrubbed scroll-driven reveal
 *
 * Per-element overrides:
 *   data-duration="0.8"    — override item duration
 *   data-stagger="0.05"    — override stagger
 *   data-delay="0.2"       — override delay
 *   data-ease="power2.out" — override GSAP ease
 *   data-once="false"      — allow replay on scroll
 *   data-manual            — split only, no auto animation
 *
 * Source: Text_Reveal_02.md
 *
 * React usage:
 *   import { useEffect, useRef } from "react";
 *   import { textReveal02 } from "../lib/gsap-effects";
 *
 *   function MyComponent() {
 *     const ref = useRef(null);
 *     useEffect(() => {
 *       const ctx = textReveal02(ref.current);
 *       return () => ctx && ctx.revert && ctx.revert();
 *     }, []);
 *     return (
 *       <div ref={ref}>
 *         <p data-reveal-02="words" data-scroll>...</p>
 *       </div>
 *     );
 *   }
 *
 * For dynamic content / route changes, call again with the new scope:
 *   textReveal02(nextContainer);
 *
 * Or after fonts load (to prevent reflow shifts):
 *   document.fonts.ready.then(() => textReveal02());
 */

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(SplitText, ScrollTrigger);

export function textReveal02(scope = document, delay = 0, { ignoreManual = false } = {}) {
  const CONFIG = {
    lines: { duration: 0.04, stagger: 0.03, ease: "power1.out" },
    words: { duration: 0.04, stagger: 0.03, ease: "power1.out" },
    chars: { duration: 0.04, stagger: 0.03, ease: "power1.out" },
    scrollStart: "top 85%",
    scrubStart: "top 80%",
    scrubEnd: "top 20%",
    once: true,
    markers: false,
  };

  const allSplitEls = scope.querySelectorAll("[data-reveal-02]");
  const autoEls = ignoreManual
    ? [...allSplitEls]
    : [...allSplitEls].filter((el) => !el.hasAttribute("data-manual"));

  // Return a GSAP context for React cleanup
  const ctx = gsap.context(() => {
    gsap.set(autoEls, { visibility: "visible" });

    allSplitEls.forEach((el) => {
      const splitType = el.getAttribute("data-reveal-02");
      const c = CONFIG[splitType];
      if (!c) return;

      let type, linesClass, wordsClass, charsClass;
      switch (splitType) {
        case "lines":
          type = "lines";
          linesClass = "line";
          break;
        case "words":
          type = "words, lines";
          wordsClass = "word";
          linesClass = "line";
          break;
        case "chars":
          type = "chars, words, lines";
          charsClass = "char";
          wordsClass = "word";
          linesClass = "line";
          break;
        default:
          return;
      }

      // Manual mode: split only, no animation
      if (!ignoreManual && el.hasAttribute("data-manual")) {
        SplitText.create(el, {
          type,
          linesClass: linesClass || undefined,
          wordsClass: wordsClass || undefined,
          charsClass: charsClass || undefined,
        });
        return;
      }

      const scrollMode = el.getAttribute("data-scroll");
      const useScroll = el.hasAttribute("data-scroll");
      const useScrub = scrollMode === "scrub";

      SplitText.create(el, {
        type,
        linesClass: linesClass || undefined,
        wordsClass: wordsClass || undefined,
        charsClass: charsClass || undefined,
        onSplit(instance) {
          const durationValue = parseFloat(el.dataset.duration);
          const staggerValue = parseFloat(el.dataset.stagger);
          const delayValue = parseFloat(el.dataset.delay);
          const duration = Number.isNaN(durationValue) ? c.duration : durationValue;
          const stagger = Number.isNaN(staggerValue) ? c.stagger : staggerValue;
          const elDelay = Number.isNaN(delayValue) ? 0 : delayValue;
          const ease = el.dataset.ease || c.ease;

          const targets = instance[splitType];
          const once = el.hasAttribute("data-once")
            ? el.getAttribute("data-once") !== "false"
            : CONFIG.once;

          const tween = {
            opacity: 0.1,
            duration,
            stagger,
            delay: useScroll ? elDelay : elDelay + delay,
            immediateRender: true,
            ease,
          };

          if (useScrub) {
            tween.scrollTrigger = {
              trigger: el,
              start: CONFIG.scrubStart,
              end: CONFIG.scrubEnd,
              scrub: true,
              markers: CONFIG.markers,
              ...(once && { onLeave: (self) => self.kill(false) }),
            };
          } else if (useScroll) {
            const start = scrollMode || CONFIG.scrollStart;
            tween.scrollTrigger = {
              trigger: el,
              start: `clamp(${start})`,
              markers: CONFIG.markers,
              ...(once ? { once: true } : { toggleActions: "play none none reverse" }),
            };
          }

          return gsap.from(targets, tween);
        },
      });
    });
  }, scope);

  return ctx;
}
