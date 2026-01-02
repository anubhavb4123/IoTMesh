import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Lightbulb,
  Activity,
  Bell,
  Users,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import Footer from "@/components/Footer";
import BackgroundVideo from "@/components/BackgroundVideo";

interface LayoutProps {
  children: ReactNode;
}

const allNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Devices", href: "/devices", icon: Lightbulb },
  { name: "Sensors", href: "/sensors", icon: Activity },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Users", href: "/users", icon: Users },
  { name: "Telegram", href: "/telegram", icon: MessageSquare },
];

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, signOut } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ================= AUTO LOGOUT =================
  const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes
  const [remainingTime, setRemainingTime] = useState(AUTO_LOGOUT_TIME);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    setRemainingTime(AUTO_LOGOUT_TIME);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  // ⏱ Countdown + Auto logout
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1000) {
          handleLogout();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 🔄 Reset timer on user activity
  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    return () =>
      events.forEach((e) => window.removeEventListener(e, resetTimer));
  }, []);

  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);

  const navigation = allNavigation.map((item) => ({
    ...item,
    adminOnly: ["Users", "Telegram"].includes(item.name),
  }));

  return (
    <div className="relative min-h-screen z-10 flex flex-col">
      <BackgroundVideo />

      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-sidebar-border">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto px-3 pb-4">
          <div className="flex items-center gap-4 mt-4">
            <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-lg border border-white/20">
              <video autoPlay muted loop playsInline className="w-full h-full object-cover">
                <source src="/logo-video.mp4" type="video/mp4" />
              </video>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-glow-cyan bg-clip-text text-transparent">
              IOTMesh <span className="ml-2 text-xs text-muted-foreground">v2.0</span>
            </span>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const isDisabled = item.adminOnly && role !== "admin";

                return (
                  <li key={item.name}>
                    {isDisabled ? (
                      <div className="flex gap-x-3 rounded-lg p-3 text-sm font-semibold opacity-50 cursor-not-allowed">
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </div>
                    ) : (
                      <Link
                        to={item.href}
                        className={cn(
                          "flex gap-x-3 rounded-lg p-3 text-sm font-semibold transition",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            <Button
              variant="ghost"
              className="mt-auto justify-start gap-x-3 rounded-lg p-3 text-sm font-semibold hover:bg-red-600/10 text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>

            <span className="text-xs text-muted-foreground ml-2 mt-2">
              Auto logout in {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </nav>
        </div>
      </aside>

      {/* ================= MOBILE HEADER ================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-glow-cyan bg-clip-text text-transparent">
            IOTMesh
          </span>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-card/95 backdrop-blur border-t border-border z-50">
            <nav className="px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const isDisabled = item.adminOnly && role !== "admin";
                if (isDisabled) return null;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-x-3 rounded-lg p-3 text-sm font-semibold hover:bg-sidebar-accent/50"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}

              <Button
                variant="ghost"
                className="w-full justify-start gap-x-3 rounded-lg p-3 text-sm font-semibold hover:bg-red-600/10 text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Auto logout in {minutes}:{seconds.toString().padStart(2, "0")}
              </p>
            </nav>
          </div>
        )}
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 lg:ml-72 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 mt-16 lg:mt-0">
        {children}
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="lg:ml-72">
        <Footer />
      </footer>
    </div>
  );
};