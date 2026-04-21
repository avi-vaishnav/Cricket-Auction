"use client";
import { useState, useEffect, useCallback } from "react";
import { Shield, Ban, CheckCircle, Search, UserPlus, X, Loader2, Mail, Phone, Lock, Hash, ChevronDown, Eye, EyeOff, ShieldAlert, Clock } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import { User } from "@/types";

import { API_BASE_URL } from "@/lib/api";

const API_URL = API_BASE_URL;

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    category: "",
    password: "",
    auctionLimit: 0,
    role: "USER"
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [showPendingOnly, setShowPendingOnly] = useState(false);
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error("API Error Response:", res.status, res.statusText);
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Network or Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleActive = (id: string, current: boolean) => {
    confirm({
      title: current ? "Disable User Account" : "Enable User Account",
      message: current
        ? "Are you sure you want to disable this user? They will instantly lose access."
        : "Are you sure you want to reactivate this user? They will regain full access instantly.",
      confirmText: current ? "Yes, Disable" : "Yes, Enable",
      isDestructive: current,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await fetch(`${API_URL}/admin/users/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ isActive: !current })
          });
          fetchUsers();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/addUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newUser,
          email: newUser.email.trim().toLowerCase().replace(/\s/g, '')
        })
      });
      if (!res.ok) throw new Error("Failed to create user");

      setIsModalOpen(false);
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        category: "",
        password: "",
        auctionLimit: 0,
        role: "USER"
      });
      fetchUsers();
    } catch (err) {
      alert("Error creating user. Make sure email is unique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveUser = async (id: string) => {
    confirm({
      title: "Approve User",
      message: "This will activate the user account and allow them to participate in auctions.",
      confirmText: "Approve Now",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/admin/users/${id}/approve`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Approval failed");
          fetchUsers();
        } catch (err) {
          alert("Approval failed");
        }
      }
    });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          email: editingUser.email.trim().toLowerCase().replace(/\s/g, ''),
          phone: editingUser.phone,
          category: editingUser.category,
          auctionLimit: editingUser.auctionLimit,
          role: editingUser.role,
          password: (editingUser as User & { password?: string }).password // Include password for reset
        })
      });
      if (!res.ok) throw new Error("Failed to update user");

      setEditingUser(null);
      fetchUsers();
    } catch (err: unknown) {
      console.error(err);
      alert("Error updating user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchStr = `${user.firstName} ${user.lastName} ${user.email} ${user.phone || ""}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = showPendingOnly ? (user as any).isApproved === false : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-extrabold mb-2 text-white">User Management</h2>
          <p className="text-slate-400 text-lg">Manage auctioneers, system limits, and access controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPendingOnly(!showPendingOnly)}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border ${
              showPendingOnly 
              ? 'bg-amber-600/20 border-amber-500/50 text-amber-400' 
              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            <ShieldAlert size={20} /> {showPendingOnly ? 'Showing Pending' : 'Approve Users'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
          >
            <UserPlus size={20} /> Add User
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Search by name, email, or phone number..."
          className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all text-lg shadow-inner"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/10 text-xs uppercase tracking-widest">
                <th className="p-6 font-bold text-slate-500">User</th>
                <th className="p-6 font-bold text-slate-500">Role & Status</th>
                <th className="p-6 font-bold text-slate-500">Category</th>
                <th className="p-6 font-bold text-slate-500">Auctions (Used / Limit)</th>
                <th className="p-6 font-bold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-500">
                    <Loader2 size={40} className="animate-spin mx-auto mb-4 text-blue-500" />
                    Fetching user records...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6">
                      <div className="font-bold text-lg text-white mb-1">{user.firstName} {user.lastName}</div>
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-slate-500 font-mono flex items-center gap-2"><Mail size={12} /> {user.email}</div>
                        {user.phone && <div className="text-sm text-slate-500 font-mono flex items-center gap-2"><Phone size={12} /> {user.phone}</div>}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold leading-none border ${user.role === 'ADMIN' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
                          <Shield size={12} /> {user.role === 'ADMIN' ? 'SUPER ADMIN' : 'NORMAL USER'}
                        </span>
                        {(user as any).isApproved === false ? (
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 bg-amber-500/5 rounded">
                             <Clock size={10} /> Pending
                           </span>
                        ) : user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-emerald-400 text-xs font-semibold">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-red-400 text-xs font-semibold">
                            <Ban size={12} /> Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${user.category ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}>
                        {user.category || 'NO CATEGORY'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 bg-white/5 rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${Math.min(((user._count?.createdAuctions || 0) / user.auctionLimit) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-slate-300 font-mono text-sm leading-none">
                          {user._count?.createdAuctions || 0} / {user.auctionLimit}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        {(user as any).isApproved === false && (
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            className="px-4 py-2 rounded-xl font-black bg-amber-600 hover:bg-amber-500 text-white text-xs transition-all shadow-lg shadow-amber-900/20"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => setEditingUser(user)}
                          className="px-4 py-2 rounded-xl font-bold text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
                        >
                          Edit
                        </button>
                        {user.role !== 'ADMIN' && (user as any).isApproved !== false && (
                          <button
                            onClick={() => toggleActive(user.id, user.isActive)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border ${user.isActive
                              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                              : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                              }`}
                          >
                            {user.isActive ? "Disable" : "Enable"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-3xl font-black mb-2">Add New User</h3>
            <p className="text-slate-400 mb-8 font-medium">Create a new system user with restricted access.</p>

            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input
                      type="email"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input
                      type="tel"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Temporary Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input
                      type={showAddPassword ? "text" : "password"}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showAddPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Auction Limit</label>
                  <div className="relative">
                    <Hash className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input
                      type="number"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                      value={newUser.auctionLimit}
                      onChange={(e) => setNewUser({ ...newUser, auctionLimit: parseInt(e.target.value) || 0 })}
                      required
                      min={0}
                      max={9}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Player Category</label>
                <div className="relative group">
                  <select
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium appearance-none cursor-pointer"
                    value={newUser.category}
                    onChange={(e) => setNewUser({ ...newUser, category: e.target.value })}
                    required
                  >
                    <option value="" className="bg-slate-900" disabled>Select Category...</option>
                    <option value="Batsman" className="bg-slate-900">Batsman</option>
                    <option value="Bowler" className="bg-slate-900">Bowler</option>
                    <option value="All Rounder" className="bg-slate-900">All Rounder</option>
                    <option value="WK Batsman" className="bg-slate-900">WK Batsman</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={20} />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-8 py-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-8 py-4 rounded-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-3xl font-black mb-2">Edit User</h3>
            <p className="text-slate-400 mb-8 font-medium">Modify existing user details and permissions.</p>

            <form onSubmit={handleEditUser} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Reset Password (Optional)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input
                    type={showEditPassword ? "text" : "password"}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                    placeholder="Enter new password to reset"
                    value={editingUser.password || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                    value={editingUser.phone || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Player Category</label>
                  <div className="relative group">
                    <select
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium appearance-none cursor-pointer"
                      value={editingUser.category}
                      onChange={(e) => setEditingUser({ ...editingUser, category: e.target.value })}
                      required
                    >
                      <option value="" disabled className="bg-slate-900">Select Category...</option>
                      <option value="Batsman" className="bg-slate-900">Batsman</option>
                      <option value="Bowler" className="bg-slate-900">Bowler</option>
                      <option value="All Rounder" className="bg-slate-900">All Rounder</option>
                      <option value="WK Batsman" className="bg-slate-900">WK Batsman</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={20} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Auction Limit</label>
                  <div className="relative">
                    <Hash className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input
                      type="number"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                      value={editingUser.auctionLimit}
                      onChange={(e) => setEditingUser({ ...editingUser, auctionLimit: parseInt(e.target.value) || 0 })}
                      required
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-8 py-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-8 py-4 rounded-xl font-black bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal />
    </div>
  );
}
