"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Play,
  Pause,
  ChevronRight,
  Gavel,
  XCircle,
  SkipForward,
  Undo2,
  X,
  AlertTriangle,
  Wifi,
  WifiOff,
  Trophy,
  Wallet,
  Users,
  Zap,
  Info,
} from "lucide-react";
import { useAuctionStore } from "@/store/useAuctionStore";
import { useConfirm } from "@/hooks/useConfirm";
import { AuctionInfoModal } from "@/components/AuctionInfoModal";
import { useAuth } from "@/context/AuthContext";

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

export default function AuctioneerPanel() {
  const router = useRouter();
  const params = useParams();
  const auctionId = params.id as string;
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { confirm, ConfirmationModal } = useConfirm();

  const {
    auctionName,
    auctionCode,
    auctionLogo,
    ownerName,
    settings,
    stats,
    currentPlayer,
    currentBid,
    leadingTeam,
    currentRound,
    auctionStatus,
    teams,
    bidHistory,
    userRole,
    error,
    isConnected,
    connectSocket,
    disconnectSocket,
    emitStartAuction,
    emitPlaceBid,
    emitSellPlayer,
    emitUnsoldPlayer,
    emitSkipPlayer,
    emitUndoAction,
    clearError,
  } = useAuctionStore();

  // Connect socket on mount
  useEffect(() => {
    if (auctionId && user?.id) {
      connectSocket(auctionId, "auctioneer", user.id);
    }
    return () => {
      disconnectSocket();
    };
  }, [auctionId, user?.id, connectSocket, disconnectSocket]);

  // ─── Handlers ──────────────────────────────────────────────

  const handleBidIncrement = (increment: number) => {
    if (!selectedTeamId) return;
    const newAmount = currentBid + increment;
    emitPlaceBid(selectedTeamId, newAmount);
  };

  const handleSell = () => {
    if (!leadingTeam) return;
    confirm({
      title: "Confirm Sale",
      message: `Sell ${currentPlayer?.name} to ${leadingTeam.name} for ₹${currentBid.toLocaleString("en-IN")}?`,
      confirmText: "SELL",
      onConfirm: () => emitSellPlayer(),
    });
  };

  const handleUnsold = () => {
    confirm({
      title: "Mark Unsold",
      message: `Mark ${currentPlayer?.name} as UNSOLD? They will return in the next round.`,
      confirmText: "UNSOLD",
      isDestructive: true,
      onConfirm: () => emitUnsoldPlayer(),
    });
  };

  const handleSkip = () => {
    confirm({
      title: "Skip Player Permanently",
      message: `Skip ${currentPlayer?.name}? This action CANNOT be undone. The player will be permanently removed from the auction.`,
      confirmText: "SKIP",
      isDestructive: true,
      onConfirm: () => emitSkipPlayer(),
    });
  };

  const handleUndo = () => {
    confirm({
      title: "Undo Last Action",
      message: "Reverse the last SELL or UNSOLD action? The player and team budget will be restored.",
      confirmText: "UNDO",
      onConfirm: () => emitUndoAction(),
    });
  };

  const handleStart = () => {
    if ((stats.totalPlayers || 0) === 0) {
      alert("Cannot start the auction because there are no players in the roster. Please add players first.");
      return;
    }
    confirm({
      title: "Start Auction",
      message: "Begin the auction? The first available player will be loaded for bidding.",
      confirmText: "Start",
      onConfirm: () => emitStartAuction(),
    });
  };

  const handleExit = () => {
    confirm({
      title: "Exit Live Auction",
      message:
        "Are you sure you want to leave? The auction state is saved and you can return at any time.",
      confirmText: "Yes, Exit",
      isDestructive: true,
      onConfirm: () => {
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        if (user?.role === "ADMIN") {
          router.push("/dashboard");
        } else {
          router.push("/auctions");
        }
      },
    });
  };

  // ─── Derived State ─────────────────────────────────────────

  const canSkip = currentRound >= 3 && bidHistory.length === 0;
  const canSell = !!leadingTeam && !!currentPlayer;
  const isAuctionIdle = auctionStatus === "IDLE";
  const isAuctionComplete = auctionStatus === "COMPLETED";
  const isManager = userRole === "OWNER" || userRole === "OPERATOR";

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const selectedTeamBudgetRemaining = selectedTeam
    ? selectedTeam.budgetTotal - selectedTeam.budgetSpent
    : 0;

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

  // ── RENDER ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050505] text-white p-3 md:p-4 flex flex-col gap-3 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[200px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 blur-[200px] rounded-full pointer-events-none" />

      {/* Error Toast */}
      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-500/90 backdrop-blur-xl text-white px-6 py-3 rounded-xl shadow-2xl shadow-red-500/20 flex items-center gap-3 font-semibold border border-red-400/30">
            <AlertTriangle size={20} />
            {error}
            <button onClick={clearError} className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Top Bar ────────────────────────────────────────── */}
      <div className="glass-panel px-5 py-3 rounded-2xl flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handleExit}
              className="hover:bg-red-500/20 text-red-400 p-2 rounded-full transition-colors"
              title="Exit Auction"
            >
              <X size={22} />
            </button>
            <button
              onClick={() => setShowInfoModal(true)}
              className="hover:bg-blue-500/20 text-blue-400 p-2 rounded-full transition-colors"
              title="Auction Details"
            >
              <Info size={22} />
            </button>
          </div>
          <div>
            <h1 className="text-lg font-bold truncate max-w-[150px] sm:max-w-none">{auctionName || "Live Auction"}</h1>
            <p className="text-slate-500 text-xs font-mono">Round {currentRound}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isConnected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"}`}>
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isConnected ? "LIVE" : "OFFLINE"}
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${auctionStatus === "BIDDING" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : auctionStatus === "COMPLETED" ? "bg-slate-500/20 text-slate-400 border border-slate-500/20" : "bg-amber-500/20 text-amber-400 border border-amber-500/20"}`}>
            {auctionStatus}
          </div>
          {!isManager && (
            <div className="px-3 py-1.5 rounded-full text-[10px] font-black bg-white/10 text-slate-400 border border-white/5 tracking-widest">
              READ ONLY
            </div>
          )}
        </div>
      </div>

      {/* ── IDLE State — Start Button ──────────────────────── */}
      {(isAuctionIdle || (auctionStatus === "BIDDING" && !currentPlayer)) && (
        <div className="flex-1 z-10 flex flex-col items-center justify-center text-center gap-6">
          <div className="relative group">
            <div className={`absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full ${auctionStatus === "BIDDING" ? "animate-pulse" : ""}`} />
            <div className="h-24 w-24 rounded-3xl bg-black border border-white/10 flex items-center justify-center relative z-10 shadow-2xl transition-transform group-hover:scale-105">
              <Zap size={48} className={auctionStatus === "BIDDING" ? "text-emerald-400 animate-pulse" : "text-emerald-500"} />
            </div>
          </div>
          
          <h2 className="text-4xl font-black">
            {auctionStatus === "BIDDING" ? "Auction In Progress" : "Ready to Begin"}
          </h2>
          
          <p className="text-slate-400 text-lg max-w-md">
            {auctionStatus === "BIDDING"
              ? "The auction has started! Just a moment while we synchronize the state and load the first player..."
              : isManager 
                ? "All players and teams are loaded. Start the auction to begin the bidding cycle."
                : "The auction is initializing. Please stay on this screen — the manager will start the bidding shortly."}
          </p>

          {isAuctionIdle && isManager && (
            <button
              onClick={handleStart}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl px-12 py-5 rounded-2xl flex items-center gap-3 transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.6)] group"
            >
              <Play size={28} className="group-hover:scale-110 transition-transform" /> START LIVE AUCTION
            </button>
          )}
        </div>
      )}

      {/* ── COMPLETED State ───────────────────────────────── */}
      {isAuctionComplete && (
        <div className="flex-1 z-10 flex flex-col items-center justify-center text-center gap-6">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center border border-amber-500/20">
            <Trophy size={48} className="text-amber-400" />
          </div>
          <h2 className="text-4xl font-black">Auction Complete</h2>
          <p className="text-slate-400 text-lg max-w-md">
            All players have been processed. {isManager ? "You can undo the last action if needed." : "Results will be available shortly."}
          </p>
          {isManager && (
            <button
              onClick={handleUndo}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all border border-white/10"
            >
              <Undo2 size={20} /> Undo Last Action
            </button>
          )}
        </div>
      )}

      {/* ── BIDDING State — Main Layout ───────────────────── */}
      {auctionStatus === "BIDDING" && (
        <div className="flex-1 flex flex-col lg:flex-row gap-3 z-10 min-h-0">
          {/* ── LEFT COLUMN: Player + Bidding ──────────────── */}
          <div className="w-full lg:w-3/5 flex flex-col gap-3 min-h-0">
            {/* Current Player Card */}
            <div className="glass-panel p-6 md:p-8 rounded-2xl flex flex-col items-center text-center">
              {currentPlayer ? (
                <>
                  <h2 className="text-3xl md:text-5xl font-black mb-2 uppercase tracking-tight">
                    {currentPlayer.name}
                  </h2>
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`${getCategoryColor(currentPlayer.category)} text-white px-4 py-1 rounded-full text-sm font-bold uppercase`}>
                      {currentPlayer.category || "General"}
                    </span>
                    {currentPlayer.age && (
                      <span className="bg-white/10 text-slate-300 px-3 py-1 rounded-full text-sm font-medium">
                        Age {currentPlayer.age}
                      </span>
                    )}
                    {currentPlayer.number && (
                      <span className="bg-white/10 text-slate-300 px-3 py-1 rounded-full text-sm font-medium">
                        #{currentPlayer.number}
                      </span>
                    )}
                  </div>

                  <div className="text-slate-500 font-medium tracking-widest text-xs mb-2">
                    CURRENT BID
                  </div>
                  <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                    ₹{currentBid.toLocaleString("en-IN")}
                  </div>
                  {leadingTeam && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-4">
                      <Trophy size={16} /> {leadingTeam.name}
                    </div>
                  )}
                  <div className="text-slate-600 text-xs">
                    Base: ₹{currentPlayer.basePrice.toLocaleString("en-IN")}
                  </div>
                </>
              ) : (
                <div className="py-12 text-slate-500">
                  <p className="text-xl font-bold">No player selected</p>
                </div>
              )}
            </div>

            {/* Team Selector + Bid Increments (Only for Managers) */}
            {isManager && (
              <div className="glass-panel p-5 rounded-2xl">
                <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-3">
                  Select Bidding Team
                </div>
                {/* ... existing team grid ... */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-5">
                  {teams.map((team) => {
                    const remaining = team.budgetTotal - team.budgetSpent;
                    const isLow = remaining < currentBid;
                    const isSelected = selectedTeamId === team.id;
                    return (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeamId(team.id)}
                        disabled={isLow}
                        className={`p-3 rounded-xl text-left transition-all border flex items-center gap-3 ${
                          isSelected
                            ? "bg-blue-600/20 border-blue-500/40 ring-2 ring-blue-500/30"
                            : isLow
                            ? "bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="h-8 w-8 rounded-lg bg-black/40 border border-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {team.logoUrl ? (
                            <img src={`${API_URL}${team.logoUrl}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: getTeamColor(team.name) }}>
                              {getTeamInitials(team.name)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-bold text-sm truncate">{team.name}</div>
                          <div className={`text-xs mt-0.5 font-mono ${isLow ? "text-red-400" : "text-emerald-400"}`}>
                            ₹{remaining.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-3">
                  Place Bid {selectedTeam ? `for ${selectedTeam.name}` : ""}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[5000, 10000, 25000, 50000, 100000].map((inc) => {
                    const nextBid = currentBid + inc;
                    const disabled = !selectedTeamId || (selectedTeam ? selectedTeamBudgetRemaining < nextBid : true);
                    return (
                      <button
                        key={inc}
                        onClick={() => handleBidIncrement(inc)}
                        disabled={disabled}
                        className={`p-3 md:p-4 rounded-xl font-bold text-base flex flex-col items-center gap-1 transition-all ${
                          disabled
                            ? "bg-white/[0.02] text-slate-600 cursor-not-allowed"
                            : "bg-white/10 hover:bg-emerald-600/30 hover:text-emerald-300 text-white"
                        }`}
                      >
                        +{inc >= 100000 ? `${inc / 100000}L` : `${inc / 1000}k`}
                      </button>
                    );
                  })}
                </div>
                {selectedTeam && selectedTeamBudgetRemaining < currentBid && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-sm font-semibold bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                    <Wallet size={16} /> Not enough points — ₹{selectedTeamBudgetRemaining.toLocaleString("en-IN")} remaining
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Actions + Bid History ────────── */}
          <div className="w-full lg:w-2/5 flex flex-col gap-3 min-h-0">
            {/* Action Buttons (Only for Managers) */}
            {isManager && (
              <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3">
                <h3 className="text-sm font-bold text-slate-500 tracking-widest uppercase">
                  Actions
                </h3>

                <button
                  onClick={handleSell}
                  disabled={!canSell}
                  className={`w-full p-5 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all ${
                    canSell
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                      : "bg-white/5 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <Gavel size={28} /> SELL
                </button>

                <button
                  onClick={handleUnsold}
                  disabled={!currentPlayer}
                  className={`w-full p-5 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all ${
                    currentPlayer
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]"
                      : "bg-white/5 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <XCircle size={28} /> UNSOLD
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleUndo}
                    className="p-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/20 transition-all"
                  >
                    <Undo2 size={20} /> UNDO
                  </button>

                  <button
                    onClick={handleSkip}
                    disabled={!canSkip}
                    className={`p-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all border ${
                      canSkip
                        ? "bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border-purple-500/20"
                        : "bg-white/[0.02] text-slate-600 cursor-not-allowed border-white/5"
                    }`}
                  >
                    <SkipForward size={20} /> SKIP
                  </button>
                </div>
              </div>
            )}

            {/* Bid History */}
            <div className="glass-panel p-5 rounded-2xl flex-1 min-h-0 flex flex-col">
              <h3 className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-3">
                Bid History ({bidHistory.length})
              </h3>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
                {bidHistory.length === 0 ? (
                  <div className="text-slate-600 text-sm text-center py-8">
                    No bids yet for this player
                  </div>
                ) : (
                  bidHistory.map((bid, i) => (
                    <div
                      key={bid.id}
                      className={`p-3 rounded-lg flex justify-between items-center ${
                        i === 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/5"
                      }`}
                    >
                      <span className={`font-bold text-sm ${i === 0 ? "text-emerald-400" : "text-slate-400"}`}>
                        {bid.team?.name || "Unknown"}
                      </span>
                      <span className="font-mono text-sm">
                        ₹{bid.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Teams Summary */}
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-3 flex items-center gap-2">
                <Users size={14} /> Teams ({teams.length})
              </h3>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {teams.map((team) => {
                  const remaining = team.budgetTotal - team.budgetSpent;
                  const pct = (remaining / team.budgetTotal) * 100;
                  return (
                    <div key={team.id} className="flex items-center gap-3 text-sm">
                      <span className="flex-1 font-semibold truncate">{team.name}</span>
                      <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-400 w-20 text-right">
                        ₹{remaining.toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal />
      <AuctionInfoModal 
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        data={{
          name: auctionName,
          code: auctionCode,
          logo: auctionLogo,
          ownerName: ownerName,
          settings: {
            minBidAmount: settings.minBidAmount,
            maxBidAmount: settings.maxBidAmount,
            maxTeams: settings.maxTeams,
          },
          stats: {
            totalPlayers: stats.totalPlayers,
            totalTeams: stats.totalTeams,
            totalBudget: stats.totalBudget,
          }
        }}
      />
    </div>
  );
}
