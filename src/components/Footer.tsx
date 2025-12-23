export default function Footer() {
  return (
    <footer className="p-0 border rounded-xl bg-card/10 backdrop-blur-md border-white/20 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">

        {/* LEFT: Project Info */}
        <div className="text-center md:text-left">
          <p className="font-medium text-foreground">
            IoTMesh – Smart Home Dashboard
          </p>
          <p>
            Control home appliances, monitor live sensor data,
          </p>
          <p>receive alerts, and manage your smart home remotely.
          </p>
        </div>

        {/* CENTER: Social & Contact Links */}
        <div className="text-center space-y-1">
            <p>
            📸 Instagram:
            <a
              href="https://www.instagram.com/anubhavb__?igsh=MWc5dmR6d243YXNxZA=="
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-primary hover:underline"
            >
              @anubhavb__
            </a>
          </p>
          <p>
            ✉️ Email:
            <a
              href="mailto:anubhavb4123@gmail.com"
              className="ml-1 text-primary hover:underline"
            >
              anubhavb4123@gmail.com
            </a>
          </p>
          <p>
            💻 GitHub:
            <a
              href="https://github.com/anubhavb4123"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-primary hover:underline"
            >
              github.com/anubhavb4123
            </a>
          </p>
        </div>

        {/* RIGHT: Your Details */}
        <div className="text-center md:text-right">
          <p>
            👨‍💻 Developed by{" "}
            <span className="font-medium text-foreground">
              Anubhav Bajpai
            </span>
          </p>
          <p className="text-xs">
            B.Tech IT | IoT & Web Developer
          </p>
        </div>

      </div>
    </footer>
  );
}