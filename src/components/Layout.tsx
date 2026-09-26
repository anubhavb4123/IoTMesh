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
  Settings,
  Sparkles,
  Clock,
  ChevronDown,
  RefreshCw,
  MoreHorizontal,
  LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import Footer from "@/components/Footer";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const primaryNavItems: NavItem[] = [
  { name: "DASHBOARD", href: "/dashboard", icon: LayoutDashboard },
  { name: "DEVICES", href: "/devices", icon: Lightbulb },
  { name: "SENSORS", href: "/sensors", icon: Activity },
  { name: "ALERTS", href: "/alerts", icon: Bell },
  { name: "AUTOMATION", href: "/automation", icon: Workflow },
];

const secondaryNavItems: NavItem[] = [
  { name: "SECURITY", href: "/security", icon: ShieldCheck, adminOnly: true },
  { name: "TELEGRAM", href: "/telegram", icon: MessageSquare },
  { name: "USERS", href: "/users", icon: Users, adminOnly: true },
  { name: "IGNITION", href: "/ignition", icon: Flame },
];

const allNavItems: NavItem[] = [...primaryNavItems, ...secondaryNavItems];

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  // AUTO LOGOUT (30 min for temporary sessions; persistent for remembered sessions)
  const isRemembered = (() => {
    try {
      const stored = localStorage.getItem("mock_user");
      if (!stored) return false;
      const data = JSON.parse(stored);
      return data.remember !== false;
    } catch {
      return false;
    }
  })();

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
    if (isRemembered) return;

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
  }, [isRemembered]);

  useEffect(() => {
    if (isRemembered) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    return () => events.forEach((e) => window.removeEventListener(e, resetTimer));
  }, [isRemembered]);

  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);

  return (
    <div className="min-h-screen flex flex-col bg-[#edece8] text-[#18191c] relative selection:bg-[#18191c] selection:text-white">
      
      {/* ── TOP FLOATING NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-6 lg:px-8 pt-3 pb-2 bg-[#edece8]/90 backdrop-blur-md border-b border-black/[0.04]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo (Left) */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 shrink-0 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-[#18191c] text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-[#18191c]">
                  IoTMesh
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-[#dedcd5] text-[#55565d]">
                  PRO
                </span>
              </div>
            </div>
          </Link>

          {/* Centered Segmented Capsule Pill Navbar (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center clay-pill-bar shrink-0">
            {primaryNavItems.map((item) => {
              const isActive = location.pathname.toLowerCase() === item.href.toLowerCase();

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all duration-150",
                    isActive
                      ? "bg-[#18191c] text-white shadow-sm"
                      : "text-[#5e6068] hover:text-[#18191c] hover:bg-white/60"
                  )}
                >
                  <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-[#797a82]")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Extra items for 2XL screen */}
            <div className="hidden 2xl:flex items-center">
              {secondaryNavItems.map((item) => {
                const isActive = location.pathname.toLowerCase() === item.href.toLowerCase();
                const isDisabled = item.adminOnly && role !== "admin";

                if (isDisabled) {
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleAdminOnlyClick(item.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider text-[#9b9a94] hover:text-[#55565d]"
                    >
                      <item.icon className="w-3.5 h-3.5 opacity-60" />
                      <span>{item.name}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all duration-150",
                      isActive
                        ? "bg-[#18191c] text-white shadow-sm"
                        : "text-[#5e6068] hover:text-[#18191c] hover:bg-white/60"
                    )}
                  >
                    <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-[#797a82]")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* More Dropdown Pill (for screens below 2XL) */}
            <div className="relative 2xl:hidden">
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all",
                  secondaryNavItems.some(i => i.href.toLowerCase() === location.pathname.toLowerCase())
                    ? "bg-[#18191c] text-white shadow-sm"
                    : "text-[#5e6068] hover:text-[#18191c]"
                )}
              >
                <span>MORE</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {moreDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-44 rounded-2xl bg-white border border-black/[0.08] shadow-xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setMoreDropdownOpen(false)}
                >
                  {secondaryNavItems.map((item) => {
                    const isActive = location.pathname.toLowerCase() === item.href.toLowerCase();
                    const isDisabled = item.adminOnly && role !== "admin";

                    if (isDisabled) {
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleAdminOnlyClick(item.name)}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#9b9a94] hover:bg-[#edece8]"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="w-3.5 h-3.5 opacity-60" />
                            <span>{item.name}</span>
                          </div>
                          <span className="text-[9px] font-mono px-1 rounded bg-[#dedcd5]">Admin</span>
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors",
                          isActive
                            ? "bg-[#18191c] text-white"
                            : "text-[#44464f] hover:bg-[#edece8] hover:text-[#18191c]"
                        )}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Quick Refresh */}
            <button
              onClick={() => {
                haptic.tick();
                sounds.click();
                window.location.reload();
              }}
              title="Refresh Telemetry"
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-black/[0.06] text-[#4d4f57] hover:text-[#18191c] flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => {
                navigate("/alerts");
                haptic.medium();
              }}
              title="System Alerts"
              className="relative w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-black/[0.06] text-[#4d4f57] hover:text-[#18191c] flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444] border-2 border-white" />
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                if (role === "admin") {
                  navigate("/security");
                } else {
                  handleAdminOnlyClick("Security Settings");
                }
              }}
              title="Security & System Settings"
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-black/[0.06] text-[#4d4f57] hover:text-[#18191c] flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* User Profile Pill Avatar */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-white/90 hover:bg-white border border-black/[0.07] shadow-sm transition-all hover:scale-[1.02]"
              >
                <div className="w-6 h-6 rounded-full bg-[#18191c] text-white flex items-center justify-center text-[10px] font-extrabold uppercase shadow-inner">
                  {user?.name?.[0] || "U"}
                </div>
                <span className="hidden sm:inline-block text-xs font-bold text-[#18191c] max-w-[70px] truncate">
                  {user?.name || "Admin"}
                </span>
                <ChevronDown className="w-3 h-3 text-[#797a82]" />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-black/[0.08] shadow-xl p-3 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-2 py-1.5 border-b border-black/[0.06]">
                    <p className="text-xs font-bold text-[#18191c] truncate">{user?.name || "User"}</p>
                    <p className="text-[10px] font-mono text-[#797a82]">
                      Role: <span className={cn("font-bold uppercase", role === "admin" ? "text-red-600" : "text-emerald-600")}>{role}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Link
                      to="/devices"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-[#44464f] hover:bg-[#edece8] hover:text-[#18191c] transition-colors"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Device Controls</span>
                    </Link>
                    <Link
                      to="/security"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-[#44464f] hover:bg-[#edece8] hover:text-[#18191c] transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Security & Passkeys</span>
                    </Link>
                    <Link
                      to="/telegram"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-[#44464f] hover:bg-[#edece8] hover:text-[#18191c] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Telegram Dispatch</span>
                    </Link>
                    <Link
                      to="/users"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-[#44464f] hover:bg-[#edece8] hover:text-[#18191c] transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Users Directory</span>
                    </Link>
                  </div>

                  <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between px-1">
                    <span className="text-[10px] font-mono text-[#797a82] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {isRemembered ? "Persistent" : `${minutes}m`}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-black/[0.07] flex items-center justify-center text-[#18191c] shadow-sm"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER NAVIGATION ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[56px] bottom-0 z-50 bg-[#edece8]/98 backdrop-blur-2xl p-4 overflow-y-auto space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="clay-card p-4 space-y-3">
            <p className="text-[10px] font-bold tracking-wider text-[#797a82] uppercase font-mono px-2">
              Navigation Menu
            </p>
            <div className="grid grid-cols-2 gap-2">
              {allNavItems.map((item) => {
                const isActive = location.pathname.toLowerCase() === item.href.toLowerCase();
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
                      "flex items-center gap-2.5 p-3 rounded-2xl text-xs font-bold transition-all text-left",
                      isActive
                        ? "bg-[#18191c] text-white shadow-md"
                        : isDisabled
                        ? "bg-[#e4e3dd]/40 text-[#9b9a94]"
                        : "bg-white/80 text-[#2c2d33] hover:bg-white border border-black/[0.05]"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-[#797a82]")} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User & Logout in Drawer */}
          <div className="clay-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#18191c]">{user?.name || "User"}</p>
              <p className="text-[10px] font-mono text-[#797a82]">
                Session: {isRemembered ? "Persistent" : `${minutes}m remaining`}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-bold text-xs flex items-center gap-1.5 hover:bg-red-100"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        {children}
      </main>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
};