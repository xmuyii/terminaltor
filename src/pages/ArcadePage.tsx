import React, { useState, useEffect } from 'react';
import { Gamepad2, Sparkles, Bug, Play, ArrowLeft, Trophy, ChevronDown, ChevronRight, Zap, Target, Users, RefreshCw, Coins, Crown, X, Swords, Shield, Store, Skull, Award } from 'lucide-react';
import { useRound } from '../game/useRound';
import WordForge from '../game/WordForge';
import DebugsHunting from '../game/DebugsHunting';
import { Profile } from '../types';
import { creditsService } from '../lib/creditsService';
import {
  arcadeLeaderboard,
  WordForgeRecord,
  DebugsHuntingRecord,
  LastWeekChampion,
  PLAYSTYLE_TITLES,
} from '../lib/arcadeLeaderboard';
import { cyberBaseService, CyberBase } from '../lib/baseService';
import { gameMasterService, GameMasterModifier } from '../lib/gameMasterService';
import { PlaystyleBadgesModal } from '../components/PlaystyleBadgesModal';
import { CyberBaseStoreModal } from '../components/CyberBaseStoreModal';
import { SadisticGameMasterModal } from '../components/SadisticGameMasterModal';
import { ArcadeCreditArt, CryptoTokenArt } from '../components/CurrencyArt';
import { gameMasterGiftService, GiftStatus } from '../lib/gameMasterGiftService';

interface ArcadePageProps {
  currentProfile: Profile;
  onBackToLobby?: () => void;
  onInRoomChange?: (inRoom: boolean) => void;
}

