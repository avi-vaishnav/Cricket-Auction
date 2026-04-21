"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { User, ChevronDown, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";

export function Header() {
  const { user, logout, refreshUser, token } = useAuth();

  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, [token]);

  if (!user) return null;

  return (
    <div className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-lg flex items-center justify-end px-8 sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <button className="text-slate-400 hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" />
        </button>

        <div className="h-8 w-px bg-white/10" />

        <div className="flex items-center gap-4 py-2 px-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-white leading-none mb-1">{user.firstName} {user.lastName}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{user.role}</div>
          </div>
          
          <div className="h-10 w-10 rounded-full border border-white/10 overflow-hidden bg-slate-800 shrink-0">
            <img 
              src={user.photoUrl || DEFAULT_AVATAR} 
              alt="Profile" 
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
