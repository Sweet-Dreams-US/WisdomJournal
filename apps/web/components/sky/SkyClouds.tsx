"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  opacity: number;
  isDaytime: boolean;
}

const clouds = [
  { cx: 200, cy: 180, rx: 200, ry: 60 },
  { cx: 320, cy: 160, rx: 150, ry: 45 },
  { cx: 850, cy: 140, rx: 250, ry: 70 },
  { cx: 980, cy: 120, rx: 180, ry: 50 },
  { cx: 1280, cy: 300, rx: 200, ry: 55 },
  { cx: 500, cy: 420, rx: 300, ry: 80 },
  { cx: 100, cy: 550, rx: 220, ry: 60 },
  { cx: 1100, cy: 600, rx: 280, ry: 75 },
];

export default function SkyClouds({ opacity, isDaytime }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const cloudEls = svgRef.current.querySelectorAll(".sky-cloud");

    const tweens: gsap.core.Tween[] = [];
    cloudEls.forEach((cloud, i) => {
      tweens.push(
        gsap.to(cloud, {
          x: `random(-50, 50)`,
          y: `random(-20, 20)`,
          duration: gsap.utils.random(12, 22),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 1.2,
        })
      );
    });

    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, []);

  // Day clouds are whiter, night clouds are bluish and subtler
  const cloudColor1 = isDaytime
    ? "rgba(255,255,255,0.25)"
    : "rgba(124,185,232,0.15)";
  const cloudColor2 = isDaytime
    ? "rgba(255,255,255,0.15)"
    : "rgba(74,144,217,0.10)";

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000"
      style={{ opacity }}
      viewBox="0 0 1440 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyCloudGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={cloudColor1} stopOpacity="0" />
          <stop offset="50%" stopColor={cloudColor1} stopOpacity="1" />
          <stop offset="100%" stopColor={cloudColor1} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="skyCloudGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={cloudColor2} stopOpacity="0" />
          <stop offset="50%" stopColor={cloudColor2} stopOpacity="1" />
          <stop offset="100%" stopColor={cloudColor2} stopOpacity="0" />
        </linearGradient>
        <filter id="skyCloudBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
        </filter>
      </defs>

      {clouds.map((cloud, i) => (
        <ellipse
          key={i}
          className="sky-cloud"
          cx={cloud.cx}
          cy={cloud.cy}
          rx={cloud.rx}
          ry={cloud.ry}
          fill={i % 2 === 0 ? "url(#skyCloudGrad1)" : "url(#skyCloudGrad2)"}
          filter="url(#skyCloudBlur)"
        />
      ))}
    </svg>
  );
}
