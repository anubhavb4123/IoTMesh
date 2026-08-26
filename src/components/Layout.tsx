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
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import Footer from "@/components/Footer";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

interface LayoutProps {
  children: ReactNode;
}

const navSections = [
  {
    title: "Monitor & Control",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Devices", href: "/devices", icon: Lightbulb },
      { name: "Sensors", href: "/sensors", icon: Activity },
      { name: "Alerts", href: "/alerts", icon: Bell },
    ],
  },
  {
    title: "Automations & Safety",
    items: [
      { name: "Automation", href: "/automation", icon: Workflow },
      { name: "Ignition", href: "/ignition", icon: Flame },
      { name: "Telegram", href: "/telegram", icon: MessageSquare },
    ],
  },
  {
    title: "System Admin",
    items: [
      { name: "Users", href: "/users", icon: Users, adminOnly: true },
      { name: "Security", href: "/security", icon: ShieldCheck, adminOnly: true },
      { name: "Firmware", href: "/firmware", icon: Cpu, adminOnly: true },
    ],
  },
];

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // AUTO LOGOUT (30 min)
  const AUTO_LOGOUT_TIME = 30 * 60 * 1000;
  const [remainingTime, setRemainingTime] = useState(AUTO_LOGOUT_TIME);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => setRemainingTime(AUTO_LOGOUT_TIME);

  const handleLogout = async () => {
    await signOut();
    haptic.heavy();
    sounds.logout();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const handleAdminOnlyClick = (itemName: string) => {
    sounds.error();
    haptic.error();
    toast.error("Admin Access Required", {
      description: `${itemName} is restricted to administrators.`,
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
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    return () => events.forEach((e) => window.removeEventListener(e, resetTimer));
  }, []);

  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-white selection:text-black">
      {/* Subtle background grid */}
      <div className="fixed inset-0 pointer-events-none bg-grid-pattern opacity-60 z-0" />

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-black border-r border-white/10 z-30">
        <div className="flex flex-col h-full px-4 py-5">
          
          {/* Brand */}
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center shadow-sm">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider text-white">IoTMesh</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-neutral-900 border border-white/20 text-white">
                  v18.4
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Smart Home Automation</p>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 space-y-6 overflow-y-auto pr-1">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="px-2 text-[10px] font-bold tracking-wider text-neutral-400 uppercase font-mono">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const isDisabled = item.adminOnly && role !== "admin";

                    if (isDisabled) {
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleAdminOnlyClick(item.name)}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/60 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                            <span>{item.name}</span>
                          </div>
                          <span className="text-[9px] uppercase px-1 rounded bg-neutral-900 border border-white/10 text-neutral-400 font-mono">
                            Admin
                          </span>
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150",
                          isActive
                            ? "bg-white text-black font-semibold shadow-sm"
                            : "text-neutral-300 hover:text-white hover:bg-neutral-900/80"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon
                            className={cn(
                              "w-4 h-4 transition-colors",
                              isActive ? "text-black" : "text-neutral-400"
                            )}
                          />
                          <span>{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* User Profile & Auto-logout Footer */}
          <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-neutral-900 border border-white/20 flex items-center justify-center text-xs font-bold text-white">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user?.name || "Guest User"}</p>
                  <span className={cn(
                    "text-[10px] uppercase font-mono font-bold",
                    role === "admin" ? "text-red-400" : "text-neutral-400"
                  )}>
                    {role === "admin" ? "Administrator" : "Guest"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between px-2 text-[11px] text-neutral-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-neutral-500" />
                Session
              </span>
              <span className="text-neutral-200">{minutes}:{seconds.toString().padStart(2, "0")}</span>
            </div>
          </div>

        </div>
      </aside>

      {/* ── MOBILE TOP NAVBAR ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm text-white tracking-wide">IoTMesh</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-neutral-900 border border-white/20 text-white">
            {role === "admin" ? "Admin" : "Guest"}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-8 w-8 text-neutral-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </header>

      {/* ── MOBILE MENU DRAWER ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[53px] bottom-0 z-40 bg-black/98 backdrop-blur-xl border-b border-white/10 px-5 py-6 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-6">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase font-mono">
                  {section.title}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const isDisabled = item.adminOnly && role !== "admin";

                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          if (isDisabled) {
                            handleAdminOnlyClick(item.name);
                          } else {
                            navigate(item.href);
                            setMobileMenuOpen(false);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium transition-all text-left",
                          isActive
                            ? "bg-white text-black font-semibold border border-white shadow-sm"
                            : isDisabled
                            ? "bg-neutral-900/30 text-neutral-600 border border-white/5"
                            : "bg-neutral-900/80 text-neutral-300 hover:text-white border border-white/10"
                        )}
                      >
                        <item.icon className={cn("w-4 h-4", isActive ? "text-black" : "text-neutral-400")} />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">{user?.name || "Guest"}</p>
              <p className="text-[11px] text-neutral-400 font-mono">Auto logout in {minutes}:{seconds.toString().padStart(2, "0")}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/20 text-red-400 hover:bg-red-950/30 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT WRAPPER ── */}
      <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 relative z-10">
        {children}
      </main>

      {/* ── FOOTER ── */}
      <div className="lg:ml-64 relative z-10">
        <Footer />
      </div>
    </div>
  );
};