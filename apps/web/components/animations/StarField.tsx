"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function StarField() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const stars: HTMLDivElement[] = [];

    for (let i = 0; i < 80; i++) {
      const star = document.createElement("div");
      const size = Math.random() * 3 + 1;
      star.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: white;
        border-radius: 50%;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        opacity: 0;
      `;
      container.appendChild(star);
      stars.push(star);

      gsap.to(star, {
        opacity: Math.random() * 0.7 + 0.1,
        duration: Math.random() * 2 + 1,
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 3,
        ease: "sine.inOut",
      });
    }

    return () => {
      stars.forEach((s) => s.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    />
  );
}
