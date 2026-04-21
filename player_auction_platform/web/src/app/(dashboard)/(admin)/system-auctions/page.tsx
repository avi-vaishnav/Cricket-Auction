"use client";
import Link from "next/link";
import { Users, Trophy, Loader2, RefreshCw, Layers, Shield, ExternalLink, Mail } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;

interface AuctionRecord {
  id: string;
  name: string;
  code: string;
  status: string;
  createdAt: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    teams: number;
    players: number;
  };
}

export default function AdminAuctionsList() {
  const [auctions, setAuctions] = useState<AuctionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllAuctions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/auctions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch all system auctions");
      const data = await res.json();
      setAuctions(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load system auctions";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAuctions();
  }, [fetchAllAuctions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold leading-none shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> LIVE
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold leading-none">
            COMPLETED
          </span>
        );
      default:
        return (
           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-full text-xs font-bold leading-none">
            UPCOMING
          </span>
        );
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/5 pb-8 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <Shield className="text-blue-500" size={24} />
             <h2 className="text-4xl font-extrabold text-white">System Auctions</h2>
          </div>
          <p className="text-slate-400 text-lg">Platform-wide overview of all created tournament rooms and drafts.</p>
        </div>
        <button
          onClick={fetchAllAuctions}
          className="bg-white/5 hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-all border border-white/10"
        >
          <RefreshCw size={18} /> Refresh Records
        </button>
      </header>

      {error && (
        <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between">
           <p className="text-red-400 font-medium">{error}</p>
           <button onClick={fetchAllAuctions} className="text-white bg-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-all font-bold text-sm uppercase">Retry</button>
        </div>
      )}

      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/10 text-xs uppercase tracking-widest">
                <th className="p-6 font-bold text-slate-500">Auction & Code</th>
                <th className="p-6 font-bold text-slate-500">Owner</th>
                <th className="p-6 font-bold text-slate-500">Status</th>
                <th className="p-6 font-bold text-slate-500">Entity Counts</th>
                <th className="p-6 font-bold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 size={40} className="animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-slate-400 font-medium">Querying system records...</p>
                  </td>
                </tr>
              ) : auctions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-500 font-medium">
                    No auctions found in the entire platform database.
                  </td>
                </tr>
              ) : (
                auctions.map((auction) => (
                  <tr key={auction.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6">
                      <div className="font-bold text-lg text-white mb-1">{auction.name || "Untitled Auction"}</div>
                      <div className="text-xs font-mono text-blue-400/70 uppercase tracking-tighter">ID: {auction.id.split('-')[0]}.. • CODE: {auction.code}</div>
                    </td>
                    <td className="p-6">
                      {auction.owner ? (
                        <div className="flex flex-col">
                          <span className="text-white font-semibold">{auction.owner.firstName} {auction.owner.lastName}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10} /> {auction.owner.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">No Owner</span>
                      )}
                    </td>
                    <td className="p-6">
                      {getStatusBadge(auction.status)}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Teams</span>
                          <span className="text-white font-mono">{auction._count.teams}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Players</span>
                          <span className="text-white font-mono">{auction._count.players}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                       <Link 
                        href={`/conduct/${auction.id}`}
                        className="inline-flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold px-4 py-2 rounded-xl border border-blue-500/20 transition-all active:scale-95"
                       >
                         Manage <ExternalLink size={14} />
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
