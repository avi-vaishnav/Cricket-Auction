"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, LayoutDashboard, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function UserSidebar() {
  const { logout, user } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/auctions" && pathname === "/") return true;
    return pathname === path;
  };
  const hasCredits = user?.auctionLimit && user.auctionLimit > 0;

  return (
    <>
      <div className="w-full md:w-72 md:min-w-[288px] border-b md:border-b-0 md:border-r border-white/10 bg-black/40 backdrop-blur-xl p-4 md:p-6 flex flex-col z-20 md:sticky top-0 h-auto md:h-screen shrink-0">
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-4 md:mb-12 flex items-center gap-2 text-white">
          AV Pro <span className="text-gradient">Auction</span>
        </h1>

        <div className="text-[10px] md:text-xs font-bold text-slate-500 tracking-widest uppercase mb-2 md:mb-4 px-3">Main Menu</div>
        <nav className="flex flex-row md:flex-col gap-2 flex-grow overflow-x-auto whitespace-nowrap hide-scrollbar pb-2 md:pb-0">
          <Link 
            href="/auctions" 
            className={`flex items-center gap-4 p-4 rounded-xl transition-all group relative ${
              isActive("/auctions") 
                ? "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {isActive("/auctions") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />}
            <Trophy size={20} className={`${isActive("/auctions") ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"} transition-colors`} /> 
            My Auctions
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

        {/* Credits Badge */}
        <div className="border-t border-white/10 pt-4 mt-4 mb-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
            <LayoutDashboard size={16} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Auction Credits:</span>
            <span className={`text-sm font-bold ${hasCredits ? 'text-emerald-400' : 'text-red-400'}`}>
              {user?.auctionLimit ?? 0}
            </span>
          </div>
        </div>

        <div className="md:mt-auto border-t border-white/10 pt-4 md:pt-6 mt-2">
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
