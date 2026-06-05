/**
 * sectionTransition01 — GSAP-based section transition system
 * ==========================================================
 *
 * Modes (via data-st-01 attribute):
 *   "parallax" — moves section on Y as next section enters
 *   "pin"      — pins section while next section scrolls over it
 *   "reveal"   — reveals section from behind previous section
 *
 * Additional attributes:
 *   data-st-y="300"       — Y distance (parallax/reveal, px)
 *   data-st-opacity="0.5" — overlay opacity (0..1)
 *   data-st-overlay="black" — overlay color
 *
 * Source: Implement_this_exact_GSAP-based_section_transition_system
 *
 * React usage:
 *   import { useEffect, useRef } from "react";
 *   import { sectionTransition01 } from "../lib/gsap-effects";
 *
 *   function MyPage() {
 *     const ref = useRef(null);
 *     useEffect(() => {
 *       const ctx = sectionTransition01(ref.current);
 *       return () => ctx && ctx.revert && ctx.revert();
 *     }, []);
 *     return (
 *       <div ref={ref}>
 *         <section data-st-01="parallax" data-st-y="300">...</section>
 *         <section>...</section>
 *       </div>
 *     );
 *   }
 */

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function sectionTransition01(scopeOrConfig = document, maybeConfig = {}) {
  const DEFAULT_CONFIG = {
    parallaxY: 400,
    revealY: 0,
    overlayColor: "black",
    mobile: {
      breakpoint: 768,
      strategy: "simplify", // "simplify" | "disable" | "same"
    },
  };

  const isScope = (value) => value instanceof Element || value instanceof Document;

  const getConfig = (overrides = {}) => ({
    ...DEFAULT_CONFIG,
    ...overrides,
    mobile: {
      ...DEFAULT_CONFIG.mobile,
      ...(overrides.mobile || {}),
    },
  });

  const getYValue = (section, fallback) => {
    const yValue = parseFloat(section.dataset.stY || String(fallback));
    return Number.isNaN(yValue) ? fallback : yValue;
  };

  const getOpacityValue = (section) => {
    const opacityValue = parseFloat(section.dataset.stOpacity || "");
    if (Number.isNaN(opacityValue)) return null;
    return Math.max(0, Math.min(1, opacityValue));
  };

  const getOverlayColor = (section, fallback) => section.dataset.stOverlay || fallback;

  const getOverlayElement = (section, color) => {
    let overlay = section.querySelector("[data-st-overlay-el]");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.setAttribute("data-st-overlay-el", "");
      overlay.setAttribute("aria-hidden", "true");
      section.append(overlay);
    }
    if (getComputedStyle(section).position === "static") {
      section.style.position = "relative";
    }
    section.style.isolation = "isolate";
    Object.assign(overlay.style, {
      position: "absolute",
      inset: "0",
      zIndex: "2",
      pointerEvents: "none",
      background: color,
      opacity: "0",
      willChange: "opacity",
    });
    return overlay;
  };

  const resetOverlay = (section) => {
    const existingOverlay = section.querySelector("[data-st-overlay-el]");
    if (existingOverlay) {
      gsap.set(existingOverlay, { opacity: 0 });
    }
  };

  const getConfiguredYValue = (section, mode, config) => {
    if (mode === "reveal") return getYValue(section, config.revealY);
    if (mode === "parallax") return getYValue(section, config.parallaxY);
    return 0;
  };

  const isMobileViewport = (config) =>
    window.matchMedia(`(max-width: ${config.mobile.breakpoint}px)`).matches;

  const getMobileStrategy = (config) => {
    const allowed = new Set(["same", "disable", "simplify"]);
    return allowed.has(config.mobile.strategy)
      ? config.mobile.strategy
      : DEFAULT_CONFIG.mobile.strategy;
  };

  const hasYMotion = (mode, y) => mode === "parallax" || (mode === "reveal" && y !== 0);

  const resolveTransition = (mode, y, strategy, isMobile) => {
    if (!isMobile || strategy === "same" || !hasYMotion(mode, y)) {
      return { mode, y };
    }
    if (strategy === "disable") return { mode: "none", y: 0 };
    if (mode === "parallax") return { mode: "pin", y: 0 };
    return { mode, y: 0 };
  };

  const scope = isScope(scopeOrConfig) ? scopeOrConfig : document;
  const config = getConfig(isScope(scopeOrConfig) ? maybeConfig : scopeOrConfig);
  const mobileStrategy = getMobileStrategy(config);
  const isMobile = isMobileViewport(config);
  const sections = scope.querySelectorAll("[data-st-01]");

  // Return a GSAP context for React cleanup
  const ctx = gsap.context(() => {
    sections.forEach((section) => {
      const configuredMode = section.getAttribute("data-st-01") || "parallax";
      const configuredY = getConfiguredYValue(section, configuredMode, config);
      const opacity = getOpacityValue(section);
      const { mode, y } = resolveTransition(configuredMode, configuredY, mobileStrategy, isMobile);

      if (mode === "none") {
        resetOverlay(section);
        return;
      }

      // --- REVEAL ---
      if (mode === "reveal") {
        const previousSection = section.previousElementSibling;
        if (!previousSection) return;

        gsap.set(previousSection, { zIndex: 1 });
        gsap.set(section, { position: "sticky", bottom: 0, zIndex: 0 });
        if (opacity === null) resetOverlay(section);
        if (y === 0 && opacity === null) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: previousSection,
            start: "bottom bottom",
            end: () => `+=${section.offsetHeight}`,
            scrub: true,
          },
        });
        if (y !== 0) {
          tl.fromTo(section, { y }, { y: 0, ease: "none", force3D: true }, 0);
        }
        if (opacity !== null) {
          const overlay = getOverlayElement(section, getOverlayColor(section, config.overlayColor));
          gsap.set(overlay, { opacity });
          tl.to(overlay, { opacity: 0, ease: "none" }, 0);
        }
        return;
      }

      const nextSection = section.nextElementSibling;
      if (!nextSection) return;

      // --- PIN ---
      if (mode === "pin") {
        ScrollTrigger.create({
          trigger: nextSection,
          start: "top bottom",
          end: "top top",
          pin: section,
          pinSpacing: false,
        });
        if (configuredMode === "parallax" && opacity !== null) {
          const overlay = getOverlayElement(section, getOverlayColor(section, config.overlayColor));
          gsap.timeline({
            scrollTrigger: { trigger: nextSection, start: "top bottom", end: "top top", scrub: true },
          }).to(overlay, { opacity, ease: "none" }, 0);
          return;
        }
        resetOverlay(section);
        return;
      }

      // --- PARALLAX (fallthrough) ---
      const st = { trigger: nextSection, start: "top bottom", end: "top top", scrub: true };
      const tw = { y, ease: "none", force3D: true };

      if (opacity === null) {
        resetOverlay(section);
        gsap.to(section, { ...tw, scrollTrigger: st });
        return;
      }

      const overlay = getOverlayElement(section, getOverlayColor(section, config.overlayColor));
      gsap.timeline({ scrollTrigger: st })
        .to(section, tw, 0)
        .to(overlay, { opacity, ease: "none" }, 0);
    });
  }, scope);

  return ctx;
}
