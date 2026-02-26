"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function WisdomOrbitSVG() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const particles = svgRef.current.querySelectorAll(".orbit-particle");
    const rings = svgRef.current.querySelectorAll(".orbit-ring");

    rings.forEach((ring, i) => {
      gsap.to(ring, {
        rotation: i % 2 === 0 ? 360 : -360,
        duration: 20 + i * 8,
        repeat: -1,
        ease: "none",
        transformOrigin: "50% 50%",
      });
    });

    particles.forEach((particle, i) => {
      gsap.to(particle, {
        opacity: gsap.utils.random(0.3, 1),
        scale: gsap.utils.random(0.5, 1.5),
        duration: gsap.utils.random(1.5, 3),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.4,
      });
    });
  }, []);

  return (
    <svg
      ref={svgRef}
      width="500"
      height="500"
      viewBox="0 0 500 500"
      className="absolute -left-32 top-1/2 -translate-y-1/2 opacity-30 hidden lg:block"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="particleGlow">
          <stop offset="0%" stopColor="#7CB9E8" />
          <stop offset="100%" stopColor="#4A90D9" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Orbit rings */}
      <g className="orbit-ring">
        <ellipse cx="250" cy="250" rx="180" ry="180" fill="none" stroke="rgba(124,185,232,0.08)" strokeWidth="1" strokeDasharray="4 8" />
        <circle className="orbit-particle" cx="430" cy="250" r="4" fill="#7CB9E8" />
        <circle className="orbit-particle" cx="70" cy="250" r="3" fill="#F5A623" />
      </g>

      <g className="orbit-ring">
        <ellipse cx="250" cy="250" rx="130" ry="130" fill="none" stroke="rgba(74,144,217,0.06)" strokeWidth="1" strokeDasharray="2 6" />
        <circle className="orbit-particle" cx="380" cy="250" r="3" fill="#4A90D9" />
        <circle className="orbit-particle" cx="120" cy="250" r="2.5" fill="#FF7E6B" />
      </g>

      <g className="orbit-ring">
        <ellipse cx="250" cy="250" rx="80" ry="80" fill="none" stroke="rgba(245,166,35,0.06)" strokeWidth="1" strokeDasharray="3 5" />
        <circle className="orbit-particle" cx="330" cy="250" r="2" fill="#F5A623" />
      </g>

      {/* Center glow */}
      <circle cx="250" cy="250" r="20" fill="url(#particleGlow)" opacity="0.3" />
      <circle cx="250" cy="250" r="6" fill="#7CB9E8" opacity="0.6" />
    </svg>
  );
}
