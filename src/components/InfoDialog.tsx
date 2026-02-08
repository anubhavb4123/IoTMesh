import { Info, Github, Linkedin, Mail, Instagram, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function InfoDialog() {
  return (
    <div className="absolute top-4 right-4 z-20">
      <Dialog>
        <DialogTrigger asChild>
          <button
            className="p-2 rounded-full bg-card/80 hover:bg-card border border-border"
            aria-label="Project Info"
          >
            <Info className="h-5 w-5 text-primary" />
          </button>
        </DialogTrigger>

        {/* 🔥 DialogContent has NO padding or background */}
        <DialogContent className="max-w-lg p-0 bg-transparent border-none">
          
          {/* 🔥 Edge glow wrapper */}
          <div className="edge-glow bg-card rounded-xl p-6">

            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                About IoTMesh
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 text-sm text-muted-foreground">

              {/* ================= PROJECT DETAILS ================= */}
              <section>
                <h3 className="font-semibold text-foreground mb-1">
                  🔌 Project Details
                </h3>
                <p>
                  <strong>IoTMesh</strong> is a smart home automation and monitoring
                  system built using ESP8266/ESP32 and Firebase. It allows users
                  to control home appliances and monitor live sensor data through
                  a modern web dashboard.
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

              {/* ================= DEVELOPER DETAILS ================= */}
              <section>
                <h3 className="font-semibold text-foreground mb-1">
                  👨‍💻 Developer Details
                </h3>
                <p>
                  <strong>Anubhav Bajpai</strong><br />
                  B.Tech – Information Technology
                </p>
                <p className="mt-1">
                  Engineering enthusiast with strong interest in IoT, embedded
                  systems, electronics, and full-stack web development.
                </p>
              </section>

              {/*  LINKS */}
              <section>
                <h3 className="font-semibold text-foreground mb-2">
                  🔗 Links & Contact
                </h3>

                <div className="space-y-2">
                  <a
                    href="https://iotmesh-4123.web.app"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>

                  <a
                    href="https://github.com/anubhavb4123"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>

                  <a
                    href="https://www.linkedin.com/in/anubhav-bajpai-12318032b"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>

                  <a
                    href="mailto:anubhavb4123@gmail.com"
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>

                  <a
                    href="https://www.instagram.com/anubhavb__"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                </div>
              </section>

            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}