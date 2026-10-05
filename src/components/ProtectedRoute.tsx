import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: JSX.Element;
  adminOnly?: boolean;
}

export function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  // ⏳ Wait for Firebase Auth to resolve before making routing decisions
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#edece8]">
        <div className="w-8 h-8 border-2 border-[#18191c]/20 border-t-[#18191c] rounded-full animate-spin" />
      </div>
    );
  }

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // ❌ Admin-only page
  if (adminOnly && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ Allowed
  return children;
}