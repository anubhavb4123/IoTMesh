import { Github, Instagram, Mail, Globe, Cpu } from "lucide-react";

const socialLinks = [
  { href: "https://anubhavb-tech-hub.web.app/", label: "Website", Icon: Globe },
  { href: "https://github.com/anubhavb4123", label: "GitHub", Icon: Github },
  { href: "https://www.instagram.com/anubhhhav_b_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", label: "Instagram", Icon: Instagram },
  { href: "mailto:anubhavb4123@gmail.com", label: "Email", Icon: Mail },
];

export default function Footer() {
  return (
    <footer className="mt-12 mb-6 border-t border-white/10 pt-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        
        {/* Brand info */}
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-white text-black flex items-center justify-center">
            <Cpu className="w-3 h-3" />
          </div>
          <span className="font-bold text-white tracking-wide">IoTMesh</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400 font-mono text-[11px]">v18.4</span>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-1.5">
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
            </a>
          ))}
        </div>

        {/* Author */}
        <p className="text-neutral-500 text-[11px]">
          Created by <span className="text-white font-semibold">Anubhav Bajpai</span> © {new Date().getFullYear()}
        </p>

      </div>
    </footer>
  );
}
