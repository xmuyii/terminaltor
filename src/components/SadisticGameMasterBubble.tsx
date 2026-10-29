import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Zap,
  MessageSquare,
  Flame,
  Award,
  ChevronRight,
  Bot
} from 'lucide-react';
import { SADISTIC_QUESTS } from '../lib/gameMasterService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'gamemaster';
  text: string;
  timestamp: number;
}

interface SadisticGameMasterBubbleProps {
  currentUsername?: string;
  selectedMode?: 'wordforge' | 'debugshunting';
  inMultiplayer?: boolean;
}

const GAME_MASTER_IMG = '/assets/aistudio/Gemini_Generated_Image_4emglu4emglu4emg_baf4003d.png';
const ONBOARDING_STORAGE_KEY = 'sovereign_gm_onboarding_seen_v3';

export const SadisticGameMasterBubble: React.FC<SadisticGameMasterBubbleProps> = ({
  currentUsername = 'Cadet',
  selectedMode = 'wordforge',
  inMultiplayer = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showOnboardingTip, setShowOnboardingTip] = useState(false);
  const [activeTab, setActiveTab] = useState<'private_chat' | 'quests'>('private_chat');
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init_gm_1',
      sender: 'gamemaster',
      text: `“Step forward, ${currentUsername}. I am The Game Master. Here in private chat, I will push you to become a coding titan. But enter my multiplayer arena... and I will show you no mercy. What syntax or combat secrets do you seek?”`,
      timestamp: Date.now(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if onboarding prompt should be displayed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => {
        setShowOnboardingTip(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissOnboarding = () => {
    setShowOnboardingTip(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    }
  };

  const openAndDismiss = () => {
    dismissOnboarding();
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMsg).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/gamemaster/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            username: currentUsername,
            mode: selectedMode,
            inMultiplayer,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to reach Game Master');
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `gm_${Date.now()}`,
          sender: 'gamemaster',
          text: data.reply || `“Listen closely, ${currentUsername}. True mastery demands speed and accuracy. Isolate the base cases and never submit guesses blindly.”`,
          timestamp: Date.now(),
        },
      ]);
    } catch {
      // Dynamic In-Character Fallback
      const clean = text.toLowerCase();
      let fallbackText = '';
      if (clean.includes('how') || clean.includes('win')) {
        fallbackText = `“In Code Forgers, ignore 3-letter bait. Look at the seed letters and drill 6-letter roots. In Debugs Hunting, read the target assertion backwards: if expected is True, check the boolean logic; if a number, check loop boundary.”`;
      } else if (clean.includes('anagram')) {
        fallbackText = `“Sort letters mentally into vowel and consonant clusters. When you see P-E-A-R-S, form PEARS, SPARE, PARSE, APRES, and REAPS in rapid succession to trigger the 50-point bonus.”`;
      } else if (clean.includes('ok') || clean.includes('sure') || clean.includes('got it')) {
        fallbackText = `“Good. Acknowledgment means nothing without execution, ${currentUsername}. Go into the arena and prove you paid attention.”`;
      } else {
        fallbackText = `“I see potential in you, ${currentUsername}. Ask your question directly, challenger, and let me forge you into an unstoppable programmer.”`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `gm_${Date.now()}`,
          sender: 'gamemaster',
          text: fallbackText,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Game Master Avatar Bubble (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
        {/* Onboarding Dialogue Speech Bubble */}
        {showOnboardingTip && !isOpen && (
          <div className="mb-3 max-w-xs sm:max-w-sm bg-gradient-to-br from-[#120724] via-[#1a0a33] to-[#0c0418] border-2 border-amber-400/80 rounded-2xl p-4 shadow-2xl text-slate-100 animate-in fade-in slide-in-from-bottom-3 relative">
            {/* Close tip button */}
            <button
              type="button"
              onClick={dismissOnboarding}
              className="absolute top-2 right-2 p-1 text-purple-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-400 shrink-0 bg-slate-950 shadow-md">
                <img
                  src={GAME_MASTER_IMG}
                  alt="The Game Master"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-300 text-xs tracking-wide">
                    The Game Master
                  </span>
                  <span className="text-[9px] font-mono font-semibold bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded border border-purple-400/40">
                    Arbiter
                  </span>
                </div>
                <p className="text-[11px] text-purple-100 leading-snug">
                  “Greetings, <span className="font-semibold text-white">{currentUsername}</span>. Need tactical secrets or guidance? Ask me in private chat. But once you enter the arena, you are on your own.”
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openAndDismiss}
                    className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[11px] rounded-lg shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <span>Private Chat</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={dismissOnboarding}
                    className="px-2.5 py-1 text-[11px] text-purple-300 hover:text-white font-medium cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>

            {/* Speech bubble pointer arrow */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-[#1a0a33] border-r-2 border-b-2 border-amber-400/80 rotate-45" />
          </div>
        )}

        {/* Floating Bubble Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative group p-1.5 rounded-2xl bg-gradient-to-tr from-purple-950 via-indigo-900 to-purple-800 border-2 border-amber-400 shadow-xl hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          title="The Game Master: Private Chat & Guidance"
        >
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-400/60 bg-slate-950">
            <img
              src={GAME_MASTER_IMG}
              alt="The Game Master"
              className="w-full h-full object-cover object-top"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
          </div>
          <div className="hidden sm:flex flex-col text-left pr-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
              The Game Master
            </span>
            <span className="text-xs font-black text-white">
              Private Chat
            </span>
          </div>
        </button>
      </div>

      {/* Expanded Game Master Interactive Console Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e071a] border-2 border-purple-500/70 rounded-3xl max-w-2xl w-full shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header Banner with Full Portrait */}
            <div className="relative p-5 sm:p-6 bg-gradient-to-r from-purple-950/90 via-[#180a29] to-slate-900 border-b border-purple-800/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] shrink-0 bg-slate-950">
                  <img
                    src={GAME_MASTER_IMG}
                    alt="The Game Master Portrait"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                      The Game Master
                    </h2>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase">
                      Private Chambers
                    </span>
                  </div>
                  <p className="text-xs text-purple-300/80 leading-relaxed mt-0.5">
                    In private chat, I groom you into an apex sovereign. In multiplayer, I show no mercy.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center bg-[#150a24] px-4 py-2 border-b border-purple-900/40 text-xs font-bold gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('private_chat')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'private_chat'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-300/70 hover:text-white hover:bg-purple-950/60'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Private Chat</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quests')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'quests'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-300/70 hover:text-white hover:bg-purple-950/60'
                }`}
              >
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Quests</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* TAB 1: PRIVATE CHAT */}
              {activeTab === 'private_chat' && (
                <div className="flex flex-col h-full min-h-[360px] max-h-[460px] space-y-3">
                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {messages.map((m) => {
                      const isGM = m.sender === 'gamemaster';
                      return (
                        <div
                          key={m.id}
                          className={`flex items-start gap-2.5 ${
                            isGM ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          {isGM && (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400/80 shrink-0 bg-slate-950 mt-1">
                              <img
                                src={GAME_MASTER_IMG}
                                alt="GM"
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                          )}

                          <div
                            className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                              isGM
                                ? 'bg-[#1b0d2e] border border-purple-500/40 text-purple-100 font-sans'
                                : 'bg-purple-600 text-white font-medium ml-auto'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.text}</p>
                          </div>
                        </div>
                      );
                    })}
                    {isLoading && (
                      <div className="flex items-center gap-2 text-xs text-purple-300 font-mono italic animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                        <span>The Game Master is formulating your directive...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Tactical Questions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendMessage('How do I win Code Forgers matches?')}
                      className="px-2.5 py-1 text-[11px] bg-purple-950/70 hover:bg-purple-900 border border-purple-800/80 rounded-lg text-purple-200 transition-colors cursor-pointer"
                    >
                      💡 How do I win Code Forgers?
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMessage('How do I spot 6-letter anagrams faster?')}
                      className="px-2.5 py-1 text-[11px] bg-purple-950/70 hover:bg-purple-900 border border-purple-800/80 rounded-lg text-purple-200 transition-colors cursor-pointer"
                    >
                      🔤 Spot anagrams faster
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMessage('How do I keep high accuracy in Debugs Hunting?')}
                      className="px-2.5 py-1 text-[11px] bg-purple-950/70 hover:bg-purple-900 border border-purple-800/80 rounded-lg text-purple-200 transition-colors cursor-pointer"
                    >
                      🎯 Debugs Hunting accuracy
                    </button>
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2 pt-2 border-t border-purple-900/40"
                  >
                    <input
                      type="text"
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      placeholder="Ask The Game Master in private chat..."
                      className="flex-1 bg-slate-950/80 border border-purple-800/80 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/50 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!inputMsg.trim() || isLoading}
                      className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: QUESTS */}
              {activeTab === 'quests' && (
                <div className="space-y-3 text-xs">
                  <p className="text-purple-300/80 leading-relaxed text-[11px]">
                    The Game Master issues trials to test your endurance. Complete them to earn Crypto Tokens (🪙) and earn his respect.
                  </p>

                  <div className="space-y-2.5">
                    {SADISTIC_QUESTS.map((quest) => (
                      <div
                        key={quest.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-purple-900/60 hover:border-purple-500/50 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{quest.title}</span>
                            <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/60">
                              TRIAL
                            </span>
                          </div>
                          <p className="text-[11px] text-purple-200/90 italic leading-snug">
                            {quest.taunt}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Requirement: {quest.requirement}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-amber-400 text-xs">
                            +{quest.rewardCredits} 🪙 Tokens
                          </span>
                          <span className="block text-[10px] text-purple-300/60 font-mono">
                            {quest.completed ? 'CLAIMED' : 'ACTIVE'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SadisticGameMasterBubble;
