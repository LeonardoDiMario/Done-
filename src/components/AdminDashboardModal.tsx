import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Users,
  MessageSquare,
  Zap,
  Gem,
  Crown,
  HelpCircle,
  FileText,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Lock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';
import { triggerHaptic, triggerHapticNotification } from '../utils/telegramSdk';
import { Character } from '../types';

interface AdminDashboardModalProps {
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ onClose }) => {
  const [adminKey, setAdminKey] = useState<string>(() => localStorage.getItem('rubychan_admin_key') || '');
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'users' | 'characters' | 'conversations' | 'energy' | 'gems' | 'premium' | 'support' | 'audit'>('users');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Overview Stats
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeCharacters: 0,
    totalConversations: 0,
    openTickets: 0
  });

  // Table Data States
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userPage, setUserPage] = useState<number>(1);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [energyLogs, setEnergyLogs] = useState<any[]>([]);
  const [gemsLogs, setGemsLogs] = useState<any[]>([]);
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Action Modals State
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<any | null>(null);
  const [energyDelta, setEnergyDelta] = useState<number>(50);
  const [gemsDelta, setGemsDelta] = useState<number>(10);
  const [balanceReason, setBalanceReason] = useState<string>('Admin gift / compensation');

  const [editingCharacter, setEditingCharacter] = useState<Partial<Character> | null>(null);
  const [isCharModalOpen, setIsCharModalOpen] = useState<boolean>(false);

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketStatus, setTicketStatus] = useState<string>('open');
  const [adminNotes, setAdminNotes] = useState<string>('');

  // Check admin authorization
  useEffect(() => {
    if (adminKey) {
      verifyAdminKey(adminKey);
    }
  }, [adminKey]);

  const verifyAdminKey = async (key: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/check', {
        headers: { 'x-admin-key': key }
      });
      const data = await res.json();
      if (data.authorized) {
        setIsAuthorized(true);
        localStorage.setItem('rubychan_admin_key', key);
        loadStats(key);
        loadTabData('users', key);
      } else {
        setIsAuthorized(false);
        setErrorMsg('Invalid Admin Passcode or Secret Key.');
      }
    } catch (err: any) {
      setErrorMsg('Server authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) return;
    triggerHaptic('medium');
    setAdminKey(passcodeInput.trim());
  };

  const loadStats = async (key: string = adminKey) => {
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'x-admin-key': key } });
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.warn('Error loading stats:', err);
    }
  };

  const loadTabData = async (tab: string, key: string = adminKey) => {
    setIsLoading(true);
    try {
      if (tab === 'users') {
        const res = await fetch(`/api/admin/users?q=${encodeURIComponent(userSearch)}&page=${userPage}&limit=15`, {
          headers: { 'x-admin-key': key }
        });
        const data = await res.json();
        setUsers(data.users || []);
        setTotalUsersCount(data.total || (data.users || []).length);
      } else if (tab === 'characters') {
        const res = await fetch('/api/admin/characters', { headers: { 'x-admin-key': key } });
        const data = await res.json();
        setCharacters(data.characters || []);
      } else if (tab === 'conversations') {
        const res = await fetch('/api/admin/conversations', { headers: { 'x-admin-key': key } });
        const data = await res.json();
        setConversations(data.conversations || []);
      } else if (tab === 'energy') {
        const res = await fetch('/api/admin/energy-logs', { headers: { 'x-admin-key': key } });
        const data = await res.json();
        setEnergyLogs(data.logs || []);
      } else if (tab === 'gems') {
        const res = await fetch('/api/admin/gems-logs', { headers: { 'x-admin-key': key } });
        const data = await res.json();
        setGemsLogs(data.logs || []);
      } else if (tab === 'premium') {
        const res = await fetch('/api/admin/premium', { headers: { 'x-admin-key': key } });
        const data = await res.json();
        setEntitlements(data.entitlements || []);
      } else if (tab === 'support') {
        const res = await fetch('/api/admin/support', { headers: { 'x-admin-key': key } });
        const data = await res.json();
        setSupportTickets(data.tickets || []);
      } else if (tab === 'audit') {
        const res = await fetch('/api/admin/audit-logs', { headers: { 'x-admin-key': key } });
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Error loading tab data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: any) => {
    triggerHaptic('light');
    setActiveTab(tab);
    loadTabData(tab);
  };

  // User Actions
  const handleAdjustBalance = async () => {
    if (!selectedUserForBalance) return;
    triggerHaptic('heavy');
    try {
      await fetch(`/api/admin/users/${selectedUserForBalance.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ energyDelta, gemsDelta, reason: balanceReason })
      });
      triggerHapticNotification('success');
      alert(`Balance updated for user ${selectedUserForBalance.username || selectedUserForBalance.id}`);
      setSelectedUserForBalance(null);
      loadTabData('users');
      loadStats();
    } catch (err) {
      alert('Failed to update balance');
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    if (confirm(`Change status of user ${userId} to ${newStatus}?`)) {
      triggerHaptic('heavy');
      try {
        await fetch(`/api/admin/users/${userId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify({ status: newStatus })
        });
        loadTabData('users');
      } catch (err) {
        alert('Failed to update user status');
      }
    }
  };

  // Character Actions
  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCharacter?.name || !editingCharacter?.greeting) return;
    triggerHaptic('heavy');
    try {
      await fetch('/api/admin/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(editingCharacter)
      });
      triggerHapticNotification('success');
      setIsCharModalOpen(false);
      setEditingCharacter(null);
      loadTabData('characters');
      loadStats();
    } catch (err) {
      alert('Failed to save character');
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (confirm('Permanently delete this character from catalog?')) {
      triggerHaptic('heavy');
      try {
        await fetch(`/api/admin/characters/${charId}`, {
          method: 'DELETE',
          headers: { 'x-admin-key': adminKey }
        });
        loadTabData('characters');
        loadStats();
      } catch (err) {
        alert('Failed to delete character');
      }
    }
  };

  // Support Ticket Action
  const handleUpdateSupportTicket = async () => {
    if (!selectedTicket) return;
    triggerHaptic('medium');
    try {
      await fetch(`/api/admin/support/${selectedTicket.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ status: ticketStatus, adminNotes })
      });
      triggerHapticNotification('success');
      setSelectedTicket(null);
      loadTabData('support');
      loadStats();
    } catch (err) {
      alert('Failed to update ticket');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#12081f] border border-rose-800/80 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-rose-950/80">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">RUBY CHAN OWNER PORTAL</h2>
            <p className="text-xs text-rose-300 font-medium">Server-side authorized administrator login</p>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-600/60 p-3 rounded-xl text-xs text-rose-200 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <input
              type="password"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="Enter Admin Passcode..."
              className="w-full bg-[#180d28] border border-rose-900/50 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-center font-bold"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all"
            >
              {isLoading ? 'Verifying Authorization...' : 'ACCESS OWNER DASHBOARD'}
            </button>
          </form>

          <p className="text-[10px] text-slate-500">
            Default Passcode: <code className="text-rose-400">rubychan_admin_2026</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#12081f] border border-rose-800/80 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="bg-[#180b28] px-5 py-3.5 border-b border-rose-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                RUBY CHAN OWNER DASHBOARD
                <span className="text-[9px] bg-rose-500/20 text-rose-300 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/30">
                  Authorized Admin
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">Full control over users, characters, logs & platform data</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                loadStats();
                loadTabData(activeTab);
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-white transition-colors border border-slate-800"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="bg-[#150a24] px-4 py-2.5 border-b border-rose-900/30 grid grid-cols-4 gap-2 text-center text-xs shrink-0">
          <div className="bg-[#180d28] p-2 rounded-xl border border-rose-900/20">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Users</p>
            <p className="font-black text-sm text-white">{stats.totalUsers}</p>
          </div>
          <div className="bg-[#180d28] p-2 rounded-xl border border-rose-900/20">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Characters</p>
            <p className="font-black text-sm text-purple-300">{stats.activeCharacters}</p>
          </div>
          <div className="bg-[#180d28] p-2 rounded-xl border border-rose-900/20">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Conversations</p>
            <p className="font-black text-sm text-rose-300">{stats.totalConversations}</p>
          </div>
          <div className="bg-[#180d28] p-2 rounded-xl border border-rose-900/20">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Open Tickets</p>
            <p className="font-black text-sm text-amber-400">{stats.openTickets}</p>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="bg-[#180b28] px-4 py-2 border-b border-rose-900/40 flex items-center space-x-1.5 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'users', label: 'Users', icon: Users },
            { id: 'characters', label: 'Characters', icon: SparklesIcon },
            { id: 'conversations', label: 'Conversations', icon: MessageSquare },
            { id: 'energy', label: 'Energy Logs', icon: Zap },
            { id: 'gems', label: 'Gems Logs', icon: Gem },
            { id: 'premium', label: 'VIP Pass', icon: Crown },
            { id: 'support', label: 'Support Tickets', icon: HelpCircle },
            { id: 'audit', label: 'Audit Log', icon: FileText }
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-md'
                    : 'bg-[#12081f] text-slate-400 hover:text-slate-200 border border-rose-900/30'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#0a0412]">
          {isLoading && (
            <div className="text-center py-8 text-slate-400 text-xs font-bold animate-pulse">
              Loading admin data...
            </div>
          )}

          {/* 1. USERS TAB */}
          {activeTab === 'users' && !isLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadTabData('users')}
                    placeholder="Search user ID, username, or name..."
                    className="w-full bg-[#180d28] border border-rose-900/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <button
                  onClick={() => loadTabData('users')}
                  className="px-3 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded-xl text-xs font-bold"
                >
                  Search
                </button>
              </div>

              <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#180b28] text-slate-400 uppercase font-extrabold text-[10px] border-b border-rose-900/30">
                      <tr>
                        <th className="p-3">User ID</th>
                        <th className="p-3">Username / Telegram ID</th>
                        <th className="p-3">Plan</th>
                        <th className="p-3">Energy</th>
                        <th className="p-3">Gems</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-900/20">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-rose-950/20 transition-colors">
                          <td className="p-3 font-mono text-[11px] text-rose-300 font-bold">{u.id}</td>
                          <td className="p-3">
                            <p className="font-extrabold text-white">{u.username}</p>
                            <p className="text-[10px] text-slate-500">TG ID: {u.telegram_id || 'N/A'}</p>
                          </td>
                          <td className="p-3">
                            <span className="bg-purple-950 text-purple-300 border border-purple-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                              {u.plan}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-amber-400">⚡ {u.energy}</td>
                          <td className="p-3 font-bold text-rose-300">🔮 {u.gems}</td>
                          <td className="p-3">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                u.status === 'banned'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-700'
                                  : u.status === 'suspended'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-700'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="p-3 flex items-center space-x-1.5">
                            <button
                              onClick={() => setSelectedUserForBalance(u)}
                              className="px-2.5 py-1 bg-rose-900/80 hover:bg-rose-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                              title="Adjust Energy/Gems"
                            >
                              <Zap className="w-3 h-3 text-amber-400" /> Balance
                            </button>

                            {u.status === 'active' ? (
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                                className="p-1 bg-amber-950 text-amber-400 hover:bg-amber-900 rounded-lg text-[10px]"
                                title="Suspend User"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, 'active')}
                                className="p-1 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 rounded-lg text-[10px]"
                                title="Activate User"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. CHARACTERS TAB */}
          {activeTab === 'characters' && !isLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-white">Character Catalog ({characters.length})</h3>
                <button
                  onClick={() => {
                    setEditingCharacter({
                      id: `char-${Date.now()}`,
                      name: '',
                      title: '',
                      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                      category: 'Anime',
                      personality: '',
                      background: '',
                      greeting: '',
                      systemPrompt: '',
                      voiceTone: 'Warm and clear',
                      isPremium: false,
                      sortOrder: 1,
                      isActive: true
                    });
                    setIsCharModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" /> Add New Character
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {characters.map((c) => (
                  <div key={c.id} className="bg-[#140a1f] border border-rose-900/40 p-3 rounded-2xl flex space-x-3 items-center">
                    <img src={c.avatar} alt={c.name} className="w-14 h-14 rounded-xl object-cover ring-1 ring-rose-500/40 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-xs text-white truncate">{c.name}</h4>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${c.isPremium ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'bg-slate-800 text-slate-300'}`}>
                          {c.isPremium ? 'VIP' : 'FREE'}
                        </span>
                      </div>
                      <p className="text-[10px] text-rose-300 truncate">{c.title}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{c.personality}</p>
                    </div>
                    <div className="flex flex-col space-y-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingCharacter(c);
                          setIsCharModalOpen(true);
                        }}
                        className="p-1.5 bg-slate-900 hover:bg-rose-950 text-slate-300 rounded-lg border border-slate-800"
                        title="Edit Character"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCharacter(c.id)}
                        className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-800"
                        title="Delete Character"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. CONVERSATIONS TAB */}
          {activeTab === 'conversations' && !isLoading && (
            <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#180b28] text-slate-400 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-3">Conversation ID</th>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Character ID</th>
                    <th className="p-3">TG ID</th>
                    <th className="p-3">Updated At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-900/20">
                  {conversations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">No conversation records recorded.</td>
                    </tr>
                  ) : (
                    conversations.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3 font-mono text-[10px] text-rose-300">{c.id}</td>
                        <td className="p-3 text-white font-bold">{c.user_id}</td>
                        <td className="p-3 text-purple-300 font-bold">{c.character_id}</td>
                        <td className="p-3 text-slate-400">{c.telegram_user_id || 'N/A'}</td>
                        <td className="p-3 text-slate-500 text-[10px]">{new Date(c.updated_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. ENERGY LOGS TAB */}
          {activeTab === 'energy' && !isLoading && (
            <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#180b28] text-slate-400 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-900/20">
                  {energyLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">No energy transaction logs recorded.</td>
                    </tr>
                  ) : (
                    energyLogs.map((l) => (
                      <tr key={l.id}>
                        <td className="p-3 text-rose-300 font-bold">{l.user_id}</td>
                        <td className={`p-3 font-black ${l.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {l.amount > 0 ? `+${l.amount}` : l.amount} ⚡
                        </td>
                        <td className="p-3 font-bold uppercase text-[10px] text-purple-300">{l.action}</td>
                        <td className="p-3 text-slate-400">{l.description}</td>
                        <td className="p-3 text-slate-500 text-[10px]">{new Date(l.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. GEMS LOGS TAB */}
          {activeTab === 'gems' && !isLoading && (
            <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#180b28] text-slate-400 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Orbs Amount</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-900/20">
                  {gemsLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">No gems transaction logs recorded.</td>
                    </tr>
                  ) : (
                    gemsLogs.map((l) => (
                      <tr key={l.id}>
                        <td className="p-3 text-rose-300 font-bold">{l.user_id}</td>
                        <td className={`p-3 font-black ${l.amount > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {l.amount > 0 ? `+${l.amount}` : l.amount} 🔮
                        </td>
                        <td className="p-3 font-bold uppercase text-[10px] text-purple-300">{l.action}</td>
                        <td className="p-3 text-slate-400">{l.description}</td>
                        <td className="p-3 text-slate-500 text-[10px]">{new Date(l.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 6. PREMIUM ENTITLEMENS TAB */}
          {activeTab === 'premium' && !isLoading && (
            <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#180b28] text-slate-400 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">Expiration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-900/20">
                  {entitlements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">No active premium entitlements found.</td>
                    </tr>
                  ) : (
                    entitlements.map((e) => (
                      <tr key={e.id}>
                        <td className="p-3 text-rose-300 font-bold">{e.userId || e.user_id}</td>
                        <td className="p-3 font-extrabold text-amber-400">{e.planId || e.plan_id}</td>
                        <td className="p-3">
                          <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {e.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-[10px]">{new Date(e.startDate || e.start_date).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-400 text-[10px]">{new Date(e.expirationDate || e.expiration_date).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 7. SUPPORT TICKETS TAB */}
          {activeTab === 'support' && !isLoading && (
            <div className="space-y-3">
              {supportTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No support tickets submitted yet.</div>
              ) : (
                supportTickets.map((t) => (
                  <div key={t.id} className="bg-[#140a1f] border border-rose-900/40 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-rose-300 bg-rose-950 border border-rose-800 px-2.5 py-0.5 rounded-full">
                        {t.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${t.status === 'open' ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'}`}>
                        {t.status}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-white">{t.subject}</h4>
                    <p className="text-xs text-slate-300 whitespace-pre-line bg-[#180d28] p-3 rounded-xl border border-rose-950">{t.message}</p>

                    {t.admin_notes && (
                      <p className="text-[11px] text-amber-300 italic bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
                        Admin Note: {t.admin_notes}
                      </p>
                    )}

                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Submitted by: {t.user_id}</span>
                      <button
                        onClick={() => {
                          setSelectedTicket(t);
                          setTicketStatus(t.status || 'open');
                          setAdminNotes(t.admin_notes || '');
                        }}
                        className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white font-bold rounded-lg"
                      >
                        Manage Ticket
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 8. AUDIT LOG TAB */}
          {activeTab === 'audit' && !isLoading && (
            <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#180b28] text-slate-400 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-3">Admin</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Details</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-900/20">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">No audit log entries recorded.</td>
                    </tr>
                  ) : (
                    auditLogs.map((a) => (
                      <tr key={a.id}>
                        <td className="p-3 font-bold text-rose-300">{a.admin_id}</td>
                        <td className="p-3 font-extrabold text-white uppercase text-[10px]">{a.action}</td>
                        <td className="p-3 text-purple-300 font-mono text-[10px]">{a.target_type}: {a.target_id || 'N/A'}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-400 truncate max-w-xs">{JSON.stringify(a.details)}</td>
                        <td className="p-3 text-slate-500 text-[10px]">{new Date(a.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Balance Sub-Modal */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#180b28] border border-rose-800/80 p-5 rounded-3xl w-full max-w-sm space-y-4 text-slate-200">
            <h3 className="font-extrabold text-sm text-white">Adjust Balance for {selectedUserForBalance.username}</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Energy Adjustment (+/-)</label>
                <input
                  type="number"
                  value={energyDelta}
                  onChange={(e) => setEnergyDelta(Number(e.target.value))}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2.5 text-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Ruby Orbs Adjustment (+/-)</label>
                <input
                  type="number"
                  value={gemsDelta}
                  onChange={(e) => setGemsDelta(Number(e.target.value))}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2.5 text-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2.5 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedUserForBalance(null)}
                className="px-3.5 py-2 bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustBalance}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-xl text-xs font-black shadow"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Character Sub-Modal */}
      {isCharModalOpen && editingCharacter && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#180b28] border border-rose-800/80 p-5 rounded-3xl w-full max-w-lg space-y-4 text-slate-200 my-auto">
            <h3 className="font-extrabold text-sm text-white">
              {editingCharacter.id ? 'Edit Character' : 'Create New Character'}
            </h3>

            <form onSubmit={handleSaveCharacter} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Character Name</label>
                  <input
                    type="text"
                    required
                    value={editingCharacter.name || ''}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                    className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Category</label>
                  <select
                    value={editingCharacter.category || 'Anime'}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, category: e.target.value as any })}
                    className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2 text-white"
                  >
                    <option value="Anime">Anime</option>
                    <option value="Realistic">Realistic</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Noir">Noir</option>
                    <option value="Romance">Romance</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Title / Role</label>
                <input
                  type="text"
                  value={editingCharacter.title || ''}
                  onChange={(e) => setEditingCharacter({ ...editingCharacter, title: e.target.value })}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={editingCharacter.avatar || ''}
                  onChange={(e) => setEditingCharacter({ ...editingCharacter, avatar: e.target.value })}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2 text-white font-mono text-[10px]"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Personality Traits</label>
                <input
                  type="text"
                  value={editingCharacter.personality || ''}
                  onChange={(e) => setEditingCharacter({ ...editingCharacter, personality: e.target.value })}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Background / About / Backstory</label>
                <textarea
                  rows={2}
                  value={editingCharacter.background || ''}
                  onChange={(e) => setEditingCharacter({ ...editingCharacter, background: e.target.value })}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2 text-white resize-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Initial Greeting Message</label>
                <textarea
                  rows={2}
                  required
                  value={editingCharacter.greeting || ''}
                  onChange={(e) => setEditingCharacter({ ...editingCharacter, greeting: e.target.value })}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2 text-white resize-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">System Prompt (AI Persona)</label>
                <textarea
                  rows={3}
                  value={editingCharacter.systemPrompt || ''}
                  onChange={(e) => setEditingCharacter({ ...editingCharacter, systemPrompt: e.target.value })}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2 text-white font-mono text-[10px] resize-none"
                />
              </div>

              <div className="flex items-center space-x-4 pt-1">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingCharacter.isPremium)}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, isPremium: e.target.checked })}
                    className="accent-rose-600 rounded"
                  />
                  <span className="font-bold text-amber-400">VIP Access Only</span>
                </label>

                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCharacter.isActive !== false}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, isActive: e.target.checked })}
                    className="accent-rose-600 rounded"
                  />
                  <span className="font-bold text-emerald-400">Active in Catalog</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-rose-900/30">
                <button
                  type="button"
                  onClick={() => setIsCharModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 hover:text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-xl font-black shadow"
                >
                  Save Character
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#180b28] border border-rose-800/80 p-5 rounded-3xl w-full max-w-md space-y-4 text-slate-200">
            <h3 className="font-extrabold text-sm text-white">Manage Support Ticket</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Ticket Status</label>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value)}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2 text-white"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Admin Notes (Internal)</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Write internal notes regarding this ticket..."
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2.5 text-white resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-3.5 py-2 bg-slate-900 text-slate-400 hover:text-white rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSupportTicket}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-xl font-black shadow"
              >
                Save Ticket Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Sparkles Icon for Tab
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);
