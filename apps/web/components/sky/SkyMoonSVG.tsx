"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  x: number;
  y: number;
  visible: boolean;
  phase: number; // 0 = new moon, 0.5 = full moon
}

export default function SkyMoonSVG({ x, y, visible, phase }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.to(".moon-glow", {
        opacity: 0.6,
        scale: 1.1,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".moon-ring-1", {
        scale: 1.15,
        opacity: 0.2,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".moon-ring-2", {
        scale: 1.2,
        opacity: 0.1,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1,
      });
    }, svgRef);

    return () => ctx.revert();
  }, []);

  // The sky is fixed-position, so page content scrolls past the moon. The raw
  // arc from getMoonPosition puts y anywhere between 10% and 85% of the
  // viewport, which parked the bright disc directly behind section headings
  // mid-scroll. Remap the arc into a 6%–26% top band so the moon stays above
  // the reading line at every scroll position, keeping the arc's shape.
  const bandY = 6 + ((Math.min(Math.max(y, 10), 85) - 10) * 20) / 75;

  // Moon phase shadow rendering
  // phase: 0=new (fully shadowed), 0.25=first quarter, 0.5=full (no shadow), 0.75=last quarter
  // We create a shadow mask using an ellipse whose rx varies with phase
  const illumination = Math.abs(phase - 0.5) * 2; // 0 at full, 1 at new
  // Shadow ellipse rx: 0 at full (no shadow), 40 at new (full shadow)
  const shadowRx = illumination * 40;
  // Shadow position: left side for waxing (0-0.5), right side for waning (0.5-1)
  const shadowCx = phase < 0.5 ? 140 - shadowRx * 0.5 : 140 + shadowRx * 0.5;
  // Shadow visibility: at full moon (phase ~0.5), no shadow needed
  const showShadow = illumination > 0.05;

  return (
    <div
      className="absolute pointer-events-none transition-all duration-[2000ms] ease-in-out"
      style={{
        left: `${x}%`,
        top: `${bandY}%`,
        transform: "translate(-50%, -50%)",
        opacity: visible ? 0.8 : 0,
      }}
      aria-hidden="true"
    >
    <svg
      ref={svgRef}
      width="240"
      height="240"
      viewBox="0 0 280 280"
      className="block"
      style={{
        // Ultra-slow ambient drift (reuses the global `float` keyframe,
        // slowed to 14s). Reduced motion zeroes this via globals.css.
        animation: "float 14s ease-in-out infinite",
      }}
    >
      <defs>
        <radialGradient id="skyMoonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5A623" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#F5A623" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="skyMoonFace" cx="40%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#FFF8E7" />
          <stop offset="60%" stopColor="#F5E6C8" />
          <stop offset="100%" stopColor="#E8D5A8" />
        </radialGradient>
        <clipPath id="moonClip">
          <circle cx="140" cy="140" r="40" />
        </clipPath>
      </defs>

      {/* Outer rings */}
      <circle className="moon-ring-2" cx="140" cy="140" r="130" fill="none" stroke="rgba(245,166,35,0.05)" strokeWidth="1" />
      <circle className="moon-ring-1" cx="140" cy="140" r="100" fill="none" stroke="rgba(245,166,35,0.08)" strokeWidth="1" />

      {/* Glow */}
      <circle className="moon-glow" cx="140" cy="140" r="90" fill="url(#skyMoonGlow)" />

      {/* Moon body */}
      <circle cx="140" cy="140" r="40" fill="url(#skyMoonFace)" />

      {/* Crater textures */}
      <g opacity="0.1" clipPath="url(#moonClip)">
        <circle cx="125" cy="130" r="8" fill="#C8B88A" />
        <circle cx="150" cy="150" r="5" fill="#C8B88A" />
        <circle cx="135" cy="160" r="6" fill="#C8B88A" />
        <circle cx="155" cy="125" r="4" fill="#C8B88A" />
      </g>

      {/* Phase shadow */}
      {showShadow && (
        <ellipse
          cx={shadowCx}
          cy="140"
          rx={shadowRx}
          ry="40"
          fill="rgba(10, 14, 26, 0.85)"
          clipPath="url(#moonClip)"
        />
      )}
    </svg>
    </div>
  );
}
