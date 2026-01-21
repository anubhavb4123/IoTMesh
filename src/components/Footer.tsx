import { Github, Instagram, Mail, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-12 rounded-2xl border border-border/40 bg-gradient-to-br from-card/30 via-card/20 to-card/10 backdrop-blur-xl shadow-xl overflow-hidden">

      {/* subtle animated glow background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.15),transparent_70%)]" />

      <div className="relative max-w-7xl mx-auto px-6 py-7 grid gap-8 md:grid-cols-3 items-center text-sm text-muted-foreground">

        {/* LEFT */}
        <div className="space-y-1 text-center md:text-left">
          <p className="text-base font-semibold text-foreground tracking-wide">
            IoTMesh
          </p>
          <p>Smart home automation & monitoring</p>
          <p>Real-time control • Alerts • Analytics</p>
        </div>

        {/* CENTER ICONS */}
        <div className="flex justify-center gap-6">
          {[
            {
              href: "https://iotmesh-4123.web.app",
              label: "Website",
              Icon: Globe,
            },
            {
              href: "https://github.com/anubhavb4123",
              label: "GitHub",
              Icon: Github,
            },
            {
              href: "https://www.instagram.com/anubhavb__?igsh=MWc5dmR6d243YXNxZA==",
              label: "Instagram",
              Icon: Instagram,
            },
            {
              href: "mailto:anubhavb4123@gmail.com",
              label: "Email",
              Icon: Mail,
            },
          ].map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="
                group relative p-3 rounded-full
                border border-border/40
                bg-background/40
                transition-all duration-300
                hover:-translate-y-1
                hover:border-primary
              "
            >
              {/* glow ring */}
              <span className="
                absolute inset-0 rounded-full
                opacity-0 group-hover:opacity-100
                transition duration-300
                bg-[radial-gradient(circle,rgba(56,189,248,0.35),transparent_60%)]
              " />
              <Icon className="relative h-5 w-5 group-hover:text-primary transition" />
            </a>
          ))}
        </div>

        {/* RIGHT */}
        <div className="space-y-1 text-center md:text-right">
          <p>
            Built by{" "}
            <span className="font-semibold text-foreground">
              Anubhav Bajpai
            </span>
          </p>
          <p className="text-xs tracking-wide">
            B.Tech IT • IoT • Full-Stack Web
          </p>
        </div>

      </div>
    </footer>
  );
}