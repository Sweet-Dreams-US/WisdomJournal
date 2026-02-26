"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  children: ReactNode;
  className?: string;
  direction?: "up" | "left" | "right" | "scale";
  delay?: number;
  duration?: number;
  stagger?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  duration = 0.8,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const initialProps: gsap.TweenVars = { opacity: 0 };
    const animateProps: gsap.TweenVars = {
      opacity: 1,
      duration,
      delay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    };

    switch (direction) {
      case "up":
        initialProps.y = 60;
        animateProps.y = 0;
        break;
      case "left":
        initialProps.x = 60;
        animateProps.x = 0;
        break;
      case "right":
        initialProps.x = -60;
        animateProps.x = 0;
        break;
      case "scale":
        initialProps.scale = 0.85;
        animateProps.scale = 1;
        break;
    }

    gsap.set(ref.current, initialProps);
    gsap.to(ref.current, animateProps);

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [direction, delay, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
