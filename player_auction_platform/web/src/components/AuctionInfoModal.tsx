"use client";
import React from "react";
import { X, Users, Trophy, Wallet, Calculator, User as UserIcon, Hash, Target, Settings2 } from "lucide-react";

interface AuctionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  data: {
    name: string;
    code: string;
    logo?: string;
    ownerName: string;
    stats: {
      totalPlayers: number;
      totalTeams: number;
      totalBudget: number;
    };
    settings: {
      minBidAmount: number;
      maxBidAmount: number | null;
      maxTeams: number;
    };
  };
}

export function AuctionInfoModal({ isOpen, onClose, onDelete, data }: AuctionInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="bg-[#0f1115] border border-white/10 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="relative p-8 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-slate-800 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
              {data.logo ? (
                <img src={data.logo} alt="Auction Logo" className="h-full w-full object-cover" />
              ) : (
                <Trophy className="text-slate-600" size={32} />
              )}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-1 leading-tight truncate">{data.name}</h2>
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg text-xs font-mono font-bold border border-blue-500/20 uppercase tracking-widest">
                  {data.code}
                </span>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                  <UserIcon size={14} /> Created by <span className="text-slate-300">{data.ownerName}</span>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 pt-4 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard 
              icon={<Users className="text-blue-400" size={18} />}
              label="Total Teams"
              value={data.stats.totalTeams.toString()}
            />
            <StatCard 
              icon={<Target className="text-emerald-400" size={18} />}
              label="Player Pool"
              value={data.stats.totalPlayers.toString()}
            />
            <StatCard 
              icon={<Wallet className="text-amber-400" size={18} />}
              label="Total Auction Budget"
              value={`₹${data.stats.totalBudget.toLocaleString("en-IN")}`}
              fullWidth
            />
          </div>

          {/* Rules / Settings */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings2 size={14} /> Auction Rulebook
            </h3>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <RuleItem 
                label="Minimum Bid"
                value={`₹${data.settings.minBidAmount.toLocaleString("en-IN")}`}
              />
              <RuleItem 
                label="Maximum Bid"
                value={data.settings.maxBidAmount ? `₹${data.settings.maxBidAmount.toLocaleString("en-IN")}` : "No Limit"}
              />
              <RuleItem 
                label="Max Teams Allowed"
                value={data.settings.maxTeams.toString()}
              />
              <RuleItem 
                label="Currency"
                value="INR (₹)"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          {onDelete ? (
            <button 
              onClick={onDelete}
              className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={18} /> Delete Auction
            </button>
          ) : <div />}
          
          <button 
            onClick={onClose}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-xl transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, fullWidth = false }: { icon: React.ReactNode, label: string, value: string, fullWidth?: boolean }) {
  return (
    <div className={`p-5 rounded-2xl bg-white/[0.03] border border-white/5 ${fullWidth ? "col-span-2 md:col-span-1" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold text-white truncate">{value}</div>
    </div>
  );
}

function RuleItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/[0.03] pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-bold text-white uppercase tracking-tight">{value}</span>
    </div>
  );
}
