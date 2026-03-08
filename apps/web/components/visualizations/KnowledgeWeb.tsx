"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import gsap from "gsap";
import type { KnowledgeWebData, WebNode, WebLink } from "@/lib/data/get-knowledge-web";

interface Props {
  data: KnowledgeWebData;
}

// Brand colors
const BRAND = {
  cloudWhite: "#FAFBFF",
  skyBlue: "#7CB9E8",
  deepSky: "#4A90D9",
  twilight: "#2C3E6B",
  goldenHour: "#F5A623",
  sunriseCoral: "#FF7E6B",
  nightSky: "#0a0e1a",
  deepNight: "#111b33",
  midnight: "#1a2a4a",
  stardust: "#c5d5f0",
};

// Node sizing
function getNodeRadius(node: WebNode): number {
  if (node.type === "center") return 40;
  if (node.type === "category") return 14 + Math.min(node.responseCount * 2, 20);
  return 6 + Math.min(node.responseCount * 1.5, 10);
}

// Glow intensity based on activity
function getGlowIntensity(node: WebNode): number {
  if (node.type === "center") return 20;
  if (node.responseCount === 0) return 0;
  return 4 + Math.min(node.responseCount * 2, 16);
}

interface SimNode extends WebNode, d3.SimulationNodeDatum {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  strength: number;
}

