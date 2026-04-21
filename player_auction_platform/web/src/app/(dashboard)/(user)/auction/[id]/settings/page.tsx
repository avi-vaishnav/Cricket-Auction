"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Save,
  ArrowLeft,
  Loader2,
  UserPlus,
  Trash2,
  ShieldCheck,
  Search,
  ShieldEllipsis,
  ShieldAlert,
  Plus,
  Users,
  Settings as SettingsIcon,
  Play,
  AlertCircle,
  FileEdit,
  UserCheck,
  Coins,
  ChevronRight,
  UploadCloud,
  X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/useConfirm";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;

interface Operator {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
  budgetTotal: number;
  budgetSpent: number;
  _count?: { players: number };
}

interface Player {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  status: string;
  teamId: string | null;
  number?: number;
  age?: number;
}

export default function AuctionSettings() {
  const { id: auctionId } = useParams();
  const router = useRouter();
  const { confirm, ConfirmationModal } = useConfirm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "teams" | "players" | "staff">("settings");

  // Auction State
  const [auction, setAuction] = useState<any>(null);
  const [settings, setSettings] = useState({
    name: "",
    minTeams: 0,
    maxTeams: 0,
    minBidAmount: 0,
    maxBidAmount: 0,
    defaultWallet: 100000,
    baseBidStep: 500,
    customBidIncrements: [] as { threshold: number, increment: number }[],
    isPublic: true,
    allowOperatorAdditions: false,
    ownerId: "",
  });

  // Operators State
  const [operators, setOperators] = useState<Operator[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Teams State
  const [teams, setTeams] = useState<Team[]>([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Partial<Team> | null>(null);
  const [teamLogoFile, setTeamLogoFile] = useState<File | null>(null);

  // Players State
  const [players, setPlayers] = useState<Player[]>([]);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Partial<Player> | null>(null);
  const [playerFilter, setPlayerFilter] = useState("all");

  // Database Player Search
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [dbResults, setDbResults] = useState<any[]>([]);
  const [isDbSearching, setIsDbSearching] = useState(false);
  const [showDbSearch, setShowDbSearch] = useState(false);

  // Manual Player Fields
  const [manualPlayer, setManualPlayer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    category: "Batsman",
    basePrice: 1000
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auctions/${auctionId}`);
      if (!res.ok) throw new Error("Failed to fetch auction details");
      const data = await res.json();

      setAuction(data);
      setSettings({
        name: data.name,
        minTeams: data.minTeams,
        maxTeams: data.maxTeams,
        minBidAmount: data.minBidAmount,
        maxBidAmount: data.maxBidAmount,
        defaultWallet: data.defaultWallet || 100000,
        baseBidStep: data.baseBidStep || 500,
        customBidIncrements: data.customBidIncrements || [],
        isPublic: data.isPublic,
        allowOperatorAdditions: data.allowOperatorAdditions,
        ownerId: data.ownerId,
      });

      setTeams(data.teams || []);
      setPlayers(data.players || []);
      setOperators(data.users.filter((u: { role: string }) => u.role === 'OPERATOR'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Auction Actions ───────────────────────────────────────────

  const handleSaveSettings = async () => {
    confirm({
      title: "Save Config",
      message: "Push these rule changes live?",
      confirmText: "Update settings",
      onConfirm: async () => {
        try {
          setSaving(true);
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/auctions/${auctionId}/settings`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(settings)
          });
          if (!res.ok) throw new Error("Update failed");
          alert("Settings updated successfully!");
          fetchData();
        } catch (err: unknown) {
          alert(err instanceof Error ? err.message : "Update failed");
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleDeleteAuction = () => {
    confirm({
      title: "DELETE AUCTION",
      message: "CRITICAL: This will permanently delete the auction, all teams, and all players. This cannot be undone.",
      confirmText: "Delete Permanently",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/auctions/${auctionId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Delete failed");
          router.replace("/auctions");
        } catch (err) {
          alert("Delete failed");
        }
      }
    });
  };

  const handleStartAuction = async () => {
    // Requirements Check
    if (teams.length < 2) {
      alert("Requirement Failed: You must add at least 2 teams before starting the auction.");
      return;
    }
    const unapproved = players.filter(p => (p as any).user?.isApproved === false);
    if (unapproved.length > 0) {
      alert(`Requirement Failed: There are ${unapproved.length} player(s) waiting for Admin approval (${unapproved.map(u => u.name).join(", ")}). Please approve them from Admin Dashboard first.`);
      return;
    }

    const bidPool = players.filter(p => !['SOLD', 'SKIPPED'].includes(p.status));
    if (bidPool.length === 0) {
      alert("Requirement Failed: You must add at least 1 player to the pool.");
      return;
    }

    if (auction.status === 'LIVE' || auction.status === 'COMPLETED') {
      router.push(`/conduct/${auctionId}`);
      return;
    }

    confirm({
      title: "Initialize Engine",
      message: "Ready to start the bidding process? This will activate the live socket and load the first player.",
      confirmText: "Launch Engine",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          if (!API_URL) {
            alert("API Configuration Error: API_BASE_URL is not defined in lib/api.ts or environment variables.");
            return;
          }
          const res = await fetch(`${API_URL}/auctions/${auctionId}/start`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
          });

          if (!res.ok) {
            // Handle non-JSON responses (like Express 404s)
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              const data = await res.json();
              throw new Error(data.message || "Failed to start auction");
            } else {
              const text = await res.text();
              throw new Error(text || `Server Error: ${res.status} ${res.statusText}`);
            }
          }
          router.push(`/conduct/${auctionId}`);
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  // ─── Team CRUD ──────────────────────────────────────────────────

  const handleSaveTeam = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const isNew = !editingTeam?.id;
      const url = isNew ? `${API_URL}/auctions/team` : `${API_URL}/auctions/teams/${editingTeam?.id}`;
      const method = isNew ? "POST" : "PATCH";

      const formData = new FormData();
      formData.append("name", editingTeam?.name || "");
      formData.append("budgetTotal", editingTeam?.budgetTotal?.toString() || "0");
      formData.append("auctionId", auctionId as string);
      if (teamLogoFile) {
        formData.append("logo", teamLogoFile);
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Team save failed");
      setIsTeamModalOpen(false);
      setEditingTeam(null);
      setTeamLogoFile(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Team error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = (teamId: string) => {
    confirm({
      title: "Remove Team",
      message: "Are you sure you want to remove this team? All their spending will be reverted.",
      confirmText: "Delete",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/auctions/teams/${teamId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Delete failed");
          }
          fetchData();
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  // ─── Player CRUD ────────────────────────────────────────────────

  const handleSavePlayer = async () => {
    try {
      const token = localStorage.getItem("token");
      const isNew = !editingPlayer?.id;
      const url = isNew ? `${API_URL}/auctions/player` : `${API_URL}/auctions/players/${editingPlayer.id}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ...editingPlayer, auctionId })
      });

      if (!res.ok) throw new Error("Player save failed");
      setIsPlayerModalOpen(false);
      setEditingPlayer(null);
      fetchData();
    } catch (err) {
      alert("Player error");
    }
  };

  const handleSearchDb = async () => {
    if (!playerSearchQuery.trim()) return;
    try {
      setIsDbSearching(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auctions/users/search?q=${playerSearchQuery}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Search failed");
      const results = await res.json();
      setDbResults(results);
    } catch (err) {
      alert("Search failed");
    } finally {
      setIsDbSearching(false);
    }
  };

  const handleAddFromDb = async (user: any) => {
    confirm({
      title: "Add Player",
      message: `Add ${user.firstName} ${user.lastName} to this auction pool?`,
      confirmText: "Yes, Add",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          // Check if already in auction
          if (players.some(p => (p as any).userId === user.id)) {
            alert("This player is already in the auction pool.");
            return;
          }

          const res = await fetch(`${API_URL}/auctions/player`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              name: `${user.firstName} ${user.lastName}`,
              category: user.category || "General",
              basePrice: settings.minBidAmount || 1000,
              auctionId,
              userId: user.id
            })
          });
          if (!res.ok) throw new Error("Failed to add player");
          fetchData();
          setDbResults([]);
          setPlayerSearchQuery("");
        } catch (err) {
          alert("Failed to add player");
        }
      }
    });
  };

  const handleCreateManualPlayer = async () => {
    if (!manualPlayer.email || !manualPlayer.firstName) {
      alert("Please fill in required fields (Name, Email)");
      return;
    }

    // Phone validation (10 digits)
    const cleanPhone = manualPlayer.phone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
      alert("Phone number must be exactly 10 digits.");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/auctions/${auctionId}/register-player`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...manualPlayer,
          phone: cleanPhone
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to register player");
      }

      setIsPlayerModalOpen(false);
      // Reset to defaults
      setManualPlayer({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        category: "Batsman",
        basePrice: settings.minBidAmount || 1000
      });

      fetchData();
      alert("Registration Successful: Player has been added to the auction roster. Note: Players added manually must be approved by an Admin from Dashboard -> Users & Limits before the auction can start.");
    } catch (err: any) {
      console.error("Registration Error:", err);
      alert(`Registration Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlayer = (playerId: string) => {
    confirm({
      title: "Delete Player",
      message: "Permanently remove this player from the pool?",
      confirmText: "Delete",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/auctions/players/${playerId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Delete failed");
          fetchData();
        } catch (err) {
          alert("Delete failed");
        }
      }
    });
  };

  // ─── Operator Handlers ──────────────────────────────────────────

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;
    try {
      setIsSearching(true);
      setFoundUser(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/search-user?email=${searchEmail}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setFoundUser(await res.json());
      else setError("User not found.");
    } finally { setIsSearching(false); }
  };

  const handleAddOperator = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auctions/${auctionId}/operators`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ userId: foundUser.id })
      });
      if (!res.ok) throw new Error("Fail");
      setFoundUser(null);
      setSearchEmail("");
      fetchData();
    } catch { alert("Failed to add operator"); }
  };

  const handleRemoveOperator = async (targetUserId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auctions/${auctionId}/operators/${targetUserId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch { alert("Failed to remove"); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Synchronizing Arena...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 relative">
      <Link
        href="/auctions"
        className="absolute -top-12 left-8 text-white hover:text-blue-400 flex items-center gap-2 transition-colors font-black text-xs uppercase tracking-[0.2em] group z-10"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
      </Link>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/5 p-6 rounded-3xl border border-white/5 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />

        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            {settings.name} <span className="bg-blue-600/10 text-blue-400 text-[10px] px-2 py-1 rounded-md border border-blue-500/20 font-mono tracking-normal">{auction?.code}</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium">Control center for managing teams, players, and logic.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => window.open(`/live/${auction?.code}`, '_blank')}
            disabled={auction?.status !== 'LIVE'}
            className={`p-4 rounded-2xl border transition-all flex items-center justify-center group ${auction?.status === 'LIVE'
              ? "bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white"
              : "bg-white/5 border-white/5 text-slate-700 cursor-not-allowed"
              }`}
            title={auction?.status === 'LIVE' ? "Open Live View" : "Live View is only available during active auctions"}
          >
            <ChevronRight size={24} className={auction?.status === 'LIVE' ? "animate-pulse" : ""} />
          </button>

          <button
            onClick={handleDeleteAuction}
            className="p-4 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all flex items-center justify-center group"
            title="Delete Arena"
          >
            <Trash2 size={20} className="group-hover:rotate-12 transition-transform" />
          </button>

          <button
            onClick={handleStartAuction}
            className={`flex-grow md:flex-grow-0 px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl ${auction?.status === 'LIVE'
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
              }`}
          >
            {auction?.status === 'LIVE' ? (
              <><ChevronRight size={24} strokeWidth={3} /> ENTER ROOM</>
            ) : (
              <><Play size={22} fill="currentColor" /> START </>
            )}
          </button>
        </div>
      </header>

      {/* ── TAB NAVIGATION ───────────────────────────────────── */}
      <div className="flex p-1.5 bg-white/5 border border-white/5 rounded-2xl w-full max-w-full overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === "settings" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
        >
          <SettingsIcon size={18} /> Config
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === "teams" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
        >
          <Users size={18} /> Teams ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab("players")}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === "players" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
        >
          <UserPlus size={18} /> Roster ({players.length})
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === "staff" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
        >
          <ShieldEllipsis size={18} /> Staff ({operators.length})
        </button>
      </div>

      {/* ── TAB CONTENT ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* TAB 1: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-8">
              <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-8 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <ShieldCheck className="text-blue-500" size={24} /> Engine Parameters
                  </h3>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 text-xs uppercase tracking-widest"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Commit Updates</>}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Auction Name</label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={e => setSettings({ ...settings, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Seed Budget (Standard Wallet)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">₹</div>
                      <input
                        type="number"
                        value={settings.defaultWallet}
                        onChange={e => setSettings({ ...settings, defaultWallet: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Bidding Step</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-bold">+</div>
                      <input
                        type="number"
                        value={settings.baseBidStep}
                        onChange={e => setSettings({ ...settings, baseBidStep: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-8 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Increments */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-white font-black text-sm uppercase tracking-tight">Bid Escalation Map</h4>
                      <p className="text-slate-500 text-xs font-medium">Define how increments grow as the price rises.</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, customBidIncrements: [...settings.customBidIncrements, { threshold: 0, increment: 0 }] })}
                      className="text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                    >
                      <Plus size={14} /> Add Scale
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {settings.customBidIncrements.map((rule, idx) => (
                      <div key={idx} className="flex gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5 items-center group">
                        <div className="flex-1 space-y-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase block">If bid hits...</span>
                          <input
                            type="number"
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-blue-500 text-sm"
                            value={rule.threshold}
                            onChange={e => {
                              const newRules = [...settings.customBidIncrements];
                              newRules[idx].threshold = parseFloat(e.target.value) || 0;
                              setSettings({ ...settings, customBidIncrements: newRules });
                            }}
                          />
                        </div>
                        <ChevronRight className="text-slate-800 mt-4" size={20} />
                        <div className="flex-1 space-y-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase block">Jump increment by...</span>
                          <input
                            type="number"
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-blue-500 text-sm"
                            value={rule.increment}
                            onChange={e => {
                              const newRules = [...settings.customBidIncrements];
                              newRules[idx].increment = parseFloat(e.target.value) || 0;
                              setSettings({ ...settings, customBidIncrements: newRules });
                            }}
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newRules = [...settings.customBidIncrements];
                            newRules.splice(idx, 1);
                            setSettings({ ...settings, customBidIncrements: newRules });
                          }}
                          className="mt-4 p-3 text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Privacy Panel */}
              <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <ShieldAlert className="text-amber-500" size={24} /> Broadcasting & Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all group">
                    <div className="space-y-1">
                      <span className="block text-base font-black text-white group-hover:text-amber-400 transition-colors">Public Portal</span>
                      <p className="text-xs text-slate-500">Allow guest viewers to watch the live feed.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.isPublic}
                      onChange={(e) => setSettings({ ...settings, isPublic: e.target.checked })}
                      className="w-6 h-6 accent-blue-600 rounded-lg"
                    />
                  </label>
                  <label className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all group">
                    <div className="space-y-1">
                      <span className="block text-base font-black text-white group-hover:text-blue-400 transition-colors">Delegated Authority</span>
                      <p className="text-xs text-slate-500">Operators can promote others to staff.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.allowOperatorAdditions}
                      onChange={(e) => setSettings({ ...settings, allowOperatorAdditions: e.target.checked })}
                      className="w-6 h-6 accent-blue-600 rounded-lg"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEAMS */}
          {activeTab === "teams" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">Initial Roster</h3>
                  <p className="text-slate-500 text-sm font-medium">Manage the participants who will be bidding.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingTeam({ name: "", budgetTotal: settings.defaultWallet });
                    setIsTeamModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg text-xs uppercase tracking-widest"
                >
                  <Plus size={18} /> Add Participant
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="glass-panel p-5 rounded-3xl border border-white/5 flex items-center gap-5 group hover:border-blue-500/30 transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0 transition-transform group-hover:scale-105">
                      {team.logoUrl ? (
                        <img src={`${API_URL}${team.logoUrl}`} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="text-xl font-black text-blue-500/40 uppercase tracking-tighter">
                          {team.name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow overflow-hidden">
                      <h4 className="text-white font-black uppercase tracking-tight truncate text-lg">{team.name}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold">
                          <Coins size={12} /> ₹{team.budgetTotal.toLocaleString("en-IN")}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-black uppercase tracking-tighter">
                          <UserCheck size={12} /> {team._count?.players || 0} Drafted
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingTeam(team);
                          setIsTeamModalOpen(true);
                        }}
                        className="p-3 bg-white/5 hover:bg-blue-600 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg"
                      >
                        <FileEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="p-3 bg-white/5 hover:bg-red-600 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {teams.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-600 border-2 border-dashed border-white/5 rounded-3xl">
                    <Users size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-sm">No teams drafted yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PLAYERS */}
          {activeTab === "players" && (
            <div className="space-y-6">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">Player Inventory</h3>
                  <p className="text-slate-500 text-sm font-medium">Add, edit, or filter your available bidding pool.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <select
                    value={playerFilter}
                    onChange={e => setPlayerFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 focus:outline-none focus:border-blue-500 flex-grow md:flex-grow-0"
                  >
                    <option value="all">Pool: ALL</option>
                    <option value="AVAILABLE">Status: AVAILABLE</option>
                    <option value="SOLD">Status: SOLD</option>
                    <option value="UNSOLD">Status: UNSOLD</option>
                    <option value="PENDING">Status: PENDING</option>
                  </select>
                  <button
                    onClick={() => {
                      setManualPlayer({ ...manualPlayer, basePrice: settings.minBidAmount || 1000 });
                      setIsPlayerModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg text-xs uppercase tracking-widest"
                  >
                    <Plus size={18} /> Manual Add
                  </button>
                </div>
              </header>

              {/* Database Search Section - Always Visible */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-purple-600/5">
                <div className="flex items-center gap-3 mb-4">
                  <Search size={18} className="text-purple-400" />
                  <h4 className="text-white font-black text-sm uppercase tracking-tight">Database Search</h4>
                </div>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all font-medium"
                      value={playerSearchQuery}
                      onChange={e => setPlayerSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearchDb()}
                    />
                  </div>
                  <button
                    onClick={handleSearchDb}
                    disabled={isDbSearching}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-black px-6 py-3 rounded-xl transition-all disabled:opacity-50 min-w-[120px]"
                  >
                    {isDbSearching ? <Loader2 className="animate-spin" size={18} /> : "SEARCH"}
                  </button>
                </div>

                {dbResults.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 animate-in slide-in-from-top-2 duration-300">
                    {dbResults.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold text-xs uppercase">
                            {user.firstName[0]}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-white text-[10px] font-black uppercase tracking-tight truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-slate-500 text-[10px] font-mono truncate">{user.email} • {user.phone || 'No Phone'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddFromDb(user)}
                          className="bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-900/20"
                        >
                          ADD
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                {players
                  .filter(p => playerFilter === "all" || p.status === playerFilter)
                  .map(player => {
                    const isApprovedValue = (player as any).user?.isApproved !== false;
                    return (
                      <div key={player.id} className={`glass-panel p-4 rounded-2xl border transition-all flex items-center gap-4 group hover:bg-white/10 ${!isApprovedValue ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'
                        }`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm relative ${player.status === 'SOLD' ? 'bg-emerald-500/20 text-emerald-500' :
                          player.status === 'UNSOLD' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                          }`}>
                          {player.name[0]}
                          {!isApprovedValue && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border border-[#0a0f1d]" title="Pending Admin Approval">
                              <ShieldAlert size={10} />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-bold">{player.name}</h4>
                            <span className="bg-white/5 text-slate-500 text-[10px] px-1.5 py-0.5 rounded border border-white/5 font-black uppercase">{player.category}</span>
                            {!isApprovedValue && (
                              <span className="bg-red-500/20 text-red-400 text-[8px] px-1.5 py-0.5 rounded-full border border-red-500/20 font-black tracking-widest uppercase">PENDING APPROVAL</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-0.5">
                            <span className="text-[10px] font-mono text-emerald-400/70 font-bold tracking-tighter">Base: ₹{player.basePrice.toLocaleString()}</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${player.status === 'SOLD' ? 'bg-emerald-500/10 text-emerald-500' :
                              player.status === 'UNSOLD' ? 'bg-red-500/10 text-red-500' :
                                player.status === 'AVAILABLE' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700 text-slate-400'
                              }`}>{player.status}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingPlayer(player);
                              setIsPlayerModalOpen(true);
                            }}
                            className="p-2 border border-white/10 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-white/5 transition-all"
                          >
                            <FileEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
                            className="p-2 border border-white/10 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {players.length === 0 && (
                  <div className="py-20 text-center text-slate-700 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-3xl">
                    <AlertCircle size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-xs">No players registered.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* TAB 4: STAFF */}
          {activeTab === "staff" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">Management Staff</h3>
                  <p className="text-slate-500 text-sm font-medium">Add trusted operators to help you manage the live auction.</p>
                </div>
              </div>

              {/* Add Staff Search */}
              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-blue-600/5">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="text-blue-500" size={24} />
                  <h4 className="text-white font-black text-lg uppercase tracking-tight">Add New Manager</h4>
                </div>

                <div className="flex gap-2 group">
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                      type="text"
                      placeholder="Search by exact email address..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-bold placeholder:font-medium placeholder:text-slate-700"
                      value={searchEmail}
                      onChange={e => setSearchEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearchUser()}
                    />
                  </div>
                  <button
                    onClick={handleSearchUser}
                    disabled={isSearching}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
                  >
                    {isSearching ? <Loader2 className="animate-spin" size={20} /> : "FIND USER"}
                  </button>
                </div>

                {foundUser && (
                  <div className="mt-8 p-6 bg-white/5 border border-blue-500/30 rounded-2xl animate-in slide-in-from-top-4 duration-500 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">
                        {foundUser.firstName[0]}
                      </div>
                      <div>
                        <p className="text-white font-black uppercase text-sm tracking-tight">{foundUser.firstName} {foundUser.lastName}</p>
                        <p className="text-slate-500 text-xs font-mono">{foundUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleAddOperator}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl transition-all shadow-xl text-xs uppercase tracking-widest">
                      Grant Access
                    </button>
                  </div>
                )}
              </div>

              {/* Staff List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {operators.map(op => (
                  <div key={op.id} className="glass-panel p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 font-bold">
                        {op.user.firstName[0]}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-white text-xs font-black uppercase tracking-tight truncate">{op.user.firstName} {op.user.lastName}</p>
                        <p className="text-slate-600 text-[10px] truncate font-mono">{op.user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveOperator(op.user.id)}
                      className="p-2 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ─────────────────────────────────────────── */}

      {/* Team Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-md bg-[#0a0f1d] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative">
            <button onClick={() => setIsTeamModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
            <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
              <Plus className="text-blue-500" /> {editingTeam?.id ? 'Edit Participant' : 'New Entry'}
            </h3>
            <div className="space-y-6">
              {/* Logo Preview Logic */}
              <div className="flex flex-col items-center gap-4 mb-2">
                <div className="relative group">
                  <div className={`w-28 h-28 rounded-3xl overflow-hidden border-2 border-dashed transition-all flex items-center justify-center p-1 bg-white/5 ${teamLogoFile || editingTeam?.logoUrl ? 'border-blue-500/50' : 'border-white/10 group-hover:border-blue-500/30'}`}>
                    {(teamLogoFile || editingTeam?.logoUrl) ? (
                      <img
                        src={teamLogoFile ? URL.createObjectURL(teamLogoFile) : `${API_URL}${editingTeam?.logoUrl}`}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="text-center">
                        {editingTeam?.name ? (
                          <div className="text-4xl font-black text-blue-500/40 uppercase tracking-tighter">
                            {editingTeam.name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2)}
                          </div>
                        ) : (
                          <UploadCloud className="text-slate-700 mx-auto" size={32} />
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    id="team-logo-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setTeamLogoFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="team-logo-upload"
                    className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl shadow-lg cursor-pointer transition-all hover:scale-110 active:scale-95"
                  >
                    <FileEdit size={16} />
                  </label>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Brand Mark / Poster</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Challengers"
                  value={editingTeam?.name || ""}
                  onChange={e => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-blue-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operating Budget</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">₹</span>
                  <input
                    type="number"
                    value={editingTeam?.budgetTotal || 0}
                    onChange={e => setEditingTeam({ ...editingTeam, budgetTotal: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-white font-mono font-bold"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveTeam}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : (editingTeam?.id ? 'Update Team' : 'Enroll Team')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Modal */}
      {isPlayerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-lg bg-[#0a0f1d] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => {
              setIsPlayerModalOpen(false);
              setEditingPlayer(null);
              setManualPlayer({ firstName: "", lastName: "", email: "", phone: "", category: "Batsman", basePrice: 1000 });
            }} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tight flex items-center gap-3">
              <UserPlus className="text-emerald-500" /> {editingPlayer?.id ? 'Edit Profile' : 'New Roster Entry'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {editingPlayer ? (
                // EDIT MODE
                <>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      value={editingPlayer?.name || ""}
                      onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                    <select
                      value={editingPlayer?.category || "Batsman"}
                      onChange={e => setEditingPlayer({ ...editingPlayer, category: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold appearance-none [color-scheme:dark]"
                    >
                      <option>Batsman</option>
                      <option>Bowler</option>
                      <option>All-Rounder</option>
                      <option>Wicket-Keeper</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Value (₹)</label>
                    <input
                      type="number"
                      value={editingPlayer?.basePrice || 0}
                      onChange={e => setEditingPlayer({ ...editingPlayer, basePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                    <select
                      value={editingPlayer?.status || "AVAILABLE"}
                      onChange={e => setEditingPlayer({ ...editingPlayer, status: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold appearance-none [color-scheme:dark]"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="SOLD">SOLD</option>
                      <option value="UNSOLD">UNSOLD</option>
                      <option value="SKIPPED">SKIPPED</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jersey #</label>
                    <input
                      type="number"
                      value={editingPlayer?.number || ""}
                      onChange={e => setEditingPlayer({ ...editingPlayer, number: parseInt(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold"
                    />
                  </div>
                </>
              ) : (
                // MANUAL ADD MODE (Create User + Link)
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">First Name</label>
                    <input
                      type="text"
                      value={manualPlayer.firstName}
                      onChange={e => setManualPlayer({ ...manualPlayer, firstName: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Name</label>
                    <input
                      type="text"
                      value={manualPlayer.lastName}
                      onChange={e => setManualPlayer({ ...manualPlayer, lastName: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address (Primary Identity)</label>
                    <input
                      type="email"
                      value={manualPlayer.email}
                      onChange={e => setManualPlayer({ ...manualPlayer, email: e.target.value })}
                      placeholder="e.g. player@example.com"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone Number</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={manualPlayer.phone}
                      onChange={e => setManualPlayer({ ...manualPlayer, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="10-digit number"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                    <select
                      value={manualPlayer.category}
                      onChange={e => setManualPlayer({ ...manualPlayer, category: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold appearance-none [color-scheme:dark]"
                    >
                      <option>Batsman</option>
                      <option>Bowler</option>
                      <option>All-Rounder</option>
                      <option>Wicket-Keeper</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initial Base Price (₹)</label>
                    <input
                      type="number"
                      value={manualPlayer.basePrice}
                      onChange={e => setManualPlayer({ ...manualPlayer, basePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono font-bold"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={editingPlayer ? handleSavePlayer : handleCreateManualPlayer}
              disabled={saving}
              className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : (editingPlayer ? "Update Roster" : "Create Account & Add")}
            </button>
            {!editingPlayer && (
              <p className="mt-4 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                Account will be created as "Pending Approval"
              </p>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal />
    </div>
  );
}
