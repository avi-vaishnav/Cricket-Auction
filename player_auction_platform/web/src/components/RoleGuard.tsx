"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      // Security violation detected: Force logout
      console.error(`Security Violation: User role ${user.role} attempted to access restricted area.`);
      // We use a silent version of logout if possible, but for now we follow user's request: "Log him out"
      // Since it's a security guard, we skip confirmation and clear session immediately
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login?error=unauthorized";
    }
  }, [user, isLoading, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  // Only render children if user has the required role
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
