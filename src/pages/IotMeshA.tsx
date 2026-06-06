import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import "@/styles/homepage-sections.css";
import HardwareArchitecture from "@/components/homepage/HardwareArchitecture";
import SoftwareEcosystem from "@/components/homepage/SoftwareEcosystem";
import AlertsBackendEngine from "@/components/homepage/AlertsBackendEngine";
import SystemArchitecture from "@/components/homepage/SystemArchitecture";
import FinalCTA from "@/components/homepage/FinalCTA";
import FeaturesShowcase from "@/components/homepage/FeaturesShowcase";

// ── Scroll-reveal hook ──
function useInView(threshold = 0.02) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Animated counter ──
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, visible } = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const t = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(t); }
      else setVal(start);
    }, 16);
    return () => clearInterval(t);
  }, [visible, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Section wrapper ──
function Section({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <section id={id} ref={ref} className={`section-wrapper ${visible ? "in-view" : ""} ${className}`}>
      {children}
    </section>
  );
}

// ── Particle Canvas ──
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(70, Math.floor(canvas.width * canvas.height / 10000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.8 + 0.5,
        o: Math.random() * 0.5 + 0.15,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Draw connections with data-stream effect
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const alpha = 0.08 * (1 - dist / 140);
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(34,211,238,${alpha})`;
            ctx!.lineWidth = 0.6;
            ctx!.stroke();
          }
        }
      }

      // Draw & update particles
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(34,211,238,${p.o})`;
        ctx!.fill();

        // Subtle glow on larger particles
        if (p.r > 1.2) {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(34,211,238,${p.o * 0.08})`;
          ctx!.fill();
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas!.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas!.height) p.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}

// ── Typing Effect Hook ──
function useTypingEffect(texts: string[], speed = 50, pause = 2000) {
  const [display, setDisplay] = useState("");
  const [textIdx, setTextIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[textIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx <= current.length) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx));
        setCharIdx(c => c + 1);
      }, speed);
    } else if (!deleting && charIdx > current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx >= 0) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx));
        setCharIdx(c => c - 1);
      }, speed / 2);
    } else {
      setDeleting(false);
      setTextIdx(i => (i + 1) % texts.length);
      setCharIdx(0);
    }

    return () => clearTimeout(timeout);
  }, [charIdx, deleting, textIdx, texts, speed, pause]);

  return display;
}

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
const IotMesh = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const typedText = useTypingEffect([
    "Distributed Cloud-Synchronized IoT Ecosystem",
    "ESP32 Powered Distributed Automation System",
    "Realtime Smart Infrastructure Platform",
    "Multi-Node Distributed Sensor Network",
  ], 45, 2500);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #050810;
          --bg2:       #090d1a;
          --cyan:      #22d3ee;
          --cyan-dim:  rgba(34,211,238,0.15);
          --cyan-glow: rgba(34,211,238,0.35);
          --white:     #f0f4ff;
          --muted:     rgba(240,244,255,0.5);
          --border:    rgba(34,211,238,0.18);
          --card-bg:   rgba(255,255,255,0.03);
          --radius:    14px;
          --font-head: 'Orbitron', 'Exo 2', sans-serif;
          --font-body: 'DM Sans', 'Segoe UI', sans-serif;
        }

        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&family=Exo+2:wght@300;600&display=swap');

        .iotmesh-page {
          background: var(--bg);
          color: var(--white);
          font-family: var(--font-body);
          font-size: 16px;
          line-height: 1.7;
          overflow-x: hidden;
        }

        .iotmesh-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }

        .iot-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5vw;
          height: 64px;
          transition: background 0.3s, border-bottom 0.3s;
        }
        .iot-nav.scrolled {
          background: rgba(5,8,16,0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo {
          font-family: var(--font-head);
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--white);
          text-decoration: none;
        }
        .nav-logo span { color: var(--cyan); }
        .nav-links { display: flex; gap: 2rem; }
        .nav-links a {
          color: var(--muted);
          text-decoration: none;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--cyan); }
        .nav-cta {
          padding: 0.45rem 1.2rem;
          border: 1px solid var(--cyan);
          border-radius: 6px;
          color: var(--cyan) !important;
          font-size: 0.85rem !important;
          transition: background 0.2s, box-shadow 0.2s !important;
        }
        .nav-cta:hover {
          background: var(--cyan-dim) !important;
          box-shadow: 0 0 16px var(--cyan-glow) !important;
          color: var(--white) !important;
        }

        .container { max-width: 1200px; margin: 0 auto; padding: 0 5vw; position: relative; z-index: 1; }

        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 120px 5vw 80px;
          position: relative;
          overflow: hidden;
        }
        .hero-glow {
          position: absolute;
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border);
          background: var(--cyan-dim);
          border-radius: 999px;
          padding: 0.35rem 1rem;
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          color: var(--cyan);
          font-family: var(--font-head);
          margin-bottom: 2rem;
          animation: fadeUp 0.6s ease both;
        }
        .hero-tag::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 8px var(--cyan); animation: blink 1.4s infinite; }
        .hero h1 {
          font-family: var(--font-head);
          font-size: clamp(2.2rem, 5.5vw, 4.2rem);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.01em;
          margin-bottom: 1.5rem;
          animation: fadeUp 0.6s 0.1s ease both;
        }
        .hero h1 .line2 { display: block; color: var(--cyan); text-shadow: 0 0 40px var(--cyan-glow); }
        .hero-sub {
          max-width: 700px;
          margin: 0 auto 1.5rem;
          color: var(--muted);
          font-size: 1.05rem;
          animation: fadeUp 0.6s 0.2s ease both;
        }
        .hero-sub2 {
          color: rgba(34,211,238,0.7);
          font-size: 0.9rem;
          letter-spacing: 0.05em;
          margin-bottom: 2.5rem;
          animation: fadeUp 0.6s 0.25s ease both;
        }
        .hero-btns {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 3rem;
          animation: fadeUp 0.6s 0.3s ease both;
        }
        .btn-primary {
          padding: 0.75rem 2rem;
          background: var(--cyan);
          color: #050810;
          font-family: var(--font-head);
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          border-radius: 8px;
          border: none;
          text-decoration: none;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.15s;
          box-shadow: 0 0 24px var(--cyan-glow);
        }
        .btn-primary:hover { box-shadow: 0 0 40px var(--cyan-glow); transform: translateY(-2px); }
        .btn-primary:active { transform: scale(0.97); }
        .btn-secondary {
          padding: 0.75rem 2rem;
          background: transparent;
          color: var(--white);
          font-family: var(--font-head);
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          border-radius: 8px;
          border: 1px solid var(--border);
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .btn-secondary:hover { border-color: var(--cyan); background: var(--cyan-dim); transform: translateY(-2px); }
        .hero-badges {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          flex-wrap: wrap;
          animation: fadeUp 0.6s 0.4s ease both;
        }
        .hero-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: var(--muted);
          letter-spacing: 0.04em;
        }
        .hero-badge::before { content: '✦'; color: var(--cyan); font-size: 0.6rem; }

        .stats-bar {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: linear-gradient(90deg, transparent, var(--cyan-dim), transparent);
          padding: 2.5rem 0;
          position: relative; z-index: 1;
        }
        .stats-inner {
          display: flex;
          justify-content: center;
          gap: 4rem;
          flex-wrap: wrap;
        }
        .stat-item { text-align: center; }
        .stat-num {
          display: block;
          font-family: var(--font-head);
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--cyan);
          text-shadow: 0 0 20px var(--cyan-glow);
          line-height: 1.1;
        }
        .stat-label {
          font-size: 0.75rem;
          color: var(--muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .section-wrapper {
          padding: 100px 0;
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .section-wrapper.in-view { opacity: 1; transform: translateY(0); }

        .sec-label {
          font-family: var(--font-head);
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: var(--cyan);
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }
        .sec-title {
          font-family: var(--font-head);
          font-size: clamp(1.6rem, 3.5vw, 2.6rem);
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 1.25rem;
          letter-spacing: -0.01em;
        }
        .sec-title span { color: var(--cyan); }
        .sec-desc {
          color: var(--muted);
          max-width: 600px;
          font-size: 1rem;
          line-height: 1.8;
        }
        .sec-desc.center { margin: 0 auto; text-align: center; }
        .text-center { text-align: center; }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--cyan-dim), transparent);
          margin: 0;
        }

        .scanline {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--cyan-dim), transparent);
          animation: scanline 6s linear infinite;
          pointer-events: none;
          z-index: 200;
          opacity: 0.4;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        @media (max-width: 768px) {
          .nav-links { display: none; }
          .stats-inner { gap: 2rem; }
        }
      `}</style>

      <div className="iotmesh-page">
        <div className="scanline" />

        {/* ══ NAV ══ */}
        <nav className={`iot-nav ${scrolled ? "scrolled" : ""}`}>
          <a href="#" className="nav-logo">I<span>O</span>TMesh</a>
          <div className="nav-links">
            <a href="#architecture">Architecture</a>
            <a href="#features">Features</a>
            <a href="#software">Software</a>
            <a href="#alerts">Alerts</a>
            <a href="#hardware">Hardware</a>
            <a href="#contact">Contact</a>
          </div>
          <Link to="/auth" className="nav-links" style={{ display: "flex" }} onClick={() => { sounds.click(); haptic.click(); }}>
            <a className="nav-cta">Launch App</a>
          </Link>
        </nav>

        {/* ══ 1. HERO ══ */}
        <section className="hero">
          <ParticleCanvas />
          <div className="hero-glow" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="hero-tag">⬡ DISTRIBUTED AUTOMATION ENGINE</div>
            <h1>
              IoTMesh
              <span className="line2">Connected Intelligence</span>
            </h1>
            <p className="hero-sub">
              A distributed cloud-synchronized IoT ecosystem bridging embedded systems,
              real-time analytics, and intelligent automation — from smart homes to industrial scale.
            </p>
            <div className="hero-typing">
              {typedText}<span className="cursor" />
            </div>
            <p className="hero-sub2" style={{ marginTop: "1rem" }}>
              SECURE · SCALABLE · REAL-TIME · ESP32 POWERED
            </p>
            <div className="hero-btns">
              <Link to="/auth" className="btn-primary" onClick={() => { sounds.click(); haptic.click(); }}>Access IoTMesh Platform</Link>
              <a href="#hardware" className="btn-secondary" onClick={() => { sounds.click(); haptic.click(); }}>Explore Architecture</a>
            </div>
            <div className="hero-badges">
              <span className="hero-badge">Real-Time Monitoring</span>
              <span className="hero-badge">Firebase Cloud Sync</span>
              <span className="hero-badge">Telegram Automation</span>
              <span className="hero-badge">Multi-Node Architecture</span>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <div className="stats-bar">
          <div className="stats-inner">
            {[
              { n: 16, s: "+", label: "Hardware Components" },
              { n: 3, s: "+", label: "ESP Room Nodes" },
              { n: 24, s: "/7", label: "Real-Time Uptime" },
              { n: 100, s: "%", label: "Cloud Sync Rate" },
              { n: 6, s: "", label: "Software Layers" },
              { n: 55, s: "+", label: "Features" },
            ].map(({ n, s, label }) => (
              <div key={label} className="stat-item">
                <span className="stat-num"><Counter to={n} suffix={s} /></span>
                <span className="stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ 2. system architecture ══ */}
        <Section id="architecture">
          <SystemArchitecture />
        </Section>

        <div className="divider" />

        {/* ══ 3. FEATURES SHOWCASE ══ */}
        <Section id="features">
          <FeaturesShowcase />
        </Section>

        <div className="divider" />

        {/* ══ 4. SOFTWARE ══ */}
        <Section id="software">
          <SoftwareEcosystem />
        </Section>

        <div className="divider" />

        {/* ══ 4. ALERTS & BACKEND ══ */}
        <Section id="alerts">
          <AlertsBackendEngine />
        </Section>

        <div className="divider" />

        {/* ══ 5. HARDWARE ══ */}
        <Section id="hardware">
          <HardwareArchitecture />
        </Section>

        <div className="divider" />

        {/* ══ 6. FINAL CTA + FOOTER ══ */}
        <div id="contact">
          <FinalCTA />
        </div>
      </div>
    </>
  );
};

export default IotMesh;
