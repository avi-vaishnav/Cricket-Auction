"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuctionStore } from "@/store/useAuctionStore";
import { useAuth } from "@/context/AuthContext";
import { Trophy, Activity, Users, Wallet, Loader2, Info, Lock, ArrowLeft } from "lucide-react";
import { AuctionInfoModal } from "@/components/AuctionInfoModal";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;

const getTeamInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.split(/\s+/).filter(p => p.length > 0);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getTeamColor = (name: string) => {
  const colors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
    "#ec4899", "#06b6d4", "#f43f5e", "#14b8a6", "#6366f1"
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function ViewerLivePage() {
  const params = useParams();
  const router = useRouter();
  const auctionCode = params.code as string;
  const { user } = useAuth();
  const [showInfoModal, setShowInfoModal] = useState(false);

  const {
    currentBid,
    currentPlayer,
    leadingTeam,
    currentRound,
    auctionStatus,
    auctionName,
    auctionLogo,
    ownerName,
    settings,
    stats,
    teams,
    isConnected,
    error,
    connectSocket,
    disconnectSocket,
    clearError,
  } = useAuctionStore();

  useEffect(() => {
    if (auctionCode) {
      connectSocket(auctionCode, "viewer", user?.id);
    }
    return () => {
      disconnectSocket();
      clearError();
    };
  }, [auctionCode, user?.id, connectSocket, disconnectSocket, clearError]);

  // Handle privacy/access errors
  const isAuthError = error?.toLowerCase().includes("private") || error?.toLowerCase().includes("login");

  // Category color mapping
  const getCategoryColor = (category?: string | null) => {
    if (!category) return "bg-slate-600";
    const c = category.toLowerCase();
    if (c.includes("bat")) return "bg-blue-600";
    if (c.includes("bowl") || c.includes("pac")) return "bg-emerald-600";
    if (c.includes("all")) return "bg-purple-600";
    if (c.includes("wk") || c.includes("keep")) return "bg-amber-600";
    return "bg-slate-600";
  };

  const isIdle = auctionStatus === "IDLE";
  const isBiddingButNoPlayer = auctionStatus === "BIDDING" && !currentPlayer;
  const isComplete = auctionStatus === "COMPLETED";

  if (isAuthError) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <Lock className="text-red-500" size={32} />
        </div>
        <h2 className="text-3xl font-black mb-4">Private Auction</h2>
        <p className="text-slate-400 max-w-md mb-8">
          {error}
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push("/login")}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-all"
          >
            Sign In
          </button>
          <button 
            onClick={() => router.push("/")}
            className="bg-white/5 hover:bg-white/10 text-white font-bold px-8 py-3 rounded-xl border border-white/10 transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#050505] overflow-hidden flex flex-col relative text-white">
      {/* Background glows */}
      <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3/4 h-3/4 bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="z-10 w-full px-4 md:px-6 py-4 flex justify-between items-center border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className={`${isIdle ? "text-slate-500" : "text-emerald-500 animate-pulse"}`} size={20} />
            <span className={`font-bold text-lg tracking-widest uppercase shrink-0 ${isIdle ? "text-slate-400" : "text-emerald-500"}`}>
              {isIdle ? "Upcoming Auction" : "Live Auction"}
            </span>
          </div>
          <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-mono hidden sm:inline-block">
            {auctionCode}
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20 whitespace-nowrap">
              Round {currentRound}
            </span>
            <button 
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <Info size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold ${isConnected ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"}`}>
            <Users size={12} />
            {isConnected ? "Spectating" : "Disconnected"}
          </div>
        </div>
      </header>

      {/* ── WAITING STATE ─────────────────────────────────── */}
      {(isIdle || isBiddingButNoPlayer) && !isComplete && (
        <main className="flex-1 z-10 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="relative">
             <div className={`absolute inset-0 bg-blue-500/20 blur-2xl rounded-full ${isBiddingButNoPlayer ? "animate-pulse" : ""}`} />
             <Loader2 size={48} className="text-blue-400 animate-spin relative z-10" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black">
             {isIdle ? "Waiting for Auction" : "Preparing Next Player"}
          </h2>
          <p className="text-slate-400 text-lg max-w-md">
            {isIdle 
              ? "The manager hasn't started the bidding cycle yet. Stay on this screen — the action will begin automatically."
              : "The manager has started the auction! Just a moment while we load the next player for bidding..."}
          </p>
        </main>
      )}

      {/* ── COMPLETED STATE ───────────────────────────────── */}
      {isComplete && (
        <main className="flex-1 z-10 flex flex-col items-center justify-center gap-6 p-8 text-center overflow-y-auto custom-scrollbar">
          <div className="py-12 flex flex-col items-center">
            <Trophy size={64} className="text-amber-400 mb-6" />
            <h2 className="text-3xl md:text-5xl font-black mb-4">Auction Concluded</h2>
            <p className="text-slate-400 text-lg max-w-md mb-12">
              All players have been processed. See the final team standings below.
            </p>

            {/* Final team standings */}
            {teams.length > 0 && (
              <div className="w-full max-w-xl">
                <h3 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-6">
                  Final Leaderboard
                </h3>
                <div className="flex flex-col gap-3">
                  {[...teams]
                    .sort((a, b) => b.budgetSpent - a.budgetSpent)
                    .map((team, i) => (
                      <div key={team.id} className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-white/5 hover:bg-white/10 transition-all">
                        <span className="text-2xl font-black text-slate-700 w-10 shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="h-12 w-12 rounded-xl bg-black/40 border border-white/5 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {team.logoUrl ? (
                            <img src={`${API_URL}${team.logoUrl}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-black text-white" style={{ backgroundColor: getTeamColor(team.name) }}>
                              {getTeamInitials(team.name)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-black text-white">{team.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{team.players?.length || 0} SIGNED</p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-black">₹{team.budgetSpent.toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-slate-600 font-bold uppercase">TOTAL SPENT</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── BIDDING STATE ─────────────────────────────────── */}
      {auctionStatus === "BIDDING" && currentPlayer && (
        <main className="flex-1 min-h-0 z-10 flex flex-col md:flex-row items-stretch md:items-center justify-center p-4 md:p-8 gap-4 md:gap-8 w-full max-w-7xl mx-auto">
          {/* Player Profile Left */}
          <motion.div
            key={currentPlayer.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="w-full md:w-1/3 flex-1 min-h-[300px] bg-gradient-to-t from-black to-slate-800 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-end p-8"
          >
             {currentPlayer.photoUrl ? (
                <img 
                  src={currentPlayer.photoUrl} 
                  alt={currentPlayer.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
              )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[1]" />
            <div className="z-[2] relative">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={currentPlayer.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-4xl md:text-6xl font-black mb-3 uppercase tracking-tight"
                >
                  {currentPlayer.name}
                </motion.h2>
              </AnimatePresence>
              <div className="flex gap-2 flex-wrap">
                <span className={`${getCategoryColor(currentPlayer.category)} text-white px-4 py-1.5 rounded-xl text-xs uppercase font-black tracking-widest`}>
                  {currentPlayer.category || "General"}
                </span>
                {currentPlayer.age && (
                   <span className="bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10">
                    AGE {currentPlayer.age}
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Bidding Info Right */}
          <div className="w-full md:w-1/2 flex flex-col gap-6 flex-1 min-h-0 justify-center">
            <motion.div
              key={currentBid}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="glass-panel p-8 md:p-14 rounded-[2.5rem] text-center relative overflow-hidden border border-white/10"
            >
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">
                Active Valuation
              </div>
              <div className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 drop-shadow-2xl">
                ₹{currentBid.toLocaleString("en-IN")}
              </div>
              {leadingTeam && (
                <div className="mt-8 flex items-center justify-center gap-3 text-emerald-400 font-black text-lg uppercase tracking-wider">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Trophy size={16} />
                  </div>
                  {leadingTeam.name}
                </div>
              )}
            </motion.div>

            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="glass-panel p-8 rounded-3xl text-center border border-white/5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Floor Price
                </div>
                <div className="text-xl md:text-3xl font-black text-white">
                  ₹{(currentPlayer.basePrice || 0).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl text-center border border-white/5 flex flex-col items-center justify-center bg-white/[0.02]">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Participants
                </div>
                <div className="text-xl md:text-3xl font-black text-white">{teams.length}</div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Fixed info button for mobile */}
      <AuctionInfoModal 
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        data={{
          name: auctionName,
          code: auctionCode,
          logo: auctionLogo,
          ownerName: ownerName,
          settings: {
            minBidAmount: settings?.minBidAmount || 0,
            maxBidAmount: settings?.maxBidAmount || 0,
            maxTeams: settings?.maxTeams || 0,
          },
          stats: {
            totalPlayers: stats?.totalPlayers || 0,
            totalTeams: stats?.totalTeams || 0,
            totalBudget: stats?.totalBudget || 0,
          }
        }}
      />
    </div>
  );
}
