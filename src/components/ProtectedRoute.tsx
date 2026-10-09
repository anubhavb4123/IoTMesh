import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MeshLoadingScreen } from "@/components/MeshLoadingScreen";

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
    return <MeshLoadingScreen />;
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