export default function KnowledgeWeb({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);

  // Responsive sizing
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(500, rect.height) });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const showTooltip = useCallback((event: MouseEvent, node: SimNode) => {
    const tip = tooltipRef.current;
    if (!tip) return;

    const lines = [`<strong>${node.name}</strong>`];
    if (node.type !== "center") {
      lines.push(`${node.responseCount} response${node.responseCount !== 1 ? "s" : ""}`);
      if (node.wordCount > 0) {
        lines.push(`${node.wordCount.toLocaleString()} words`);
      }
    } else {
      lines.push(`${data.totalResponses} total responses`);
      lines.push(`${data.totalWords.toLocaleString()} words`);
      lines.push(`${data.categoriesCovered} categories explored`);
    }

    tip.innerHTML = lines.join("<br/>");
    tip.style.opacity = "1";
    tip.style.left = `${event.offsetX + 12}px`;
    tip.style.top = `${event.offsetY - 12}px`;
  }, [data]);

  const hideTooltip = useCallback(() => {
    const tip = tooltipRef.current;
    if (tip) tip.style.opacity = "0";
  }, []);

  // Main D3 render
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const cx = width / 2;
    const cy = height / 2;

    // Deep copy data for D3 mutation
    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const links: SimLink[] = data.links.map((l) => ({
      source: l.source,
      target: l.target,
      strength: l.strength,
    }));

    // Defs: gradients, filters, glow
    const defs = svg.append("defs");

    // Radial background gradient
    const bgGrad = defs
      .append("radialGradient")
      .attr("id", "web-bg-gradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "60%");
    bgGrad.append("stop").attr("offset", "0%").attr("stop-color", BRAND.deepNight);
    bgGrad.append("stop").attr("offset", "100%").attr("stop-color", BRAND.nightSky);

    // Glow filter for nodes
    const glowFilter = defs.append("filter").attr("id", "node-glow");
    glowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "6")
      .attr("result", "blur");
    const merge = glowFilter.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    // Stronger glow for center
    const centerGlow = defs.append("filter").attr("id", "center-glow");
    centerGlow
      .append("feGaussianBlur")
      .attr("stdDeviation", "12")
      .attr("result", "blur");
    const centerMerge = centerGlow.append("feMerge");
    centerMerge.append("feMergeNode").attr("in", "blur");
    centerMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Pulse glow for active nodes
    const pulseGlow = defs.append("filter").attr("id", "pulse-glow");
    pulseGlow
      .append("feGaussianBlur")
      .attr("stdDeviation", "10")
      .attr("result", "blur");
    const pulseMerge = pulseGlow.append("feMerge");
    pulseMerge.append("feMergeNode").attr("in", "blur");
    pulseMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Background
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("rx", 24)
      .attr("fill", "url(#web-bg-gradient)");

    // Ambient particles
    const particleGroup = svg.append("g").attr("class", "particles");
    for (let i = 0; i < 40; i++) {
      const particle = particleGroup
        .append("circle")
        .attr("cx", Math.random() * width)
        .attr("cy", Math.random() * height)
        .attr("r", Math.random() * 1.5 + 0.5)
        .attr("fill", BRAND.stardust)
        .attr("opacity", 0);

      // GSAP ambient float
      gsap.to(particle.node(), {
        attr: {
          cx: `+=${gsap.utils.random(-80, 80)}`,
          cy: `+=${gsap.utils.random(-80, 80)}`,
        },
        opacity: gsap.utils.random(0.1, 0.4),
        duration: gsap.utils.random(6, 14),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: gsap.utils.random(0, 4),
      });
    }

    // Force simulation
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((d) => {
            const src = d.source as SimNode;
            const tgt = d.target as SimNode;
            if (src.type === "center" || tgt.type === "center") return 160;
            return 80;
          })
          .strength((d) => d.strength * 0.8)
      )
      .force("charge", d3.forceManyBody().strength((d) => {
        const node = d as SimNode;
        if (node.type === "center") return -600;
        if (node.type === "category") return -200;
        return -60;
      }))
      .force("center", d3.forceCenter(cx, cy))
      .force("collision", d3.forceCollide<SimNode>().radius((d) => getNodeRadius(d) + 4))
      .force("radial", d3.forceRadial<SimNode>((d) => {
        if (d.type === "center") return 0;
        if (d.type === "category") return Math.min(width, height) * 0.28;
        return Math.min(width, height) * 0.42;
      }, cx, cy).strength(0.3));

    simulationRef.current = simulation;

    // Links group
    const linkGroup = svg.append("g").attr("class", "links");
    const linkElements = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => {
        const tgt = typeof d.target === "string" ? nodes.find(n => n.id === d.target) : d.target as SimNode;
        return tgt?.color ?? BRAND.stardust;
      })
      .attr("stroke-opacity", 0)
      .attr("stroke-width", (d) => 1 + d.strength * 2);

    // Node group
    const nodeGroup = svg.append("g").attr("class", "nodes");
    const nodeElements = nodeGroup
      .selectAll<SVGGElement, SimNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node outer glow ring
    nodeElements
      .filter((d) => d.responseCount > 0 || d.type === "center")
      .append("circle")
      .attr("r", (d) => getNodeRadius(d) + getGlowIntensity(d))
      .attr("fill", (d) => d.color)
      .attr("opacity", 0)
      .attr("class", "glow-ring");

    // Node circle
    nodeElements
      .append("circle")
      .attr("r", (d) => getNodeRadius(d))
      .attr("fill", (d) => {
        if (d.type === "center") return BRAND.deepSky;
        if (d.responseCount === 0) return BRAND.midnight;
        return d.color;
      })
      .attr("stroke", (d) => {
        if (d.type === "center") return BRAND.skyBlue;
        if (d.responseCount === 0) return `${d.color}40`;
        return `${d.color}80`;
      })
      .attr("stroke-width", (d) => (d.type === "center" ? 3 : d.type === "category" ? 2 : 1))
      .attr("filter", (d) =>
        d.type === "center"
          ? "url(#center-glow)"
          : d.responseCount > 0
            ? "url(#node-glow)"
            : "none"
      )
      .attr("opacity", 0)
      .attr("class", "node-circle");

    // Center node text
    nodeElements
      .filter((d) => d.type === "center")
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", BRAND.cloudWhite)
      .attr("font-size", "13px")
      .attr("font-weight", "700")
      .attr("font-family", "'IBM Plex Mono', monospace")
      .attr("opacity", 0)
      .attr("class", "node-label");

    // Category labels
    nodeElements
      .filter((d) => d.type === "category")
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => getNodeRadius(d) + 16)
      .attr("fill", BRAND.stardust)
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("font-family", "'IBM Plex Mono', monospace")
      .attr("opacity", 0)
      .attr("class", "node-label");

    // Response count badges on categories
    nodeElements
      .filter((d) => d.type === "category" && d.responseCount > 0)
      .append("text")
      .text((d) => d.responseCount.toString())
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", BRAND.cloudWhite)
      .attr("font-size", "10px")
      .attr("font-weight", "700")
      .attr("font-family", "'IBM Plex Mono', monospace")
      .attr("opacity", 0)
      .attr("class", "node-label");

    // Hover interactions
    nodeElements
      .on("mouseenter", function (event, d) {
        const el = d3.select(this);

        // Scale up node
        gsap.to(el.select(".node-circle").node(), {
          attr: { r: getNodeRadius(d) * 1.2 },
          duration: 0.3,
          ease: "back.out(1.7)",
        });

        // Intensify glow
        const glowRing = el.select(".glow-ring").node();
        if (glowRing) {
          gsap.to(glowRing, {
            attr: { r: getNodeRadius(d) * 1.5 + getGlowIntensity(d) },
            opacity: 0.3,
            duration: 0.3,
            ease: "power2.out",
          });
        }

        // Brighten connected links
        linkElements
          .filter((l) => {
            const src = (l.source as SimNode).id;
            const tgt = (l.target as SimNode).id;
            return src === d.id || tgt === d.id;
          })
          .transition()
          .duration(200)
          .attr("stroke-opacity", 0.8)
          .attr("stroke-width", (l) => 2 + l.strength * 3);

        // Dim unconnected nodes
        nodeElements
          .filter((n) => {
            if (n.id === d.id) return false;
            return !links.some(
              (l) =>
                ((l.source as SimNode).id === d.id && (l.target as SimNode).id === n.id) ||
                ((l.target as SimNode).id === d.id && (l.source as SimNode).id === n.id)
            );
          })
          .select(".node-circle")
          .transition()
          .duration(200)
          .attr("opacity", 0.3);

        showTooltip(event, d);
      })
      .on("mousemove", function (event, d) {
        const tip = tooltipRef.current;
        if (tip) {
          tip.style.left = `${event.offsetX + 12}px`;
          tip.style.top = `${event.offsetY - 12}px`;
        }
      })
      .on("mouseleave", function (event, d) {
        const el = d3.select(this);

        gsap.to(el.select(".node-circle").node(), {
          attr: { r: getNodeRadius(d) },
          duration: 0.3,
          ease: "power2.out",
        });

        const glowRing = el.select(".glow-ring").node();
        if (glowRing) {
          gsap.to(glowRing, {
            attr: { r: getNodeRadius(d) + getGlowIntensity(d) },
            opacity: 0.12,
            duration: 0.4,
          });
        }

        linkElements
          .transition()
          .duration(300)
          .attr("stroke-opacity", (l) => 0.1 + l.strength * 0.3)
          .attr("stroke-width", (l) => 1 + l.strength * 2);

        nodeElements
          .select(".node-circle")
          .transition()
          .duration(300)
          .attr("opacity", 1);

        hideTooltip();
      });

    // Tick update
    simulation.on("tick", () => {
      linkElements
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      nodeElements.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // ---- GSAP Entrance Animations ----

    // 1. Center node appears first with a pulse
    const centerNodeEl = nodeElements.filter((d) => d.type === "center");
    const tl = gsap.timeline({ delay: 0.3 });

    tl.to(centerNodeEl.select(".node-circle").node(), {
      opacity: 1,
      duration: 0.8,
      ease: "power2.out",
    });
    tl.to(
      centerNodeEl.select(".node-label").node(),
      { opacity: 1, duration: 0.5 },
      "-=0.3"
    );

    // Center glow pulse
    const centerGlowRing = centerNodeEl.select(".glow-ring").node();
    if (centerGlowRing) {
      tl.fromTo(
        centerGlowRing,
        { opacity: 0, attr: { r: 10 } },
        {
          opacity: 0.15,
          attr: { r: getNodeRadius(data.nodes[0]!) + 20 },
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.6"
      );
    }

    // 2. Links radiate outward
    tl.to(
      linkElements
        .filter((d) => (d.source as SimNode).type === "center")
        .nodes(),
      {
        "stroke-opacity": (i: number, target: SVGLineElement) => {
          const d = d3.select(target).datum() as SimLink;
          return 0.1 + d.strength * 0.3;
        },
        duration: 0.6,
        stagger: 0.05,
        ease: "power2.out",
      },
      "-=0.3"
    );

    // 3. Category nodes appear with stagger
    const catNodes = nodeElements.filter((d) => d.type === "category");
    tl.to(
      catNodes.selectAll(".node-circle").nodes(),
      {
        opacity: 1,
        duration: 0.5,
        stagger: 0.06,
        ease: "back.out(1.4)",
      },
      "-=0.3"
    );
    tl.to(
      catNodes.selectAll(".node-label").nodes(),
      {
        opacity: 1,
        duration: 0.4,
        stagger: 0.06,
      },
      "-=0.3"
    );
    // Category glow rings
    tl.to(
      catNodes.selectAll(".glow-ring").nodes(),
      {
        opacity: 0.12,
        duration: 0.5,
        stagger: 0.04,
      },
      "-=0.4"
    );

    // 4. Sub-category links
    tl.to(
      linkElements
        .filter((d) => (d.source as SimNode).type === "category")
        .nodes(),
      {
        "stroke-opacity": (i: number, target: SVGLineElement) => {
          const d = d3.select(target).datum() as SimLink;
          return 0.1 + d.strength * 0.3;
        },
        duration: 0.4,
        stagger: 0.02,
        ease: "power2.out",
      },
      "-=0.2"
    );

    // 5. Subcategory nodes
    const subNodes = nodeElements.filter((d) => d.type === "subcategory");
    tl.to(
      subNodes.selectAll(".node-circle").nodes(),
      {
        opacity: 1,
        duration: 0.4,
        stagger: 0.015,
        ease: "power2.out",
      },
      "-=0.2"
    );

    // 6. Continuous breathing animation for active nodes
    tl.add(() => {
      nodeElements
        .filter((d) => d.responseCount > 0 && d.type !== "center")
        .each(function () {
          const glowEl = d3.select(this).select(".glow-ring").node();
          if (glowEl) {
            gsap.to(glowEl, {
              opacity: 0.2,
              duration: gsap.utils.random(2, 4),
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: gsap.utils.random(0, 2),
            });
          }
        });

      // Center breathe
      if (centerGlowRing) {
        gsap.to(centerGlowRing, {
          opacity: 0.25,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    });

    return () => {
      simulation.stop();
      gsap.killTweensOf("*");
    };
  }, [data, dimensions, showTooltip, hideTooltip]);

  return (
    <div ref={containerRef} className="relative w-full h-[600px] rounded-3xl overflow-hidden">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none px-3 py-2 rounded-xl text-xs font-body transition-opacity duration-150"
        style={{
          opacity: 0,
          background: "rgba(26, 42, 74, 0.95)",
          color: BRAND.stardust,
          border: `1px solid ${BRAND.deepSky}40`,
          backdropFilter: "blur(8px)",
          maxWidth: 200,
          zIndex: 10,
        }}
      />
      {/* Stats overlay */}
      <div className="absolute bottom-4 left-4 flex gap-3">
        <div
          className="px-3 py-1.5 rounded-xl text-xs font-body"
          style={{
            background: "rgba(26, 42, 74, 0.8)",
            color: BRAND.stardust,
            border: `1px solid ${BRAND.deepSky}30`,
            backdropFilter: "blur(8px)",
          }}
        >
          <span style={{ color: BRAND.goldenHour }} className="font-bold">
            {data.totalResponses}
          </span>{" "}
          responses
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-xs font-body"
          style={{
            background: "rgba(26, 42, 74, 0.8)",
            color: BRAND.stardust,
            border: `1px solid ${BRAND.deepSky}30`,
            backdropFilter: "blur(8px)",
          }}
        >
          <span style={{ color: BRAND.skyBlue }} className="font-bold">
            {data.categoriesCovered}
          </span>{" "}
          / 11 categories
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-xs font-body hidden sm:block"
          style={{
            background: "rgba(26, 42, 74, 0.8)",
            color: BRAND.stardust,
            border: `1px solid ${BRAND.deepSky}30`,
            backdropFilter: "blur(8px)",
          }}
        >
          <span style={{ color: BRAND.sunriseCoral }} className="font-bold">
            {data.totalWords.toLocaleString()}
          </span>{" "}
          words
        </div>
      </div>
    </div>
  );
}
