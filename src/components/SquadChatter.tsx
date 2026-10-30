import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Radio,
  Shield,
  Zap,
  Skull,
  ChevronDown,
  ChevronUp,
  Flame,
  Bug,
  Sparkles,
  Terminal,
} from 'lucide-react';

export interface SquadMessage {
  id: string;
  sender: string;
  callsign: string;
  role: 'striker' | 'tactician' | 'debugger' | 'sentinel' | 'player';
  text: string;
  timestamp: string;
  isCombatAlert?: boolean;
  avatarColor: string;
}

const DEFAULT_SQUAD_MESSAGES: SquadMessage[] = [
  {
    id: 'sq_1',
    sender: 'Ada',
    callsign: 'ByteStriker',
    role: 'striker',
    text: 'Compiling neural tree... Ose engine latency 12ms. Room is primed.',
    timestamp: 'Just now',
    avatarColor: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'sq_2',
    sender: 'Chidi',
    callsign: 'SyntaxGuard',
    role: 'debugger',
    text: 'Watch out for recursion traps in Sector 4. The Terminaltor is priming a loop overload!',
    timestamp: 'Just now',
    avatarColor: 'from-amber-400 to-orange-500',
  },
  {
    id: 'sq_3',
    sender: 'Zuri',
    callsign: 'CipherGhost',
    role: 'tactician',
    text: 'Mid-round letter surge hits at 90s. Save high-value letters for 6-letter keyword combos.',
    timestamp: '1m ago',
    avatarColor: 'from-sky-400 to-indigo-500',
  },
];

const AMBIENT_CHATS: Array<{
  sender: string;
  callsign: string;
  role: 'striker' | 'tactician' | 'debugger' | 'sentinel';
  text: string;
  avatarColor: string;
  isCombatAlert?: boolean;
}> = [
  {
    sender: 'Ada',
    callsign: 'ByteStriker',
    role: 'striker',
    text: 'Terminaltor logic core detected! Chain 3 valid keywords to trigger a shield breach.',
    avatarColor: 'from-emerald-400 to-teal-500',
    isCombatAlert: true,
  },
  {
    sender: 'Chidi',
    callsign: 'SyntaxGuard',
    role: 'debugger',
    text: 'Debug hint: Spot the missing colon or off-by-one bounds before buzz-in timer runs dry!',
    avatarColor: 'from-amber-400 to-orange-500',
  },
  {
    sender: 'Zuri',
    callsign: 'CipherGhost',
    role: 'tactician',
    text: 'Jammer active on rival sector! Their word typing buffer is scrambled for this round.',
    avatarColor: 'from-sky-400 to-indigo-500',
    isCombatAlert: true,
  },
  {
    sender: 'Sentinel',
    callsign: 'OseCore',
    role: 'sentinel',
    text: 'The Game Master just dropped a contraband care package! Check your top comms banner.',
    avatarColor: 'from-purple-400 to-pink-500',
  },
  {
    sender: 'Ada',
    callsign: 'ByteStriker',
    role: 'striker',
    text: 'Clean syntax forge landed! +120 PTS logged on the live arena feed.',
    avatarColor: 'from-emerald-400 to-teal-500',
  },
  {
    sender: 'Chidi',
    callsign: 'SyntaxGuard',
    role: 'debugger',
    text: 'Boss shield dropped to 64%! Keep hammering the test suites.',
    avatarColor: 'from-amber-400 to-orange-500',
    isCombatAlert: true,
  },
  {
    sender: 'Zuri',
    callsign: 'CipherGhost',
    role: 'tactician',
    text: 'Holding defensive shield... Word forge multiplier is ready for payout.',
    avatarColor: 'from-sky-400 to-indigo-500',
  },
];

interface SquadChatterProps {
  currentUsername?: string;
  roomCode?: string;
  inRoom?: boolean;
  selectedMode?: 'wordforge' | 'debugshunting';
}

