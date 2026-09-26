import { Github, Instagram, Mail, Globe, Cpu, Heart } from "lucide-react";

const socialLinks = [
  { href: "https://anubhavb-tech-hub.web.app/", label: "Website", Icon: Globe },
  { href: "https://github.com/anubhavb4123", label: "GitHub", Icon: Github },
  { href: "https://www.instagram.com/anubhhhav_b_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", label: "Instagram", Icon: Instagram },
  { href: "mailto:anubhavb4123@gmail.com", label: "Email", Icon: Mail },
];

export default function Footer() {
  return (
    <footer className="mt-auto py-8 px-4 sm:px-8 border-t border-black/[0.06] bg-transparent">
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#797a82]">
        
        {/* Brand info */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#18191c] text-white flex items-center justify-center shadow-sm">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-[#18191c] tracking-tight text-sm">IoTMesh</span>
          <span className="text-[#a9a8a2]">·</span>
          <span className="text-[#797a82] font-mono text-[11px]">v18.4 Pro Suite</span>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-2">
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/70 hover:bg-white border border-black/[0.06] text-[#55565e] hover:text-[#18191c] shadow-sm transition-all hover:scale-105"
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>

        {/* Author */}
        <p className="text-[#797a82] text-xs font-medium">
          Engineered with precision by <span className="text-[#18191c] font-bold">Anubhav Bajpai</span> © {new Date().getFullYear()}
        </p>

      </div>
    </footer>
  );
}
