"use client";
import Link from "next/link";
import { 
  Copy, Settings, Users, PlusCircle, Trophy, Loader2, RefreshCw, 
  Play, ShieldCheck, AlertCircle, Search, ChevronRight, ChevronLeft, 
  Trash2, Plus, Image as ImageIcon, UploadCloud
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Auction } from "@/types";
import { useConfirm } from "@/hooks/useConfirm";
import { AuctionInfoModal } from "@/components/AuctionInfoModal";
import { Info, ExternalLink } from "lucide-react";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;

interface BiddingRule {
  threshold: number;
  increment: number;
}

interface NewTeam {
  name: string;
  logo: File | null;
  preview: string;
}

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
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function UserAuctionsList() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Wizard State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, ConfirmationModal } = useConfirm();

  // Step 1: Identity
  const [auctionName, setAuctionName] = useState("");
  const [auctionPoster, setAuctionPoster] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [maxTeams, setMaxTeams] = useState(10);
  const [isPublic, setIsPublic] = useState(true);
  const [allowOperatorAdditions, setAllowOperatorAdditions] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  // Step 2: Logic
  const [defaultWallet, setDefaultWallet] = useState(100000);
  const [baseBidStep, setBaseBidStep] = useState(500);
  const [biddingRules, setBiddingRules] = useState<BiddingRule[]>([]);

  // Step 3: Teams
  const [teams, setTeams] = useState<NewTeam[]>([
    { name: "", logo: null, preview: "" },
    { name: "", logo: null, preview: "" }
  ]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [viewingAuction, setViewingAuction] = useState<Auction | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserCredits(data.auctionLimit);
        setUserRole(data.role);
      }
    } catch (err) {
      console.error("Failed to fetch user data", err);
    }
  }, []);

  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const url = new URL(`${API_URL}/auctions/my`);
      if (searchTerm) url.searchParams.append("search", searchTerm);
      if (filterType !== "all") url.searchParams.append("filter", filterType);

      const res = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch auctions");
      const data = await res.json();
      setAuctions(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load auctions";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterType]);

  useEffect(() => {
    fetchAuctions();
    fetchUserData();
  }, [fetchAuctions, fetchUserData]);

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  // Rule Handlers
  const addRule = () => setBiddingRules([...biddingRules, { threshold: 0, increment: 0 }]);
  const removeRule = (index: number) => {
    confirm({
      title: "Remove Rule",
      message: "Are you sure you want to delete this bidding rule?",
      confirmText: "Delete Rule",
      isDestructive: true,
      onConfirm: () => {
        setBiddingRules(biddingRules.filter((_, i) => i !== index));
      }
    });
  };
  const updateRule = (index: number, field: keyof BiddingRule, value: number) => {
    const updated = [...biddingRules];
    updated[index][field] = value;
    setBiddingRules(updated);
  };

  // Team Handlers
  const addTeam = () => {
    if (teams.length >= maxTeams) {
      alert(`Maximum of ${maxTeams} teams reached.`);
      return;
    }
    setTeams([...teams, { name: "", logo: null, preview: "" }]);
  };
  const removeTeam = (index: number) => {
    if (teams.length <= 2) {
      alert("At least 2 teams are required.");
      return;
    }
    confirm({
      title: "Remove Team",
      message: "Are you sure you want to remove this team from the auction?",
      confirmText: "Remove Team",
      isDestructive: true,
      onConfirm: () => {
        setTeams(teams.filter((_, i) => i !== index));
      }
    });
  };
  const updateTeamName = (index: number, name: string) => {
    const updated = [...teams];
    updated[index].name = name;
    setTeams(updated);
  };
  const updateTeamLogo = (index: number, file: File) => {
    const updated = [...teams];
    updated[index].logo = file;
    updated[index].preview = URL.createObjectURL(file);
    setTeams(updated);
  };

  const handlePosterChange = (file: File) => {
    setAuctionPoster(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleCreateAuction = async () => {
    // Final Validation
    if (!auctionName.trim()) { alert("Auction name is required"); return; }
    if (teams.some(t => !t.name.trim())) { alert("All teams must have names"); return; }
    if (teams.length < 2) { alert("Minimum 2 teams required"); return; }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }
      const formData = new FormData();
      
      // Step 1: Basics
      formData.append("name", auctionName);
      formData.append("maxTeams", maxTeams.toString());
      formData.append("isPublic", isPublic.toString());
      formData.append("allowOperatorAdditions", allowOperatorAdditions.toString());
      if (scheduledAt) formData.append("scheduledAt", scheduledAt);
      if (auctionPoster) formData.append("poster", auctionPoster);

      // Step 2: Logic
      formData.append("defaultWallet", defaultWallet.toString());
      formData.append("baseBidStep", baseBidStep.toString());
      formData.append("customBidIncrements", JSON.stringify(biddingRules));

      // Step 3: Teams
      const teamNames = teams.map(t => t.name);
      formData.append("teams", JSON.stringify(teamNames));
      teams.forEach((t, i) => {
        if (t.logo) formData.append(`team_logo_${i}`, t.logo);
      });

      const res = await fetch(`${API_URL}/auctions`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}` 
        },
        body: formData,
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create auction");
      }
      
      setIsModalOpen(false);
      resetWizard();
      fetchAuctions();
      fetchUserData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create auction";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteAuction = async (id: string) => {
    confirm({
      title: "Delete Auction Permanently",
      message: "This will remove all teams, players, and history. This action IS IRREVERSIBLE.",
      confirmText: "Yes, Delete Everything",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/auctions/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Failed to delete auction");
          setViewingAuction(null);
          fetchAuctions();
          fetchUserData();
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  const handleOpenCreateModal = () => {
    resetWizard();
    setIsModalOpen(true);
  };

  const handleCancelCreation = () => {
    confirm({
      title: "Cancel Creation",
      message: "Are you sure you want to cancel? All progress for this new auction will be lost.",
      confirmText: "Yes, Cancel",
      isDestructive: true,
      onConfirm: () => {
        resetWizard();
        setIsModalOpen(false);
      }
    });
  };

  const resetWizard = () => {
    setStep(1);
    setAuctionName("");
    setAuctionPoster(null);
    setPosterPreview("");
    setMaxTeams(10);
    setScheduledAt("");
    setDefaultWallet(100000);
    setBaseBidStep(500);
    setBiddingRules([]);
    setTeams([
      { name: "", logo: null, preview: "" },
      { name: "", logo: null, preview: "" }
    ]);
  };

  const getStatusColor = (derivedStatus: string) => {
    switch (derivedStatus) {
      case "LIVE": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20";
      case "PAST": return "bg-slate-500/20 text-slate-400 border-slate-500/20";
      case "NOT STARTED YET": return "bg-red-500/20 text-red-400 border-red-500/20";
      default: return "bg-amber-500/20 text-amber-400 border-amber-500/20";
    }
  };

  const getDerivedStatus = (auction: Auction) => {
    if (auction.status === "COMPLETED") return "PAST";
    if (auction.status === "LIVE") return "LIVE";
    
    // For UPCOMING, check scheduled time
    if (auction.scheduledAt) {
      const scheduledTime = new Date(auction.scheduledAt).getTime();
      const now = new Date().getTime();
      if (now >= scheduledTime) return "NOT STARTED YET";
    }
    
    return "UPCOMING";
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "OPERATOR": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default: return "bg-white/5 text-slate-400 border-white/10";
    }
  };

  const isLimitReached = userRole !== 'ADMIN' && userCredits !== null && userCredits <= 0;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="space-y-6 mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-white">Auctions & Drafts</h2>
            <p className="text-slate-400 text-base md:text-lg">Manage your active tournaments and room logic.</p>
          </div>
          <div className="flex items-center gap-3">
            {userCredits !== null && (
              <div className={`hidden md:flex items-center gap-2 px-4 py-3 rounded-xl border font-bold text-sm ${isLimitReached ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                <ShieldCheck size={18} />
                {userRole === 'ADMIN' ? 'UNLIMITED' : `${userCredits} CREDITS`}
              </div>
            )}
            <button 
              onClick={handleOpenCreateModal}
              disabled={isLimitReached}
              className={`font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-xl ${
                isLimitReached 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]'
              }`}
            >
              <PlusCircle size={20} /> Create Auction
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Search by arena name..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-[#030712] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-w-[200px]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Auctions</option>
            <option value="created">My Creations</option>
            <option value="managing">Managing</option>
            <option value="joined">Member of</option>
          </select>
          <button onClick={fetchAuctions} className="bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl border border-white/10">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full py-20 text-center text-slate-500 uppercase flex flex-col items-center gap-4">
             <Loader2 size={40} className="animate-spin text-blue-500" />
             <span className="text-[10px] font-black tracking-widest">Loading auctions...</span>
           </div>
        ) : auctions.map(auction => {
          const teamCount = auction._count?.teams ?? 0;
          const playerCount = auction._count?.players ?? 0;
          const myRole = auction.users?.[0]?.role ?? "PARTICIPANT";

          return (
            <div key={auction.id} className="glass-panel p-6 rounded-2xl border border-white/5 group relative flex flex-col hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded border ${getRoleBadge(myRole)}`}>
                  {myRole}
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${getStatusColor(getDerivedStatus(auction))} uppercase`}>
                  {getDerivedStatus(auction)}
                </span>
              </div>

              <div className="flex gap-4 mb-6">
                <div className="h-16 w-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                  {auction.logoUrl ? (
                    <img src={`${API_URL}${auction.logoUrl}`} alt={auction.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-500/30">
                      <Trophy size={24} />
                    </div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-xl font-extrabold text-white group-hover:text-blue-400 transition-colors truncate">{auction.name}</h3>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                      <span className="font-mono bg-white/5 px-2 py-1 rounded border border-white/5 uppercase">{auction.code}</span>
                      <button onClick={() => handleCopyCode(auction.code, auction.id)} className="hover:text-amber-400 transition-colors p-1">
                        {copiedId === auction.id ? <ShieldCheck size={14} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                    {auction.scheduledAt && (
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                        Scheduled: {new Date(auction.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider block mb-1">Teams</span>
                  <span className="text-white font-black text-lg">{teamCount}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider block mb-1">Players</span>
                  <span className="text-white font-black text-lg">{playerCount}</span>
                </div>
              </div>

              <div className="mt-auto space-y-2">
                {getDerivedStatus(auction) === "PAST" ? (
                  <Link href={`/auction/${auction.id}/settings`} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black flex items-center justify-center gap-2 py-3 rounded-xl transition-all border border-white/5 uppercase tracking-widest text-xs">
                    <Info size={18} /> SEE DETAILS
                  </Link>
                ) : auction.status === "LIVE" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/conduct/${auction.id}`} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-center gap-2 py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/40 uppercase tracking-widest text-[10px]">
                      <Play size={16} /> ENTER
                    </Link>
                    <Link href={`/auction/${auction.id}/settings`} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black flex items-center justify-center gap-2 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40 uppercase tracking-widest text-[10px]">
                      <Settings size={16} /> MANAGE
                    </Link>
                  </div>
                ) : (
                  <Link href={`/auction/${auction.id}/settings`} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black flex items-center justify-center gap-2 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40 uppercase tracking-widest text-xs">
                    <Settings size={18} /> MANAGE ROOM
                  </Link>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Link 
                    href={`/live/${auction.code}`} 
                    target="_blank"
                    className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 transition-colors text-xs"
                  >
                    <Play size={16} /> WATCH LIVE
                  </Link>
                  <Link href={`/auction/${auction.id}/players`} className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 transition-colors text-xs">
                    <Users size={16} /> ROSTER
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Step Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-2xl bg-[#030712] border border-white/10 shadow-[0_0_100px_-20px_rgba(37,99,235,0.3)] rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Wizard Progress Header */}
            <div className="bg-white/5 p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`flex items-center gap-2 ${step >= i ? 'text-blue-400' : 'text-slate-700'}`}>
                    <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-black text-xs transition-colors ${step >= i ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800'}`}>
                      {i}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block`}>
                      {i === 1 ? 'Identity' : i === 2 ? 'Logic' : 'Teams'}
                    </span>
                    {i < 3 && <div className={`h-[2px] w-4 bg-slate-800 rounded-full`} />}
                  </div>
                ))}
              </div>
              <button onClick={handleCancelCreation} className="text-slate-500 hover:text-red-500 transition-colors" title="Cancel Creation">
                <Trash2 size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-grow custom-scrollbar">
              {/* Step 1: Identity & Limits */}
              {step === 1 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <header>
                    <h3 className="text-3xl font-black text-white">Create Auction</h3>
                    <p className="text-slate-500 text-sm mt-1">Define the visual identity and scaling of your draft.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tournament Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. World Draft 2026"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-800"
                          value={auctionName}
                          onChange={e => setAuctionName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Maximum Teams</label>
                        <input 
                          type="number" 
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 focus:outline-none"
                          value={maxTeams}
                          onChange={e => setMaxTeams(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scheduled Date & Time</label>
                        <input 
                          type="datetime-local" 
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                          value={scheduledAt}
                          onChange={e => setScheduledAt(e.target.value)}
                        />
                      </div>
                      <div className="space-y-4 pt-2">
                        <label className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                          <div>
                            <span className="block text-sm font-bold text-white">Public Auction</span>
                            <span className="text-[10px] text-slate-500 font-medium tracking-tight">Allows viewers to watch guest.</span>
                          </div>
                          <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-5 h-5 accent-blue-500" />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                          <div>
                            <span className="block text-sm font-bold text-white">Operator Autonomy</span>
                            <span className="text-[10px] text-slate-500 font-medium tracking-tight">Operators can add other admins.</span>
                          </div>
                          <input type="checkbox" checked={allowOperatorAdditions} onChange={e => setAllowOperatorAdditions(e.target.checked)} className="w-5 h-5 accent-blue-500" />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Room Poster</label>
                      <div 
                        className="aspect-[4/5] bg-black/40 border-2 border-dashed border-white/10 rounded-3xl relative overflow-hidden group cursor-pointer"
                        onClick={() => document.getElementById('poster-upload')?.click()}
                      >
                        {posterPreview ? (
                          <img src={posterPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-600 group-hover:text-blue-400 transition-colors">
                            <UploadCloud size={48} />
                            <span className="text-xs font-black uppercase tracking-widest">Upload Poster</span>
                          </div>
                        )}
                        <input 
                          id="poster-upload" 
                          type="file" 
                          hidden 
                          accept="image/*"
                          onChange={e => e.target.files?.[0] && handlePosterChange(e.target.files[0])}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Logic & Financials */}
              {step === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <header>
                    <h3 className="text-3xl font-black text-white">Bidding Logic</h3>
                    <p className="text-slate-500 text-sm mt-1">Configure wallet sizes and incremental bidding rules.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initial Wallet (All Teams)</label>
                      <input 
                        type="number" 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 focus:outline-none font-bold"
                        value={defaultWallet}
                        onChange={e => setDefaultWallet(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Bid Step</label>
                      <input 
                        type="number" 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 focus:outline-none font-bold"
                        value={baseBidStep}
                        onChange={e => setBaseBidStep(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Custom Increment Rules</label>
                      <button onClick={addRule} className="text-blue-500 flex items-center gap-1 text-[10px] font-black uppercase hover:text-blue-400">
                        <Plus size={14} /> Add Scale
                      </button>
                    </div>

                    <div className="space-y-3">
                      {biddingRules.map((rule, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 animate-in slide-in-from-top-2">
                          <div className="col-span-2 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">If Bid is over...</span>
                            <input 
                              type="number" 
                              className="w-full bg-black border border-white/10 rounded-xl p-2 text-white focus:outline-none text-sm font-bold"
                              value={rule.threshold}
                              onChange={e => updateRule(idx, 'threshold', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Increment by</span>
                            <input 
                              type="number" 
                              className="w-full bg-black border border-white/10 rounded-xl p-2 text-white focus:outline-none text-sm font-bold"
                              value={rule.increment}
                              onChange={e => updateRule(idx, 'increment', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex items-end justify-end">
                            <button onClick={() => removeRule(idx)} className="p-3 text-slate-700 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {biddingRules.length === 0 && (
                        <div className="text-center py-12 bg-white/[0.02] border-2 border-dashed border-white/10 rounded-3xl">
                          <p className="text-slate-600 text-xs font-medium italic">No custom rules. Fallback to base step will be used.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Team Roster */}
              {step === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <header className="flex justify-between items-end">
                    <div>
                      <h3 className="text-3xl font-black text-white">The Roster</h3>
                      <p className="text-slate-500 text-sm mt-1">Deploy initial team participants (Min. 2).</p>
                    </div>
                    <button 
                      onClick={addTeam}
                      className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-all"
                    >
                      <PlusCircle size={20} />
                    </button>
                  </header>

                  <div className="space-y-4">
                    {teams.map((team, idx) => (
                      <div key={idx} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group relative">
                        <div 
                          className="h-14 w-14 rounded-xl bg-black/40 border border-white/10 flex-shrink-0 relative overflow-hidden group/logo cursor-pointer"
                          onClick={() => document.getElementById(`team-logo-${idx}`)?.click()}
                        >
                          {team.preview ? (
                            <img src={team.preview} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-white font-black text-xl`} style={{ backgroundColor: getTeamColor(team.name || `T${idx+1}`) }}>
                              {getTeamInitials(team.name || `Team ${idx+1}`)}
                            </div>
                          )}
                          <input 
                            id={`team-logo-${idx}`}
                            type="file" 
                            hidden 
                            accept="image/*"
                            onChange={e => e.target.files?.[0] && updateTeamLogo(idx, e.target.files[0])}
                          />
                        </div>
                        <div className="flex-grow space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Team Name</label>
                          <input 
                            type="text" 
                            placeholder={`Team ${idx + 1} Name`}
                            className="w-full bg-transparent border-b border-white/10 p-1 text-white font-bold focus:outline-none focus:border-blue-500 transition-all"
                            value={team.name}
                            onChange={e => updateTeamName(idx, e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={() => removeTeam(idx)}
                          className="p-3 text-slate-700 hover:text-red-500 transition-colors self-center"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-8 bg-white/5 border-t border-white/5 flex gap-4">
               {step > 1 && (
                 <button 
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-4 rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5 flex items-center gap-2"
                >
                  <ChevronLeft size={18} /> Back
                </button>
               )}
               {step < 3 ? (
                 <button 
                  onClick={() => setStep(step + 1)}
                  className="flex-grow px-6 py-4 rounded-2xl font-black bg-blue-600 hover:bg-blue-500 text-white shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  Configure {step === 1 ? 'Logic' : 'Teams'} <ChevronRight size={18} />
                </button>
               ) : (
                 <button 
                  onClick={handleCreateAuction}
                  disabled={isSubmitting}
                  className="flex-grow px-6 py-4 rounded-2xl font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>FINALIZE AUCTION <ShieldCheck size={18} /></>}
                </button>
               )}
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal />
      
      {viewingAuction && (
        <AuctionInfoModal 
          isOpen={!!viewingAuction}
          onClose={() => setViewingAuction(null)}
          onDelete={
            viewingAuction.users?.[0]?.role === "OWNER" 
              ? () => handleDeleteAuction(viewingAuction.id) 
              : undefined
          }
          data={{
            name: viewingAuction.name,
            code: viewingAuction.code,
            logo: viewingAuction.logoUrl ? `${API_URL}${viewingAuction.logoUrl}` : undefined,
            ownerName: viewingAuction.users?.find(u => u.role === "OWNER")?.user?.name || "Unknown",
            stats: {
              totalPlayers: viewingAuction._count?.players || 0,
              totalTeams: viewingAuction._count?.teams || 0,
              totalBudget: (viewingAuction._count?.teams || 0) * viewingAuction.settings.defaultWallet,
            },
            settings: {
              minBidAmount: viewingAuction.settings.minBidAmount,
              maxBidAmount: viewingAuction.settings.maxBidAmount,
              maxTeams: viewingAuction.settings.maxTeams,
            }
          }}
        />
      )}
    </div>
  );
}
