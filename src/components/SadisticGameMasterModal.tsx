import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Flame,
  Zap,
  Sparkles,
  Bot,
  Send,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { SADISTIC_QUESTS } from '../lib/gameMasterService';

interface SadisticGameMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMode: 'wordforge' | 'debugshunting';
  onLeaderboardMutated?: () => void;
  currentUsername?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'gamemaster';
  text: string;
  timestamp: number;
}

const GAME_MASTER_IMG = '/assets/aistudio/Gemini_Generated_Image_4emglu4emglu4emg_baf4003d.png';

export const SadisticGameMasterModal: React.FC<SadisticGameMasterModalProps> = ({
  isOpen,
  onClose,
  selectedMode,
  currentUsername = 'Cadet',
}) => {
  const [activeTab, setActiveTab] = useState<'private_chat' | 'quests'>('private_chat');
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init_gm_1',
      sender: 'gamemaster',
      text: `“Step into my sanctum, ${currentUsername}. In private chat, I will push you to level up and outsmart every contender on this platform. But in the multiplayer arena, I will show you no mercy. What knowledge do you seek?”`,
      timestamp: Date.now(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'private_chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  if (!isOpen) return null;

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
            inMultiplayer: false,
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
          text: data.reply || `“Listen closely, ${currentUsername}. True mastery demands speed and accuracy. Isolate the base cases and strike with precision.”`,
          timestamp: Date.now(),
        },
      ]);
    } catch {
      // Dynamic In-Character Fallback
      const clean = text.toLowerCase();
      let fallbackText = '';
      if (clean.includes('how') || clean.includes('win')) {
        fallbackText = `“In Code Forgers, ignore 3-letter bait. Look at the seed letters and drill 6-letter roots. In Debugs Hunting, read the target assertion backwards: if expected is True, check boolean logic; if a number, check loop boundary.”`;
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0e071a] border-2 border-purple-500/70 rounded-3xl max-w-2xl w-full shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header Banner */}
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
            onClick={onClose}
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
            <div className="flex flex-col h-full min-h-[340px] max-h-[440px] space-y-3">
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

              {/* Quick Questions */}
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
  );
};

export default SadisticGameMasterModal;
