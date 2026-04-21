"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Trophy, Download, Activity, Flame, Loader2, PlusCircle, ClipboardList } from "lucide-react";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;

interface DashboardStats {
  activeAuctions: number;
  totalTeams: number;
  totalPlayers: number;
}

interface AuctionRecord {
  id: string;
  name: string;
  code: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auctions, setAuctions] = useState<AuctionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        const [statsRes, auctionsRes] = await Promise.all([
          fetch(`${API_URL}/admin/stats`, { headers }),
          fetch(`${API_URL}/admin/auctions`, { headers })
        ]);

        if (statsRes.ok && auctionsRes.ok) {
          const statsData = await statsRes.json();
          const auctionsData = await auctionsRes.json();
          setStats(statsData);
          setAuctions(auctionsData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-10">
      <header className="flex justify-between items-end mb-12 border-b border-white/5 pb-8 gap-4">
        <div>
          <h2 className="text-4xl font-extrabold mb-2 text-white">Dashboard Overview</h2>
          <p className="text-slate-400 text-lg flex items-center gap-2">
            <Activity size={18} className="text-emerald-500" />
            {loading ? "Refreshing metrics..." : "System status healthy. Real-time monitoring active."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auctions" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-900/40 active:scale-95">
            <ClipboardList size={20} /> Auctions List
          </Link>
          <button onClick={() => alert("Export functionality coming soon")} className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl flex items-center gap-2 transition-colors font-semibold text-white">
            <Download size={18} /> Export Data
          </button>
        </div>
      </header>

      {/* Stats Grid - Shrinking these by 50% */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-14 mt-4">
        {/* Active Auctions */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20 text-blue-400">
              <Trophy size={20} />
            </div>
          </div>
          <div className="text-slate-500 font-bold mb-1 relative z-10 text-[10px] uppercase tracking-widest">Active Auctions</div>
          <div className="text-2xl font-black relative z-10 text-white">
            {loading ? "..." : stats?.activeAuctions || 0}
          </div>
        </div>

        {/* Registered Teams */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <Users size={20} />
            </div>
          </div>
          <div className="text-slate-500 font-bold mb-1 relative z-10 text-[10px] uppercase tracking-widest">Registered Teams</div>
          <div className="text-2xl font-black relative z-10 text-white">
            {loading ? "..." : stats?.totalTeams || 0}
          </div>
        </div>

        {/* Players Pool */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/20 text-purple-400">
              <Flame size={20} />
            </div>
          </div>
          <div className="text-slate-500 font-bold mb-1 relative z-10 text-[10px] uppercase tracking-widest">Players Pool</div>
          <div className="text-2xl font-black relative z-10 text-white">
            {loading ? "..." : stats?.totalPlayers || 0}
          </div>
        </div>

        {/* System Health / Status Placeholder */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/20 text-amber-400">
              <Activity size={20} />
            </div>
            <span className="flex h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
          </div>
          <div className="text-slate-500 font-bold mb-1 relative z-10 text-[10px] uppercase tracking-widest">Node Status</div>
          <div className="text-lg font-black relative z-10 text-white uppercase tracking-tighter">Operational</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-2 text-white">
          Recent Auctions
          {!loading && <span className="flex h-3 w-3 bg-blue-500 rounded-full animate-pulse ml-2" />}
        </h3>
        <Link href="/system-auctions" className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors">
          View All Auctions →
        </Link>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/10 text-sm uppercase tracking-wider">
                <th className="p-6 font-semibold text-slate-400">Auction Name</th>
                <th className="p-6 font-semibold text-slate-400">Status</th>
                <th className="p-6 font-semibold text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-20 text-center">
                    <Loader2 className="animate-spin inline-block mr-2 text-blue-500" size={24} />
                    <span className="text-slate-400 font-medium">Loading auctions...</span>
                  </td>
                </tr>
              ) : auctions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-20 text-center text-slate-500 font-medium">
                    No auctions found in the database.
                  </td>
                </tr>
              ) : (
                auctions.map((auction) => (
                  <tr key={auction.id} className="bg-white/[0.02] hover:bg-white/5 transition-colors group">
                    <td className="p-6">
                      <div className="font-bold text-lg text-white mb-1">{auction.name}</div>
                      <div className="text-sm text-slate-500 font-mono">CODE: {auction.code}</div>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold leading-none border ${auction.status === 'LIVE'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${auction.status === 'LIVE' ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                        {auction.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <Link href={`/auction/${auction.id}/settings`} className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-all shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)] group-hover:scale-105 active:scale-95">
                        Manage Room
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
