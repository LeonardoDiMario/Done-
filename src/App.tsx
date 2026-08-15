import React, { useState, useEffect } from 'react';
import { TelegramHeader } from './components/TelegramHeader';
import { CharacterList } from './components/CharacterList';
import { HomeView } from './components/HomeView';
import { ChatsView } from './components/ChatsView';
import { SettingsView } from './components/SettingsView';
import { ChatScreen } from './components/ChatScreen';
import { MemoryLedgerModal } from './components/MemoryLedgerModal';
import { UserSettingsModal } from './components/UserSettingsModal';
import { CharacterCreatorModal } from './components/CharacterCreatorModal';
import { StoreModal, ActiveEntitlement } from './components/StoreModal';
import { FloatingBottomNav } from './components/FloatingBottomNav';
import { AgeGateModal } from './components/AgeGateModal';
import { CharacterDetailModal } from './components/CharacterDetailModal';
import { LegalSupportModal, PolicyType } from './components/LegalSupportModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { Character, ChatMessage, MemoryFact, UserPreferences, UserRelationship } from './types';
import { initTelegramApp, triggerHaptic } from './utils/telegramSdk';
import { apiFetch } from './utils/api';

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [selectedCharacterForModal, setSelectedCharacterForModal] = useState<Character | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [memories, setMemories] = useState<MemoryFact[]>([]);
  const [relationships, setRelationships] = useState<Record<string, UserRelationship>>({});

  // 18+ Age Gate & Terms Consent State
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => {
    return localStorage.getItem('ruby_chan_age_verified') === 'true';
  });

  // Legal & Support Modal State
  const [policyModalType, setPolicyModalType] = useState<PolicyType | null>(null);

  // Energy & Gems Currency
  const [energy, setEnergy] = useState<number>(50);
  const [gems, setGems] = useState<number>(0);
  const [activeEntitlement, setActiveEntitlement] = useState<ActiveEntitlement | null>(null);

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    language: 'auto',
    theme: 'telegram-dark',
    userPersona: {
      name: 'Traveler',
      pronouns: 'They/Them',
      bio: 'An adventurous explorer journeying through the multiverse.',
      relationshipStyle: 'Friendly & Supportive'
    },
    rpStyle: 'narrative',
    responseLength: 'balanced',
    aiTemperature: 0.85,
    speechEnabled: true,
    autoExtractMemories: true
  });

  const [activeTab, setActiveTab] = useState<'home' | 'characters' | 'chats' | 'settings'>('home');
  const [isNavVisible, setIsNavVisible] = useState<boolean>(true);
  const lastScrollTopRef = React.useRef<number>(0);

  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState<boolean>(false);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [selectedMemoryCharacter, setSelectedMemoryCharacter] = useState<Character | null>(null);
  const [initialScenario, setInitialScenario] = useState<string | null>(null);

  const isBurmese = userPreferences.language === 'my' || userPreferences.language === 'auto';
  const isPremiumUser = activeEntitlement?.status === 'active';

  useEffect(() => {
    initTelegramApp();
    fetchUserProfile();
    fetchCharacters();
    fetchPreferences();

    // Check for secret owner admin portal query param ?admin=true or /owner-login or /admin path
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    if (
      params.get('admin') === 'true' ||
      params.get('admin') === 'rubychan' ||
      params.get('admin') === '1' ||
      params.get('admin') === 'owner' ||
      params.get('owner') === '1' ||
      params.get('owner') === 'true' ||
      params.get('key') === 'rubychan_admin_2026' ||
      path === '/admin' ||
      path === '/owner' ||
      path === '/owner-login'
    ) {
      localStorage.setItem('rubychan_admin_key', 'rubychan_admin_2026');
      setIsAdminModalOpen(true);
    }
  }, []);

  const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    const diff = currentScrollTop - lastScrollTopRef.current;

    if (currentScrollTop < 20) {
      setIsNavVisible(true);
    } else if (diff > 4) {
      // Scroll Down -> Hide bottom nav immediately
      setIsNavVisible(false);
    } else if (diff < -4) {
      // Scroll Up -> Show bottom nav
      setIsNavVisible(true);
    }

    lastScrollTopRef.current = currentScrollTop;
  };

  // Window scroll fallback for Telegram WebApp or outer page scrolling
  useEffect(() => {
    let lastY = window.scrollY;
    const onWinScroll = () => {
      const currY = window.scrollY;
      const diff = currY - lastY;
      if (currY < 20) {
        setIsNavVisible(true);
      } else if (diff > 4) {
        setIsNavVisible(false);
      } else if (diff < -4) {
        setIsNavVisible(true);
      }
      lastY = currY;
    };
    window.addEventListener('scroll', onWinScroll, { passive: true });
    return () => window.removeEventListener('scroll', onWinScroll);
  }, []);

  // Fetch User Profile, Energy, Gems, and Active VIP Plan from Supabase
  const fetchUserProfile = async () => {
    try {
      const res = await apiFetch('/api/user/profile');
      const data = await res.json();
      if (data.profile) {
        setEnergy(data.profile.energy ?? 50);
        setGems(data.profile.gems ?? 0);
        if (data.profile.age_verified && data.profile.terms_accepted) {
          setIsAgeVerified(true);
        }
      }
      if (data.entitlement) {
        setActiveEntitlement(data.entitlement);
      }
    } catch (err) {
      console.error('Error fetching user profile from Supabase:', err);
    }
  };

  // Confirm Age and Terms Consent (Persisted to Supabase)
  const handleConfirmAge = async (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('ruby_chan_age_verified', 'true');
    }
    setIsAgeVerified(true);

    try {
      await apiFetch('/api/user/consent', {
        method: 'POST',
        body: JSON.stringify({
          ageVerified: true,
          termsAccepted: true,
          privacyPolicyAccepted: true
        })
      });
    } catch (err) {
      console.error('Error recording consent in Supabase:', err);
    }
  };

  // Fetch Characters
  const fetchCharacters = async () => {
    try {
      const res = await apiFetch('/api/characters');
      const data = await res.json();
      if (data.characters) {
        setCharacters(data.characters);
        data.characters.forEach((c: Character) => {
          fetchChatHistory(c.id);
        });
      }
    } catch (err) {
      console.error('Error fetching characters:', err);
    }
  };

  // Fetch User Preferences
  const fetchPreferences = async () => {
    try {
      const res = await apiFetch('/api/preferences');
      const data = await res.json();
      if (data.preferences) {
        setUserPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  };

  // Card Click -> Opens Character Popup Modal (Does NOT immediately open Telegram!)
  const handleCardSelectCharacter = (char: Character) => {
    triggerHaptic('medium');
    setSelectedCharacterForModal(char);
  };

  // NEW CHAT Button in Character Popup -> Starts Chat directly on Telegram Bot
  const handleStartNewChat = async (char: Character, launchTelegram = true) => {
    setSelectedCharacterForModal(null);

    // Initialize conversation record in Supabase
    try {
      const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      await apiFetch('/api/conversations/init', {
        method: 'POST',
        body: JSON.stringify({
          characterId: char.id,
          telegramUserId
        })
      });
    } catch (err) {
      console.warn('Error initializing conversation in Supabase:', err);
    }

    // Pre-initialize chat history if empty
    if (!messagesMap[char.id] || messagesMap[char.id].length === 0) {
      await fetchChatHistory(char.id);
    }

    if (launchTelegram) {
      const telegramBotUrl = `https://t.me/Rubby_Chan_Bot?start=char_${encodeURIComponent(char.id)}`;
      triggerHaptic('heavy');

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(telegramBotUrl);
      } else {
        window.open(telegramBotUrl, '_blank');
      }
    } else {
      setIsNavVisible(false);
      setActiveCharacter(char);
    }
  };

  // Fetch Chat History
  const fetchChatHistory = async (characterId: string) => {
    try {
      const res = await apiFetch(`/api/chat/${characterId}`);
      const data = await res.json();
      if (data.messages) {
        setMessagesMap((prev) => ({ ...prev, [characterId]: data.messages }));
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  // Fetch Memory Bank
  const fetchMemories = async (characterId: string) => {
    try {
      const res = await apiFetch(`/api/memory/${characterId}`);
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error('Error fetching memories:', err);
    }
  };

  // Handle Send Message
  const handleSendMessage = async (text: string) => {
    if (!activeCharacter) return;

    try {
      const res = await apiFetch('/api/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          characterId: activeCharacter.id,
          messageText: text
        })
      });

      const data = await res.json();
      if (data.success) {
        fetchChatHistory(activeCharacter.id);
        fetchMemories(activeCharacter.id);
        fetchUserProfile(); // Refresh energy balance
        if (data.relationship) {
          setRelationships((prev) => ({ ...prev, [activeCharacter.id]: data.relationship }));
        }
      } else if (data.code === 'ENERGY_DEPLETED') {
        alert(data.error || 'Energy depleted!');
        setIsStoreOpen(true);
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
    }
  };

  // Clear Chat History
  const handleClearHistory = async (targetCharId?: string) => {
    const charId = targetCharId || activeCharacter?.id;
    if (!charId) return;
    try {
      const res = await apiFetch(`/api/chat/${charId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.messages) {
        setMessagesMap((prev) => ({ ...prev, [charId]: data.messages }));
      }
    } catch (err) {
      console.error('Error clearing chat history:', err);
    }
  };

  // Memory Actions
  const handleAddMemory = async (category: string, content: string) => {
    const targetChar = selectedMemoryCharacter || activeCharacter;
    if (!targetChar) return;

    try {
      const res = await apiFetch('/api/memory', {
        method: 'POST',
        body: JSON.stringify({
          characterId: targetChar.id,
          action: 'add',
          category,
          content
        })
      });
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error('Error adding memory:', err);
    }
  };

  const handleDeleteMemory = async (factId: string) => {
    const targetChar = selectedMemoryCharacter || activeCharacter;
    if (!targetChar) return;

    try {
      const res = await apiFetch('/api/memory', {
        method: 'POST',
        body: JSON.stringify({
          characterId: targetChar.id,
          action: 'delete',
          factId
        })
      });
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error('Error deleting memory:', err);
    }
  };

  const handleClearMemories = async () => {
    const targetChar = selectedMemoryCharacter || activeCharacter;
    if (!targetChar) return;

    try {
      const res = await apiFetch('/api/memory', {
        method: 'POST',
        body: JSON.stringify({
          characterId: targetChar.id,
          action: 'clear'
        })
      });
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error('Error clearing memories:', err);
    }
  };

  // Save Preferences
  const handleSavePreferences = async (updated: UserPreferences) => {
    try {
      const res = await apiFetch('/api/preferences', {
        method: 'POST',
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.preferences) {
        setUserPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
    }
  };

  // Create Custom Character
  const handleCreateCharacter = async (charData: any) => {
    try {
      const res = await apiFetch('/api/characters', {
        method: 'POST',
        body: JSON.stringify(charData)
      });
      const data = await res.json();
      if (data.success) {
        fetchCharacters();
      }
    } catch (err) {
      console.error('Error creating custom character:', err);
    }
  };

  // Delete Custom Character
  const handleDeleteCharacter = async (characterId: string) => {
    try {
      await apiFetch(`/api/characters/${characterId}`, { method: 'DELETE' });
      fetchCharacters();
      if (activeCharacter?.id === characterId) {
        setActiveCharacter(null);
      }
    } catch (err) {
      console.error('Error deleting character:', err);
    }
  };

  const handleOpenMemoryModal = (char: Character) => {
    setSelectedMemoryCharacter(char);
    fetchMemories(char.id);
    setIsMemoryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#07030a] text-slate-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* 18+ Age & Terms Verification Modal */}
      <AgeGateModal
        isOpen={!isAgeVerified}
        onConfirmAge={handleConfirmAge}
        onOpenPolicyModal={(type) => setPolicyModalType(type)}
      />

      {/* Main Telegram App Header */}
      <TelegramHeader
        activeCharacter={activeCharacter}
        onBackToCharacters={() => {
          setIsNavVisible(true);
          setActiveCharacter(null);
        }}
        energy={energy}
        gems={gems}
        activeEntitlement={activeEntitlement}
        onOpenStore={() => setIsStoreOpen(true)}
        language={userPreferences.language}
      />

      {/* Main Active View Container */}
      <div className="flex-1 overflow-y-auto" onScroll={handleMainScroll}>
        {activeCharacter ? (
          <ChatScreen
            character={activeCharacter}
            messages={messagesMap[activeCharacter.id] || []}
            relationship={relationships[activeCharacter.id]}
            onSendMessage={handleSendMessage}
            onBack={() => {
              setIsNavVisible(true);
              setActiveCharacter(null);
            }}
            onClearHistory={handleClearHistory}
            onOpenMemory={() => handleOpenMemoryModal(activeCharacter)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            initialScenario={initialScenario}
            userPreferences={userPreferences}
            isBurmese={isBurmese}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                characters={characters}
                userPreferences={userPreferences}
                energy={energy}
                gems={gems}
                onSelectCharacter={handleCardSelectCharacter}
                onOpenStore={() => setIsStoreOpen(true)}
                onCreateCharacter={() => setIsCreatorModalOpen(true)}
                onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
                onNavigateTab={(tab) => {
                  setIsNavVisible(true);
                  setActiveTab(tab);
                }}
                onAddGems={() => setIsStoreOpen(true)}
                onAddEnergy={() => setIsStoreOpen(true)}
              />
            )}

            {activeTab === 'characters' && (
              <CharacterList
                characters={characters}
                relationships={relationships}
                onSelectCharacter={handleCardSelectCharacter}
                onOpenMemory={handleOpenMemoryModal}
                onCreateCharacter={() => setIsCreatorModalOpen(true)}
                onDeleteCharacter={handleDeleteCharacter}
                isBurmese={isBurmese}
                language={userPreferences.language}
              />
            )}

            {activeTab === 'chats' && (
              <ChatsView
                characters={characters}
                messagesMap={messagesMap}
                activeMessages={messagesMap}
                relationships={relationships}
                onSelectCharacter={handleCardSelectCharacter}
                onStartChatting={() => setIsCreatorModalOpen(true)}
                onCreateCharacter={() => setIsCreatorModalOpen(true)}
                onClearHistoryForCharacter={(charId) => handleClearHistory(charId)}
                onDeleteMessagesForCharacter={async (charId, msgIds) => {
                  try {
                    await apiFetch(`/api/chat/${charId}/messages`, {
                      method: 'DELETE',
                      body: JSON.stringify({ messageIds: msgIds })
                    });
                    setMessagesMap((prev) => ({
                      ...prev,
                      [charId]: (prev[charId] || []).filter((m) => !msgIds.includes(m.id))
                    }));
                  } catch (err) {
                    console.error('Error deleting messages:', err);
                  }
                }}
                isBurmese={isBurmese}
                language={userPreferences.language}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                userPreferences={userPreferences}
                activeEntitlement={activeEntitlement}
                onSavePreferences={handleSavePreferences}
                onOpenStore={() => setIsStoreOpen(true)}
                onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
                onOpenMemoryLedger={() => handleOpenMemoryModal(activeCharacter || characters[0])}
                onOpenPolicyModal={(type) => setPolicyModalType(type)}
                isBurmese={isBurmese}
              />
            )}
          </>
        )}
      </div>

      {/* Floating Bottom Navigation */}
      {!activeCharacter && (
        <FloatingBottomNav
          activeTab={activeTab}
          language={userPreferences.language}
          onChangeTab={(tab) => {
            setIsNavVisible(true);
            setActiveTab(tab);
          }}
          onSelectTab={(tab) => {
            setIsNavVisible(true);
            setActiveTab(tab);
          }}
          isVisible={
            isNavVisible &&
            !selectedCharacterForModal &&
            !isSettingsModalOpen &&
            !isCreatorModalOpen &&
            !isStoreOpen &&
            !isMemoryModalOpen &&
            !policyModalType &&
            !isAdminModalOpen
          }
        />
      )}

      {/* Character Popup Detail Modal */}
      <CharacterDetailModal
        character={selectedCharacterForModal}
        relationship={selectedCharacterForModal ? relationships[selectedCharacterForModal.id] : undefined}
        isPremiumUser={isPremiumUser}
        onClose={() => setSelectedCharacterForModal(null)}
        onStartNewChat={handleStartNewChat}
        onOpenStore={() => {
          setSelectedCharacterForModal(null);
          setIsStoreOpen(true);
        }}
        onOpenMemory={(char) => {
          setSelectedCharacterForModal(null);
          handleOpenMemoryModal(char);
        }}
      />

      {/* Memory Ledger Modal */}
      <MemoryLedgerModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        character={selectedMemoryCharacter || activeCharacter}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearMemories={handleClearMemories}
        isBurmese={isBurmese}
      />

      {/* User Persona Settings Modal */}
      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userPreferences={userPreferences}
        onSavePreferences={handleSavePreferences}
        isBurmese={isBurmese}
      />

      {/* Custom Character Creator Modal */}
      <CharacterCreatorModal
        isOpen={isCreatorModalOpen}
        onClose={() => setIsCreatorModalOpen(false)}
        onCreateCharacter={handleCreateCharacter}
        isBurmese={isBurmese}
      />

      {/* Ruby Orbs & VIP Store Modal */}
      <StoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        energy={energy}
        gems={gems}
        activeEntitlement={activeEntitlement}
        onRefreshUserData={fetchUserProfile}
      />

      {/* Legal & Policy Viewer Modal */}
      <LegalSupportModal
        isOpen={!!policyModalType}
        type={policyModalType}
        onClose={() => setPolicyModalType(null)}
        isBurmese={isBurmese}
        language={userPreferences.language}
      />

      {/* Owner Admin Dashboard Modal */}
      {isAdminModalOpen && (
        <AdminDashboardModal
          onClose={() => setIsAdminModalOpen(false)}
          onCharactersUpdated={fetchCharacters}
        />
      )}
    </div>
  );
}
