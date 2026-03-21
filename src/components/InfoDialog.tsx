import { Info, Github, Linkedin, Mail, Instagram, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function InfoDialog() {
  return (
    <div className="absolute top-4 right-4 z-20">
      <Dialog>
        <DialogTrigger asChild>
          <button
            className="p-2 rounded-full bg-card/80 hover:bg-card border border-border transition-all duration-200 hover:scale-110 hover:border-primary active:scale-95"
            aria-label="Project Info"
          >
            <Info className="h-5 w-5 text-primary" />
          </button>
        </DialogTrigger>

        <DialogContent className="max-w-lg p-0 bg-transparent border-none">
          <div
            className="edge-glow bg-card rounded-xl p-6"
            style={{ animation: "fadeSlideIn 0.3s ease both" }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">About IoTMesh</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 text-sm text-muted-foreground">

              {/* Project Details */}
              <section style={{ animation: "fadeSlideIn 0.3s ease both", animationDelay: "0.05s" }}>
                <h3 className="font-semibold text-foreground mb-1">🔌 Project Details</h3>
                <p>
                  <strong>IoTMesh</strong> is a smart home automation and monitoring system built
                  using ESP8266/ESP32 and Firebase. It allows users to control home appliances
                  and monitor live sensor data through a modern web dashboard.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Web-based dashboard control</li>
                  <li>Light, fan & relay switching</li>
                  <li>Live temperature, humidity, gas & pressure data</li>
                  <li>Power source detection</li>
                  <li>Alerts & historical graphs</li>
                  <li>Admin & Guest login system</li>
                  <li>ESP + Firebase Realtime Database</li>
                </ul>
              </section>

              {/* Developer Details */}
              <section style={{ animation: "fadeSlideIn 0.3s ease both", animationDelay: "0.1s" }}>
                <h3 className="font-semibold text-foreground mb-1">👨‍💻 Developer Details</h3>
                <p><strong>Anubhav Bajpai</strong><br />B.Tech – Information Technology</p>
                <p className="mt-1">
                  Engineering enthusiast with strong interest in IoT, embedded systems,
                  electronics, and full-stack web development.
                </p>
              </section>

              {/* Links*/}
              <section style={{ animation: "fadeSlideIn 0.3s ease both", animationDelay: "0.15s" }}>
                <h3 className="font-semibold text-foreground mb-2">🔗 Links & Contact</h3>
                <div className="space-y-2">
                  {[
                    { href: "https://iotmesh-4123.web.app", Icon: Globe,     label: "Website",   color: "text-primary" },
                    { href: "https://github.com/anubhavb4123", Icon: Github,  label: "GitHub",    color: "" },
                    { href: "https://www.linkedin.com/in/anubhav-bajpai-12318032b", Icon: Linkedin, label: "LinkedIn", color: "" },
                    { href: "mailto:anubhavb4123@gmail.com", Icon: Mail,      label: "Email",     color: "" },
                    { href: "https://www.instagram.com/anubhavb__", Icon: Instagram, label: "Instagram", color: "" },
                  ].map(({ href, Icon, label, color }, i) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      style={{ animation: "fadeSlideIn 0.25s ease both", animationDelay: `${0.2 + i * 0.05}s` }}
                      className={`flex items-center gap-2 hover:underline transition-all duration-200 hover:translate-x-1 ${color}`}
                    >
                      <Icon className="h-4 w-4" />{label}
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
