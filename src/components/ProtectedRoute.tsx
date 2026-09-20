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
  const { role, user } = useAuth();
  const storedUser = localStorage.getItem("mock_user");

  // { Not logged in }
  if (!user && !storedUser) {
    return <Navigate to="/auth" replace />;
  }

  // ❌ Admin-only page
  if (adminOnly && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ Allowed
  return children;
}