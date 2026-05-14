import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div ref={ref} className={`final-cta ${visible ? "in-view" : ""}`}>
        <div className="final-cta-glow" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="final-cta-label">The Future of IoT</p>
          <h2>Building <span>Distributed Smart</span> Infrastructure</h2>
          <div className="sub-texts">
            <span className="sub-text">Cloud-Synchronized Modular IoT Ecosystem</span>
            <span className="sub-text">Realtime Intelligent Automation Platform</span>
          </div>
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

      <footer className="iot-footer">
        <span>IoTMesh</span> © {new Date().getFullYear()} — Engineered for Intelligent Automation · Built by Anubhav Bajpai
      </footer>
    </>
  );
}
