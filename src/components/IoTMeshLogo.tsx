import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface IoTMeshLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  animated?: boolean;
  speed?: number; // Base animation speed multiplier (default: 1.0)
  amplitude?: number; // Distance increase/decrease amplitude (default: 1.0)
}

interface NodeDef {
  id: string;
  baseX: number;
  baseY: number;
  freqX: number;
  freqY: number;
  ampX: number;
  ampY: number;
  phaseX: number;
  phaseY: number;
  r: number;
}

const NODES: NodeDef[] = [
  { id: "TR", baseX: 117.88, baseY: 37.12,  freqX: 1.1, freqY: 1.4, ampX: 3.8, ampY: 4.2, phaseX: 0.0, phaseY: 1.2, r: 5.8 },
  { id: "TL", baseX: 19.35,  baseY: 49.35,  freqX: 1.3, freqY: 1.0, ampX: 4.2, ampY: 3.8, phaseX: 2.1, phaseY: 0.5, r: 5.8 },
  { id: "MR", baseX: 144.65, baseY: 66.35,  freqX: 0.9, freqY: 1.2, ampX: 4.0, ampY: 3.5, phaseX: 3.4, phaseY: 2.3, r: 5.8 },
  { id: "C1", baseX: 68.62,  baseY: 79.69,  freqX: 1.4, freqY: 1.1, ampX: 4.5, ampY: 4.5, phaseX: 1.5, phaseY: 4.1, r: 5.8 },
  { id: "C3", baseX: 104.39, baseY: 102.00, freqX: 1.2, freqY: 1.3, ampX: 4.0, ampY: 4.2, phaseX: 4.2, phaseY: 1.9, r: 5.8 },
  { id: "BL", baseX: 28.24,  baseY: 112.07, freqX: 1.0, freqY: 1.5, ampX: 3.8, ampY: 4.0, phaseX: 5.0, phaseY: 3.2, r: 5.8 },
  { id: "BR", baseX: 134.56, baseY: 119.93, freqX: 1.5, freqY: 0.9, ampX: 4.2, ampY: 3.8, phaseX: 0.8, phaseY: 5.1, r: 5.8 },
  { id: "C2", baseX: 75.23,  baseY: 126.55, freqX: 1.1, freqY: 1.3, ampX: 4.0, ampY: 4.2, phaseX: 2.7, phaseY: 0.9, r: 5.8 },
];

const EDGES: [string, string][] = [
  ["TL", "C1"],
  ["TL", "C2"],
  ["BL", "C1"],
  ["BL", "C2"], // Added 2nd line for bottom-left hole (BL)
  ["C1", "TR"],
  ["C1", "C3"],
  ["C2", "C3"],
  ["C3", "MR"],
  ["MR", "TR"], // Added 2nd line for middle-right hole (MR)
  ["C3", "BR"],
  ["TR", "BR"],
];

// Helper to compute initial line coordinates
function computeInitialLine(u: string, v: string) {
  const p1 = NODES.find((n) => n.id === u)!;
  const p2 = NODES.find((n) => n.id === v)!;
  const dx = p2.baseX - p1.baseX;
  const dy = p2.baseY - p1.baseY;
  const dist = Math.hypot(dx, dy);
  const gap = 12.2;
  const ux = dx / dist;
  const uy = dy / dist;
  return {
    x1: p1.baseX + ux * gap,
    y1: p1.baseY + uy * gap,
    x2: p2.baseX - ux * gap,
    y2: p2.baseY - uy * gap,
  };
}

export function IoTMeshLogo({
  className,
  animated = true,
  speed = 1.0,
  amplitude = 1.0,
  ...props
}: IoTMeshLogoProps) {
  const linesRef = useRef<(SVGLineElement | null)[]>([]);
  const circlesRef = useRef<Record<string, SVGCircleElement | null>>({});

  useEffect(() => {
    if (!animated) return;

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let animId: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const t = elapsed * speed * 1.6;

      // 1. Calculate new moving positions for all holes (nodes)
      const currentPos: Record<string, { x: number; y: number }> = {};
      for (let i = 0; i < NODES.length; i++) {
        const node = NODES[i];
        // Organic Lissajous drift
        const dx = (Math.sin(t * node.freqX + node.phaseX) + Math.cos(t * node.freqY * 0.7 + node.phaseY) * 0.3) * node.ampX * amplitude;
        const dy = (Math.cos(t * node.freqY + node.phaseY) + Math.sin(t * node.freqX * 0.7 + node.phaseX) * 0.3) * node.ampY * amplitude;
        
        const curX = node.baseX + dx;
        const curY = node.baseY + dy;
        currentPos[node.id] = { x: curX, y: curY };

        // Update hole circle in DOM directly (60/120fps, zero React re-renders)
        const circleEl = circlesRef.current[node.id];
        if (circleEl) {
          circleEl.setAttribute("cx", curX.toFixed(2));
          circleEl.setAttribute("cy", curY.toFixed(2));
        }
      }

      // 2. Calculate dynamic stretch & contraction for all connecting lines
      for (let i = 0; i < EDGES.length; i++) {
        const [u, v] = EDGES[i];
        const p1 = currentPos[u];
        const p2 = currentPos[v];
        if (!p1 || !p2) continue;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1) {
          const ux = dx / dist;
          const uy = dy / dist;
          // Breathing gap that slightly flexes with distance
          const gap = Math.min(12.2, dist * 0.33);

          const x1 = p1.x + ux * gap;
          const y1 = p1.y + uy * gap;
          const x2 = p2.x - ux * gap;
          const y2 = p2.y - uy * gap;

          const lineEl = linesRef.current[i];
          if (lineEl) {
            lineEl.setAttribute("x1", x1.toFixed(2));
            lineEl.setAttribute("y1", y1.toFixed(2));
            lineEl.setAttribute("x2", x2.toFixed(2));
            lineEl.setAttribute("y2", y2.toFixed(2));
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [animated, speed, amplitude]);

  return (
    <svg
      viewBox="5 24 154 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-auto text-[#18191c] shrink-0 overflow-visible", className)}
      {...props}
    >
      {/* Dynamic Connecting Lines (Distances increase & decrease) */}
      <g stroke="currentColor" strokeWidth="3.8" strokeLinecap="round">
        {EDGES.map(([u, v], i) => {
          const init = computeInitialLine(u, v);
          return (
            <line
              key={`${u}-${v}`}
              ref={(el) => {
                linesRef.current[i] = el;
              }}
              x1={init.x1.toFixed(2)}
              y1={init.y1.toFixed(2)}
              x2={init.x2.toFixed(2)}
              y2={init.y2.toFixed(2)}
              className="transition-colors duration-150"
            />
          );
        })}
      </g>

      {/* Dynamic Moving Holes (Nodes) */}
      <g stroke="currentColor" strokeWidth="3.8" fill="none">
        {NODES.map((node) => (
          <circle
            key={node.id}
            ref={(el) => {
              circlesRef.current[node.id] = el;
            }}
            cx={node.baseX.toFixed(2)}
            cy={node.baseY.toFixed(2)}
            r={node.r}
            className="transition-colors duration-150"
          />
        ))}
      </g>
    </svg>
  );
}

export default IoTMeshLogo;
