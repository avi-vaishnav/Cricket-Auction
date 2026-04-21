"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;

export default function Login() {
  const router = useRouter();
  const { user, token, login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && token && user) {
      if (user.role === "ADMIN") {
        router.replace("/dashboard");
      } else {
        router.replace("/auctions");
      }
    }
  }, [user, token, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase().replace(/\s/g, ''),
          password
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid email or password");
      }

      const data = await res.json();

      // Use AuthContext to manage login state
      login(data.access_token, data.user as User);

      // Routing is now handled by the useEffect above or manually here
      if (data.user.role === "ADMIN") {
        router.replace("/dashboard");
      } else {
        router.replace("/auctions");
      }
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(`Cannot reach the backend server at ${API_URL}. Please ensure the backend is started.`);
      } else {
        const message = err instanceof Error ? err.message : "Login failed. Please try again.";
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#030712] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 backdrop-blur-md">
        <ArrowLeft size={18} /> <span className="font-medium text-sm">Return Home</span>
      </Link>

      <div className="glass-panel p-10 rounded-[2rem] w-full max-w-md z-10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border-t border-white/10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 mb-6 border border-white/5 shadow-inner">
            <Lock size={28} className="text-blue-400" />
          </div>
          <h2 className="text-4xl font-black mb-3">Welcome Back</h2>
          <p className="text-slate-400 text-lg">Sign in to your command center</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="group">
            <label className="block text-sm font-semibold text-slate-300 mb-2 group-focus-within:text-blue-400 transition-colors">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input
                type="email"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                placeholder="admin@avproauction.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="group mb-2">
            <div className="flex justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-300 group-focus-within:text-blue-400 transition-colors">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-2 transition-all flex justify-center items-center gap-2 group shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Authenticating...
              </>
            ) : (
              <>Sign In <ArrowLeft size={18} className="rotate-180 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>

          <div className="text-center mt-6">
            <p className="text-slate-500 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-all">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
