import { useEffect, useRef } from "react";

/**
 * Animated background for the dashboard / full-site layout.
 * Renders a subtle floating-node network on a canvas + a CSS grid overlay.
 * Inspired by the homepage ParticleCanvas but softer for content readability.
 */
export default function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      o: number;
      pulse: number;
      pulseSpeed: number;
    }
    let nodes: Node[] = [];

    function resize() {
      canvas!.width = canvas!.offsetWidth * window.devicePixelRatio;
      canvas!.height = canvas!.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();
    window.addEventListener("resize", resize);

    // Fewer particles than homepage for subtlety
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const count = Math.min(45, Math.floor((w * h) / 18000));

    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.4,
        o: Math.random() * 0.35 + 0.1,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.015,
      });
    }

    function draw() {
      const cw = canvas!.offsetWidth;
      const ch = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, cw, ch);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const alpha = 0.04 * (1 - dist / 160);
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.strokeStyle = `rgba(34,211,238,${alpha})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      // Draw & update nodes
      for (const n of nodes) {
        n.pulse += n.pulseSpeed;
        const pulseAlpha = n.o * (0.6 + 0.4 * Math.sin(n.pulse));

        // Node dot
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(34,211,238,${pulseAlpha})`;
        ctx!.fill();

        // Soft glow on larger nodes
        if (n.r > 1) {
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(34,211,238,${pulseAlpha * 0.06})`;
          ctx!.fill();
        }

        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > cw) n.vx *= -1;
        if (n.y < 0 || n.y > ch) n.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -49,
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: -50 }}
      />
      {/* Dark overlay for readability */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -48,
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.04) 0%, transparent 60%)",
        }}
      />
    </>
  );
}
