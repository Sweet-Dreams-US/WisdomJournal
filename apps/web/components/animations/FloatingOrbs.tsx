"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface OrbConfig {
  color: string;
  size: number;
  x: string;
  y: string;
  blur: number;
}

const defaultOrbs: OrbConfig[] = [
  { color: "rgba(74, 144, 217, 0.12)", size: 400, x: "10%", y: "20%", blur: 80 },
  { color: "rgba(124, 185, 232, 0.08)", size: 500, x: "70%", y: "10%", blur: 100 },
  { color: "rgba(245, 166, 35, 0.06)", size: 350, x: "80%", y: "60%", blur: 70 },
  { color: "rgba(255, 126, 107, 0.05)", size: 300, x: "20%", y: "70%", blur: 60 },
  { color: "rgba(74, 144, 217, 0.08)", size: 250, x: "50%", y: "40%", blur: 90 },
];

interface Props {
  orbs?: OrbConfig[];
}

export default function FloatingOrbs({ orbs = defaultOrbs }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.children;

    Array.from(els).forEach((el, i) => {
      gsap.to(el, {
        x: `random(-60, 60)`,
        y: `random(-60, 60)`,
        duration: gsap.utils.random(8, 14),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.5,
      });

      gsap.to(el, {
        scale: gsap.utils.random(0.8, 1.2),
        opacity: gsap.utils.random(0.3, 0.8),
        duration: gsap.utils.random(4, 8),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.3,
      });
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: `blur(${orb.blur}px)`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}