export const SquadChatter: React.FC<SquadChatterProps> = ({
  currentUsername = 'Cadet',
  roomCode = 'ARENA-FORGE-1',
  inRoom = false,
  selectedMode = 'wordforge',
}) => {
  const [messages, setMessages] = useState<SquadMessage[]>(DEFAULT_SQUAD_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [bossShield, setBossShield] = useState(78);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isCollapsed]);

  // Ambient squad message ticker (every 14 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const randomChat = AMBIENT_CHATS[Math.floor(Math.random() * AMBIENT_CHATS.length)];
      const newMsg: SquadMessage = {
        id: `sq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: randomChat.sender,
        callsign: randomChat.callsign,
        role: randomChat.role,
        text: randomChat.text,
        timestamp: 'Just now',
        isCombatAlert: randomChat.isCombatAlert,
        avatarColor: randomChat.avatarColor,
      };

      setMessages((prev) => {
        const next = [...prev, newMsg];
        return next.length > 30 ? next.slice(next.length - 30) : next;
      });

      // Fluctuate boss shield
      setBossShield((prev) => Math.max(12, Math.min(99, prev + (Math.random() > 0.6 ? -2 : 1))));
    }, 14000);

    return () => clearInterval(interval);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const userMsg: SquadMessage = {
      id: `usr_${Date.now()}`,
      sender: currentUsername,
      callsign: 'You',
      role: 'player',
      text,
      timestamp: 'Just now',
      avatarColor: 'from-emerald-500 to-teal-400',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Simulated squad response if player sends tactical inquiry
    if (text.startsWith('!') || text.toLowerCase().includes('boss') || text.toLowerCase().includes('shield')) {
      setTimeout(() => {
        const botReply: SquadMessage = {
          id: `sq_rep_${Date.now()}`,
          sender: 'Ada',
          callsign: 'ByteStriker',
          role: 'striker',
          text: `Acknowledged, @${currentUsername}! Focusing fire on Terminaltor core loop in ${roomCode}.`,
          timestamp: 'Just now',
          isCombatAlert: true,
          avatarColor: 'from-emerald-400 to-teal-500',
        };
        setMessages((prev) => [...prev, botReply]);
      }, 1000);
    }
  };

  return (
    <div className="bg-slate-950/95 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-xl text-slate-200 font-sans relative backdrop-blur-md">
      {/* CRT Scanline effect overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent opacity-60 bg-[length:100%_4px]" />

      {/* Header bar: Live Squad Comm & Terminaltor Raid Status */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20" />
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Live Squad Comms
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {roomCode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Boss Shield Bar */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
            <Skull className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400 text-[10px] uppercase font-bold">Terminaltor Shield:</span>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                style={{ width: `${bossShield}%` }}
              />
            </div>
            <span className="text-rose-400 font-bold text-[11px]">{bossShield}%</span>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Squad Comms' : 'Collapse Squad Comms'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Messages scroll pane */}
          <div
            ref={scrollRef}
            className="p-4 space-y-3 max-h-60 sm:max-h-72 overflow-y-auto text-xs font-mono divide-y divide-slate-800/40"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`pt-2.5 first:pt-0 flex items-start gap-2.5 transition-colors ${
                  msg.isCombatAlert ? 'bg-emerald-950/20 -mx-2 px-2 py-1.5 rounded-lg border-l-2 border-emerald-400' : ''
                }`}
              >
                {/* Callsign Avatar */}
                <div
                  className={`w-6 h-6 rounded-md bg-gradient-to-tr ${msg.avatarColor} text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs uppercase`}
                >
                  {msg.sender.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-white text-[11px]">{msg.sender}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                      [{msg.callsign}]
                    </span>
                    {msg.isCombatAlert && (
                      <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1 rounded uppercase">
                        RAID ALERT
                      </span>
                    )}
                    <span className="text-[9px] text-slate-500 ml-auto">{msg.timestamp}</span>
                  </div>

                  <p
                    className={`leading-relaxed text-[11px] break-words ${
                      msg.role === 'player'
                        ? 'text-emerald-200 font-semibold'
                        : msg.isCombatAlert
                        ? 'text-emerald-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick tactical chips */}
          <div className="px-4 py-1.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono scrollbar-none">
            <span className="text-slate-500 shrink-0 uppercase font-bold">Quick:</span>
            <button
              type="button"
              onClick={() => setInputText('!scan boss')}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-colors"
            >
              !scan boss
            </button>
            <button
              type="button"
              onClick={() => setInputText('!focus keywords')}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-colors"
            >
              !focus keywords
            </button>
            <button
              type="button"
              onClick={() => setInputText('!ready')}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-colors"
            >
              !ready
            </button>
            <button
              type="button"
              onClick={() => setInputText('!jammer status')}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-colors"
            >
              !jammer status
            </button>
          </div>

          {/* Input form */}
          <form onSubmit={handleSend} className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send squad transmission or tactical command (!)..."
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold transition-all shrink-0 cursor-pointer"
              title="Transmit transmission"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default SquadChatter;
