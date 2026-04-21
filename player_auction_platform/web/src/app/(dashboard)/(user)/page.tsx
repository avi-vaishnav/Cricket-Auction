"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Users, 
  Calendar, 
  PlusCircle, 
  ArrowRight, 
  Loader2, 
  CreditCard,
  ShieldAlert,
  Search,
  LayoutDashboard
} from "lucide-react";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;

interface AuctionSummary {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  owner: { firstName: string; lastName: string };
  _count: { teams: number; players: number };
  users?: { role: string }[];
}

interface DashboardData {
  createdAuctions: AuctionSummary[];
  participatingAuctions: AuctionSummary[];
  upcomingAuctions: AuctionSummary[];
  credits: number;
}

export default function UserDashboardHub() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/auctions/dashboard-summary`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to fetch dashboard summary");
      const summary = await res.json();
      setData(summary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch dashboard summary";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-slate-400 font-medium tracking-wide">Assembling your dashboard...</p>
      </div>
    );
  }

  const SectionHeader = ({ title, icon: Icon, href }: { title: string, icon: React.ElementType, href: string }) => (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300">
          <Icon size={20} />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white">{title}</h3>
      </div>
      <Link 
        href={href}
        className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 group"
      >
        SEE MORE <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );

  const AuctionCard = ({ auction }: { auction: AuctionSummary }) => {
    const isOwner = data?.createdAuctions.some(a => a.id === auction.id);
    const isManager = auction.users?.some(u => u.role === 'OPERATOR');
    const canManage = isOwner || isManager;
    const isPast = ['COMPLETED', 'PAST'].includes(auction.status);

    return (
      <div className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 flex flex-col h-full bg-white/[0.01]">
        <div className="flex justify-between items-start mb-4">
          <div className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded border ${
            auction.status === 'LIVE' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
            auction.status === 'UPCOMING' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
            'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}>
            {auction.status}
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase">
            {new Date(auction.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">{auction.name}</h4>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1 text-slate-400 text-xs font-bold bg-white/5 px-2 py-1 rounded-lg">
            <Users size={12} className="text-blue-400" /> {auction._count.teams} Teams
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-bold bg-white/5 px-2 py-1 rounded-lg">
            <Trophy size={12} className="text-emerald-400" /> {auction._count.players} Players
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3">
          <Link href={`/conduct/${auction.id}`} className="block">
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2">
              {auction.status === 'LIVE' ? 'Watch Live' : 'Enter Arena'}
            </button>
          </Link>
          
          {canManage && (
            <Link href={`/auction/${auction.id}/settings`} className="block">
              <button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl text-xs border border-white/10 transition-all flex items-center justify-center gap-2">
                {isPast ? 'See Details' : 'Manage Room'}
              </button>
            </Link>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
           <p className="text-[10px] text-slate-600 font-medium italic">
            by {auction.owner.firstName} {auction.owner.lastName}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      {/* Welcome Hero */}
      <section className="relative overflow-hidden rounded-[2rem] p-8 md:p-12 border border-white/10 bg-gradient-to-br from-blue-600/20 to-purple-600/10 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3 text-white">
              Hello, <span className="text-gradient">Agent</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl">
              Welcome to your command center. Monitor your auctions, manage your teams, and participate in live drafts.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none glass-panel px-4 py-3 rounded-xl border border-white/10 flex flex-col items-center">
              <CreditCard className="text-emerald-400 mb-1" size={18} />
              <span className="text-[8px] font-black text-slate-500 tracking-wider uppercase">Credits</span>
              <span className="text-xl font-black text-white">{data?.credits ?? 0}</span>
            </div>
            <Link href="/auctions" className="flex-1 md:flex-none">
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-4 rounded-xl transition-all shadow-lg shadow-blue-900/40 flex flex-col items-center justify-center gap-1">
                <PlusCircle size={20} />
                <span className="text-[9px] uppercase tracking-widest font-bold">Create Auction</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Grid Layout for Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Created Auctions Column */}
        <div className="lg:col-span-1 space-y-6">
          <SectionHeader title="My Creations" icon={LayoutDashboard} href="/auctions?filter=created" />
          <div className="grid grid-cols-1 gap-4">
            {data?.createdAuctions.map(a => <AuctionCard key={a.id} auction={a} />)}
            {(!data?.createdAuctions || data.createdAuctions.length === 0) && (
              <div className="py-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                <PlusCircle size={32} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No auctions created</p>
              </div>
            )}
          </div>
        </div>

        {/* Participating/Managing Column */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Managing Section */}
          <div>
            <SectionHeader title="Managing (Operator)" icon={ShieldAlert} href="/auctions?filter=managing" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.participatingAuctions.filter(a => a.users?.[0]?.role === 'OPERATOR').map(a => <AuctionCard key={a.id} auction={a} />)}
              {(!data?.participatingAuctions || data.participatingAuctions.filter(a => a.users?.[0]?.role === 'OPERATOR').length === 0) && (
                <div className="md:col-span-2 py-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                  <p className="text-xs font-bold uppercase tracking-widest">Not managing any auctions</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Section */}
          <div>
            <SectionHeader title="Upcoming Rosters" icon={Calendar} href="/auctions" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.upcomingAuctions.map(a => <AuctionCard key={a.id} auction={a} />)}
              {(!data?.upcomingAuctions || data.upcomingAuctions.length === 0) && (
                <div className="md:col-span-2 py-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                  <p className="text-xs font-bold uppercase tracking-widest">No upcoming drafts</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Global Search Quick Link */}
      <Link href="/auctions" className="block p-8 border border-white/10 rounded-3xl bg-white/5 hover:bg-white/10 transition-all text-center">
        <div className="flex flex-col items-center">
          <Search size={32} className="text-blue-500 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">In search of something else?</h3>
          <p className="text-slate-400">Browse and filter all auctions you&apos;ve been involved with in full detail.</p>
        </div>
      </Link>
    </div>
  );
}
