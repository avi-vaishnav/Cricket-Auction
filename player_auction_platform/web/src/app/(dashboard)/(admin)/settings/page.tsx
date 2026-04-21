"use client";
import { useState, useEffect } from "react";
import { Save, AlertCircle, Loader2 } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    loginEnabled: true,
    signupEnabled: true,
    defaultAuctionLimit: 1
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { confirm, ConfirmationModal } = useConfirm();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/admin/settings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings({
            loginEnabled: data.loginEnabled,
            signupEnabled: data.signupEnabled,
            defaultAuctionLimit: data.defaultAuctionLimit
          });
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    confirm({
      title: "Confirm Settings Override",
      message: "Are you sure you want to apply these global settings? Changes to login/signup take effect immediately.",
      confirmText: "Yes, Override Defaults",
      onConfirm: async () => {
        setSaving(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/admin/settings`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(settings)
          });
          if (res.ok) {
            alert("Settings saved successfully!");
          } else {
            throw new Error("Failed to save settings");
          }
        } catch (err) {
          alert("Error saving settings. Please try again.");
          console.error(err);
        } finally {
          setSaving(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={40} />
        <p className="font-medium">Loading platform configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-4xl">
      <h2 className="text-4xl font-extrabold mb-8 text-white">Global Settings</h2>

      <div className="glass-panel p-8 rounded-2xl border border-white/10 mb-8">
        <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Access Rules</h3>

        <div className="flex flex-col gap-6">
          <label className="flex items-center justify-between text-slate-300">
            <div>
              <div className="font-semibold text-white text-lg">Enable Login</div>
              <div className="text-sm">Allow users to log into the platform. Disable for maintenance.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.loginEnabled}
              onChange={e => setSettings({ ...settings, loginEnabled: e.target.checked })}
              className="w-6 h-6 rounded border-white/20 bg-black/50 accent-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300">
            <div>
              <div className="font-semibold text-white text-lg">Enable Signup</div>
              <div className="text-sm">Allow new auctioneers to register.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.signupEnabled}
              onChange={e => setSettings({ ...settings, signupEnabled: e.target.checked })}
              className="w-6 h-6 rounded border-white/20 bg-black/50 accent-emerald-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-white/10 mb-8">
        <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Auctioneer Quotas</h3>

        <div className="flex flex-col gap-6">
          <label className="flex flex-col gap-2 text-slate-300">
            <div>
              <div className="font-semibold text-white text-lg">Default Auction Limit</div>
              <div className="text-sm">The default number of auctions a newly registered user can create.</div>
            </div>
            <input
              type="number" min="0"
              value={settings.defaultAuctionLimit}
              onChange={e => setSettings({ ...settings, defaultAuctionLimit: parseInt(e.target.value) || 0 })}
              className="mt-2 bg-black/50 border border-white/10 rounded-xl p-4 text-white max-w-[200px] focus:outline-none focus:border-blue-500 font-mono text-xl"
            />
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 group active:scale-95"
      >
        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
        {saving ? "Saving Changes..." : "Apply Global Settings"}
      </button>

      <div className="mt-8 flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <AlertCircle className="text-blue-400 mt-1 shrink-0" size={20} />
        <p className="text-sm text-blue-200/70">
          <strong>Note:</strong> Settings are persisted globally. Disabling signup will prevent anyone from reaching the registration page, while disabling login will instantly block all non-admin sessions.
        </p>
      </div>

      <ConfirmationModal />
    </div>
  );
}
