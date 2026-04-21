"use client";
import React from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { UserSidebar } from "@/components/UserSidebar";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check if we are in a live auction screen (no sidebar/header)
  const isLiveAuction = pathname?.includes('/conduct/');
  const isAdmin = user?.role === "ADMIN";

  // During SSR and first paint, render a skeleton to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col md:flex-row overflow-hidden">
        <div className="flex-grow overflow-y-auto relative z-10 w-full flex flex-col">
          <main className="flex-grow">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className={`min-h-screen bg-[#030712] text-white flex flex-col md:flex-row overflow-hidden`}>
        {/* Dynamic Background ambient light based on role */}
        {!isLiveAuction && (
          <div className={`absolute top-0 left-64 w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none ${
            isAdmin ? 'bg-blue-600/5' : 'bg-purple-600/5'
          }`} />
        )}
        
        {!isLiveAuction && (
          isAdmin ? <AdminSidebar /> : <UserSidebar />
        )}
        
        <div className={`flex-grow overflow-y-auto relative z-10 w-full flex flex-col ${isLiveAuction ? 'bg-black' : ''}`}>
          {!isLiveAuction && <Header />}
          <main className="flex-grow">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
