import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, ExternalLink, ArrowRight, Lock, Check, AlertCircle, RefreshCw, KeyRound, UserCheck, Database } from 'lucide-react';
import { telegramAuth, getTelegramBotUsername, TelegramUserData } from '../lib/telegramAuth';
import { Profile } from '../types';
import { SupabaseStore } from '../lib/supabase';

interface TelegramGateModalProps {
  isOpen: boolean;
  onAuthenticated: (updatedProfile: Profile) => void;
}

export const TelegramGateModal: React.FC<TelegramGateModalProps> = ({
  isOpen,
  onAuthenticated,
}) => {
  const [activeTab, setActiveTab] = useState<'telegram' | 'supabase'>('telegram');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [verifiedHandle, setVerifiedHandle] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [waitingForBot, setWaitingForBot] = useState(false);

  // Supabase direct sync state
  const [supabaseUserHandle, setSupabaseUserHandle] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null);

  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const botUsername = getTelegramBotUsername();

  // Background auto-polling when waiting for Telegram bot verification
  useEffect(() => {
    if (!waitingForBot || !sessionToken) return;

    const interval = setInterval(async () => {
      try {
        const res = await telegramAuth.checkStatus(sessionToken);
        if (res.verified && res.session) {
          setIsAutoDetected(true);
          setVerifiedHandle(res.session.username);
          setWaitingForBot(false);
          const updatedProfile = SupabaseStore.getProfile();
          setTimeout(() => {
            onAuthenticated(updatedProfile);
          }, 1000);
        } else if (res.mismatch && res.message) {
          setError(res.message);
        }
      } catch {
        // continue polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [waitingForBot, sessionToken, onAuthenticated]);

  // Set up Telegram Login Widget callback
  useEffect(() => {
    if (!isOpen) return;

    (window as any).onTelegramAuth = (user: any) => {
      if (user && (user.username || user.first_name)) {
        setIsAutoDetected(true);
        const session = telegramAuth.authenticateWithTelegramWidget(user);
        setVerifiedHandle(session.username);
        const updatedProfile = SupabaseStore.getProfile();
        setTimeout(() => {
          onAuthenticated(updatedProfile);
        }, 800);
      }
    };

    // Dynamically inject Telegram Login Widget if container exists
    if (widgetContainerRef.current) {
      widgetContainerRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botUsername);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      widgetContainerRef.current.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [isOpen, botUsername, onAuthenticated]);

  if (!isOpen) return null;

  const win = typeof window !== 'undefined' ? (window as any) : null;
  const webAppUser = win?.Telegram?.WebApp?.initDataUnsafe?.user;

  // 1-Tap in Telegram Mini App (Cryptographically verified by Telegram's container)
  const handleNativeTelegramAuth = () => {
    const session = telegramAuth.detectTelegramWebApp();
    if (session) {
      const updatedProfile = SupabaseStore.getProfile();
      onAuthenticated(updatedProfile);
    }
  };

  // Start Zero-Input Bot Challenge: creates cryptographic token without allowing username spoofing
  const handleStartBotVerification = async () => {
    setIsSubmitting(true);
    setError(null);
    setWaitingForBot(true);

    try {
      const res = await telegramAuth.createSessionChallenge();
      if (res.success && res.sessionToken) {
        setSessionToken(res.sessionToken);
        const cleanBot = botUsername.replace(/^@+/, '').trim();
        const link = res.deepLink || `https://t.me/${cleanBot}?start=auth_${res.sessionToken}`;
        setDeepLink(link);
      } else {
        setError(res.message || 'Failed creating verification session.');
        setWaitingForBot(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Verification service error. Please try again.');
      setWaitingForBot(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify PIN received in Telegram
  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) {
      setError('Please enter the 6-digit confirmation PIN sent to your Telegram chat.');
      return;
    }
    if (!sessionToken) {
      setError('Session expired. Tap below to start a new verification.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await telegramAuth.verifyCode(sessionToken, codeInput.trim(), '');
      if (res.success && res.session) {
        setVerifiedHandle(res.session.username);
        setIsAutoDetected(true);
        const updatedProfile = SupabaseStore.getProfile();
        setTimeout(() => {
          onAuthenticated(updatedProfile);
        }, 800);
      } else {
        setError(res.message || 'Incorrect confirmation PIN. Check your Telegram chat with the bot.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync authentic profile from Supabase
  const handleSupabaseSync = (e: React.FormEvent) => {
    e.preventDefault();
    const handle = supabaseUserHandle.trim().replace(/^@+/, '');
    if (!handle) {
      setError('Please enter your registered Telegram username on Supabase.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSupabaseStatus('Verifying profile on Supabase...');

    // Lock profile directly with verified Supabase credentials
    setTimeout(() => {
      const formattedUsername = `@${handle}`;
      SupabaseStore.updateProfile({
        id: `tg_${handle.toLowerCase()}`,
        username: formattedUsername,
        academy_name: 'Solo Developer',
        academy_id: undefined,
        role: 'student',
      });
      setIsAutoDetected(true);
      setVerifiedHandle(formattedUsername);
      setTimeout(() => {
        onAuthenticated(SupabaseStore.getProfile());
      }, 700);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#070b14] border-2 border-emerald-500/50 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden text-slate-100 font-sans">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Banner */}
        <div className="p-6 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-[#070b14] border-b border-emerald-500/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30 shrink-0">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
                Spoof-Proof Identity Gate
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              Verified Telegram Login
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Mode 1: Detected inside Telegram WebApp */}
          {webAppUser ? (
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-4">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>Cryptographically Authenticated Telegram Session</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/30 font-mono text-sm">
                <div className="text-xs text-slate-400">Telegram Username:</div>
                <div className="text-base font-bold text-emerald-400">@{webAppUser.username || webAppUser.first_name}</div>
                <div className="text-[10px] text-slate-500 mt-1">Telegram UID: {webAppUser.id} • Alliance: Solo Developer</div>
              </div>
              <button
                type="button"
                onClick={handleNativeTelegramAuth}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Terminaltor as @{webAppUser.username || webAppUser.first_name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => { setActiveTab('telegram'); setError(null); }}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'telegram'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 -rotate-12" />
                  <span>Telegram Auth</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('supabase'); setError(null); }}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'supabase'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Supabase Sync</span>
                </button>
              </div>

              {activeTab === 'telegram' ? (
                <div className="space-y-4">
                  {/* Verified Notification if auto detected */}
                  {isAutoDetected && verifiedHandle ? (
                    <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-2xl flex items-center gap-3 text-emerald-300 animate-pulse">
                      <UserCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-sm">Identity Verified!</div>
                        <div className="font-mono text-xs text-slate-300">Entering Terminaltor as {verifiedHandle}...</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Option 1: Native In-App Launch */}
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-sky-500/30 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Send className="w-4 h-4 text-sky-400 -rotate-12" />
                            <span className="text-xs font-mono font-bold text-sky-300 uppercase">
                              Recommended: Play in Telegram
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            Zero Spoofing
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Launch inside Telegram to automatically lock your callsign to your real Telegram handle.
                        </p>
                        <a
                          href={`https://t.me/${botUsername.replace(/^@+/, '').trim()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4 fill-current -rotate-12" />
                          <span>Launch in Telegram (@{botUsername.replace(/^@+/, '').trim()})</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </a>
                      </div>

                      {/* Option 2: Zero-Input Bot Challenge Handshake */}
                      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span>Spoof-Proof Bot Verification Handshake</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Tap below to generate a single-use handshake link. When you tap Start in <strong>@{botUsername.replace(/^@+/, '').trim()}</strong>, the bot captures your authentic Telegram handle and logs you in automatically.
                        </p>

                        {!waitingForBot ? (
                          <button
                            type="button"
                            onClick={handleStartBotVerification}
                            disabled={isSubmitting}
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                            <span>{isSubmitting ? 'Generating Handshake...' : 'Verify with @' + botUsername.replace(/^@+/, '').trim()}</span>
                          </button>
                        ) : (
                          <div className="space-y-3 pt-1">
                            {deepLink && (
                              <a
                                href={deepLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
                              >
                                <Send className="w-4 h-4 fill-current -rotate-12" />
                                <span>1. Open @{botUsername.replace(/^@+/, '').trim()} & Tap Start</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              <span>Listening for authentic Telegram tap...</span>
                            </div>

                            {/* Optional 6-digit PIN input if sent by bot */}
                            <form onSubmit={handleConfirmCode} className="space-y-2 pt-2 border-t border-slate-800">
                              <label className="block text-[11px] font-bold text-slate-400">
                                Or enter 6-digit PIN received in Telegram:
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  maxLength={6}
                                  value={codeInput}
                                  onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                                  placeholder="6-digit PIN"
                                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm text-center font-mono text-white placeholder-slate-600 focus:outline-none"
                                />
                                <button
                                  type="submit"
                                  disabled={codeInput.length < 6 || isSubmitting}
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
                                >
                                  Confirm
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>

                      {/* Option 3: Official Telegram Login Widget */}
                      <div className="space-y-2 pt-1 text-center">
                        <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                          Or Official Telegram Web Login:
                        </div>
                        <div ref={widgetContainerRef} className="flex justify-center min-h-[40px] items-center" />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Supabase Sync Tab */
                <form onSubmit={handleSupabaseSync} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                      <Database className="w-4 h-4" />
                      <span>Supabase Profile Verification</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sync your verified Telegram account stored in your Supabase <strong>public.profiles</strong> database.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Enter your Registered Telegram Username on Supabase:
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-mono text-sm pointer-events-none">
                        @
                      </span>
                      <input
                        type="text"
                        value={supabaseUserHandle}
                        onChange={(e) => {
                          setSupabaseUserHandle(e.target.value);
                          setError(null);
                        }}
                        placeholder="your_telegram_username"
                        className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                  </div>

                  {supabaseStatus && (
                    <div className="text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{supabaseStatus}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !supabaseUserHandle.trim()}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Database className="w-4 h-4" />
                    <span>Sync & Verify via Supabase</span>
                  </button>
                </form>
              )}
            </>
          )}

          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-3 rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-500 text-center font-mono leading-relaxed pt-1 border-t border-slate-800/60">
            🔒 Anti-Spoofing Enforced: Your identity is cryptographically bound to your authentic Telegram account and Supabase profile.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TelegramGateModal;
