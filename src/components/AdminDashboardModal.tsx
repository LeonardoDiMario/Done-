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
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  AlertTriangle,
  Send,
  Sliders,
  Database,
  Copy,
  Volume2,
  CreditCard,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';
import { triggerHaptic, triggerHapticNotification } from '../utils/telegramSdk';
import { Character } from '../types';

interface AdminDashboardModalProps {
  onClose: () => void;
  onCharactersUpdated?: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ onClose, onCharactersUpdated }) => {
  const [adminKey, setAdminKey] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramKey = urlParams.get('admin_key') || urlParams.get('key');
    if (paramKey) return paramKey;
    if (urlParams.get('admin') === 'true' || urlParams.get('admin') === 'rubychan' || urlParams.get('owner') === 'true') {
      return 'rubychan_admin_2026';
    }
    return localStorage.getItem('rubychan_admin_key') || '';
  });
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'characters' | 'users' | 'broadcast' | 'system' | 'orders' | 'conversations' | 'backup' | 'audit'
  >('overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  // Overview Stats
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeCharacters: 0,
    totalConversations: 0,
    openTickets: 0,
    totalEnergy: 0,
    totalGems: 0
  });

  // Table Data States
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userPage, setUserPage] = useState<number>(1);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [charSearch, setCharSearch] = useState<string>('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Action Modals State
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<any | null>(null);
  const [energyDelta, setEnergyDelta] = useState<number>(50);
  const [gemsDelta, setGemsDelta] = useState<number>(10);
  const [balanceReason, setBalanceReason] = useState<string>('Owner gift / compensation');

  const [selectedUserForVip, setSelectedUserForVip] = useState<any | null>(null);
  const [vipPlanId, setVipPlanId] = useState<string>('vip_monthly');
  const [vipDays, setVipDays] = useState<number>(30);

  const [editingCharacter, setEditingCharacter] = useState<Partial<Character> | null>(null);
  const [isCharModalOpen, setIsCharModalOpen] = useState<boolean>(false);

  // Live Chat Inspection State for Owner
  const [inspectChatModal, setInspectChatModal] = useState<{
    userId: string;
    characterId: string;
    characterName?: string;
    characterAvatar?: string;
    username?: string;
    messages: any[];
  } | null>(null);
  const [isFetchingChatLogs, setIsFetchingChatLogs] = useState<boolean>(false);
  const [userChatsOverview, setUserChatsOverview] = useState<{
    userId: string;
    username: string;
    chats: any[];
  } | null>(null);

  // Broadcast Composer State
  const [broadcastTitle, setBroadcastTitle] = useState<string>('RubyChan 2.0 18+ VIP Announcement');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastBtnText, setBroadcastBtnText] = useState<string>('🌸 Open RubyChan 2.0 WebApp');
  const [broadcastBtnUrl, setBroadcastBtnUrl] = useState<string>('');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastResult, setBroadcastResult] = useState<any | null>(null);

  // System Config State
  const [systemConfig, setSystemConfig] = useState<any>({
    botUsername: '@Rubby_Chan_Bot',
    defaultModel: 'gemini-2.5-flash',
    defaultTemperature: 0.85,
    dailyFreeEnergy: 25,
    maxFreeEnergy: 50,
    activeAiService: 'Google Gemini 2.5 Flash'
  });

  // Verify Admin authorization
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
        loadSystemConfig(key);
        loadTabData('overview', key);
      } else {
        setIsAuthorized(false);
        setErrorMsg('Invalid Owner Passcode or Secret Key.');
      }
    } catch (err: any) {
      setErrorMsg('Server connection failed.');
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

  const showBannerMessage = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
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

  const loadSystemConfig = async (key: string = adminKey) => {
    try {
      const res = await fetch('/api/admin/system-config', { headers: { 'x-admin-key': key } });
      const data = await res.json();
      if (data.config) setSystemConfig(data.config);
    } catch (err) {}
  };

  const loadTabData = async (tab: string, key: string = adminKey) => {
    setIsLoading(true);
    try {
      if (tab === 'overview') {
        await loadStats(key);
      } else if (tab === 'users') {
        const res = await fetch(`/api/admin/users?q=${encodeURIComponent(userSearch)}&page=${userPage}&limit=20`, {
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
      } else if (tab === 'orders') {
        const res = await fetch('/api/admin/premium', { headers: { 'x-admin-key': key } });
        const data = await res.json();
        setEntitlements(data.entitlements || []);
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

  // User Actions: Balance
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
      showBannerMessage(`Updated balance for user ${selectedUserForBalance.username || selectedUserForBalance.id}`);
      setSelectedUserForBalance(null);
      loadTabData('users');
      loadStats();
    } catch (err) {
      alert('Failed to update balance');
    }
  };

  // User Actions: Grant VIP
  const handleGrantVip = async () => {
    if (!selectedUserForVip) return;
    triggerHaptic('heavy');
    try {
      const res = await fetch(`/api/admin/users/${selectedUserForVip.id}/grant-vip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ planId: vipPlanId, days: vipDays, action: 'grant' })
      });
      const data = await res.json();
      triggerHapticNotification('success');
      showBannerMessage(data.message || 'VIP successfully granted!');
      setSelectedUserForVip(null);
      loadTabData('users');
      loadStats();
    } catch (err) {
      alert('Failed to grant VIP');
    }
  };

  const handleRevokeVip = async (userId: string) => {
    if (!confirm('Revoke active VIP access for this user?')) return;
    triggerHaptic('heavy');
    try {
      const res = await fetch(`/api/admin/users/${userId}/grant-vip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ action: 'revoke' })
      });
      const data = await res.json();
      triggerHapticNotification('success');
      showBannerMessage(data.message || 'VIP revoked.');
      loadTabData('users');
      loadStats();
    } catch (err) {
      alert('Failed to revoke VIP');
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
        showBannerMessage(`User marked as ${newStatus}`);
        loadTabData('users');
      } catch (err) {
        alert('Failed to update user status');
      }
    }
  };

  // Inspect specific chat transcript for owner
  const handleInspectChat = async (userId: string, characterId: string, charName?: string, username?: string, charAvatar?: string) => {
    triggerHaptic('medium');
    setIsFetchingChatLogs(true);
    try {
      const res = await fetch(`/api/admin/chat-logs/${encodeURIComponent(userId)}/${encodeURIComponent(characterId)}`, {
        headers: { 'x-admin-key': adminKey }
      });
      const data = await res.json();
      setInspectChatModal({
        userId,
        characterId,
        characterName: charName || data.character?.name || characterId,
        characterAvatar: charAvatar || data.character?.avatar,
        username: username || userId,
        messages: data.messages || []
      });
    } catch (err) {
      console.error('Failed to fetch chat logs:', err);
      alert('Failed to load chat history.');
    } finally {
      setIsFetchingChatLogs(false);
    }
  };

  // View all chats for a member
  const handleViewUserAllChats = async (user: any) => {
    triggerHaptic('medium');
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/user-chats/${encodeURIComponent(user.id)}`, {
        headers: { 'x-admin-key': adminKey }
      });
      const data = await res.json();
      setUserChatsOverview({
        userId: user.id,
        username: user.username || user.first_name || user.id,
        chats: data.chats || []
      });
    } catch (err) {
      console.error('Failed to load user chats overview:', err);
      alert('Failed to fetch user conversations.');
    } finally {
      setIsLoading(false);
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
      showBannerMessage(`Saved character "${editingCharacter.name}"`);
      setIsCharModalOpen(false);
      setEditingCharacter(null);
      loadTabData('characters');
      loadStats();
      if (onCharactersUpdated) onCharactersUpdated();
    } catch (err) {
      alert('Failed to save character');
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (confirm('Permanently delete this character from the RubyChan 2.0 universe?')) {
      triggerHaptic('heavy');
      try {
        await fetch(`/api/admin/characters/${charId}`, {
          method: 'DELETE',
          headers: { 'x-admin-key': adminKey }
        });
        showBannerMessage('Character deleted.');
        loadTabData('characters');
        loadStats();
        if (onCharactersUpdated) onCharactersUpdated();
      } catch (err) {
        alert('Failed to delete character');
      }
    }
  };

  const handleDuplicateCharacter = async (charId: string) => {
    triggerHaptic('medium');
    try {
      const res = await fetch(`/api/admin/characters/${charId}/duplicate`, {
        method: 'POST',
        headers: { 'x-admin-key': adminKey }
      });
      const data = await res.json();
      if (data.success) {
        triggerHapticNotification('success');
        showBannerMessage('Character cloned successfully!');
        loadTabData('characters');
        loadStats();
        if (onCharactersUpdated) onCharactersUpdated();
      }
    } catch (err) {
      alert('Failed to duplicate character');
    }
  };

  // Broadcast Action
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    if (!confirm('Send this live broadcast announcement to all connected Telegram users?')) return;

    setIsBroadcasting(true);
    triggerHaptic('heavy');
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          buttonText: broadcastBtnText,
          buttonUrl: broadcastBtnUrl
        })
      });
      const data = await res.json();
      setBroadcastResult(data);
      triggerHapticNotification('success');
      showBannerMessage(data.message || 'Broadcast announcement dispatched!');
      loadStats();
    } catch (err) {
      alert('Failed to send broadcast');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // System Config Action
  const handleSaveSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    try {
      await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(systemConfig)
      });
      triggerHapticNotification('success');
      showBannerMessage('System settings updated successfully!');
    } catch (err) {
      alert('Failed to update system config');
    }
  };

  // Backup & Export
  const handleExportBackup = () => {
    triggerHaptic('medium');
    window.open('/api/admin/export-data?key=' + encodeURIComponent(adminKey), '_blank');
  };

  // Webhook & Supabase Management
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState<boolean>(false);
  const [isSyncingWebhook, setIsSyncingWebhook] = useState<boolean>(false);

  const fetchSupabaseStatus = async () => {
    setIsCheckingSupabase(true);
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setSupabaseStatus(data);
    } catch (err) {
      console.warn('Failed to load supabase status:', err);
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'backup' || activeTab === 'overview') {
      fetchSupabaseStatus();
    }
  }, [activeTab]);

  const handleSyncWebhook = async () => {
    setIsSyncingWebhook(true);
    triggerHaptic('medium');
    try {
      const res = await fetch('/api/telegram/setup-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        triggerHapticNotification('success');
        showBannerMessage(`Telegram webhook refreshed and synchronized to: ${data.webhookUrl}`);
      } else {
        alert(data.error || 'Failed to setup webhook');
      }
    } catch (err: any) {
      alert(err.message || 'Webhook sync failed');
    } finally {
      setIsSyncingWebhook(false);
    }
  };

  const handleClearOldWebhook = async () => {
    if (!confirm('Clear all old webhooks and drop pending conflicting messages from Telegram servers?')) return;
    setIsSyncingWebhook(true);
    triggerHaptic('heavy');
    try {
      const res = await fetch('/api/telegram/delete-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        triggerHapticNotification('success');
        showBannerMessage('All old webhooks and pending updates were successfully purged from Telegram servers.');
      } else {
        alert(data.error || 'Failed to clear webhook');
      }
    } catch (err: any) {
      alert(err.message || 'Webhook purge failed');
    } finally {
      setIsSyncingWebhook(false);
    }
  };

  const handleResetDatabase = async () => {
    const code = prompt('Type "RESET" to confirm resetting database to defaults:');
    if (code === 'RESET') {
      triggerHaptic('heavy');
      try {
        await fetch('/api/admin/reset-data', {
          method: 'POST',
          headers: { 'x-admin-key': adminKey }
        });
        triggerHapticNotification('success');
        showBannerMessage('Database successfully reset to initial default state.');
        loadStats();
        loadTabData('characters');
      } catch (err) {
        alert('Failed to reset database');
      }
    }
  };

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
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
            <p className="text-xs text-rose-300 font-medium">Authorized server administration control center</p>
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
              placeholder="Enter Owner Passcode..."
              className="w-full bg-[#180d28] border border-rose-900/50 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-center font-bold"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all"
            >
              {isLoading ? 'Verifying Credentials...' : 'UNLOCK OWNER DASHBOARD'}
            </button>
          </form>

          <p className="text-[10px] text-slate-500">
            Passcode: <code className="text-rose-400">rubychan_admin_2026</code>
          </p>
        </div>
      </div>
    );
  }

  const filteredCharacters = characters.filter(
    (c) =>
      c.name.toLowerCase().includes(charSearch.toLowerCase()) ||
      c.title.toLowerCase().includes(charSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(charSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#12081f] border border-rose-800/80 rounded-3xl w-full max-w-5xl h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="bg-[#180b28] px-5 py-3.5 border-b border-rose-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/80 border border-rose-400/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-white tracking-tight">RUBY CHAN OWNER CONTROL CENTER</h2>
                <span className="text-[9px] bg-rose-500/20 text-rose-300 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/30">
                  Full Authority
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {systemConfig.botUsername || '@Rubby_Chan_Bot'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Manage 18+ characters, user wallets, broadcast announcements & AI engine</p>
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

        {/* Global Notification Banner */}
        {actionSuccessMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-4 py-2 text-xs text-emerald-200 font-bold flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg('')} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="bg-[#180b28] px-4 py-2 border-b border-rose-900/40 flex items-center space-x-1.5 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'overview', label: 'Overview', icon: Zap },
            { id: 'characters', label: 'Characters', icon: Gem },
            { id: 'users', label: 'Users & VIP', icon: Users },
            { id: 'broadcast', label: 'Broadcast', icon: Send },
            { id: 'system', label: 'AI & Bot Settings', icon: Sliders },
            { id: 'orders', label: 'VIP Orders', icon: CreditCard },
            { id: 'conversations', label: 'Live Chats', icon: MessageSquare },
            { id: 'backup', label: 'Backup & Reset', icon: Database },
            { id: 'audit', label: 'Audit Trail', icon: FileText }
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 text-white shadow-md'
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
            <div className="text-center py-6 text-slate-400 text-xs font-bold animate-pulse">
              Loading dashboard data...
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && !isLoading && (
            <div className="space-y-5">
              {/* Metrics Bento Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#150a24] p-3.5 rounded-2xl border border-rose-900/30 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
                    <Users className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-xl font-black text-white">{stats.totalUsers || 1}</p>
                  <p className="text-[10px] text-emerald-400 mt-1">Platform & Telegram sync</p>
                </div>

                <div className="bg-[#150a24] p-3.5 rounded-2xl border border-rose-900/30 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">18+ Characters</span>
                    <Gem className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xl font-black text-purple-300">{stats.activeCharacters || characters.length}</p>
                  <p className="text-[10px] text-rose-300 mt-1">Ready for roleplay</p>
                </div>

                <div className="bg-[#150a24] p-3.5 rounded-2xl border border-rose-900/30 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Conversations</span>
                    <MessageSquare className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-xl font-black text-rose-300">{stats.totalConversations || 0}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Multi-turn memories</p>
                </div>

                <div className="bg-[#150a24] p-3.5 rounded-2xl border border-rose-900/30 shadow-lg">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">AI Service Status</span>
                    <Sliders className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-xs font-black text-emerald-300 truncate">Gemini 2.5 Flash</p>
                  <p className="text-[10px] text-emerald-400 mt-1">● Online & High-Speed</p>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-[#150a24] border border-rose-900/40 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-extrabold text-white tracking-wide uppercase">Owner Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      setEditingCharacter({
                        name: '',
                        title: '18+ Roleplay Partner',
                        category: 'Anime',
                        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
                        personality: 'Playful, affectionate, devoted',
                        greeting: '*gazes at you softly* Hello, my love...',
                        systemPrompt: 'You are an explicit 18+ adult roleplay companion. Stay strictly in character.',
                        voiceTone: 'Warm and seductive',
                        voiceName: 'Kore',
                        isPremium: false,
                        isActive: true
                      });
                      setIsCharModalOpen(true);
                    }}
                    className="p-3 bg-gradient-to-r from-rose-600/80 to-purple-600/80 hover:from-rose-500 hover:to-purple-500 rounded-xl text-left text-white border border-rose-500/40 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4 mb-1 text-white" />
                    <p className="text-xs font-bold">New 18+ Character</p>
                    <p className="text-[10px] text-rose-200">Add to universe catalog</p>
                  </button>

                  <button
                    onClick={() => handleTabChange('broadcast')}
                    className="p-3 bg-[#180d28] hover:bg-rose-950/60 rounded-xl text-left text-slate-200 border border-rose-900/40 transition-all"
                  >
                    <Send className="w-4 h-4 mb-1 text-rose-400" />
                    <p className="text-xs font-bold">Dispatch Broadcast</p>
                    <p className="text-[10px] text-slate-400">Push to all Telegram users</p>
                  </button>

                  <button
                    onClick={() => handleTabChange('users')}
                    className="p-3 bg-[#180d28] hover:bg-rose-950/60 rounded-xl text-left text-slate-200 border border-rose-900/40 transition-all"
                  >
                    <Crown className="w-4 h-4 mb-1 text-amber-400" />
                    <p className="text-xs font-bold">Grant VIP Access</p>
                    <p className="text-[10px] text-slate-400">Manage user memberships</p>
                  </button>

                  <button
                    onClick={handleExportBackup}
                    className="p-3 bg-[#180d28] hover:bg-rose-950/60 rounded-xl text-left text-slate-200 border border-rose-900/40 transition-all"
                  >
                    <Download className="w-4 h-4 mb-1 text-emerald-400" />
                    <p className="text-xs font-bold">Export Backup</p>
                    <p className="text-[10px] text-slate-400">Save full JSON snapshot</p>
                  </button>
                </div>
              </div>

              {/* Bot Info Banner */}
              <div className="bg-gradient-to-r from-rose-950/40 to-purple-950/40 border border-rose-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h4 className="text-xs font-bold text-white">Telegram Bot Synchronized</h4>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Official Bot Handle: <b className="text-rose-300">@Rubby_Chan_Bot</b>. Commands like <code className="text-amber-300">/start</code> dynamically open the WebApp choice portal with character deep linking.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={handleClearOldWebhook}
                    disabled={isSyncingWebhook}
                    className="px-3 py-2 bg-slate-900 hover:bg-rose-950/80 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold transition-all shadow-sm"
                    title="Purge old webhook & conflicting queues from Telegram server"
                  >
                    Clear Old Webhooks
                  </button>
                  <button
                    onClick={handleSyncWebhook}
                    disabled={isSyncingWebhook}
                    className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1"
                  >
                    <RotateCcw className={`w-3 h-3 ${isSyncingWebhook ? 'animate-spin' : ''}`} />
                    <span>Sync Live Webhook</span>
                  </button>
                  <a
                    href="https://t.me/Rubby_Chan_Bot"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Test Bot
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHARACTERS */}
          {activeTab === 'characters' && !isLoading && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={charSearch}
                    onChange={(e) => setCharSearch(e.target.value)}
                    placeholder="Search character by name, title, or category..."
                    className="w-full bg-[#180d28] border border-rose-900/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingCharacter({
                      name: '',
                      title: '18+ Companion',
                      category: 'Anime',
                      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
                      personality: 'Passionate, alluring, devoted',
                      greeting: '*steps closer to you with a warm gaze* I have been waiting for you...',
                      systemPrompt: 'You are an explicit 18+ adult roleplay partner. Keep full immersion and realistic emotions.',
                      voiceTone: 'Warm and seductive',
                      voiceName: 'Kore',
                      isPremium: false,
                      isActive: true
                    });
                    setIsCharModalOpen(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Character</span>
                </button>
              </div>

              {/* Characters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCharacters.map((char) => (
                  <div
                    key={char.id}
                    className="bg-[#140a1f] border border-rose-900/40 hover:border-rose-700/60 rounded-2xl p-3 flex gap-3 shadow-md transition-all"
                  >
                    <img
                      src={char.avatar}
                      alt={char.name}
                      className="w-16 h-16 rounded-xl object-cover ring-1 ring-rose-500/40 shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-extrabold text-sm text-white truncate">{char.name}</h4>
                          <div className="flex items-center gap-1 shrink-0">
                            {char.isPremium && (
                              <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-black">
                                VIP
                              </span>
                            )}
                            <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800/40 px-1.5 py-0.5 rounded font-bold">
                              {char.category}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-rose-300/90 font-medium line-clamp-1">{char.title}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 italic">"{char.greeting}"</p>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-rose-950 mt-2">
                        <button
                          onClick={() => handleDuplicateCharacter(char.id)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-slate-700"
                          title="Duplicate character"
                        >
                          <Copy className="w-3 h-3" /> Clone
                        </button>
                        <button
                          onClick={() => {
                            setEditingCharacter({ ...char });
                            setIsCharModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-200 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-rose-800/60"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCharacter(char.id)}
                          className="p-1 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded-lg text-[10px] border border-rose-900/60"
                          title="Delete character"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: USERS & VIP */}
          {activeTab === 'users' && !isLoading && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadTabData('users')}
                    className="px-4 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded-xl text-xs font-bold"
                  >
                    Search
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to clean/reset all member records and chat logs to start fresh?')) {
                        try {
                          await fetch('/api/admin/users/reset', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
                            body: JSON.stringify({ action: 'clear_all' })
                          });
                          showBannerMessage('All member data reset successfully.');
                          loadTabData('users');
                          loadStats();
                        } catch (err) {
                          alert('Failed to reset members');
                        }
                      }
                    }}
                    className="px-3 py-2 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1"
                    title="Clean all old member logs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset Members</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#180b28] text-slate-400 uppercase font-extrabold text-[10px] border-b border-rose-900/30">
                      <tr>
                        <th className="p-3">Member Name & ID</th>
                        <th className="p-3">Plan / VIP</th>
                        <th className="p-3">Energy</th>
                        <th className="p-3">Gems</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-950">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500">
                            No member records found. When users click /start on Telegram bot, their Name & Telegram ID will immediately appear here.
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => {
                          const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'User';
                          const tgId = u.telegram_id || (u.id.startsWith('tg_') ? u.id.replace('tg_', '') : '');
                          return (
                            <tr key={u.id} className="hover:bg-rose-950/20">
                              <td className="p-3">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shrink-0 shadow">
                                    {(fullName[0] || 'U').toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-white text-xs truncate">{fullName}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {tgId ? (
                                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                                          🆔 {tgId}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-mono text-slate-400">
                                          {u.id}
                                        </span>
                                      )}
                                      {u.username && u.username !== fullName && (
                                        <span className="text-[10px] text-rose-300">
                                          {u.username.startsWith('@') ? u.username : `@${u.username}`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                {u.plan && u.plan !== 'free' ? (
                                  <span className="bg-amber-950 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                                    <Crown className="w-2.5 h-2.5" /> {u.plan.toUpperCase()}
                                  </span>
                                ) : (
                                  <span className="bg-slate-900 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    FREE
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-bold text-amber-300">⚡ {u.energy ?? 50}</td>
                              <td className="p-3 font-bold text-rose-300">💎 {u.gems ?? 0}</td>
                              <td className="p-3">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    u.status === 'banned'
                                      ? 'bg-red-950 text-red-300 border-red-800'
                                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  }`}
                                >
                                  {u.status || 'active'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => handleViewUserAllChats(u)}
                                    className="p-1.5 bg-purple-950 hover:bg-purple-900 text-purple-200 rounded-lg text-[10px] border border-purple-700/60 font-bold flex items-center gap-1"
                                    title="View Chat Logs"
                                  >
                                    <MessageSquare className="w-3 h-3" /> Chats
                                  </button>
                                  <button
                                    onClick={() => setSelectedUserForVip(u)}
                                    className="p-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded-lg text-[10px] border border-amber-700/60 font-bold flex items-center gap-1"
                                    title="Grant VIP"
                                  >
                                    <Crown className="w-3 h-3" /> VIP
                                  </button>
                                  <button
                                    onClick={() => setSelectedUserForBalance(u)}
                                    className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 rounded-lg text-[10px] border border-rose-800/60 font-bold flex items-center gap-1"
                                    title="Adjust Energy/Gems"
                                  >
                                    <Zap className="w-3 h-3" /> Coins
                                  </button>
                                  {u.status === 'banned' ? (
                                    <button
                                      onClick={() => handleUpdateUserStatus(u.id, 'active')}
                                      className="p-1.5 bg-emerald-950 text-emerald-300 rounded-lg text-[10px] border border-emerald-800"
                                      title="Unban"
                                    >
                                      Unban
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateUserStatus(u.id, 'banned')}
                                      className="p-1.5 bg-red-950 text-red-300 rounded-lg text-[10px] border border-red-800"
                                      title="Ban"
                                    >
                                      Ban
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BROADCAST */}
          {activeTab === 'broadcast' && !isLoading && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Telegram Broadcast Announcement</h3>
                    <p className="text-[10px] text-slate-400">Push instant notification to all active Telegram bot users</p>
                  </div>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Announcement Title</label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. 🌸 New 18+ Characters & Weekend VIP Bonus!"
                      className="w-full bg-[#180d28] border border-rose-900/50 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Message Body (Supports formatting)</label>
                    <textarea
                      rows={5}
                      required
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Write your broadcast announcement here..."
                      className="w-full bg-[#180d28] border border-rose-900/50 rounded-xl p-2.5 text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Inline Button Label</label>
                      <input
                        type="text"
                        value={broadcastBtnText}
                        onChange={(e) => setBroadcastBtnText(e.target.value)}
                        placeholder="e.g. 🌸 Open RubyChan 2.0 WebApp"
                        className="w-full bg-[#180d28] border border-rose-900/50 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Inline Button URL (Optional)</label>
                      <input
                        type="url"
                        value={broadcastBtnUrl}
                        onChange={(e) => setBroadcastBtnUrl(e.target.value)}
                        placeholder="https://t.me/Rubby_Chan_Bot/app"
                        className="w-full bg-[#180d28] border border-rose-900/50 rounded-xl p-2.5 text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className="w-full py-3 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isBroadcasting ? 'Broadcasting Announcement...' : 'DISPATCH BROADCAST NOW'}</span>
                  </button>
                </form>

                {broadcastResult && (
                  <div className="bg-[#180d28] border border-emerald-500/40 p-3 rounded-xl text-xs text-emerald-200">
                    <p className="font-bold">Broadcast Dispatch Completed:</p>
                    <p className="text-[11px] text-slate-300">
                      Successfully delivered to {broadcastResult.successCount} users. (Total targeted: {broadcastResult.totalTargeted})
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM SETTINGS */}
          {activeTab === 'system' && !isLoading && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Platform & AI Engine Tuning</h3>
                    <p className="text-[10px] text-slate-400">Configure AI model, bot usernames, and energy refills</p>
                  </div>
                </div>

                <form onSubmit={handleSaveSystemConfig} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Official Telegram Bot Username</label>
                    <input
                      type="text"
                      value={systemConfig.botUsername || '@Rubby_Chan_Bot'}
                      onChange={(e) => setSystemConfig({ ...systemConfig, botUsername: e.target.value })}
                      className="w-full bg-[#180d28] border border-rose-900/50 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Primary AI Model Engine</label>
                    <select
                      value={systemConfig.defaultModel || 'gemini-2.5-flash'}
                      onChange={(e) => setSystemConfig({ ...systemConfig, defaultModel: e.target.value })}
                      className="w-full bg-[#180d28] border border-rose-900/50 rounded-xl p-2.5 text-white"
                    >
                      <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Recommended - Ultra Fast & Expressive)</option>
                      <option value="gemini-2.5-pro">Google Gemini 2.5 Pro (Deep Roleplay & Complex Logic)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
                      <span>Default AI Creativity (Temperature)</span>
                      <span className="text-rose-400">{systemConfig.defaultTemperature || 0.85}</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.2"
                      step="0.05"
                      value={systemConfig.defaultTemperature || 0.85}
                      onChange={(e) => setSystemConfig({ ...systemConfig, defaultTemperature: parseFloat(e.target.value) })}
                      className="w-full accent-rose-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Daily Energy Refill</label>
                      <input
                        type="number"
                        value={systemConfig.dailyFreeEnergy || 25}
                        onChange={(e) => setSystemConfig({ ...systemConfig, dailyFreeEnergy: parseInt(e.target.value, 10) })}
                        className="w-full bg-[#180d28] border border-rose-900/50 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Max Free Energy Cap</label>
                      <input
                        type="number"
                        value={systemConfig.maxFreeEnergy || 50}
                        onChange={(e) => setSystemConfig({ ...systemConfig, maxFreeEnergy: parseInt(e.target.value, 10) })}
                        className="w-full bg-[#180d28] border border-rose-900/50 rounded-xl p-2.5 text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-xl font-black text-xs shadow-md"
                  >
                    Save System Configuration
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: VIP ORDERS */}
          {activeTab === 'orders' && !isLoading && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-white tracking-wide uppercase">Active VIP Entitlements</h3>
              <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#180b28] text-slate-400 uppercase font-extrabold text-[10px] border-b border-rose-900/30">
                    <tr>
                      <th className="p-3">User ID</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Started</th>
                      <th className="p-3">Expires</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-950">
                    {entitlements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          No active VIP memberships recorded yet.
                        </td>
                      </tr>
                    ) : (
                      entitlements.map((ent) => (
                        <tr key={ent.id} className="hover:bg-rose-950/20">
                          <td className="p-3 font-mono text-[10px] text-rose-300">{ent.user_id || ent.userId}</td>
                          <td className="p-3 font-bold text-amber-300">{(ent.plan_id || ent.planId || '').toUpperCase()}</td>
                          <td className="p-3 text-[10px] text-slate-400">
                            {new Date(ent.start_date || ent.startDate).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-[10px] text-slate-400">
                            {new Date(ent.expiration_date || ent.expirationDate).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              {ent.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleRevokeVip(ent.user_id || ent.userId)}
                              className="px-2.5 py-1 bg-red-950 text-red-300 hover:bg-red-900 rounded-lg text-[10px] font-bold border border-red-800"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: LIVE CONVERSATIONS */}
          {activeTab === 'conversations' && !isLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-white tracking-wide uppercase">Active Conversation Channels</h3>
                  <p className="text-[10px] text-slate-400">All live member dialogues and messages across Telegram and WebApp</p>
                </div>
                <button
                  onClick={() => loadTabData('conversations')}
                  className="px-3 py-1.5 bg-[#180d28] hover:bg-rose-950 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#180b28] text-slate-400 uppercase font-extrabold text-[10px] border-b border-rose-900/30">
                    <tr>
                      <th className="p-3">Character</th>
                      <th className="p-3">Member / User</th>
                      <th className="p-3">Messages</th>
                      <th className="p-3">Last Activity</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-950">
                    {conversations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          No conversation records found.
                        </td>
                      </tr>
                    ) : (
                      conversations.map((c) => (
                        <tr key={c.id} className="hover:bg-rose-950/20">
                          <td className="p-3">
                            <div className="flex items-center space-x-2.5">
                              {c.character_avatar ? (
                                <img
                                  src={c.character_avatar}
                                  alt={c.character_name || c.character_id}
                                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-rose-500/40 shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-700/60 flex items-center justify-center font-bold text-rose-300 text-[10px] shrink-0">
                                  {(c.character_name || c.character_id || 'C')[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-extrabold text-white">{c.character_name || c.character_id}</p>
                                <p className="text-[10px] text-rose-300/80 font-mono">{c.character_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-200">{c.username || c.user_id}</p>
                              <p className="font-mono text-[10px] text-rose-400">{c.user_id}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/40">
                                {c.message_count || 0} msgs
                              </span>
                              {c.last_message && (
                                <p className="text-[10px] text-slate-400 italic max-w-[180px] truncate">
                                  "{c.last_message}"
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-[10px] text-slate-400">
                            {new Date(c.updated_at).toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleInspectChat(c.user_id, c.character_id, c.character_name, c.username, c.character_avatar)}
                              className="px-2.5 py-1.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl text-[10px] font-black shadow flex items-center gap-1 ml-auto"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect Chat</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: BACKUP & DATABASE */}
          {activeTab === 'backup' && !isLoading && (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Supabase Cloud Database Live Status Card */}
              <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <span>Supabase Live Cloud Database</span>
                        {supabaseStatus?.liveConnected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Connected & Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-950/80 text-amber-300 border border-amber-500/50">
                            {supabaseStatus?.isConfigured ? 'Connecting...' : 'Environment Keys Active'}
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-400">All character memory facts, profiles, and Telegram chats sync here</p>
                    </div>
                  </div>

                  <button
                    onClick={fetchSupabaseStatus}
                    disabled={isCheckingSupabase}
                    className="px-3 py-1.5 bg-[#180d28] hover:bg-rose-950 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <RotateCcw className={`w-3 h-3 ${isCheckingSupabase ? 'animate-spin' : ''}`} />
                    <span>Ping Supabase</span>
                  </button>
                </div>

                <div className="p-3.5 bg-[#180d28] rounded-xl border border-rose-900/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Connected Project URL:</span>
                    <span className="font-mono text-white text-[11px] font-bold truncate max-w-[240px]">
                      {supabaseStatus?.supabaseUrl || 'Loading...'}
                    </span>
                  </div>
                  {supabaseStatus?.tableStats && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-rose-900/30">
                      <div className="bg-[#12071f] p-2 rounded-lg text-center">
                        <p className="text-[10px] text-slate-400">Characters</p>
                        <p className="text-sm font-black text-rose-300">{supabaseStatus.tableStats.characters}</p>
                      </div>
                      <div className="bg-[#12071f] p-2 rounded-lg text-center">
                        <p className="text-[10px] text-slate-400">User Profiles</p>
                        <p className="text-sm font-black text-emerald-300">{supabaseStatus.tableStats.profiles}</p>
                      </div>
                      <div className="bg-[#12071f] p-2 rounded-lg text-center">
                        <p className="text-[10px] text-slate-400">Live Messages</p>
                        <p className="text-sm font-black text-sky-300">{supabaseStatus.tableStats.messages}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Data Management & Platform Recovery</h3>
                    <p className="text-[10px] text-slate-400">Export JSON backups or perform factory resets</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-4 bg-[#180d28] border border-rose-900/40 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">Export Complete JSON Backup</p>
                      <p className="text-[10px] text-slate-400">Downloads all custom characters, user balances, and configurations.</p>
                    </div>
                    <button
                      onClick={handleExportBackup}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download JSON
                    </button>
                  </div>

                  <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-red-300 text-xs">Reset Platform to Factory Defaults</p>
                      <p className="text-[10px] text-slate-400">Erases custom characters and resets mock balances to default state.</p>
                    </div>
                    <button
                      onClick={handleResetDatabase}
                      className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Database
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: AUDIT TRAIL */}
          {activeTab === 'audit' && !isLoading && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-white tracking-wide uppercase">Admin Action Audit Log</h3>
              <div className="bg-[#140a1f] border border-rose-900/40 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#180b28] text-slate-400 uppercase font-extrabold text-[10px] border-b border-rose-900/30">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-950">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-500">
                          No audit logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-rose-950/20">
                          <td className="p-3 text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="p-3 font-bold text-rose-300">{log.action}</td>
                          <td className="p-3 text-[10px] text-slate-300">{log.target_type} ({log.target_id})</td>
                          <td className="p-3 font-mono text-[10px] text-slate-400">
                            {JSON.stringify(log.details || {})}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Balance Modal */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#180b28] border border-rose-800/80 p-5 rounded-3xl w-full max-w-sm space-y-4 text-slate-200">
            <h3 className="font-extrabold text-sm text-white">
              Adjust Coins for @{selectedUserForBalance.username || selectedUserForBalance.id}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Starlight Energy (+ or -)</label>
                <input
                  type="number"
                  value={energyDelta}
                  onChange={(e) => setEnergyDelta(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Ruby Gems (+ or -)</label>
                <input
                  type="number"
                  value={gemsDelta}
                  onChange={(e) => setGemsDelta(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2.5 text-white"
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

      {/* Grant VIP Modal */}
      {selectedUserForVip && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#180b28] border border-rose-800/80 p-5 rounded-3xl w-full max-w-sm space-y-4 text-slate-200">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              Grant VIP for @{selectedUserForVip.username || selectedUserForVip.id}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Select VIP Tier</label>
                <select
                  value={vipPlanId}
                  onChange={(e) => setVipPlanId(e.target.value)}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2.5 text-white"
                >
                  <option value="vip_weekly">Weekly VIP (7 Days)</option>
                  <option value="vip_monthly">Monthly VIP (30 Days)</option>
                  <option value="vip_yearly">Yearly VIP (365 Days)</option>
                  <option value="vip_lifetime">Lifetime VIP (Unlimited)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Duration (Days)</label>
                <input
                  type="number"
                  value={vipDays}
                  onChange={(e) => setVipDays(parseInt(e.target.value, 10) || 30)}
                  className="w-full bg-[#12081f] border border-rose-900/50 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedUserForVip(null)}
                className="px-3.5 py-2 bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantVip}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 text-white rounded-xl text-xs font-black shadow"
              >
                Confirm VIP
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
              {editingCharacter.id ? 'Edit Character' : 'Create New 18+ Character'}
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
                <label className="text-slate-400 font-bold block mb-1">Title / Persona Role</label>
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
                <label className="text-slate-400 font-bold block mb-1">Background / Lore</label>
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
                <label className="text-slate-400 font-bold block mb-1">System Prompt (AI Persona Guidelines)</label>
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

      {/* INSPECT CHAT TRANSCRIPT MODAL */}
      {inspectChatModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-[#12081c] border border-rose-900/60 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-rose-950 via-slate-950 to-purple-950 px-5 py-4 border-b border-rose-900/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {inspectChatModal.characterAvatar ? (
                  <img
                    src={inspectChatModal.characterAvatar}
                    alt={inspectChatModal.characterName}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-rose-500/50"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-rose-950 flex items-center justify-center text-rose-300 font-bold">
                    {(inspectChatModal.characterName || 'C')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>{inspectChatModal.characterName}</span>
                    <span className="text-xs text-slate-400 font-normal font-sans">with</span>
                    <span className="text-xs text-rose-300 font-mono">@{inspectChatModal.username}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    User: {inspectChatModal.userId} • Total Messages: {inspectChatModal.messages.length}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectChatModal(null)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              {inspectChatModal.messages.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No chat messages found for this dialogue channel.
                </div>
              ) : (
                inspectChatModal.messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`p-3.5 rounded-2xl max-w-[85%] space-y-1 ${
                      msg.sender === 'user'
                        ? 'ml-auto bg-gradient-to-br from-rose-950/80 to-purple-950/80 border border-rose-600/40 text-rose-100'
                        : 'mr-auto bg-[#180d28] border border-rose-900/30 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 gap-2 font-mono">
                      <span className={msg.sender === 'user' ? 'text-rose-300 font-bold' : 'text-purple-300 font-bold'}>
                        {msg.sender === 'user' ? `👤 User (@${inspectChatModal.username})` : `🤖 ${inspectChatModal.characterName}`}
                      </span>
                      <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</span>
                    </div>
                    <p className="font-sans leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    {msg.emotion && (
                      <span className="text-[9px] bg-rose-950/60 text-rose-300 px-1.5 py-0.5 rounded-full inline-block border border-rose-800/30">
                        Emotion: {msg.emotion}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-[#160a22] border-t border-rose-900/30 flex items-center justify-end">
              <button
                onClick={() => setInspectChatModal(null)}
                className="px-4 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800/60 rounded-xl text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER CHATS OVERVIEW MODAL */}
      {userChatsOverview && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-[#12081c] border border-purple-900/60 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-purple-950 via-slate-950 to-rose-950 px-5 py-4 border-b border-purple-900/30 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>Conversations of @{userChatsOverview.username}</span>
                </h3>
                <p className="text-[10px] text-purple-300/80 font-mono">
                  User ID: {userChatsOverview.userId} • Total Active Characters: {userChatsOverview.chats.length}
                </p>
              </div>

              <button
                onClick={() => setUserChatsOverview(null)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 text-xs">
              {userChatsOverview.chats.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  This user has not started any conversations yet.
                </div>
              ) : (
                userChatsOverview.chats.map((chat) => (
                  <div
                    key={chat.characterId}
                    className="bg-[#180d28] border border-rose-900/30 hover:border-rose-700/60 p-3 rounded-2xl flex items-center justify-between gap-3 shadow transition-all"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <img
                        src={chat.character.avatar}
                        alt={chat.character.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-rose-500/40 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-xs truncate">{chat.character.name}</h4>
                          <span className="text-[10px] text-rose-300 font-mono">
                            {chat.messageCount} msgs
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {chat.lastMessage ? chat.lastMessage.text : chat.character.greeting}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleInspectChat(
                          userChatsOverview.userId,
                          chat.characterId,
                          chat.character.name,
                          userChatsOverview.username,
                          chat.character.avatar
                        )
                      }
                      className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-xl text-[10px] font-black shadow shrink-0 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-[#160a22] border-t border-purple-900/30 flex items-center justify-end">
              <button
                onClick={() => setUserChatsOverview(null)}
                className="px-4 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800/60 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
