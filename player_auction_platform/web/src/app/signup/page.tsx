"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, User as UserIcon, Phone, ArrowLeft, Loader2, Image as ImageIcon, ChevronDown, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;

export default function Signup() {
  const router = useRouter();
  const { user, token, login, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    category: "",
    photoUrl: ""
  });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.category) {
      setError("Please select a player category");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: formData.email.trim().toLowerCase().replace(/\s/g, '')
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Use AuthContext to manage login state
      login(data.access_token, data.user as User);

      // Route based on role
      if (data.user.role === "ADMIN") {
        router.replace("/dashboard");
      } else {
        router.replace("/auctions");
      }
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(`Cannot reach the backend server at ${API_URL}. Please ensure the backend is started.`);
      } else {
        const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
        const errMsg = Array.isArray(message) ? message[0] : message;
        setError(errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-6 bg-[#030712] relative overflow-x-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      <Link
        href="/login"
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 backdrop-blur-md z-20">
        <ArrowLeft size={18} /> <span className="font-medium text-sm">Back to Login</span>
      </Link>

      <div className="glass-panel p-10 rounded-[2rem] w-full max-w-2xl z-10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border-t border-white/10 relative mt-12 mb-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/10 mb-6 border border-white/5 shadow-inner">
            <UserPlus size={28} className="text-purple-400" />
          </div>
          <h2 className="text-4xl font-black mb-3">Create Your Profile</h2>
          <p className="text-slate-400 text-lg">Join the platform and participate in auctions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="group">
              <label className="block text-sm font-semibold text-slate-300 mb-2 group-focus-within:text-purple-400 transition-colors">First Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                <input
                  name="firstName"
                  type="text"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                  placeholder="Virat"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-slate-300 mb-2 group-focus-within:text-purple-400 transition-colors">Last Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                <input
                  name="lastName"
                  type="text"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                  placeholder="Kohli"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-slate-300 mb-2 group-focus-within:text-purple-400 transition-colors">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
              <input
                name="email"
                type="email"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                placeholder="player@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="group">
              <label className="block text-sm font-semibold text-slate-300 mb-2 group-focus-within:text-purple-400 transition-colors">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                <input
                  name="phone"
                  type="tel"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-slate-300 mb-2 focus-within:text-purple-400 transition-colors">Player Category</label>
              <div className="relative">
                <select
                  name="category"
                  className="w-full bg-[#0a0f1a] border border-white/10 rounded-xl px-4 py-[15px] text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner appearance-none custom-select cursor-pointer"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select Category...</option>
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All Rounder">All Rounder</option>
                  <option value="WK Batsman">WK Batsman</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within:text-purple-400 transition-colors" size={20} />
              </div>
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-slate-300 mb-2 group-focus-within:text-purple-400 transition-colors">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
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

          <div className="group mb-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2 group-focus-within:text-purple-400 transition-colors">Profile Image URL (Optional)</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={20} />
              <input
                name="photoUrl"
                type="url"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                placeholder="https://example.com/avatar.jpg"
                value={formData.photoUrl}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 group shadow-[0_0_20px_-5px_rgba(147,51,234,0.4)] disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Registering...
              </>
            ) : (
              <>Create Account <ArrowLeft size={18} className="rotate-180 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>

          <div className="text-center mt-2">
            <p className="text-slate-400 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-400 hover:text-blue-300 font-bold hover:underline transition-all">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
        }
      `}} />
    </div>
  );
}
