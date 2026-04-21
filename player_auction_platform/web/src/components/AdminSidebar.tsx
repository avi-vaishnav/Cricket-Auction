"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Trophy, Users, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function AdminSidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => {
    // If we're on the root admin path, highlight dashboard
    if (path === "/dashboard" && pathname === "/admin") return true; 
    return pathname === path;
  };

  return (
    <>
      <div className="w-full md:w-72 md:min-w-[288px] border-b md:border-b-0 md:border-r border-white/10 bg-black/40 backdrop-blur-xl p-4 md:p-6 flex flex-col z-20 md:sticky top-0 h-auto md:h-screen shrink-0">
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-4 md:mb-12 flex items-center gap-2 text-white">
          AV Pro <span className="text-gradient">Admin</span>
        </h1>

        <div className="text-[10px] md:text-xs font-bold text-slate-500 tracking-widest uppercase mb-2 md:mb-4 px-3">Main Menu</div>
        <nav className="flex flex-row md:flex-col gap-2 flex-grow overflow-x-auto whitespace-nowrap hide-scrollbar pb-2 md:pb-0">
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-4 p-4 rounded-xl transition-all group relative ${
              isActive("/dashboard") 
                ? "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {isActive("/dashboard") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />}
            <Trophy size={20} className={`${isActive("/dashboard") ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"} transition-colors`} /> 
            Auctions
          </Link>

          <Link 
            href="/users" 
            className={`flex items-center gap-4 p-4 rounded-xl transition-all group relative ${
              isActive("/users") 
                ? "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {isActive("/users") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />}
            <Users size={20} className={`${isActive("/users") ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-400"} transition-colors`} /> 
            Users & Limits
          </Link>

          <Link 
            href="/settings" 
            className={`flex items-center gap-4 p-4 rounded-xl transition-all group relative ${
              isActive("/settings") 
                ? "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {isActive("/settings") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full" />}
            <Settings size={20} className={`${isActive("/settings") ? "text-purple-400" : "text-slate-500 group-hover:text-purple-400"} transition-colors`} /> 
            Global Settings
          </Link>

          <Link 
            href="/profile" 
            className={`flex items-center gap-4 p-4 rounded-xl transition-all group relative ${
              isActive("/profile") 
                ? "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {isActive("/profile") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 rounded-r-full" />}
            <User size={20} className={`${isActive("/profile") ? "text-amber-400" : "text-slate-500 group-hover:text-amber-400"} transition-colors`} /> 
            My Profile
          </Link>
        </nav>

        <div className="md:mt-auto border-t border-white/10 pt-4 md:pt-6 mt-4">
          <button
            onClick={() => logout()}
            className="w-full justify-center md:justify-start flex items-center gap-4 p-4 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
