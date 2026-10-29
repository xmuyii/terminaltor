import React, { useState, useEffect } from 'react';
import Navigation, { AppView } from './components/Navigation';
import LandingHero from './components/LandingHero';
import HomeTabBar from './components/HomeTabBar';
import QuestMap from './components/QuestMap';
import WorkspacePage from './app/workspace/[questId]/page';
import InstructorConsole from './components/InstructorConsole';
import PassModal from './components/PassModal';
import LeaderboardModal from './components/LeaderboardModal';
import DailyQuestsModal from './components/DailyQuestsModal';
import CreditsModal from './components/CreditsModal';
import TelegramAuthModal from './components/TelegramAuthModal';
import SadisticGameMasterBubble from './components/SadisticGameMasterBubble';
import { WifiOff, AlertTriangle, ShieldCheck, X, GraduationCap } from 'lucide-react';
import ArcadePage from './pages/ArcadePage';
import TeacherDashboard from './pages/TeacherDashboard';
import AcademyDashboard from './pages/AcademyDashboard';
import AcademySignup from './pages/AcademySignup';
import AcademyJoin from './pages/AcademyJoin';
import { SupabaseStore } from './lib/supabase';
import { retentionService } from './lib/retentionService';
import { academyService } from './lib/academyService';
import { telegramAuth } from './lib/telegramAuth';
import { Profile, UserProgress, UserRole } from './types';

