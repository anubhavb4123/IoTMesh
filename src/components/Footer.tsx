import { Github, Instagram, Mail, Globe, Cpu } from "lucide-react";

const socialLinks = [
  { href: "https://anubhavb-tech-hub.web.app/", label: "Website", Icon: Globe },
  { href: "https://github.com/anubhavb4123", label: "GitHub", Icon: Github },
  { href: "https://www.instagram.com/anubhhhav_b_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", label: "Instagram", Icon: Instagram },
  { href: "mailto:anubhavb4123@gmail.com", label: "Email", Icon: Mail },
];

export default function Footer() {
  return (
    <footer
      className="relative mt-8 overflow-hidden"
      style={{ animation: "fadeSlideIn 0.5s ease both", animationDelay: "0.3s" }}
    >
      {/* Top cyan line */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      <div className="relative glass-subtle rounded-b-xl px-5 py-3">

        {/* Faint bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-10 bg-cyan-400/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Left — brand */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-6 h-6 rounded-md border border-cyan-400/30 bg-cyan-400/10">
              <Cpu className="h-3 w-3 text-cyan-400" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
            <span className="text-xs font-bold tracking-widest text-foreground/80 uppercase">
              I<span className="glow-o">O</span>TMesh
            </span>
            <span className="text-[9px] text-muted-foreground/50 tracking-wider">v18.04.26 XSEY</span>
          </div>

          {/* Center — social icons */}
          <div className="flex items-center gap-2">
            {socialLinks.map(({ href, label, Icon }, i) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: `${0.4 + i * 0.06}s` }}
                className="group w-7 h-7 flex items-center justify-center rounded-lg border border-border/30 bg-background/30 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-cyan-400 transition-colors duration-200" />
              </a>
            ))}
          </div>

          {/* Right — author */}
          <p className="text-[11px] text-muted-foreground/60 tracking-wide">
            Built by{" "}
            <span className="text-foreground/70 font-medium">Anubhav Bajpai</span>
            {" · "}
            <span className="text-muted-foreground/40">© {new Date().getFullYear()}</span>
          </p>

        </div>
      </div>
    </footer>
  );
}
