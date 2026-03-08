"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  currentStreak: number;
  longestStreak: number;
}

export default function StreakFlame({ currentStreak, longestStreak }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!flameRef.current) return;

    const flames = flameRef.current.querySelectorAll(".flame-layer");
    const particles = flameRef.current.querySelectorAll(".spark");

    // Flame breathing
    flames.forEach((flame, i) => {
      gsap.to(flame, {
        scaleY: gsap.utils.random(0.9, 1.1),
        scaleX: gsap.utils.random(0.95, 1.05),
        duration: gsap.utils.random(0.6, 1.2),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.15,
        transformOrigin: "center bottom",
      });
    });

    // Sparks float up
    particles.forEach((spark) => {
      gsap.to(spark, {
        y: gsap.utils.random(-40, -80),
        x: gsap.utils.random(-20, 20),
        opacity: 0,
        scale: 0,
        duration: gsap.utils.random(1, 2.5),
        repeat: -1,
        ease: "power1.out",
        delay: gsap.utils.random(0, 3),
      });
    });

    // Entrance animation
    gsap.from(containerRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power2.out",
    });

    return () => {
      gsap.killTweensOf("*");
    };
  }, []);

  // Flame intensity based on streak length
  const intensity = Math.min(currentStreak / 30, 1); // caps at 30-day streak
  const flameHeight = 60 + intensity * 40;
  const outerColor = currentStreak >= 7 ? "#F5A623" : "#FF7E6B";
  const innerColor = currentStreak >= 14 ? "#FFD700" : currentStreak >= 7 ? "#FFBE4F" : "#FFA07A";

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      <svg
        ref={flameRef}
        viewBox="0 0 100 120"
        className="w-24 h-28"
      >
        {/* Glow underneath */}
        <ellipse
          cx="50"
          cy="105"
          rx={20 + intensity * 10}
          ry="6"
          fill={outerColor}
          opacity={0.15 + intensity * 0.15}
        />

        {/* Outer flame */}
        <path
          className="flame-layer"
          d={`M50 ${110 - flameHeight} C35 ${80 - flameHeight * 0.3} 25 85 30 100 C33 108 42 112 50 110 C58 112 67 108 70 100 C75 85 65 ${80 - flameHeight * 0.3} 50 ${110 - flameHeight}Z`}
          fill={outerColor}
          opacity={0.7 + intensity * 0.3}
        />

        {/* Mid flame */}
        <path
          className="flame-layer"
          d={`M50 ${120 - flameHeight * 0.85} C40 ${90 - flameHeight * 0.2} 33 92 37 102 C40 108 45 110 50 109 C55 110 60 108 63 102 C67 92 60 ${90 - flameHeight * 0.2} 50 ${120 - flameHeight * 0.85}Z`}
          fill={innerColor}
          opacity={0.8}
        />

        {/* Inner bright core */}
        <path
          className="flame-layer"
          d={`M50 ${125 - flameHeight * 0.6} C44 ${100 - flameHeight * 0.1} 40 98 43 104 C45 108 48 109 50 108 C52 109 55 108 57 104 C60 98 56 ${100 - flameHeight * 0.1} 50 ${125 - flameHeight * 0.6}Z`}
          fill="#FFFEF0"
          opacity={0.9}
        />

        {/* Sparks */}
        {Array.from({ length: 6 }).map((_, i) => (
          <circle
            key={i}
            className="spark"
            cx={45 + Math.random() * 10}
            cy={90 - Math.random() * 20}
            r={1 + Math.random()}
            fill={innerColor}
            opacity={0.6 + Math.random() * 0.4}
          />
        ))}
      </svg>

      <div className="text-center mt-1">
        <p className="text-3xl font-bold font-heading" style={{ color: outerColor }}>
          {currentStreak}
        </p>
        <p className="text-xs text-charcoal/50 font-body">
          day streak
        </p>
        {longestStreak > currentStreak && (
          <p className="text-xs text-charcoal/40 font-body mt-0.5">
            Best: {longestStreak} days
          </p>
        )}
      </div>
    </div>
  );
}
