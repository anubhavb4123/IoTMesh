import { ReactNode, useState } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role, signOut } = useAuth();

  const navigation = allNavigation.map((item) => ({
    ...item,
    adminOnly: ["Users", "Telegram"].includes(item.name),
  }));

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    // 🔥 IMPORTANT FIX
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
              IOTMesh
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
          </nav>
        </div>
      </aside>

      {/* ================= MOBILE HEADER ================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 border-b border-border/40 bg-card/70 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-glow-cyan bg-clip-text text-transparent">
            IOTMesh <span className="ml-2 text-xs text-muted-foreground">v1.0</span>
          </span>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu />
          </Button>
        </div>

        {mobileMenuOpen && (
          <nav className="px-4 pb-4 space-y-2 border-t border-border/40">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-x-3 rounded-lg p-3 text-sm font-semibold hover:bg-sidebar-accent/50"
              >
                {item.name}
              </Link>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start gap-x-3 rounded-lg p-3 text-sm font-semibold hover:bg-red-600/10 text-red-600"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </nav>
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