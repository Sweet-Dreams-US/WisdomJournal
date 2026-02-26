"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  opacity: number;
}

// Pre-generate star positions so they're stable across re-renders
const STAR_COUNT = 120;
const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  size: Math.random() * 2.5 + 0.5,
  top: Math.random() * 100,
  left: Math.random() * 100,
  baseOpacity: Math.random() * 0.6 + 0.2,
  twinkleDuration: Math.random() * 2 + 1.5,
  delay: Math.random() * 4,
}));

export default function SkyStars({ opacity }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.children;

    const tweens: gsap.core.Tween[] = [];
    Array.from(els).forEach((el, i) => {
      const star = stars[i];
      const tween = gsap.to(el, {
        opacity: star.baseOpacity,
        duration: star.twinkleDuration,
        repeat: -1,
        yoyo: true,
        delay: star.delay,
        ease: "sine.inOut",
      });
      tweens.push(tween);
    });
    tweensRef.current = tweens;

    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
      style={{ opacity }}
      aria-hidden="true"
    >
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            width: star.size,
            height: star.size,
            top: `${star.top}%`,
            left: `${star.left}%`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
