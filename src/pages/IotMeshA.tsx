import { Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import "@/styles/homepage-sections.css";
import HardwareShowcase from "@/components/homepage/HardwareShowcase";
import SystemFlowchart from "@/components/homepage/SystemFlowchart";
import RoomNodeArchitecture from "@/components/homepage/RoomNodeArchitecture";
import TelegramEngine from "@/components/homepage/TelegramEngine";
import FirebaseCloudEngine from "@/components/homepage/FirebaseCloudEngine";
import FeatureFlowcharts from "@/components/homepage/FeatureFlowcharts";
import AdvancedFeatures from "@/components/homepage/AdvancedFeatures";
import TechStack from "@/components/homepage/TechStack";

// Scroll-reveal hook
function useInView(threshold = 0.15) {
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

// ── CTA Section wrapper ──
function CtaSection() {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={`cta-section ${visible ? "in-view" : ""}`}>
      <div className="cta-glow" />
      <div style={{ position: "relative", zIndex: 1 }}>
        <p className="sec-label" style={{ marginBottom: "1rem" }}>GET STARTED</p>
        <h2>Ready to Build <span style={{ color: "var(--cyan)" }}>Intelligent Systems?</span></h2>
        <p>Whether automating a smart home, developing an IoT startup, or deploying industrial-grade monitoring — IoTMesh provides the infrastructure, scalability, and intelligence you need.</p>
        <div className="hero-btns">
          <Link
            to="/auth"
            className="btn-primary"
            onClick={() => { sounds.click(); haptic.click(); }}
          >
            Access IoTMesh Platform
          </Link>
          <a
            href="https://anubhavb-tech-hub.web.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            onClick={() => { sounds.click(); haptic.click(); }}
          >
            Meet the Founder
          </a>
          <a
            href="mailto:iotmesh4123@gmail.com"
            className="btn-secondary"
            onClick={() => { sounds.click(); haptic.click(); }}
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
function Card({ icon, title, desc, delay = 0 }: { icon: string; title: string; desc: string; delay?: number }) {
  return (
    <div className="feat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="feat-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

// ── Showcase row ──
function ShowcaseRow({ img, alt, title, desc, reverse = false }: { img: string; alt: string; title: string; desc: string; reverse?: boolean }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={`showcase-row ${reverse ? "reverse" : ""} ${visible ? "in-view" : ""}`}>
      <div className="showcase-text">
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
      <div className="showcase-img-wrap">
        <img src={img} alt={alt} />
        <div className="img-glow" />
      </div>
    </div>
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

    // Create particles
    const count = Math.min(60, Math.floor(canvas.width * canvas.height / 12000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.5 + 0.2,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(34,211,238,${0.08 * (1 - dist / 120)})`;
            ctx!.lineWidth = 0.5;
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

const IotMesh = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const typedText = useTypingEffect([
    "Distributed IoT Automation Ecosystem",
    "Realtime Cloud-Synchronized Smart Infrastructure",
    "Multi-Node Distributed Sensor Network",
  ], 45, 2500);

  return (
    <>
      <style>{`
        /* ── RESET & TOKENS ── */
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

        /* ── GRID LINES BG ── */
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

        /* ── NAV ── */
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

        /* ── CONTAINER ── */
        .container { max-width: 1200px; margin: 0 auto; padding: 0 5vw; position: relative; z-index: 1; }

        /* ── HERO ── */
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
          max-width: 680px;
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

        /* ── STATS BAR ── */
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

        /* ── SECTION WRAPPER (scroll reveal) ── */
        .section-wrapper {
          padding: 100px 0;
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .section-wrapper.in-view { opacity: 1; transform: translateY(0); }

        /* ── SECTION HEADER ── */
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

        /* ── FEATURE GRID ── */
        .feat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.25rem;
          margin-top: 3rem;
        }
        .feat-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.75rem;
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
          animation: fadeUp 0.5s ease both;
        }
        .feat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--cyan-dim), transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .feat-card:hover { border-color: var(--cyan); transform: translateY(-4px); box-shadow: 0 8px 32px rgba(34,211,238,0.12); }
        .feat-card:hover::before { opacity: 1; }
        .feat-icon { font-size: 1.75rem; margin-bottom: 1rem; }
        .feat-card h3 {
          font-family: var(--font-head);
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          margin-bottom: 0.6rem;
          color: var(--white);
        }
        .feat-card p { font-size: 0.88rem; color: var(--muted); line-height: 1.7; }

        /* ── SHOWCASE ── */
        .showcase-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          margin-bottom: 6rem;
          opacity: 0;
          transform: translateX(-24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .showcase-row.in-view { opacity: 1; transform: translateX(0); }
        .showcase-row.reverse { direction: rtl; }
        .showcase-row.reverse > * { direction: ltr; }
        .showcase-row.reverse { transform: translateX(24px); }
        .showcase-text h3 {
          font-family: var(--font-head);
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--white);
        }
        .showcase-text p { color: var(--muted); line-height: 1.8; }
        .showcase-img-wrap {
          position: relative;
          border-radius: var(--radius);
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .showcase-img-wrap img { width: 100%; display: block; border-radius: var(--radius); }
        .img-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--cyan-dim), transparent);
          pointer-events: none;
        }

        /* ── PORTFOLIO GRID ── */
        .port-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 3rem;
        }
        .port-item {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--card-bg);
          transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
          animation: fadeUp 0.5s ease both;
        }
        .port-item:hover { border-color: var(--cyan); transform: translateY(-5px); box-shadow: 0 12px 40px rgba(34,211,238,0.15); }
        .port-item img { width: 100%; height: 200px; object-fit: cover; display: block; }
        .port-item-body { padding: 1.25rem; }
        .port-item h3 { font-family: var(--font-head); font-size: 0.85rem; font-weight: 600; letter-spacing: 0.04em; margin-bottom: 0.5rem; color: var(--white); }
        .port-item p { font-size: 0.82rem; color: var(--muted); line-height: 1.65; }

        /* ── ABOUT / VISION ACCENT ── */
        .accent-list { list-style: none; margin-top: 2rem; display: flex; flex-direction: column; gap: 0.85rem; }
        .accent-list li {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--card-bg);
          font-size: 0.9rem;
          color: var(--muted);
          line-height: 1.6;
          transition: border-color 0.2s, background 0.2s;
        }
        .accent-list li:hover { border-color: var(--cyan); background: var(--cyan-dim); }
        .accent-list li::before { content: '▸'; color: var(--cyan); flex-shrink: 0; margin-top: 2px; }
        .accent-list li strong { color: var(--white); }

        /* ── DIVIDER ── */
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--cyan-dim), transparent);
          margin: 0;
        }

        /* ── CTA SECTION ── */
        .cta-section {
          padding: 120px 5vw;
          text-align: center;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s, transform 0.7s;
        }
        .cta-section.in-view { opacity: 1; transform: translateY(0); }
        .cta-glow {
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .cta-section h2 {
          font-family: var(--font-head);
          font-size: clamp(1.8rem, 4vw, 3rem);
          font-weight: 700;
          margin-bottom: 1.25rem;
        }
        .cta-section p { color: var(--muted); max-width: 600px; margin: 0 auto 2.5rem; font-size: 1rem; }

        /* ── FOOTER ── */
        .iot-footer {
          border-top: 1px solid var(--border);
          padding: 2rem 5vw;
          text-align: center;
          font-size: 0.78rem;
          color: var(--muted);
          letter-spacing: 0.05em;
          position: relative; z-index: 1;
        }
        .iot-footer span { color: var(--cyan); }

        /* ── ANIMATIONS ── */
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

        /* ── SCANLINE OVERLAY ── */
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

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .stats-inner { gap: 2rem; }
          .showcase-row { grid-template-columns: 1fr; gap: 2rem; }
          .showcase-row.reverse { direction: ltr; }
          .feat-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="iotmesh-page">
        <div className="scanline" />

        {/* NAV  */}
        <nav className={`iot-nav ${scrolled ? "scrolled" : ""}`}>
          <a href="#" className="nav-logo">I<span>O</span>TMesh</a>
          <div className="nav-links">
            <a href="#hardware">Hardware</a>
            <a href="#explore">Platform</a>
            <a href="#architecture">Architecture</a>
            <a href="#telegram-engine">Telegram</a>
            <a href="#tech-stack">Stack</a>
            <a href="#contact">Contact</a>
          </div>
          <Link to="/auth" className="nav-links" style={{ display: "flex" }} onClick={() => { sounds.click(); haptic.click(); }}>
            <a className="nav-cta">Launch App</a>
          </Link>
        </nav>

        {/* HERO */}
        <section className="hero">
          <ParticleCanvas />
          <div className="hero-glow" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="hero-tag">⬡ INTELLIGENT AUTOMATION ENGINE</div>
            <h1>
              IoTMesh
              <span className="line2">Connected Intelligence</span>
            </h1>
            <p className="hero-sub">
              Bridging embedded systems, cloud infrastructure, and real-time analytics
              into one unified automation ecosystem — from smart homes to industrial scale.
            </p>
            <div className="hero-typing">
              {typedText}<span className="cursor" />
            </div>
            <p className="hero-sub2" style={{ marginTop: "1rem" }}>
              SECURE · SCALABLE · REAL-TIME · BUILT FOR THE FUTURE
            </p>
            <div className="hero-btns">
              <Link to="/auth" className="btn-primary" onClick={() => { sounds.click(); haptic.click(); }}>Access IoTMesh Platform</Link>
              <a href="#explore" className="btn-secondary" onClick={() => { sounds.click(); haptic.click(); }}>Explore Solutions</a>
            </div>
            <div className="hero-badges">
              <span className="hero-badge">Real-Time Monitoring</span>
              <span className="hero-badge">Cloud Integration</span>
              <span className="hero-badge">Secure Remote Control</span>
              <span className="hero-badge">Industrial-Grade Reliability</span>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div className="stats-bar">
          <div className="stats-inner">
            {[
              { n: 10, s: "+", label: "Sensors Monitored" },
              { n: 3, s: "+", label: "ESP Nodes" },
              { n: 24, s: "/7", label: "Real-Time Uptime" },
              { n: 100, s: "%", label: "Firebase Sync" },
            ].map(({ n, s, label }) => (
              <div key={label} className="stat-item">
                <span className="stat-num"><Counter to={n} suffix={s} /></span>
                <span className="stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* HARDWARE SHOWCASE — NEW */}
        <Section id="hardware">
          <HardwareShowcase />
        </Section>

        <div className="divider" />

        {/* EXPLORE — SHOWCASE */}
        <Section id="explore">
          <div className="container">
            <div className="text-center" style={{ marginBottom: "4rem" }}>
              <p className="sec-label">Platform Preview</p>
              <h2 className="sec-title">Explore <span>IoTMesh</span> Platform</h2>
              <p className="sec-desc center">Discover core features through our intuitive platform interfaces.</p>
            </div>
            <ShowcaseRow img="/pictures/dashboard.png" alt="Dashboard" title="Central Dashboard" desc="Comprehensive overview of all connected devices and system status. Monitor real-time metrics and control operations from a unified interface." />
            <ShowcaseRow img="/pictures/devices1.png" alt="Devices" title="Device Management & Control" desc="Efficiently manage and control all IoT devices across your network. Configure settings, monitor performance, and execute commands remotely." reverse />
            <ShowcaseRow img="/pictures/sensors.png" alt="Sensors" title="Live Sensor Monitoring" desc="Real-time visualization of sensor data including temperature, humidity, and environmental parameters. Track trends and receive instant updates." />
            <ShowcaseRow img="/pictures/telegram.png" alt="Telegram" title="Telegram Bot Automation & Alerts" desc="Integrate with Telegram for automated notifications and remote control. Receive alerts and manage devices directly through messaging." reverse />
            <ShowcaseRow img="/pictures/alerts.png" alt="Alerts" title="Smart Alerts & Notifications" desc="Intelligent alert system for critical events and threshold breaches. Customize notification preferences and response protocols." />
            <ShowcaseRow img="/pictures/users.png" alt="Users" title="User & Role Management" desc="Manage user accounts, permissions, and access levels. Ensure secure and organized control over your IoT ecosystem." reverse />
          </div>
        </Section>

        <div className="divider" />

        {/* SYSTEM FLOWCHART — NEW */}
        <Section id="architecture">
          <SystemFlowchart />
        </Section>

        <div className="divider" />

        {/* ROOM NODE ARCHITECTURE — NEW */}
        <Section id="room-nodes">
          <RoomNodeArchitecture />
        </Section>

        <div className="divider" />

        {/* ABOUT */}
        <Section id="about">
          <div className="container">
            <p className="sec-label">About</p>
            <h2 className="sec-title">The <span>IoTMesh</span> Platform</h2>
            <p className="sec-desc" style={{ marginBottom: "1rem" }}>
              IoTMesh is a next-generation IoT automation platform designed to bridge the gap between embedded hardware and modern cloud infrastructure. It transforms traditional devices into intelligent, connected systems capable of real-time monitoring, secure remote control, and dynamic automation.
            </p>
            <p className="sec-desc">
              Built on a distributed architecture, IoTMesh connects multiple ESP-based nodes, sensors, actuators, and cloud services into a unified ecosystem — from single-room control to factory-scale infrastructure.
            </p>
            <ul className="accent-list">
              {[
                ["Embedded Systems Integration", "Seamless connection of ESP32/ESP8266, sensors, relays, and microcontrollers."],
                ["Cloud-Based Intelligence", "Firebase-powered real-time database with secure backend synchronization."],
                ["Real-Time Data Monitoring", "Live updates for temperature, pressure, gas levels, power state, and device activity."],
                ["Secure Remote Control", "Role-based access control with encrypted cloud communication."],
                ["Scalable Architecture", "Multi-node device support from home automation to industrial scale."],
                ["Event-Driven Automation", "Smart alerts, conditional triggers, and real-time Telegram notification system."],
              ].map(([t, d]) => (
                <li key={t}><div><strong>{t}</strong> — {d}</div></li>
              ))}
            </ul>
          </div>
        </Section>

        <div className="divider" />

        {/* TELEGRAM ENGINE — NEW */}
        <Section id="telegram-engine">
          <TelegramEngine />
        </Section>

        <div className="divider" />

        {/* FIREBASE CLOUD ENGINE — NEW */}
        <Section id="cloud-engine">
          <FirebaseCloudEngine />
        </Section>

        <div className="divider" />

        {/* HOME AUTOMATION */}
        <Section id="home-automation">
          <div className="container">
            <div className="text-center" style={{ marginBottom: "3.5rem" }}>
              <p className="sec-label">Home</p>
              <h2 className="sec-title">Smart <span>Home Automation</span></h2>
              <p className="sec-desc center">From lighting to environmental safety — every device becomes part of a unified smart ecosystem.</p>
            </div>
            <div className="feat-grid">
              {[
                ["💡", "Advanced Device Control", "Remotely manage lights, fans, televisions, and appliances with instant state synchronization across all users."],
                ["📱", "Telegram Command System", "Receive gas leak, door, and power alerts on Telegram. Control devices via secure command-based messaging."],
                ["🌡️", "Environmental Intelligence", "Monitor temperature, humidity, pressure, gas, and water levels in real time with historical data logging."],
                ["⚡", "Energy & Power Management", "Track battery voltage, inverter/grid switching, and consumption patterns with smart automated logic."],
                ["🏠", "Multi-Room Architecture", "Connect multiple ESP nodes across rooms, each syncing independently with the central cloud database."],
                ["⚙️", "Event-Driven Automation", "Configure auto-responses: fans when temperature rises, alerts on gas detection, power source switching."],
              ].map(([icon, title, desc], i) => (
                <Card key={title as string} icon={icon as string} title={title as string} desc={desc as string} delay={i * 60} />
              ))}
            </div>
          </div>
        </Section>

        <div className="divider" />

        {/* INDUSTRY */}
        <Section id="industry-automation">
          <div className="container">
            <div className="text-center" style={{ marginBottom: "3.5rem" }}>
              <p className="sec-label">Industry</p>
              <h2 className="sec-title">Industry & <span>Factory Automation</span></h2>
              <p className="sec-desc center">Enterprise-level industrial automation for real-time machine monitoring and centralized control.</p>
            </div>
            <div className="feat-grid">
              {[
                ["🏭", "Industrial Machine Monitoring", "Track performance, load, temperature, and power usage in real time. Identify anomalies early to reduce downtime."],
                ["🔌", "Smart Grid & Power Management", "Auto-switch between grid, inverter, or backup sources. Prevent outages and optimize energy distribution."],
                ["🛡️", "Safety & Compliance Monitoring", "Detect hazardous gas, overheating, or unauthorized access. Instant alerts ensure rapid response."],
                ["📊", "Centralized Control Dashboard", "Manage multiple factory units from a unified cloud dashboard with live metrics and historical trends."],
                ["🌐", "Multi-Node Distributed Architecture", "Deploy ESP controllers across production zones, each syncing securely with the central database."],
                ["🔮", "Predictive Maintenance & Analytics", "Use historical data and cloud analytics to anticipate failures and optimize workflows."],
              ].map(([icon, title, desc], i) => (
                <Card key={title as string} icon={icon as string} title={title as string} desc={desc as string} delay={i * 60} />
              ))}
            </div>
          </div>
        </Section>

        <div className="divider" />

        {/* FEATURE FLOWCHARTS — NEW */}
        <Section id="feature-flows">
          <FeatureFlowcharts />
        </Section>

        <div className="divider" />

        {/* CAPABILITIES */}
        <Section id="capabilities">
          <div className="container">
            <div className="text-center" style={{ marginBottom: "3.5rem" }}>
              <p className="sec-label">Capabilities</p>
              <h2 className="sec-title"><span>Platform</span> Capabilities</h2>
              <p className="sec-desc center">A full-stack IoT ecosystem combining embedded intelligence, cloud computing, secure data flow, and dynamic interfaces.</p>
            </div>
            <div className="feat-grid">
              {[
                ["🎛️", "Advanced Device Orchestration", "Manage multiple ESP nodes with centralized config and real-time status."],
                ["📡", "Real-Time Telemetry", "Stream live sensor data with instant dashboard updates."],
                ["🔔", "Event-Driven Alerts", "Threshold-based notifications via Telegram and dashboard."],
                ["☁️", "Cloud-Native Architecture", "Firebase-powered real-time sync and scalable deployment."],
                ["🤖", "Automation Rules Engine", "Intelligent workflows: auto power switching, scheduling, sensor triggers."],
                ["🔒", "Encrypted Communication", "End-to-end encrypted device-cloud-frontend data flow."],
                ["📈", "Historical Data & Analytics", "Structured logs for trend analysis and predictive maintenance."],
                ["🌍", "Global Remote Access", "Secure access from anywhere via responsive web dashboard."],
                ["👥", "Role-Based Access Control", "Guest and admin roles with permission-based management."],
                ["🧩", "Modular & Expandable Design", "Easily add devices, sensors, and rules without disrupting infrastructure."],
              ].map(([icon, title, desc], i) => (
                <Card key={title as string} icon={icon as string} title={title as string} desc={desc as string} delay={i * 40} />
              ))}
            </div>
          </div>
        </Section>

        <div className="divider" />

        {/* PORTFOLIO */}
        <Section id="portfolio">
          <div className="container">
            <div className="text-center" style={{ marginBottom: "3.5rem" }}>
              <p className="sec-label">Screenshots</p>
              <h2 className="sec-title">Platform <span>Preview</span></h2>
              <p className="sec-desc center">Experience the powerful, intuitive interface of IoTMesh — designed for clarity, control, and real-time insights.</p>
            </div>
            <div className="port-grid">
              {[
                ["/pictures/dashboard.png", "Dashboard Overview", "Real-time overview of all connected ESP nodes, health metrics, device states, and alert notifications."],
                ["/pictures/sensors.png", "Live Sensor Monitoring", "Temperature, humidity, gas, pressure, voltage, and battery monitoring synchronized from embedded systems."],
                ["/pictures/devices1.png", "Device Management", "Remotely control relays, lighting, fans, and industrial switches via secure cloud-synced interface."],
                ["/pictures/devices2.png", "Advanced Configuration", "Configure device behavior, assign ESP pins, and manage room-wise automation dynamically."],
                ["/pictures/alerts.png", "Smart Alert System", "Instant alerts for gas leaks, power switching, door status, and battery thresholds."],
                ["/pictures/telegram.png", "Telegram Integration", "Control devices and receive real-time alerts via Telegram from anywhere."],
                ["/pictures/users.png", "User Management", "Manage users with guest and admin permissions for secure IoT access control."],
              ].map(([src, title, desc], i) => (
                <div key={title as string} className="port-item" style={{ animationDelay: `${i * 80}ms` }}>
                  <img src={src as string} alt={title as string} />
                  <div className="port-item-body">
                    <h3>{title as string}</h3>
                    <p>{desc as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <div className="divider" />

        {/* ADVANCED FEATURES — NEW */}
        <Section id="advanced-features">
          <AdvancedFeatures />
        </Section>

        <div className="divider" />

        {/* TECH STACK — NEW */}
        <Section id="tech-stack">
          <TechStack />
        </Section>

        <div className="divider" />

        {/* VISION */}
        <Section id="vision">
          <div className="container">
            <div className="text-center" style={{ marginBottom: "3.5rem" }}>
              <p className="sec-label">Vision</p>
              <h2 className="sec-title">The <span>IoTMesh</span> Vision</h2>
              <p className="sec-desc center">A unified intelligence layer connecting embedded systems, cloud computing, and real-world infrastructure.</p>
            </div>
            <div className="feat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              {[
                ["🧠", "Intelligent Automation", "Rule-based automation, adaptive behaviors, and context-aware decision making powered by real-time data."],
                ["🤖", "AI-Driven Insights", "Transform raw sensor data into actionable intelligence using analytics and predictive monitoring."],
                ["🕸️", "Scalable IoT Mesh Architecture", "From a single ESP device to a distributed multi-node industrial network — seamless scaling."],
                ["🔗", "Universal Integration Layer", "Integrates with diverse microcontrollers, APIs, Telegram, and cloud services in one ecosystem."],
              ].map(([icon, title, desc], i) => (
                <Card key={title as string} icon={icon as string} title={title as string} desc={desc as string} delay={i * 80} />
              ))}
            </div>
          </div>
        </Section>

        {/* CTA */}
        <div id="contact">
          <CtaSection />
        </div>

        {/* FOOTER */}
        <footer className="iot-footer">
          <span>IoTMesh</span> © {new Date().getFullYear()} — Engineered for Intelligent Automation · Built by Anubhav Bajpai
        </footer>
      </div>
    </>
  );
};

export default IotMesh;
