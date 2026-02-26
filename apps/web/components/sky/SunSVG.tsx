"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  x: number;
  y: number;
  visible: boolean;
}

export default function SunSVG({ x, y, visible }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const rays = svgRef.current.querySelector(".sun-rays");
    const glow = svgRef.current.querySelector(".sun-glow");

    if (rays) {
      gsap.to(rays, {
        rotation: 360,
        duration: 60,
        repeat: -1,
        ease: "none",
        transformOrigin: "50% 50%",
      });
    }

    if (glow) {
      gsap.to(glow, {
        scale: 1.15,
        opacity: 0.6,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }
  }, []);

  // Scale larger near horizon (low y = high in sky)
  const horizonScale = y > 60 ? 1.2 : y > 40 ? 1.0 : 0.9;

  return (
    <svg
      ref={svgRef}
      width="200"
      height="200"
      viewBox="0 0 200 200"
      className="absolute pointer-events-none transition-all duration-[2000ms] ease-in-out"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${horizonScale})`,
        opacity: visible ? 1 : 0,
      }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FFF8E1" />
          <stop offset="100%" stopColor="#FFD54F" />
        </radialGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD54F" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#FFA726" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FF8F00" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer glow */}
      <circle className="sun-glow" cx="100" cy="100" r="90" fill="url(#sunGlow)" />

      {/* Rays */}
      <g className="sun-rays" opacity="0.3">
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 100 + Math.cos(angle) * 45;
          const y1 = 100 + Math.sin(angle) * 45;
          const x2 = 100 + Math.cos(angle) * 75;
          const y2 = 100 + Math.sin(angle) * 75;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#FFD54F"
              strokeWidth={i % 2 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Sun body */}
      <circle cx="100" cy="100" r="30" fill="url(#sunCore)" />
    </svg>
  );
}