export const ArcadePage: React.FC<ArcadePageProps> = ({ currentProfile, onBackToLobby, onInRoomChange }) => {
  const [selectedMode, setSelectedMode] = useState<'wordforge' | 'debugshunting'>('wordforge');
  const [roomCode, setRoomCode] = useState<string>('ARENA-FORGE-1');
  const [customRoomInput, setCustomRoomInput] = useState<string>('ARENA-FORGE-1');
  const [playerName, setPlayerName] = useState<string>(() => currentProfile?.username || 'QuantumCadet');
  const [inRoom, setInRoom] = useState<boolean>(false);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);

  // Tactical Base, Store & Playstyle Badges Modals
  const [showPlaystyleModal, setShowPlaystyleModal] = useState<boolean>(false);
  const [showBaseModal, setShowBaseModal] = useState<boolean>(false);
  const [showGameMasterModal, setShowGameMasterModal] = useState<boolean>(false);
  const [equippedStyle, setEquippedStyle] = useState<string>(() => arcadeLeaderboard.getPlayerEquippedStyle());
  const [cyberBase, setCyberBase] = useState<CyberBase>(() => cyberBaseService.getBase());
  const [activeGMMod, setActiveGMMod] = useState<GameMasterModifier | null>(() => gameMasterService.getActiveModifier());
  
  // Last Week Winners Overlay state for joining player
  const [showLastWeekRivals, setShowLastWeekRivals] = useState<boolean>(false);
  const [rivalsCountdown, setRivalsCountdown] = useState<number>(5);

  // Lobby Leaderboard Tab state
  const [activeBoardTab, setActiveBoardTab] = useState<'wordforge' | 'debugshunting' | 'rules'>('wordforge');
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<'today' | 'weekly' | 'all_time'>('today');
  const [wordForgeBoard, setWordForgeBoard] = useState<WordForgeRecord[]>([]);
  const [debugsBoard, setDebugsBoard] = useState<DebugsHuntingRecord[]>([]);
  const [roomGenerationIndex, setRoomGenerationIndex] = useState<number>(1);
  const [playerCredits, setPlayerCredits] = useState<number>(() => creditsService.getBalance());
  const [tokensBalance, setTokensBalance] = useState<number>(() => creditsService.getTokensBalance());
  const [giftStatus, setGiftStatus] = useState<GiftStatus>(() => gameMasterGiftService.getStatus());

  // Deterministic room occupancy (n/16) so players see real capacity before entering
  const getRoomOccupancy = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) hash = (hash << 5) - hash + code.charCodeAt(i);
    const base = (Math.abs(hash) % 7) + 3; // 3 to 9 base players
    return inRoom ? Math.min(16, base + 1) : base;
  };
  const roomOccupancy = getRoomOccupancy(roomCode);

  // Keep credit, token balances, and Game Master gifts updated in real time
  useEffect(() => {
    const handleUpdate = () => {
      setPlayerCredits(creditsService.getBalance());
      setTokensBalance(creditsService.getTokensBalance());
      setGiftStatus(gameMasterGiftService.getStatus());
    };
    const giftInterval = setInterval(() => {
      setGiftStatus(gameMasterGiftService.getStatus());
    }, 1000);

    window.addEventListener('sovereign_credits_deducted', handleUpdate);
    window.addEventListener('sovereign_credits_added', handleUpdate);
    window.addEventListener('sovereign_tokens_updated', handleUpdate);
    window.addEventListener('sovereign_gm_gift_claimed', handleUpdate);
    window.addEventListener('sovereign_gm_gift_status_changed', handleUpdate);
    window.addEventListener('sovereign_profile_updated', handleUpdate);
    return () => {
      clearInterval(giftInterval);
      window.removeEventListener('sovereign_credits_deducted', handleUpdate);
      window.removeEventListener('sovereign_credits_added', handleUpdate);
      window.removeEventListener('sovereign_tokens_updated', handleUpdate);
      window.removeEventListener('sovereign_gm_gift_claimed', handleUpdate);
      window.removeEventListener('sovereign_gm_gift_status_changed', handleUpdate);
      window.removeEventListener('sovereign_profile_updated', handleUpdate);
    };
  }, []);

  // Load persistent leaderboards with timeframe
  useEffect(() => {
    setWordForgeBoard(arcadeLeaderboard.getWordForgeLeaderboard(leaderboardTimeframe));
    setDebugsBoard(arcadeLeaderboard.getDebugsHuntingLeaderboard(leaderboardTimeframe));
  }, [inRoom, leaderboardTimeframe]);

  // Keep roomCode in sync with mode selection unless user explicitly overrides
  const handleSelectMode = (mode: 'wordforge' | 'debugshunting') => {
    setSelectedMode(mode);
    const defaultForMode = mode === 'wordforge' ? `ARENA-FORGE-${roomGenerationIndex}` : `ARENA-DEBUG-${roomGenerationIndex}`;
    setRoomCode(defaultForMode);
    setCustomRoomInput(defaultForMode);
  };

  useEffect(() => {
    onInRoomChange?.(inRoom);
  }, [inRoom, onInRoomChange]);

  const round = useRound(roomCode, selectedMode, playerName, inRoom);

  // When round finishes or player scores, record to arcade leaderboard
  useEffect(() => {
    if (round.gameState === 'scoring' || round.gameState === 'intermission') {
      if (selectedMode === 'wordforge' && round.myScore > 0) {
        arcadeLeaderboard.recordWordForgeScore(
          playerName,
          round.myScore,
          Math.max(1, Math.floor(round.myScore / 35)),
          'QUANTUM',
          'Solo Developer'
        );
        setWordForgeBoard(arcadeLeaderboard.getWordForgeLeaderboard());
      } else if (selectedMode === 'debugshunting' && round.myScore > 0) {
        arcadeLeaderboard.recordDebugsHuntingScore(
          playerName,
          round.myScore,
          Math.max(1, Math.floor(round.myScore / 80)),
          1.8,
          'Solo Developer'
        );
        setDebugsBoard(arcadeLeaderboard.getDebugsHuntingLeaderboard());
      }
    }
  }, [round.gameState, round.myScore, selectedMode, playerName]);

  const handleQuickJoin = () => {
    if (playerCredits < 10) {
      window.dispatchEvent(new CustomEvent('sovereign_insufficient_credits'));
      return;
    }
    if (roomCode.trim()) {
      setInRoom(true);
      setShowLastWeekRivals(true);
      setRivalsCountdown(5);
    }
  };

  const handleCustomRoomApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerCredits < 10) {
      window.dispatchEvent(new CustomEvent('sovereign_insufficient_credits'));
      return;
    }
    const clean = customRoomInput.trim().toUpperCase() || (selectedMode === 'wordforge' ? 'ARENA-FORGE-1' : 'ARENA-DEBUG-1');
    setRoomCode(clean);
    setInRoom(true);
    setShowLastWeekRivals(true);
    setRivalsCountdown(5);
  };

  const handleCreateNewRoom = () => {
    const nextIdx = roomGenerationIndex + 1;
    setRoomGenerationIndex(nextIdx);
    const newCode = selectedMode === 'wordforge' ? `ARENA-FORGE-${nextIdx}` : `ARENA-DEBUG-${nextIdx}`;
    setRoomCode(newCode);
    setCustomRoomInput(newCode);
  };

  const handleRequestLeave = () => {
    setShowLeaveModal(true);
  };

  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
    setInRoom(false);
    setShowLastWeekRivals(false);
  };

  const lastWeekChampions = arcadeLeaderboard.getLastWeekWinners(selectedMode);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f0f9f3] text-slate-800 flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Arcade Header */}
      <div className="max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 bg-white/90 border border-emerald-200/90 rounded-2xl shadow-xs mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Multiplayer Arcade
              <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                Live Arena
              </span>
            </h1>
            <p className="text-xs text-slate-600">
              Real-time competitive multiplayer arenas for Code Forgers &amp; Debugs Hunting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Arcade Energy Credits & Crypto Tokens with Distinct Art */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('sovereign_insufficient_credits'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-200 transition-colors shadow-xs"
              title="Arcade Credits: Energy Core fuel for arena submissions (10 credits deducted per play) · Click to view/top up"
            >
              <ArcadeCreditArt size={16} animated={false} />
              <span>{playerCredits.toLocaleString()}</span>
              <span className="text-[10px] text-cyan-400/80 font-normal">(-10/play)</span>
            </button>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('sovereign_insufficient_credits'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 transition-colors shadow-xs"
              title="Earned Crypto Tokens: Awarded for match wins & weekly leaderboards · Used for Base building & consumables"
            >
              <CryptoTokenArt size={16} />
              <span>{tokensBalance.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-400 font-normal">TOKENS</span>
            </button>
          </div>

          {inRoom ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span>Room: <strong className="text-emerald-800">{roomCode}</strong></span>
                <span className="text-emerald-300">·</span>
                <span className="text-emerald-900 font-semibold">{round.players.length}/16 Players</span>
              </span>
              <button
                type="button"
                onClick={handleRequestLeave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-emerald-50 border border-slate-300 text-slate-700 transition-colors shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Leave Room</span>
              </button>
            </div>
          ) : (
            onBackToLobby && (
              <button
                type="button"
                onClick={onBackToLobby}
                className="text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
              >
                ← Back to Home
              </button>
            )
          )}
        </div>
      </div>

      {/* Cyber Command Bar: Playstyle Badge · Base Citadel · Tactical Store · Sadistic Game Master */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Playstyle Badge Button */}
        <button
          type="button"
          onClick={() => setShowPlaystyleModal(true)}
          className="p-3 rounded-2xl bg-white border border-amber-300 hover:border-amber-400 hover:bg-amber-50/50 shadow-xs transition-all flex items-center justify-between text-left cursor-pointer group"
          title="Click to view and equip earned Playstyle Combat Badges"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl group-hover:scale-110 transition-transform">🏷️</span>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 block">
                Combat Playstyle
              </span>
              <span className="text-xs font-black text-slate-900 truncate block">
                {equippedStyle}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
            Badges
          </span>
        </button>

        {/* The Game Master Surprise Gift Drop Countdown Card */}
        <button
          type="button"
          onClick={() => setShowBaseModal(true)}
          className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer group shadow-xs ${
            giftStatus.isReady
              ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/30'
              : 'bg-white border-purple-200 hover:border-purple-300 hover:bg-purple-50/40'
          }`}
          title="The Game Master drops 10 random surprise care packages every 24h. Click to view countdown & claim gift!"
        >
          <div className="flex items-center gap-2.5">
            <span className={`text-2xl group-hover:scale-110 transition-transform ${giftStatus.isReady ? 'animate-bounce' : ''}`}>
              🎁
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-900 block flex items-center gap-1">
                <span>GM Gift ({giftStatus.claimedCountToday}/10)</span>
              </span>
              <span className={`text-xs font-black truncate block ${giftStatus.isReady ? 'text-emerald-700 animate-pulse' : 'text-slate-900'}`}>
                {giftStatus.formattedCountdown}
              </span>
            </div>
          </div>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
            giftStatus.isReady ? 'bg-emerald-600 text-white animate-pulse' : 'bg-purple-100 text-purple-800'
          }`}>
            {giftStatus.isReady ? 'CLAIM' : 'WAIT'}
          </span>
        </button>

        {/* Arsenal Store Button */}
        <button
          type="button"
          onClick={() => setShowBaseModal(true)}
          className="p-3 rounded-2xl bg-white border border-cyan-300 hover:border-cyan-400 hover:bg-cyan-50/50 shadow-xs transition-all flex items-center justify-between text-left cursor-pointer group"
          title="Click to open the Arsenal Store (Jammers, Shields, Double Points)"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl group-hover:scale-110 transition-transform">⚔️</span>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-800 block">
                Arsenal Store
              </span>
              <span className="text-xs font-black text-slate-900 truncate block">
                Combat Equipment
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-cyan-700 bg-cyan-100 px-1.5 py-0.5 rounded">
            Store
          </span>
        </button>

        {/* The Game Master Button */}
        <button
          type="button"
          onClick={() => setShowGameMasterModal(true)}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border border-purple-500/60 hover:border-purple-400 text-white shadow-xs transition-all flex items-center justify-between text-left cursor-pointer group"
          title="Click to consult The Game Master in private chat"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-purple-400/60 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <img
                src="/assets/aistudio/Gemini_Generated_Image_4emglu4emglu4emg_baf4003d.png"
                alt="The Game Master"
                className="w-full h-full object-cover object-top"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-400 border border-purple-900 rounded-full animate-ping" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 block">
                The Game Master
              </span>
              <span className="text-xs font-black text-purple-100 truncate block">
                Private Chat &amp; Quests
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-purple-300 bg-purple-900/80 px-1.5 py-0.5 rounded border border-purple-600">
            Private
          </span>
        </button>
      </div>

      {/* Main Container: Lobby vs In-Game */}
      {!inRoom ? (
        <div className="max-w-5xl w-full mx-auto py-4 space-y-8">
          {/* Mode Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mode 1: Code Forgers */}
            <div
              onClick={() => handleSelectMode('wordforge')}
              className={`p-6 rounded-2xl border cursor-pointer transition-all shadow-xs relative ${
                selectedMode === 'wordforge'
                  ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white/80 border-emerald-200 hover:border-emerald-400 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                    Room: ARENA-FORGE-{roomGenerationIndex}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                    180s Battle
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Code Forgers</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Synthesize valid keywords and logic tokens from seed letter pools. Mid-round letter injection at 1:30!
              </p>
              {/* Compelling, Short & Engaging Description */}
              <div className="text-xs text-emerald-950 font-medium bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200/80 mb-4 leading-relaxed">
                ⚡ High-octane syntax combat. Synthesize valid language keywords from live letter buffers before the mid-round surge hits. Outforge your rivals, dominate the scoreboard, and claim top token bounty.
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectMode('wordforge');
                  handleQuickJoin();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Quick Join Active Code Forgers</span>
              </button>
            </div>

            {/* Mode 2: Debugs Hunting */}
            <div
              onClick={() => handleSelectMode('debugshunting')}
              className={`p-6 rounded-2xl border cursor-pointer transition-all shadow-xs relative ${
                selectedMode === 'debugshunting'
                  ? 'bg-white border-orange-500 ring-2 ring-orange-500/25 shadow-md'
                  : 'bg-white/80 border-orange-200 hover:border-orange-400 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600">
                  <Bug className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded font-semibold">
                    Room: ARENA-DEBUG-{roomGenerationIndex}
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded">
                    Speed Trivia
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Debugs Hunting</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                High-speed debugging trivia. Up to 10 seconds per question with early resolution on first correct answer!
              </p>
              {/* Compelling, Short & Engaging Description */}
              <div className="text-xs text-orange-950 font-medium bg-orange-50/80 p-3.5 rounded-xl border border-orange-200/80 mb-4 leading-relaxed">
                🐞 Bug-squashing speed trials. Spot syntax flaws, logic glitches, and runtime traps before opponents buzz in. Fastest correct solver scoops max streak points.
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectMode('debugshunting');
                  handleQuickJoin();
                }}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Quick Join Active Debugs Hunting</span>
              </button>
            </div>
          </div>

          {/* Active Room Allocation Banner */}
          <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-4 transition-colors ${
            selectedMode === 'debugshunting' ? 'border-orange-300/90' : 'border-emerald-200/90'
          }`}>
            <div className="space-y-4">
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                selectedMode === 'debugshunting' ? 'border-orange-100' : 'border-emerald-100'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    selectedMode === 'debugshunting' ? 'bg-orange-500' : 'bg-emerald-500'
                  }`} />
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                    selectedMode === 'debugshunting' ? 'text-orange-900' : 'text-emerald-800'
                  }`}>
                    Auto-Allocation Arena System • {selectedMode === 'debugshunting' ? 'Debugs Hunting' : 'Code Forgers'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Users className={`w-3.5 h-3.5 ${selectedMode === 'debugshunting' ? 'text-orange-600' : 'text-emerald-600'}`} />
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-md border ${
                    selectedMode === 'debugshunting'
                      ? 'bg-orange-100 text-orange-900 border-orange-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {roomOccupancy}/16
                  </span>
                  <span className="text-slate-600">players in room (Room 2 created automatically when full)</span>
                </div>
              </div>

              {/* Player Username Display */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-600">Playing as:</span>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className={`font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-right font-mono focus:outline-none ${
                    selectedMode === 'debugshunting' ? 'focus:border-orange-500' : 'focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Main 1-Click Action */}
              <button
                type="button"
                onClick={handleQuickJoin}
                className={`w-full py-3.5 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 text-white cursor-pointer ${
                  selectedMode === 'debugshunting'
                    ? 'bg-orange-600 hover:bg-orange-500 active:bg-orange-700 shadow-orange-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Enter Current Active Room ({roomCode}) • {roomOccupancy}/16 Players</span>
              </button>

              {/* Advanced Settings Collapsible Accordion */}
              <details className={`group border rounded-xl overflow-hidden transition-colors ${
                selectedMode === 'debugshunting' ? 'border-orange-200/90 bg-orange-50/30' : 'border-emerald-200/90 bg-emerald-50/30'
              }`}>
                <summary className={`flex items-center justify-between p-3.5 text-xs font-semibold cursor-pointer select-none transition-colors ${
                  selectedMode === 'debugshunting' ? 'text-orange-950 hover:bg-orange-100/50' : 'text-emerald-900 hover:bg-emerald-100/50'
                }`}>
                  <span className="flex items-center gap-2">
                    <span>⚙️ Advanced Settings: Custom Room Code &amp; Matchmaking</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform group-open:rotate-180 ${
                    selectedMode === 'debugshunting' ? 'text-orange-600' : 'text-emerald-600'
                  }`} />
                </summary>
                <div className={`p-4 border-t bg-white space-y-3.5 text-xs ${
                  selectedMode === 'debugshunting' ? 'border-orange-200/60' : 'border-emerald-200/60'
                }`}>
                  <div className="text-slate-600 leading-relaxed text-[11px]">
                    Players are placed into the current active room automatically. To play with another player, both of you enter the active room together. If either player wants a fresh board, leave and join the latest room created.
                  </div>

                  <form onSubmit={handleCustomRoomApply} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Custom Room Code
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customRoomInput}
                          onChange={(e) => setCustomRoomInput(e.target.value.toUpperCase())}
                          placeholder={selectedMode === 'debugshunting' ? 'e.g. ARENA-DEBUG-2' : 'e.g. ARENA-FORGE-2'}
                          className={`flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-800 uppercase focus:bg-white focus:outline-none ${
                            selectedMode === 'debugshunting' ? 'focus:border-orange-500' : 'focus:border-emerald-500'
                          }`}
                        />
                        <button
                          type="submit"
                          className={`px-3.5 py-2 font-semibold rounded-lg text-xs transition-colors shrink-0 text-white cursor-pointer ${
                            selectedMode === 'debugshunting'
                              ? 'bg-orange-600 hover:bg-orange-500 active:bg-orange-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                          }`}
                        >
                          Join Code
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">Need a fresh battle room?</span>
                      <button
                        type="button"
                        onClick={handleCreateNewRoom}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-[11px] transition-colors cursor-pointer ${
                          selectedMode === 'debugshunting'
                            ? 'border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-900'
                            : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Create &amp; Switch to Room {roomGenerationIndex + 1}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </details>
            </div>
          </div>

          {/* Separate Leaderboard Section */}
          <div className="bg-white border border-emerald-200/90 rounded-2xl p-6 sm:p-7 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-emerald-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Arcade Leaderboards</h3>
                  <p className="text-xs text-slate-500">Separate rankings calculated for Code Forgers and Debugs Hunting</p>
                </div>
              </div>

              {/* Filters: Timeframe & Game Mode */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Timeframe Selector (Today / This Week / All-Time) */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLeaderboardTimeframe('today')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      leaderboardTimeframe === 'today'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardTimeframe('weekly')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      leaderboardTimeframe === 'weekly'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardTimeframe('all_time')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      leaderboardTimeframe === 'all_time'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All-Time
                  </button>
                </div>

                {/* Board Selector Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveBoardTab('wordforge')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeBoardTab === 'wordforge'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Code Forgers</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveBoardTab('debugshunting')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeBoardTab === 'debugshunting'
                        ? 'bg-white text-amber-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Bug className="w-3.5 h-3.5" />
                    <span>Debugs Hunting</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab 1: Code Forgers Leaderboard */}
            {activeBoardTab === 'wordforge' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-emerald-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Player</th>
                      <th className="py-2.5 px-3">Academy Alliance</th>
                      <th className="py-2.5 px-3">Longest Word</th>
                      <th className="py-2.5 px-3 text-right">Arcade Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wordForgeBoard.map((r) => (
                      <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">
                          {r.rank === 1 ? '🥇 1' : r.rank === 2 ? '🥈 2' : r.rank === 3 ? '🥉 3' : `#${r.rank}`}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {r.username}
                          {r.username.toLowerCase() === playerName.toLowerCase() && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          🎓 {r.allianceName || 'Solo Developer'}
                        </td>
                        <td className="py-3 px-3 font-mono text-emerald-700 font-bold">
                          {r.longestWord}
                        </td>
                        <td className="py-3 px-3 font-mono text-right font-bold text-emerald-800 text-sm">
                          {r.score.toLocaleString()} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Debugs Hunting Leaderboard */}
            {activeBoardTab === 'debugshunting' && (
              <div className="space-y-4">
                {/* Accuracy Calculation Explainer Callout */}
                <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <div className="p-1 rounded bg-amber-500/10 text-amber-700 mt-0.5 shrink-0">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-950">Accuracy Calculation in Debugs Hunting:</span>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed">
                      <strong>Accuracy = (Bugs Solved ÷ Total Question Attempts) × 100%</strong>. Every answer costs 10 credits. Correct identifications award 100 base pts + time-remaining speed bonus + combo streak multiplier. Incorrect choices incur a -20 pt penalty, break your streak, and lower your accuracy percentage.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-amber-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Player</th>
                        <th className="py-2.5 px-3">Academy Alliance</th>
                        <th className="py-2.5 px-3 text-right">Bugs Fixed</th>
                        <th className="py-2.5 px-3 text-right">Speed Record</th>
                        <th className="py-2.5 px-3 text-right">Accuracy</th>
                        <th className="py-2.5 px-3 text-right">Arcade Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {debugsBoard.map((r) => (
                        <tr key={r.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">
                            {r.rank === 1 ? '🥇 1' : r.rank === 2 ? '🥈 2' : r.rank === 3 ? '🥉 3' : `#${r.rank}`}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {r.username}
                            {r.username.toLowerCase() === playerName.toLowerCase() && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold">
                                You
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            🎓 {r.allianceName || 'Solo Developer'}
                          </td>
                          <td className="py-3 px-3 font-mono text-right text-slate-700 font-semibold">
                            {r.bugsFixed}
                          </td>
                          <td className="py-3 px-3 font-mono text-right text-amber-700 font-bold">
                            {r.speedRecordSeconds}s
                          </td>
                          <td className="py-3 px-3 font-mono text-right text-emerald-700 font-bold">
                            {r.accuracyRate}%
                          </td>
                          <td className="py-3 px-3 font-mono text-right font-bold text-amber-800 text-sm">
                            {r.score.toLocaleString()} pts
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {activeGMMod && (
            <div className="max-w-7xl w-full mx-auto mb-4 p-3.5 rounded-2xl bg-[#1c0828] border-2 border-purple-500/60 text-purple-200 flex items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl animate-pulse">😈</span>
                <div>
                  <span className="font-bold text-white uppercase tracking-wider text-[11px] font-mono flex items-center gap-2">
                    <span>Sadistic Game Master Active Rule:</span>
                    <strong className="text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/40">{activeGMMod.name}</strong>
                  </span>
                  <p className="text-[11px] text-purple-200 mt-0.5">{activeGMMod.ruleDescription}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGameMasterModal(true)}
                className="text-[10px] font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-md"
              >
                View Quests
              </button>
            </div>
          )}

          {selectedMode === 'wordforge' ? (
            <WordForge
          language={round.language}
          seedWords={round.seedWords}
          pool={round.pool}
          possibleCount={round.possibleCount}
          startsAt={round.startsAt}
          midroundAt={round.midroundAt}
          endsAt={round.endsAt}
          batches={round.batches}
          players={round.players}
          myPlayerId={round.myPlayerId}
          myScore={round.myScore}
          inputFlash={round.inputFlash}
          rejectionTooltip={round.rejectionTooltip}
          gameState={round.gameState}
          roundEndScores={round.roundEndScores}
          intermissionEndsAt={round.intermissionEndsAt}
          peerInputs={round.peerInputs}
          currentUsername={playerName}
          addedLetters={round.addedLetters}
          isJammerActive={round.isJammerActive}
          jammerUsedThisRound={round.jammerUsedThisRound}
          onActivateJammer={round.activateJammer}
          onTriggerMidround={round.triggerMidround}
          onSubmitWord={round.submitWord}
          onBroadcastTyping={round.broadcastTyping}
        />
      ) : (
        <DebugsHunting
          language={round.language}
          currentQuestion={round.currentQuestion}
          questionIndex={round.questionIndex}
          debugPhase={round.debugPhase}
          phaseSecondsRemaining={round.phaseSecondsRemaining}
          solvedByUsername={round.solvedByUsername}
          endsAt={round.endsAt}
          players={round.players}
          myPlayerId={round.myPlayerId}
          myScore={round.myScore}
          gameState={round.gameState}
          roundEndScores={round.roundEndScores}
          intermissionEndsAt={round.intermissionEndsAt}
          currentUsername={playerName}
          debugAccuracy={round.debugAccuracy}
          debugFeedback={round.debugFeedback}
          onSubmitAnswer={round.submitAnswer}
        />
      )}
        </>
      )}

      {/* Last Week Winners Overlay Modal: Shown ONLY to the player just joining the room */}
      {showLastWeekRivals && inRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1329] border border-amber-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Last Week&apos;s Champions &amp; Rivals</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      {selectedMode === 'wordforge' ? 'Code Forgers' : 'Debugs Hunting'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Know your opponents before you enter the battle!</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLastWeekRivals(false)}
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl leading-relaxed">
              ⚔️ <strong>Remember your rivals and enemies!</strong> These were last week&apos;s top podium scorers. Outcode them in this live room to claim this week&apos;s 100 token prize and alliance glory!
            </p>

            {/* Top 10 Rivals Scrollable List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1.5 divide-y divide-slate-800/60">
              {lastWeekChampions.map((champ) => (
                <div
                  key={champ.rank}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-xs shrink-0">
                      {champ.rank === 1 ? '🥇' : champ.rank === 2 ? '🥈' : champ.rank === 3 ? '🥉' : `#${champ.rank}`}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">{champ.username}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {champ.title}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-black text-amber-400 text-sm shrink-0">
                    {champ.score.toLocaleString()} pts
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Action: Clear Close Button */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400">
                Top 10 Podium Champions
              </span>
              <button
                type="button"
                onClick={() => setShowLastWeekRivals(false)}
                className={`px-6 py-2.5 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  selectedMode === 'debugshunting'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 shadow-orange-500/25'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25'
                }`}
              >
                <span>⚔️ Enter the Battle (Close)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Room Confirmation Warning Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-emerald-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Leave Arena Room?</h3>
                <p className="text-xs text-slate-500">Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              A live round is currently in progress. If you leave, the game will keep running for other players in the room. You can re-enter this room anytime.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Stay in Game
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-xs"
              >
                Yes, Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playstyle Badges Modal */}
      <PlaystyleBadgesModal
        isOpen={showPlaystyleModal}
        onClose={() => setShowPlaystyleModal(false)}
        equippedStyle={equippedStyle}
        onStyleEquipped={(newStyle) => {
          setEquippedStyle(newStyle);
          arcadeLeaderboard.setPlayerEquippedStyle(newStyle);
        }}
      />

      {/* Cyber Base & Arsenal Store Modal */}
      <CyberBaseStoreModal
        isOpen={showBaseModal}
        onClose={() => setShowBaseModal(false)}
        playerCredits={playerCredits}
        onCreditsUpdated={() => {
          setPlayerCredits(creditsService.getBalance());
          setCyberBase(cyberBaseService.getBase());
        }}
      />

      {/* Sadistic Game Master Chaos Modal */}
      <SadisticGameMasterModal
        isOpen={showGameMasterModal}
        onClose={() => setShowGameMasterModal(false)}
        selectedMode={selectedMode}
        onLeaderboardMutated={() => {
          setWordForgeBoard(arcadeLeaderboard.getWordForgeLeaderboard(leaderboardTimeframe));
          setDebugsBoard(arcadeLeaderboard.getDebugsHuntingLeaderboard(leaderboardTimeframe));
        }}
      />
    </div>
  );
};

export default ArcadePage;
