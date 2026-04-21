"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, ArrowLeft, Users as UsersIcon, Plus, Edit2, Trash2, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Papa from "papaparse";
import { useConfirm } from "@/hooks/useConfirm";
import { Player } from "@/types";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;

export default function AuctionPlayers() {
  const { id } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [fetching, setFetching] = useState(true);
  const [importing, setImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [newPlayer, setNewPlayer] = useState({
    name: "",
    number: "",
    age: "",
    category: "Batsman",
    basePrice: "",
    photoUrl: ""
  });

  const { confirm, ConfirmationModal } = useConfirm();

  const fetchPlayers = useCallback(async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auctions/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch players");
      const data = await res.json();
      setPlayers(data.players || []);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedPlayers = (results.data as Record<string, string>[]).map((row) => ({
          name: row["Name"] || row["name"],
          number: row["Number"] || row["number"],
          age: row["Age"] || row["age"],
          category: row["Category"] || row["category"] || "General",
          basePrice: row["Base Price"] || row["basePrice"] || row["base_price"] || "0",
          photoUrl: row["Photo URL"] || row["photoUrl"] || "",
        })).filter((p: { name: string }) => p.name);

        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/auctioneer/auctions/${id}/players/bulk`, {
            method: 'POST',
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ players: parsedPlayers })
          });
          if (!res.ok) throw new Error("Failed to import players");
          
          fetchPlayers();
          setImporting(false);
          alert(`Successfully imported ${parsedPlayers.length} players!`);
        } catch (err: unknown) {
          console.error(err);
          setImporting(false);
          alert("Failed to sync players to server.");
        }
      },
      error: (error: Error) => {
        console.error(error);
        setImporting(false);
        alert("Failed to parse CSV file.");
      }
    });
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auctioneer/auctions/${id}/players/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          players: [{
            ...newPlayer,
            number: parseInt(newPlayer.number) || null,
            age: parseInt(newPlayer.age) || null,
            basePrice: parseFloat(newPlayer.basePrice) || 0
          }] 
        })
      });
      if (!res.ok) throw new Error("Failed to add player");

      setIsAddModalOpen(false);
      setNewPlayer({
        name: "",
        number: "",
        age: "",
        category: "Batsman",
        basePrice: "",
        photoUrl: ""
      });
      fetchPlayers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error adding player.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auctioneer/players/${editingPlayer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editingPlayer,
          number: typeof editingPlayer.number === 'string' ? parseInt(editingPlayer.number) : editingPlayer.number,
          age: typeof editingPlayer.age === 'string' ? parseInt(editingPlayer.age) : editingPlayer.age,
          basePrice: typeof editingPlayer.basePrice === 'string' ? parseFloat(editingPlayer.basePrice) : editingPlayer.basePrice
        })
      });
      if (!res.ok) throw new Error("Failed to update player");

      setEditingPlayer(null);
      fetchPlayers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error updating player.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlayer = (playerId: string) => {
    confirm({
      title: "Delete Player",
      message: "Are you sure you want to remove this player from the auction roster? This cannot be undone.",
      confirmText: "Yes, Delete",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await fetch(`${API_URL}/auctioneer/players/${playerId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          fetchPlayers();
        } catch (err: unknown) {
          console.error(err);
        }
      }
    });
  };

  const getDefaultAvatar = (category: string) => {
    // Generate a simple SVG data URI based on category text to provide an avatar
    let color = "10,20,50"; // default
    if (category.toLowerCase().includes("bat")) color = "37,99,235";   // Blue
    if (category.toLowerCase().includes("bowl")) color = "16,185,129"; // Emerald
    if (category.toLowerCase().includes("all")) color = "139,92,246";  // Purple
    if (category.toLowerCase().includes("wk")) color = "245,158,11";   // Amber

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="rgb(${color})" fill-opacity="0.2"/><circle cx="50" cy="40" r="20" fill="rgb(${color})"/><path d="M20 90 Q50 60 80 90" stroke="rgb(${color})" stroke-width="8" stroke-linecap="round" fill="none"/></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <Link href="/auctions" className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 transition-colors">
        <ArrowLeft size={20} /> Back to My Auctions
      </Link>
      
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-extrabold mb-2 text-white">Player Roster</h2>
          <p className="text-slate-400 text-lg flex items-center gap-2"><UsersIcon size={18}/> Manage athletes for Auction {id}</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            className="hidden" 
          />
          <button 
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 font-semibold px-6 py-3 rounded-xl transition-all flex items-center gap-2"
          >
            <Upload size={20} />
            {importing ? "Processing..." : "Bulk Import"}
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]"
          >
            <Plus size={20} /> Add Player
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {fetching ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
             <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
             <p className="text-xl font-medium">Fetching auction roster...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
            <UsersIcon size={48} className="mb-4 opacity-50" />
            <h3 className="text-2xl font-bold text-white mb-2">No Players Found</h3>
            <p className="max-w-md text-center">Click &quot;Add Player&quot; to manually create one, or use &quot;Bulk Import CSV&quot; to upload multiple players at once.</p>
          </div>
        ) : (
          players.map((p, i) => (
            <div key={i} className="glass-panel rounded-2xl overflow-hidden border border-white/10 group relative duration-300 hover:-translate-y-1">
              <div className="aspect-[4/3] w-full relative bg-black/40">
                {/* Fallback to generated image if photoUrl is missing */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={p.photoUrl || getDefaultAvatar(p.category ?? "")} 
                  alt={p.name} 
                  className="w-full h-full object-cover mix-blend-screen"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                  {p.category}
                </div>
                {p.number && (
                  <div className="absolute top-3 right-3 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-black text-white shadow-lg">
                    {p.number}
                  </div>
                )}
                {/* Action Buttons on Hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button 
                    onClick={() => setEditingPlayer(p)}
                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-transform hover:scale-110"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={() => handleDeletePlayer(p.id)}
                    className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full transition-transform hover:scale-110"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{p.name}</h3>
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className="text-slate-400">Age: {p.age || 'N/A'}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">Base Price</div>
                  <div className="text-lg font-black text-emerald-400">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(p.basePrice)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Player Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-8 rounded-3xl border border-white/10 shadow-2xl relative">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
            <h3 className="text-3xl font-black mb-6">Add Player</h3>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Player Name</label>
                <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Number</label>
                  <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={newPlayer.number} onChange={e => setNewPlayer({...newPlayer, number: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Age</label>
                  <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={newPlayer.age} onChange={e => setNewPlayer({...newPlayer, age: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Category</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={newPlayer.category} onChange={e => setNewPlayer({...newPlayer, category: e.target.value})}>
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All Rounder">All Rounder</option>
                  <option value="Wicket Keeper">Wicket Keeper</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Base Price</label>
                <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={newPlayer.basePrice} onChange={e => setNewPlayer({...newPlayer, basePrice: e.target.value})} required />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Create Player"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-8 rounded-3xl border border-white/10 shadow-2xl relative">
            <button onClick={() => setEditingPlayer(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
            <h3 className="text-3xl font-black mb-6">Edit Player</h3>
            <form onSubmit={handleEditPlayer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Player Name</label>
                <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={editingPlayer.name} onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Number</label>
                  <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={editingPlayer.number || ""} onChange={e => setEditingPlayer({...editingPlayer, number: e.target.value as any})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Age</label>
                  <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={editingPlayer.age || ""} onChange={e => setEditingPlayer({...editingPlayer, age: e.target.value as any})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Category</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={editingPlayer.category ?? ""} onChange={e => setEditingPlayer({...editingPlayer, category: e.target.value})}>
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All Rounder">All Rounder</option>
                  <option value="Wicket Keeper">Wicket Keeper</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Base Price</label>
                <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" value={editingPlayer.basePrice} onChange={e => setEditingPlayer({...editingPlayer, basePrice: e.target.value as any})} required />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Update Details"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal />
    </div>
  );
}
