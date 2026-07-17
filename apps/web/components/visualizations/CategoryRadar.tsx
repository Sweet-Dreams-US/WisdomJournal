"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import gsap from "gsap";
import type { CategoryBreakdown } from "@wisdom-journal/shared";

interface Props {
  categories: CategoryBreakdown[];
  size?: number;
}

const BRAND = {
  deepSky: "#4A90D9",
  skyBlue: "#7CB9E8",
  twilight: "#2C3E6B",
  goldenHour: "#F5A623",
  stardust: "#c5d5f0",
  nightSky: "#0a0e1a",
  deepNight: "#111b33",
  midnight: "#1a2a4a",
};

const CATEGORY_COLORS: Record<string, string> = {
  medical_health: "#f43f5e",
  financial: "#059669",
  relationships: "#ec4899",
  deeply_personal: "#9333ea",
  life_lessons: "#f59e0b",
  family_traditions: "#f97316",
  career_work: "#2563eb",
  hobbies_interests: "#14b8a6",
  values_beliefs: "#6366f1",
  memories_stories: "#0ea5e9",
  daily_reflection: "#eab308",
};

export default function CategoryRadar({ categories, size = 400 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || categories.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = 60;
    const cx = size / 2;
    const cy = size / 2;
    const radius = (size - margin * 2) / 2;
    const angleSlice = (Math.PI * 2) / categories.length;

    // Max value for scaling
    const maxVal = Math.max(...categories.map((c) => c.response_count), 1);

    // Radial scale
    const rScale = d3.scaleLinear().domain([0, maxVal]).range([0, radius]);

    // Defs
    const defs = svg.append("defs");

    // Gradient fill for the web
    const areaGrad = defs
      .append("radialGradient")
      .attr("id", "radar-fill")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");
    areaGrad.append("stop").attr("offset", "0%").attr("stop-color", BRAND.deepSky).attr("stop-opacity", 0.4);
    areaGrad.append("stop").attr("offset", "100%").attr("stop-color", BRAND.skyBlue).attr("stop-opacity", 0.1);

    // Background
    svg
      .append("rect")
      .attr("width", size)
      .attr("height", size)
      .attr("rx", 20)
      .attr("fill", BRAND.deepNight);

    const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

    // Concentric grid rings
    const levels = 4;
    for (let level = 1; level <= levels; level++) {
      const r = (radius / levels) * level;
      g.append("circle")
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", `${BRAND.stardust}15`)
        .attr("stroke-width", 1);

      // Level label
      g.append("text")
        .attr("x", 4)
        .attr("y", -r + 4)
        .text(Math.round((maxVal / levels) * level).toString())
        .attr("fill", `${BRAND.stardust}40`)
        .attr("font-size", "9px")
        .attr("font-family", "'IBM Plex Mono', monospace");
    }

    // Axis lines + labels
    categories.forEach((cat, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const lineX = Math.cos(angle) * radius;
      const lineY = Math.sin(angle) * radius;

      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", lineX)
        .attr("y2", lineY)
        .attr("stroke", `${BRAND.stardust}15`)
        .attr("stroke-width", 1);

      // Label
      const labelRadius = radius + 16;
      const lx = Math.cos(angle) * labelRadius;
      const ly = Math.sin(angle) * labelRadius;

      const label = g
        .append("text")
        .attr("x", lx)
        .attr("y", ly)
        .attr("text-anchor", () => {
          if (Math.abs(lx) < 5) return "middle";
          return lx > 0 ? "start" : "end";
        })
        .attr("dy", "0.35em")
        .attr("fill", CATEGORY_COLORS[cat.slug] ?? BRAND.stardust)
        .attr("font-size", "10px")
        .attr("font-weight", "600")
        .attr("font-family", "'IBM Plex Mono', monospace")
        .attr("opacity", 0)
        .text(cat.name.length > 14 ? cat.name.slice(0, 12) + "…" : cat.name);

      // Animate labels in
      gsap.to(label.node(), {
        opacity: 1,
        duration: 0.4,
        delay: 0.8 + i * 0.06,
        ease: "power2.out",
      });

      // Dot at data point
      const dotR = rScale(cat.response_count);
      const dotX = Math.cos(angle) * dotR;
      const dotY = Math.sin(angle) * dotR;

      const dot = g
        .append("circle")
        .attr("cx", dotX)
        .attr("cy", dotY)
        .attr("r", 4)
        .attr("fill", CATEGORY_COLORS[cat.slug] ?? BRAND.deepSky)
        .attr("stroke", BRAND.deepNight)
        .attr("stroke-width", 2)
        .attr("opacity", 0);

      gsap.to(dot.node(), {
        opacity: 1,
        duration: 0.3,
        delay: 1.2 + i * 0.05,
        ease: "back.out(2)",
      });

      // Glow on active dots
      if (cat.response_count > 0) {
        const glow = g
          .append("circle")
          .attr("cx", dotX)
          .attr("cy", dotY)
          .attr("r", 8)
          .attr("fill", CATEGORY_COLORS[cat.slug] ?? BRAND.deepSky)
          .attr("opacity", 0);

        gsap.to(glow.node(), {
          opacity: 0.15,
          duration: gsap.utils.random(2, 4),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: gsap.utils.random(1, 3),
        });
      }
    });

    // Data polygon — build path
    const radarLine = d3
      .lineRadial<CategoryBreakdown>()
      .radius((d) => rScale(d.response_count))
      .angle((_, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // Area fill
    const areaPath = g
      .append("path")
      .datum(categories)
      .attr("d", radarLine)
      .attr("fill", "url(#radar-fill)")
      .attr("stroke", BRAND.deepSky)
      .attr("stroke-width", 2)
      .attr("opacity", 0);

    // Animate area in
    gsap.to(areaPath.node(), {
      opacity: 1,
      duration: 1,
      delay: 0.5,
      ease: "power2.out",
    });

    // Stroke animation via dasharray
    const pathNode = areaPath.node();
    if (pathNode) {
      const totalLen = pathNode.getTotalLength();
      areaPath
        .attr("stroke-dasharray", `${totalLen} ${totalLen}`)
        .attr("stroke-dashoffset", totalLen);

      gsap.to(pathNode, {
        strokeDashoffset: 0,
        duration: 1.5,
        delay: 0.5,
        ease: "power2.inOut",
      });
    }

    return () => {
      // Scope to our own SVG — a global "*" kill cancels sibling tweens.
      if (svgRef.current) {
        gsap.killTweensOf(svgRef.current.querySelectorAll("*"));
      }
    };
  }, [categories, size]);

  if (categories.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[400px] h-auto mx-auto"
    />
  );
}
