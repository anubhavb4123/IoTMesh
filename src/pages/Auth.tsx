import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import { ArrowRight, Sparkles, Loader2, ShieldAlert } from "lucide-react";
import { IoTMeshLogo } from "@/components/IoTMeshLogo";
import { MeshLoadingScreen } from "@/components/MeshLoadingScreen";

// Official Google "G" SVG Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setUnauthorizedEmail(null);
    setIsAuthenticating(true);
    sounds.click();
    haptic.tick();

    try {
      await signInWithGoogle();
      sounds.loginSuccess();
      haptic.success();
      toast.success("Welcome back to IoTMesh!");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      if (err?.code === "auth/not-authorized") {
        sounds.wrongPass();
        haptic.error();
        setUnauthorizedEmail(err.email || "Your account");
        toast.error("Access Denied", {
          description: "Your Gmail is not on the administrator whitelist.",
        });
      } else if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request"
      ) {
        toast.info("Google sign-in was cancelled");
      } else {
        sounds.wrongPass();
        haptic.error();
        toast.error(err?.message || "Authentication failed. Please try again.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Show pure kinetic mesh animation while resolving initial session state
  if (loading) {
    return <MeshLoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#edece8] px-4 py-8 relative">

      {/* Main Container */}
      <div className="w-full max-w-[420px] space-y-4">

        {/* Explore Pill Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/iotmesh")}
            className="clay-pill-bar px-4 py-2 flex items-center gap-2 text-xs font-bold text-[#55565d] hover:text-[#18191c] hover:bg-white/80 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#18191c]" />
            <span>Explore IoTMesh Architecture</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Auth Card */}
        <div className="clay-card p-8 space-y-6 shadow-xl border border-black/[0.08]">

          {/* Logo & Title */}
          <div className="flex flex-col items-center text-center space-y-3">
            <IoTMeshLogo className="h-14 w-auto text-[#18191c]" />
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#18191c]">
                IoTMesh
              </h2>
            </div>
          </div>

          {/* Unauthorized Alert Banner */}
          {unauthorizedEmail && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <p className="text-xs font-bold">Registration Required</p>
              </div>
              <p className="text-xs text-red-600 leading-relaxed">
                <span className="font-semibold text-red-800">{unauthorizedEmail}</span> has not been registered. Contact an administrator to grant access.
              </p>
            </div>
          )}

          {/* Google OAuth Action Button */}
          <div className="space-y-4">
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full h-12 rounded-2xl bg-white hover:bg-neutral-50 active:scale-[0.98] border border-black/[0.12] text-[#18191c] text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#18191c]" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#797a82] font-mono">
          IoTMesh Pro Suite · v18.4 · © {new Date().getFullYear()}
        </p>

      </div>
    </div>
  );
}
