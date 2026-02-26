"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import {
  getFractionalHour,
  getSkyColors,
  getSunPosition,
  getMoonPosition,
  getMoonPhase,
  getStarOpacity,
  getCloudOpacity,
} from "@/lib/skyUtils";
import SkyStars from "./SkyStars";
import SunSVG from "./SunSVG";
import SkyMoonSVG from "./SkyMoonSVG";
import SkyClouds from "./SkyClouds";

interface SkyState {
  topColor: string;
  bottomColor: string;
  sunX: number;
  sunY: number;
  sunVisible: boolean;
  moonX: number;
  moonY: number;
  moonVisible: boolean;
  moonPhase: number;
  starOpacity: number;
  cloudOpacity: number;
  isDaytime: boolean;
}

function computeSkyState(date: Date): SkyState {
  const hour = getFractionalHour(date);
  const colors = getSkyColors(hour);
  const sun = getSunPosition(hour);
  const moon = getMoonPosition(hour);

  return {
    topColor: colors.top,
    bottomColor: colors.bottom,
    sunX: sun.x,
    sunY: sun.y,
    sunVisible: sun.visible,
    moonX: moon.x,
    moonY: moon.y,
    moonVisible: moon.visible,
    moonPhase: getMoonPhase(date),
    starOpacity: getStarOpacity(hour),
    cloudOpacity: getCloudOpacity(hour),
    isDaytime: hour >= 6.5 && hour < 19,
  };
}

export default function DynamicSky() {
  const [sky, setSky] = useState<SkyState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimatedIn = useRef(false);

  const updateSky = useCallback(() => {
    setSky(computeSkyState(new Date()));
  }, []);

  // Initial mount + entrance animation
  useEffect(() => {
    updateSky();

    // Entrance animation: start slightly darker, then settle
    if (containerRef.current && !hasAnimatedIn.current) {
      hasAnimatedIn.current = true;
      gsap.fromTo(
        containerRef.current,
        { opacity: 0.7 },
        { opacity: 1, duration: 0.8, ease: "power2.out" }
      );
    }

    // Update every 60 seconds
    const interval = setInterval(updateSky, 60_000);
    return () => clearInterval(interval);
  }, [updateSky]);

  // Don't render anything server-side
  if (!sky) return <div className="fixed inset-0 z-0 bg-[#0a0e1a]" />;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 transition-colors duration-[2000ms]"
      style={{
        background: `linear-gradient(180deg, ${sky.topColor} 0%, ${sky.bottomColor} 100%)`,
      }}
      aria-hidden="true"
    >
      {/* Stars layer */}
      <SkyStars opacity={sky.starOpacity} />

      {/* Clouds layer */}
      <SkyClouds opacity={sky.cloudOpacity} isDaytime={sky.isDaytime} />

      {/* Sun */}
      <SunSVG x={sky.sunX} y={sky.sunY} visible={sky.sunVisible} />

      {/* Moon */}
      <SkyMoonSVG
        x={sky.moonX}
        y={sky.moonY}
        visible={sky.moonVisible}
        phase={sky.moonPhase}
      />
    </div>
  );
}
