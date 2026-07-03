import { useEffect, useRef } from "react";

/**
 * Animated background for the login / auth page.
 * Features a circuit-board style animation with pulsing nodes,
 * scanning lines and a hexagonal grid — visually distinct from
 * the dashboard's floating-particle network.
 */
export default function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // ── Types ──
    interface CircuitNode {
      x: number;
      y: number;
      radius: number;
      pulsePhase: number;
      pulseSpeed: number;
      connections: number[]; // indices of connected nodes
    }

    interface ScanLine {
      y: number;
      speed: number;
      opacity: number;
    }

    let nodes: CircuitNode[] = [];
    let scanLines: ScanLine[] = [];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = canvas!.offsetWidth * dpr;
      canvas!.height = canvas!.offsetHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNodes();
    }

    function initNodes() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      nodes = [];

      // Create a grid-based layout with slight randomness (circuit-board feel)
      const spacing = 80;
      const cols = Math.ceil(w / spacing) + 1;
      const rows = Math.ceil(h / spacing) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Only place ~40% of possible positions for organic feel
          if (Math.random() > 0.4) continue;
          nodes.push({
            x: c * spacing + (Math.random() - 0.5) * 20,
            y: r * spacing + (Math.random() - 0.5) * 20,
            radius: Math.random() * 2 + 1,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.008 + Math.random() * 0.02,
            connections: [],
          });
        }
      }

      // Connect nearby nodes with circuit-like connections (prefer horizontal/vertical)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = Math.abs(nodes[i].x - nodes[j].x);
          const dy = Math.abs(nodes[i].y - nodes[j].y);
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Connect if close, prefer axis-aligned connections
          const isAxisAligned = dx < 15 || dy < 15;
          const maxDist = isAxisAligned ? 120 : 90;

          if (dist < maxDist && nodes[i].connections.length < 3 && nodes[j].connections.length < 3) {
            nodes[i].connections.push(j);
            nodes[j].connections.push(i);
          }
        }
      }

      // Scan lines
      scanLines = [
        { y: Math.random() * h, speed: 0.3, opacity: 0.06 },
        { y: Math.random() * h, speed: -0.2, opacity: 0.04 },
      ];
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);
      time++;

      // ── Draw circuit connections (L-shaped paths) ──
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        for (const j of node.connections) {
          if (j <= i) continue; // avoid drawing twice
          const target = nodes[j];

          const pulse = 0.5 + 0.5 * Math.sin(time * 0.015 + node.pulsePhase);
          const alpha = 0.04 + pulse * 0.03;

          ctx!.beginPath();
          ctx!.strokeStyle = `rgba(34,211,238,${alpha})`;
          ctx!.lineWidth = 0.6;

          // Draw L-shaped circuit path
          const midX = target.x;
          const midY = node.y;
          ctx!.moveTo(node.x, node.y);
          ctx!.lineTo(midX, midY);
          ctx!.lineTo(target.x, target.y);
          ctx!.stroke();

          // Small corner dot at bend
          ctx!.beginPath();
          ctx!.arc(midX, midY, 1, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(34,211,238,${alpha * 0.8})`;
          ctx!.fill();
        }
      }

      // ── Draw nodes ──
      for (const node of nodes) {
        node.pulsePhase += node.pulseSpeed;
        const pulse = 0.5 + 0.5 * Math.sin(node.pulsePhase);
        const alpha = 0.15 + pulse * 0.3;

        // Outer glow
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, node.radius * 5, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(34,211,238,${alpha * 0.05})`;
        ctx!.fill();

        // Inner dot
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(34,211,238,${alpha})`;
        ctx!.fill();

        // Bright ring on larger nodes
        if (node.radius > 1.8) {
          ctx!.beginPath();
          ctx!.arc(node.x, node.y, node.radius + 2, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(34,211,238,${alpha * 0.15})`;
          ctx!.lineWidth = 0.5;
          ctx!.stroke();
        }
      }

      // ── Horizontal scan lines ──
      for (const scan of scanLines) {
        scan.y += scan.speed;
        if (scan.y > h) scan.y = 0;
        if (scan.y < 0) scan.y = h;

        const gradient = ctx!.createLinearGradient(0, scan.y - 30, 0, scan.y + 30);
        gradient.addColorStop(0, "rgba(34,211,238,0)");
        gradient.addColorStop(0.5, `rgba(34,211,238,${scan.opacity})`);
        gradient.addColorStop(1, "rgba(34,211,238,0)");

        ctx!.fillStyle = gradient;
        ctx!.fillRect(0, scan.y - 30, w, 60);
      }

      // ── Central radial glow (focused behind login card) ──
      const cx = w / 2;
      const cy = h / 2;
      const radGrad = ctx!.createRadialGradient(cx, cy - 40, 0, cx, cy - 40, Math.min(w, h) * 0.5);
      radGrad.addColorStop(0, "rgba(34,211,238,0.03)");
      radGrad.addColorStop(0.5, "rgba(34,211,238,0.01)");
      radGrad.addColorStop(1, "rgba(34,211,238,0)");
      ctx!.fillStyle = radGrad;
      ctx!.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -3,
        pointerEvents: "none",
      }}
    />
  );
}