export default function App() {
  const [initialJoinCode, setInitialJoinCode] = useState<string>('');
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash.startsWith('#join-academy-')) {
        return 'academy-join';
      }
      if (window.location.pathname.startsWith('/arcade') || window.location.hash === '#arcade') {
        return 'arcade';
      }
      if (window.location.pathname.startsWith('/teach') || window.location.hash === '#teach') {
        return 'teach';
      }
      if (window.location.hash === '#academies') {
        return 'academy-dashboard';
      }
    }
    return 'sandbox';
  });

  const [activeQuestId, setActiveQuestId] = useState<string>('quest-1');
  const [profile, setProfile] = useState<Profile>(() => SupabaseStore.getProfile());
  const [progress, setProgress] = useState<Record<string, UserProgress>>(() => SupabaseStore.getProgress());
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isDailyQuestsModalOpen, setIsDailyQuestsModalOpen] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [streakProtectedBanner, setStreakProtectedBanner] = useState<string | null>(null);
  const [allianceUnlockedBanner, setAllianceUnlockedBanner] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  
  // Track if player is in an active multiplayer arcade room
  const [isArcadeInRoom, setIsArcadeInRoom] = useState(false);
  const [pendingView, setPendingView] = useState<AppView | null>(null);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);

  // Automatically detect Telegram WebApp user session if running inside Telegram
  useEffect(() => {
    const tgSession = telegramAuth.detectTelegramWebApp();
    if (tgSession) {
      setProfile(SupabaseStore.getProfile());
    }
  }, []);

  // Automatically open credits modal if user attempts submission without enough credits
  useEffect(() => {
    const handleInsufficientCredits = () => {
      setIsCreditsModalOpen(true);
    };
    window.addEventListener('sovereign_insufficient_credits', handleInsufficientCredits);
    return () => window.removeEventListener('sovereign_insufficient_credits', handleInsufficientCredits);
  }, []);

  // Check URL hash for direct join links (#join-academy-LOV300)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#join-academy-')) {
        const code = hash.replace('#join-academy-', '').trim();
        setInitialJoinCode(code);
        setCurrentView('academy-join');
      }
    }
  }, []);

  // Phase 5.5: Dual-track entitlement check
  useEffect(() => {
    academyService.getEffectiveTier(profile.id, profile.has_pro_pass).then((entitlement) => {
      if (entitlement.source === 'academy' && (entitlement.tier === 'premium' || entitlement.tier === 'pro')) {
        if (!profile.has_pro_pass) {
          const updated = SupabaseStore.updateProfile({ has_pro_pass: true });
          setProfile(updated);
          setAllianceUnlockedBanner(
            `🎓 Welcome to ${entitlement.academyName || 'your Alliance'}! Sovereign ${entitlement.tier.toUpperCase()} perks unlocked via your school alliance seat.`
          );
        }
      }
    });
  }, [profile.id, profile.has_pro_pass]);

  // Phase 9A: Automatic streak protection check on session start
  useEffect(() => {
    const tier = profile.has_pro_pass ? 'pro' : 'free';
    retentionService.checkStreakFreeze(profile.id || 'student_demo', tier).then((res) => {
      if (res.applied) {
        setStreakProtectedBanner(res.message || 'Streak freeze applied');
      }
    }).catch(() => {
      // Fallback
    });

    const handleStreakProtected = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail?.message) {
        setStreakProtectedBanner(customEvent.detail.message);
      }
    };

    window.addEventListener('sovereign_streak_protected', handleStreakProtected);
    return () => window.removeEventListener('sovereign_streak_protected', handleStreakProtected);
  }, [profile.id, profile.has_pro_pass]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync state whenever local store updates
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Profile>;
      setProfile(customEvent.detail);
    };

    const handleProgressUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, UserProgress>>;
      setProgress(customEvent.detail);
    };

    window.addEventListener('sovereign_profile_updated', handleProfileUpdate);
    window.addEventListener('sovereign_progress_updated', handleProgressUpdate);

    return () => {
      window.removeEventListener('sovereign_profile_updated', handleProfileUpdate);
      window.removeEventListener('sovereign_progress_updated', handleProgressUpdate);
    };
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    const updated = SupabaseStore.setRole(newRole);
    setProfile(updated);
  };

  const handleSelectQuest = (questId: string) => {
    setActiveQuestId(questId);
    setCurrentView('workspace');
  };

  const handleResetProgress = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('sovereign_progress_v1');
        localStorage.removeItem('sovereign_profile_v1');
      } catch {}
    }
    const freshProfile = SupabaseStore.updateProfile({
      xp_points: 0,
      streak_days: 1,
      has_pro_pass: false,
    });
    setProfile(freshProfile);
    setProgress({});
  };

  const handleNavigate = (view: AppView) => {
    if (currentView === 'arcade' && isArcadeInRoom && view !== 'arcade') {
      setPendingView(view);
      setShowLeaveWarning(true);
      return;
    }
    setCurrentView(view);
  };

  const handleConfirmLeaveRoom = () => {
    setShowLeaveWarning(false);
    setIsArcadeInRoom(false);
    if (pendingView) {
      setCurrentView(pendingView);
      setPendingView(null);
    }
  };

  const isLightPage = currentView === 'arcade' || currentView === 'academy-dashboard' || currentView === 'academy-signup' || currentView === 'academy-join';

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isLightPage ? 'bg-[#f4fbf7] text-slate-800' : 'bg-[#070b14] text-slate-100 selection:bg-sky-500/30 selection:text-sky-200'}`}>
      {/* Top Bar Navigation (Always pinned at top with Tokens, Daily Quests, Leaderboards, Telegram) */}
      <Navigation
        currentView={currentView}
        onNavigate={handleNavigate}
        profile={profile}
        onOpenPassModal={() => setIsPassModalOpen(true)}
        onOpenLeaderboardModal={() => setIsLeaderboardModalOpen(true)}
        onOpenDailyQuestsModal={() => setIsDailyQuestsModalOpen(true)}
        onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        onRoleChange={handleRoleChange}
      />

      {/* Alliance Elevation Banner (Phase 5.5) */}
      {allianceUnlockedBanner && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-sm animate-in slide-in-from-top duration-300">
          <GraduationCap className="w-4 h-4 text-emerald-200" />
          <span>{allianceUnlockedBanner}</span>
          <button
            type="button"
            onClick={() => setAllianceUnlockedBanner(null)}
            className="p-0.5 hover:bg-white/20 rounded ml-2 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Streak Protected Banner (Phase 9A) */}
      {streakProtectedBanner && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 border-b border-emerald-300 text-slate-950 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm animate-in slide-in-from-top duration-300">
          <ShieldCheck className="w-4 h-4 text-slate-950" />
          <span>{streakProtectedBanner} — Your streak freeze was automatically applied to preserve your progress!</span>
          <button
            type="button"
            onClick={() => setStreakProtectedBanner(null)}
            className="p-0.5 hover:bg-slate-950/10 rounded ml-2 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </div>
      )}

      {/* Offline Mode Banner */}
      {!isOnline && (
        <div className="bg-amber-950/90 border-b border-amber-600/50 px-4 py-2 text-center text-xs text-amber-200 font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Offline — you can browse, but you can&apos;t run code right now.</span>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'sandbox' && (
          <div className="space-y-6">
            <LandingHero
              onEnterQuestLine={() => setCurrentView('quests')}
              onOpenPassModal={() => setIsPassModalOpen(true)}
            />
            {/* Homepage Tabs: Multiplayer Arcade, Academy Alliances, Classroom */}
            <HomeTabBar
              currentView={currentView}
              onNavigate={handleNavigate}
              profile={profile}
              onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
              onOpenDailyQuestsModal={() => setIsDailyQuestsModalOpen(true)}
              onOpenPassModal={() => setIsPassModalOpen(true)}
            />
          </div>
        )}

        {currentView === 'quests' && (
          <QuestMap
            profile={profile}
            progress={progress}
            onSelectQuest={handleSelectQuest}
            onOpenPassModal={() => setIsPassModalOpen(true)}
            onResetProgress={handleResetProgress}
          />
        )}

        {currentView === 'workspace' && (
          <WorkspacePage
            questId={activeQuestId}
            onBackToQuests={() => setCurrentView('quests')}
            onOpenPassModal={() => setIsPassModalOpen(true)}
          />
        )}

        {currentView === 'instructor' && (
          <InstructorConsole
            currentProfile={profile}
            onSelectQuest={handleSelectQuest}
            onNavigateToSignup={() => setCurrentView('academy-signup')}
          />
        )}

        {currentView === 'arcade' && (
          <ArcadePage
            currentProfile={profile}
            onBackToLobby={() => setCurrentView('sandbox')}
            onInRoomChange={(inRoom) => setIsArcadeInRoom(inRoom)}
          />
        )}

        {currentView === 'teach' && (
          <TeacherDashboard
            currentProfile={profile}
            onSelectQuest={handleSelectQuest}
            onBackToApp={() => setCurrentView('sandbox')}
          />
        )}

        {currentView === 'academy-dashboard' && (
          <AcademyDashboard
            currentProfile={profile}
            onBackToApp={() => setCurrentView('sandbox')}
            onNavigateToSignup={() => setCurrentView('academy-signup')}
          />
        )}

        {currentView === 'academy-signup' && (
          <AcademySignup
            currentProfile={profile}
            onSuccess={() => setCurrentView('academy-dashboard')}
            onCancel={() => setCurrentView('academy-dashboard')}
          />
        )}

        {currentView === 'academy-join' && (
          <AcademyJoin
            currentProfile={profile}
            initialCode={initialJoinCode}
            onSuccess={() => setCurrentView('quests')}
            onCancel={() => setCurrentView('sandbox')}
          />
        )}
      </main>

      {/* Sovereign Creator Pass Modal */}
      <PassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        profile={profile}
        onPassUpdated={(updated) => setProfile(updated)}
      />

      {/* Telegram Single Sign-On & Instructor Passcode Modal */}
      <TelegramAuthModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        profile={profile}
        onProfileUpdated={(updated) => setProfile(updated)}
        onNavigateToAcademySignup={() => {
          setIsTelegramModalOpen(false);
          setCurrentView('academy-signup');
        }}
      />

      {/* Multi-Timeframe Classroom Leaderboards Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
        currentProfile={profile}
      />

      {/* Daily Rotating Quests Modal (Phase 9A) */}
      <DailyQuestsModal
        isOpen={isDailyQuestsModalOpen}
        onClose={() => setIsDailyQuestsModalOpen(false)}
        currentProfile={profile}
        onNavigateToQuest={() => setCurrentView('quests')}
      />

      {/* Arcade Credits Economy & Top-Up Modal */}
      <CreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        profile={profile}
        onCreditsUpdated={() => setProfile(SupabaseStore.getProfile())}
      />

      {/* Leave Room Confirmation Warning Modal when navigating away from live arcade room */}
      {showLeaveWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Leave Arena Room?</h3>
                <p className="text-xs text-slate-400">Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              A live multiplayer round is currently in progress. If you navigate away, the game will keep going for players remaining in the room. You can return anytime.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLeaveWarning(false);
                  setPendingView(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Stay in Game
              </button>
              <button
                type="button"
                onClick={handleConfirmLeaveRoom}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Yes, Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official IRETE LABS Footer */}
      <footer className="border-t border-slate-900 bg-[#050810] px-6 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span className="font-mono text-slate-400">
              Studio: <strong className="text-slate-200 font-bold">IRETE LABS</strong>
            </span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="font-mono text-slate-400">
              Product: <strong className="text-emerald-400 font-bold">TERMINALTOR</strong>
            </span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="font-mono text-slate-400">
              Tech: <strong className="text-teal-300 font-bold">Powered by Ose Engine</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setCurrentView('academy-signup')}
              className="hover:text-emerald-400 transition-colors"
            >
              School Alliances (⭐️ 675 Stars/mo)
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('academy-join')}
              className="hover:text-emerald-400 transition-colors"
            >
              Have a School Code?
            </button>
          </div>
        </div>
      </footer>

      {/* The Sadistic Game Master Floating Onboarding Bubble & Gemini Agent */}
      <SadisticGameMasterBubble
        currentUsername={profile.username}
        selectedMode="wordforge"
        inMultiplayer={currentView === 'arcade' && isArcadeInRoom}
      />
    </div>
  );
}
