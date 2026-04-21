"use client";
import { useState, useEffect, useRef } from "react";
import { User as UserIcon, Mail, Camera, Save, Phone, Tag, Loader2, CheckCircle2, AlertCircle, Crown, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { User } from "@/types";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;
const DEFAULT_AVATAR = "https://avatar.iran.liara.run/public/boy?username=Cricketer";

export default function ProfilePage() {
  const { user: authUser, refreshUser, token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    category: "",
  });

  useEffect(() => {
    if (authUser) {
      setFormData({
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        phone: authUser.phone || "",
        category: authUser.category || "",
      });
      setPreviewUrl(authUser.photoUrl ? (authUser.photoUrl.startsWith("http") ? authUser.photoUrl : `${API_URL}${authUser.photoUrl}`) : null);
    }
  }, [authUser]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Image size must be less than 1MB");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Auto-save image when selected for better UX, or just keep it in form?
    // User said "if clicks on Edit icon then photo update flow should work".
    // I'll keep it as is (requires Commit Update) but I've split the trigger.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const data = new FormData();
      data.append("firstName", formData.firstName);
      data.append("lastName", formData.lastName);
      data.append("phone", formData.phone);
      data.append("category", formData.category);
      if (selectedFile) {
        data.append("photo", selectedFile);
      }

      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: data
      });

      if (res.ok) {
        setSuccess(true);
        await refreshUser();
        setSelectedFile(null);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update profile");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = authUser?.role === "ADMIN";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#050505] p-4 md:p-10 relative overflow-hidden">
        {/* Decorative background glows */}
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[150px] rounded-full pointer-events-none ${isAdmin ? "bg-amber-500/10" : "bg-blue-600/10"}`} />
        <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] blur-[150px] rounded-full pointer-events-none ${isAdmin ? "bg-purple-600/10" : "bg-emerald-600/10"}`} />

        <div className="max-w-5xl mx-auto z-10 relative">
          {authUser && (
            <div className="flex flex-col gap-8">
              {/* Profile Overview Header */}
              <div className={`glass-panel p-6 md:p-10 rounded-[2.5rem] border ${isAdmin ? "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent shadow-[0_0_50px_-12px_rgba(245,158,11,0.15)]" : "border-white/10"}`}>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group">
                    <div
                      onClick={() => setIsViewModalOpen(true)}
                      className={`h-40 w-40 rounded-full border-4 cursor-zoom-in ${isAdmin ? "border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)] anim-glow-gold" : "border-white/10 shadow-2xl"} overflow-hidden bg-slate-800 transition-transform hover:scale-105 relative`}
                    >
                      <img
                        src={previewUrl || DEFAULT_AVATAR}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold uppercase tracking-widest">View Photo</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className={`absolute bottom-2 right-2 h-10 w-10 ${isAdmin ? "bg-amber-500" : "bg-blue-600"} rounded-full flex items-center justify-center text-white border-2 border-[#050505] shadow-xl hover:scale-110 transition-transform z-10`}
                      title="Update Photo"
                    >
                      <Camera size={18} />
                    </button>
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageChange} />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
                        {authUser.firstName} {authUser.lastName}
                      </h1>
                      {isAdmin ? (
                        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-black rounded-full font-black text-xs tracking-widest animate-pulse shadow-lg shadow-amber-500/40">
                          <Crown size={14} /> SUPER ADMIN
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-xs tracking-widest uppercase">
                          <ShieldCheck size={14} /> AUTHORIZED MEMBER
                        </div>
                      )}
                    </div>
                    <p className="text-slate-400 text-lg flex items-center justify-center md:justify-start gap-2 mb-6">
                      <Mail size={18} className="text-slate-600" /> {authUser.email}
                    </p>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <div className="bg-white/5 border border-white/5 px-6 py-2 rounded-2xl">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-0.5">Role</span>
                        <span className="text-white font-black text-sm uppercase">{authUser.role}</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 px-6 py-2 rounded-2xl">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-0.5">Credits</span>
                        <span className="text-white font-mono text-sm">{authUser.auctionLimit ?? "0"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name Box */}
                  <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl transition-all focus-within:border-blue-500/50 group">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                      <UserIcon size={14} /> First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-transparent text-xl font-bold text-white focus:outline-none placeholder:text-slate-700"
                      required
                    />
                  </div>

                  {/* Last Name Box */}
                  <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl transition-all focus-within:border-blue-500/50 group">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                      <UserIcon size={14} /> Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-transparent text-xl font-bold text-white focus:outline-none placeholder:text-slate-700"
                      required
                    />
                  </div>

                  {/* Phone Box */}
                  <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl transition-all focus-within:border-blue-500/50 group">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                      <Phone size={14} /> Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-transparent text-xl font-bold text-white focus:outline-none placeholder:text-slate-700"
                    />
                  </div>

                  {/* Category Box */}
                  <div className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl transition-all focus-within:border-blue-500/50 group">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                      <Tag size={14} /> Category / Designation
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Lead Auctioneer"
                      className="w-full bg-transparent text-xl font-bold text-white focus:outline-none placeholder:text-slate-700"
                    />
                  </div>
                </div>

                {/* Submit Section */}
                <div className="pt-8 flex flex-col items-center gap-6">
                  <div className="min-h-[24px]">
                    {success && (
                      <div className="flex items-center gap-2 text-emerald-400 font-bold animate-in zoom-in-95 fade-in">
                        <CheckCircle2 size={18} /> Configuration successfully updated
                      </div>
                    )}
                    {error && (
                      <div className="flex items-center gap-2 text-red-400 font-bold animate-in zoom-in-95 fade-in">
                        <AlertCircle size={18} /> {error}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className={`w-full max-w-md ${isAdmin ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20" : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"} text-black font-black py-5 rounded-2xl transition-all shadow-[0_0_30px_-5px] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm active:scale-95 disabled:opacity-50`}
                  >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {saving ? "Processing..." : "Update"}
                  </button>
                  <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Maximum file size allowed: 1MB</p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Photo View Modal */}
      {isViewModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsViewModalOpen(false)}
        >
          <div className="relative max-w-2xl w-full flex items-center justify-center">
            <button
              className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors"
              onClick={() => setIsViewModalOpen(false)}
            >
              <CircleIcon icon={X} />
            </button>
            <img
              src={previewUrl || DEFAULT_AVATAR}
              alt="Full Profile"
              className="max-h-[80vh] w-auto rounded-2xl shadow-2xl border border-white/10 ring-1 ring-white/20 animate-in zoom-in-95 duration-300"
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes glow-gold {
          0%, 100% { border-color: rgba(245, 158, 11, 0.5); box-shadow: 0 0 20px rgba(245, 158, 11, 0.2); }
          50% { border-color: rgba(245, 158, 11, 1); box-shadow: 0 0 40px rgba(245, 158, 11, 0.4); }
        }
        .anim-glow-gold {
          animation: glow-gold 3s infinite ease-in-out;
        }
      `}</style>
    </ProtectedRoute>
  );
}

function CircleIcon({ icon: Icon }: { icon: any }) {
  return (
    <div className="bg-white/10 p-2 rounded-full border border-white/20 hover:bg-white/20 transition-all">
      <Icon size={24} />
    </div>
  );
}
