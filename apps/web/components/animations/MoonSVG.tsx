"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function MoonSVG() {
  const moonRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!moonRef.current) return;
    const glow = moonRef.current.querySelector(".moon-glow");
    const ring1 = moonRef.current.querySelector(".moon-ring-1");
    const ring2 = moonRef.current.querySelector(".moon-ring-2");

    gsap.to(glow, {
      opacity: 0.6,
      scale: 1.1,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(ring1, {
      scale: 1.15,
      opacity: 0.2,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(ring2, {
      scale: 1.2,
      opacity: 0.1,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 1,
    });
  }, []);

  return (
    <svg
      ref={moonRef}
      width="280"
      height="280"
      viewBox="0 0 280 280"
      className="absolute top-12 right-12 md:right-24 opacity-60"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5A623" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#F5A623" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonFace" cx="40%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#FFF8E7" />
          <stop offset="60%" stopColor="#F5E6C8" />
          <stop offset="100%" stopColor="#E8D5A8" />
        </radialGradient>
      </defs>

      {/* Outer rings */}
      <circle className="moon-ring-2" cx="140" cy="140" r="130" fill="none" stroke="rgba(245,166,35,0.05)" strokeWidth="1" />
      <circle className="moon-ring-1" cx="140" cy="140" r="100" fill="none" stroke="rgba(245,166,35,0.08)" strokeWidth="1" />

      {/* Glow */}
      <circle className="moon-glow" cx="140" cy="140" r="90" fill="url(#moonGlow)" />

      {/* Moon body */}
      <circle cx="140" cy="140" r="40" fill="url(#moonFace)" />

      {/* Crescent shadow */}
      <circle cx="155" cy="135" r="35" fill="rgba(44, 62, 107, 0.25)" />
    </svg>
  );
}
