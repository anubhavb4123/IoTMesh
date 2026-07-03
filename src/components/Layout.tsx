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
  Flame,
  Workflow,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import Footer from "@/components/Footer";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

interface LayoutProps {
  children: ReactNode;
}

const allNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Devices", href: "/devices", icon: Lightbulb },
  { name: "Sensors", href: "/sensors", icon: Activity },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Telegram", href: "/telegram", icon: MessageSquare },
  { name: "Ignition", href: "/ignition", icon: Flame },
  { name: "Automation", href: "/automation", icon: Workflow },
  { name: "Users", href: "/users", icon: Users },
  { name: "Security", href: "/security", icon: ShieldCheck },
  { name: "Firmware", href: "/firmware", icon: Cpu },
];

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, signOut } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // AUTO LOGOUT
  const AUTO_LOGOUT_TIME = 30 * 60 * 1000;
  const [remainingTime, setRemainingTime] = useState(AUTO_LOGOUT_TIME);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => setRemainingTime(AUTO_LOGOUT_TIME);

  const handleLogout = async () => {
    await signOut();
    haptic.heavy();
    sounds.logout();
    toast.success("Signed out successfully", { className: "toast-success" });
    navigate("/auth");
  };

  const handleAdminOnlyClick = (itemName: string) => {
    toast.error("Admin Access Only", {
      description: `${itemName} is restricted. Please login as Admin.`,
      className: "toast-admin-warning",
    });
  };

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
    adminOnly: ["Users", "Security", "Firmware"].includes(item.name),
  }));

  return (
    <div className="relative min-h-screen z-10 flex flex-col">
      {/* Lightweight CSS-only background */}
      <div className="fixed inset-0 -z-50 bg-grid-pattern" />
      <div className="fixed inset-0 -z-49 bg-radial-glow" />

      {/* ====== SIDEBAR ===*/}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col glass-strong glass-highlight">

        <div className="flex grow flex-col gap-y-5 overflow-y-auto px-3 pb-4">

          {/* LOGO */}
          <div
            className="flex items-center gap-4 mt-4"
            style={{ animation: "fadeSlideIn .35s ease both" }}
          >
            <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-lg border border-white/20 transition-transform duration-300 hover:scale-105">
              <video autoPlay muted loop playsInline className="w-full h-full object-cover">
                <source src="/logo-video.mp4" type="video/mp4" />
              </video>
            </div>

            <span className="text-xl font-bold bg-gradient-to-r from-primary bg-clip-text text-transparent">
              I<span className="glow-o">O</span>TMesh
              <span className="ml-2 text-xs text-muted-foreground">
                v18.04.26 XSEY
              </span>
            </span>
          </div>

          <nav className="flex flex-1 flex-col">

            <ul className="flex flex-1 flex-col gap-y-1">

              {navigation.map((item, i) => {
                const isActive = location.pathname === item.href;
                const isDisabled = item.adminOnly && role !== "admin";

                return (
                  <li
                    key={item.name}
                    style={{
                      animation: "fadeSlideIn .35s ease both",
                      animationDelay: `${0.05 + i * 0.05}s`,
                    }}
                  >
                    {isDisabled ? (
                      <button
                        onClick={() => handleAdminOnlyClick(item.name)}
                        className="flex w-full gap-x-3 rounded-lg p-3 text-sm font-semibold opacity-50 cursor-pointer hover:bg-red-500/10 text-left transition-all duration-300"
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </button>
                    ) : (
                      <Link
                        to={item.href}
                        className={cn(
                          "flex gap-x-3 rounded-lg p-3 text-sm font-semibold transition-all duration-300 ease-out",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground scale-[1.03] shadow-[0_0_12px_rgba(0,212,255,0.25)]"
                            : "hover:bg-sidebar-accent/60 hover:translate-x-1 hover:shadow-md"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 transition-all duration-300",
                            isActive && "scale-110"
                          )}
                        />
                        {item.name}
                      </Link>
                    )}
                  </li>
                );
              })}

            </ul>

            <Button
              variant="ghost"
              className="mt-auto justify-start gap-x-3 rounded-lg p-3 text-sm font-semibold hover:bg-red-600/10 text-red-600 transition-all duration-300 hover:translate-x-1"
              onClick={handleLogout}
              style={{ animation: "fadeSlideIn .35s ease both", animationDelay: ".45s" }}
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

      {/* MOBILE HEADER */}

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-strong">

        <div className="flex items-center justify-between px-4 py-3">

          <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-glow-cyan bg-clip-text text-transparent">
            I<span className="glow-o">O</span>TMesh
            <span className="ml-2 text-xs text-muted-foreground">
              v18.04.26 XSEY
            </span>
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="transition-all duration-200 active:scale-90 hover:scale-105"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>

        </div>

        {mobileMenuOpen && (

          <div
            className="absolute top-full left-0 right-0 glass-strong border-t border-white/5 z-50"
            style={{ animation: "fadeSlideIn .35s cubic-bezier(.22,.61,.36,1) both" }}
          >

            <nav className="px-4 py-4 space-y-2">

              {navigation.map((item, i) => {
                const isDisabled = item.adminOnly && role !== "admin";

                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (isDisabled) handleAdminOnlyClick(item.name);
                      else {
                        navigate(item.href);
                        setMobileMenuOpen(false);
                      }
                    }}
                    style={{
                      animation: "fadeSlideIn .25s ease both",
                      animationDelay: `${i * .04}s`,
                    }}
                    className={cn(
                      "flex w-full items-center gap-x-3 rounded-lg p-3 text-sm font-semibold text-left transition-all duration-200",
                      isDisabled
                        ? "opacity-50 hover:bg-red-500/10"
                        : "hover:bg-sidebar-accent/50 hover:translate-x-1"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </button>
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

              <p className="text-xs text-muted-foreground text-center mt-2">
                Auto logout in {minutes}:{seconds.toString().padStart(2, "0")}
              </p>

            </nav>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}

      <main
        className="flex-1 lg:ml-72 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-6"
        style={{ animation: "fadeSlideIn .35s ease both" }}
      >
        {children}
      </main>

      {/* FOOTER */}

      <footer className="lg:ml-72">
        <Footer />
      </footer>

      {/* ANIMATION */}

      <style>
        {`
        @keyframes fadeSlideIn {
          0% { opacity:0; transform:translateY(16px) scale(.98); }
          100% { opacity:1; transform:translateY(0) scale(1); }
        }
        `}
      </style>
    </div>
  );
};