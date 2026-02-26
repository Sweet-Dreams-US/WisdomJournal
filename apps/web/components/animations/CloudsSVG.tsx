"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CloudsSVG() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const clouds = svgRef.current.querySelectorAll(".cloud");

    clouds.forEach((cloud, i) => {
      gsap.set(cloud, { opacity: 0.15 + i * 0.05 });
      gsap.to(cloud, {
        x: `random(-40, 40)`,
        y: `random(-15, 15)`,
        duration: gsap.utils.random(10, 20),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 1.5,
      });
    });
  }, []);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cloudGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(124,185,232,0)" />
          <stop offset="50%" stopColor="rgba(124,185,232,0.15)" />
          <stop offset="100%" stopColor="rgba(124,185,232,0)" />
        </linearGradient>
        <linearGradient id="cloudGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(74,144,217,0)" />
          <stop offset="50%" stopColor="rgba(74,144,217,0.1)" />
          <stop offset="100%" stopColor="rgba(74,144,217,0)" />
        </linearGradient>
        <filter id="cloudBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
        </filter>
      </defs>

      {/* Layered cloud shapes */}
      <ellipse className="cloud" cx="200" cy="200" rx="200" ry="60" fill="url(#cloudGrad1)" filter="url(#cloudBlur)" />
      <ellipse className="cloud" cx="300" cy="180" rx="150" ry="45" fill="url(#cloudGrad2)" filter="url(#cloudBlur)" />

      <ellipse className="cloud" cx="900" cy="150" rx="250" ry="70" fill="url(#cloudGrad1)" filter="url(#cloudBlur)" />
      <ellipse className="cloud" cx="1000" cy="130" rx="180" ry="50" fill="url(#cloudGrad2)" filter="url(#cloudBlur)" />

      <ellipse className="cloud" cx="1300" cy="350" rx="200" ry="55" fill="url(#cloudGrad1)" filter="url(#cloudBlur)" />

      <ellipse className="cloud" cx="500" cy="500" rx="300" ry="80" fill="url(#cloudGrad2)" filter="url(#cloudBlur)" />

      <ellipse className="cloud" cx="100" cy="650" rx="220" ry="60" fill="url(#cloudGrad1)" filter="url(#cloudBlur)" />
      <ellipse className="cloud" cx="1100" cy="700" rx="280" ry="75" fill="url(#cloudGrad2)" filter="url(#cloudBlur)" />
    </svg>
  );
}
