"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, QrCode, MonitorPlay, ArrowRight } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinViewer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedCode) {
      setError("Please enter a valid auction code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auctions/code/${trimmedCode}`);
      
      if (res.status === 404) {
        setError("Invalid auction code. No auction found.");
        setIsLoading(false);
        return;
      }
      
      const auction = await res.json();
      
      if (auction.status === "UPCOMING") {
        setError("This auction hasn't started yet.");
        setIsLoading(false);
        return;
      }
      
      router.push(`/live/${trimmedCode}`);
    } catch (err) {
      setError("Failed to verify code. Please check your connection.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-[#030712] overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="z-10 text-center mb-16 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-blue-400 mb-8 backdrop-blur-sm shadow-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Live Platform v2.0
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
          AV Pro <span className="text-gradient">Auction</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          The ultimate real-time player auction platform. Experience seamless bidding, effortless management, and instant live updates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl z-10">

        {/* Spectator Card */}
        <div className="glass-panel p-10 rounded-3xl flex flex-col items-center text-center group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] transition-all duration-500">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 flex items-center justify-center mb-8 text-blue-400 group-hover:scale-110 group-hover:text-blue-300 shadow-lg border border-blue-500/20 transition-all duration-500">
            <MonitorPlay size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Spectator View</h2>
          <p className="text-slate-400 mb-8 flex-grow leading-relaxed">
            Enter your unique auction code below to join the live audience pool instantly and watch the action unfold.
          </p>
          <form onSubmit={handleJoinViewer} className="w-full flex gap-3 flex-col xl:flex-row">
            <input
              type="text"
              placeholder="Code (e.g. IPL24)"
              className="w-full xl:flex-grow bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-center xl:text-left focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all uppercase text-lg shadow-inner placeholder:normal-case min-w-0"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button type="submit" disabled={isLoading} className="w-full xl:w-auto xl:flex-shrink-0 bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-bold transition-all text-white flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] hover:shadow-[0_0_25px_-5px_rgba(37,99,235,0.7)] group disabled:opacity-70 disabled:cursor-not-allowed">
              {isLoading ? "Joining..." : <>Join <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>
          {error && <div className="w-full mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold text-center">{error}</div>}
        </div>

        {/* Admin Card */}
        <div className="glass-panel p-10 rounded-3xl flex flex-col items-center text-center group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />

          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center mb-8 text-emerald-400 group-hover:scale-110 group-hover:text-emerald-300 shadow-lg border border-emerald-500/20 transition-all duration-500">
            <LogIn size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Admin Portal</h2>
          <p className="text-slate-400 mb-8 flex-grow leading-relaxed">
            Conduct live auctions, manage team budgets, and control the entire player roster from your command center.
          </p>
          <Link href="/login" className="w-full">
            <button className="w-full font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-3 glass-button hover:border-white/20">
              Sign In to Dashboard
            </button>
          </Link>
        </div>
      </div>

      <footer className="mt-12 mb-4 text-sm text-slate-600 tracking-wider font-medium z-10 text-center">
        © {new Date().getFullYear()} AV PRO AUCTION PLATFORM
      </footer>
    </main>
  );
}
