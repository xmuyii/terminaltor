import React, { useState } from 'react';
<<<<<<< HEAD
import { Send, Shield, Sparkles, ExternalLink, ArrowRight, Lock, Check, AlertCircle, RefreshCw } from 'lucide-react';
=======
import { Send, Shield, Sparkles, ExternalLink, ArrowRight, Lock, Check } from 'lucide-react';
>>>>>>> 9ff66a72d6618209fddfea5cd16b800fe285ce04
import { telegramAuth, getTelegramBotUsername } from '../lib/telegramAuth';
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
<<<<<<< HEAD
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [handleInput, setHandleInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
=======
  const [handleInput, setHandleInput] = useState('');
>>>>>>> 9ff66a72d6618209fddfea5cd16b800fe285ce04
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const botUsername = getTelegramBotUsername();

  if (!isOpen) return null;

<<<<<<< HEAD
  const win = typeof window !== 'undefined' ? (window as any) : null;
  const webAppUser = win?.Telegram?.WebApp?.initDataUnsafe?.user;

  // Step 1: Request confirmation code
  const handleRequestCode = async (e: React.FormEvent) => {
=======
  const handleManualLogin = (e: React.FormEvent) => {
>>>>>>> 9ff66a72d6618209fddfea5cd16b800fe285ce04
    e.preventDefault();
    const raw = handleInput.trim().replace(/^@/, '');
    if (!raw) {
      setError('Please enter a valid Telegram username.');
      return;
    }
    if (raw.length < 3) {
      setError('Telegram username must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
<<<<<<< HEAD
      const res = await telegramAuth.requestCode(raw);
      if (res.success && res.code) {
        setGeneratedCode(res.code);
        setDeepLink(res.deepLink || `https://t.me/${botUsername}?start=auth_${res.code}`);
        setStep('verify');
      } else {
        setError(res.message || 'Failed generating verification code.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification service error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Confirm code and complete login
  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = handleInput.trim().replace(/^@/, '');
    if (!codeInput.trim()) {
      setError('Please enter the 6-digit confirmation code.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await telegramAuth.verifyCode(raw, codeInput.trim());
      if (res.success && res.session) {
        const updatedProfile = SupabaseStore.getProfile();
        onAuthenticated(updatedProfile);
      } else {
        setError(res.message || 'Incorrect confirmation code. Please check your Telegram.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Native 1-Tap in Telegram WebApp
  const handleNativeTelegramAuth = () => {
    const session = telegramAuth.detectTelegramWebApp();
    if (session) {
      const updatedProfile = SupabaseStore.getProfile();
      onAuthenticated(updatedProfile);
=======
      const session = telegramAuth.signInWithTelegram(raw);
      const updatedProfile = SupabaseStore.getProfile();
      onAuthenticated(updatedProfile);
    } catch (err: any) {
      setError(err?.message || 'Failed connecting Telegram account.');
    } finally {
      setIsSubmitting(false);
>>>>>>> 9ff66a72d6618209fddfea5cd16b800fe285ce04
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#070b14] border-2 border-emerald-500/50 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.25)] overflow-hidden text-slate-100 font-sans">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Banner */}
        <div className="p-6 sm:p-7 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-[#070b14] border-b border-emerald-500/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30 shrink-0">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
                Identity Verification Gate
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
<<<<<<< HEAD
              {step === 'input' ? 'Connect Telegram Account' : 'Confirm Ownership'}
=======
              Connect Telegram To Enter
>>>>>>> 9ff66a72d6618209fddfea5cd16b800fe285ce04
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-6">
<<<<<<< HEAD
          {/* If inside Telegram WebApp */}
          {webAppUser ? (
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Verified Telegram Mini App User</span>
              </div>
              <p className="text-sm text-slate-200">
                Logged into Telegram as <strong>@{webAppUser.username || webAppUser.first_name}</strong> (ID: {webAppUser.id}).
              </p>
              <button
                type="button"
                onClick={handleNativeTelegramAuth}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Terminaltor as @{webAppUser.username || webAppUser.first_name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : step === 'input' ? (
            <>
              {/* Option 1: Native Telegram WebApp Launch */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-sky-400 -rotate-12" />
                    <span className="text-xs font-mono font-bold text-sky-300 uppercase">
                      Recommended: Play In Telegram
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    1-Tap Instant Auth
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Open directly inside Telegram to verify identity automatically with zero login steps.
                </p>

                <a
                  href={`https://t.me/${botUsername}?startapp=play`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 fill-current -rotate-12" />
                  <span>Launch in Telegram WebApp (@{botUsername})</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative px-3 bg-[#070b14] text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                  Or Connect With Verification Code
                </span>
              </div>

              {/* Step 1 Form: Username Entry */}
              <form onSubmit={handleRequestCode} className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  Enter your Telegram Username:
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-mono text-sm pointer-events-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={handleInput}
                    onChange={(e) => {
                      setHandleInput(e.target.value);
                      setError(null);
                    }}
                    placeholder="your_telegram_username"
                    className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition-colors"
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-xl font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !handleInput.trim()}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Generating Verification...' : 'Send Verification Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            /* Step 2 Form: Code Confirmation */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Account to Verify:</span>
                  <strong className="text-emerald-400 font-mono">@{handleInput.replace('@', '')}</strong>
                </div>

                <div className="p-3 bg-black/70 rounded-xl border border-emerald-500/30 text-center space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Confirmation Security Code:
                  </div>
                  <div className="text-2xl font-black font-mono tracking-widest text-emerald-400">
                    {generatedCode}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  To confirm you own this account, open <strong>@{botUsername}</strong> and send or click this verification code.
                </p>

                {deepLink && (
                  <a
                    href={deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5 -rotate-12" />
                    <span>Open @{botUsername} in Telegram</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <form onSubmit={handleConfirmCode} className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  Enter 6-Digit Code to Confirm:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder="e.g. 582914"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-lg text-center tracking-widest font-mono text-white placeholder-slate-600 focus:outline-none transition-colors"
                  autoFocus
                />

                {error && (
                  <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-xl font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || codeInput.length < 6}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isSubmitting ? 'Verifying...' : 'Confirm Ownership & Enter'}</span>
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input');
                      setError(null);
                      setCodeInput('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    ← Change Username
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    className="text-xs text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                </div>
              </form>
            </div>
          )}
=======
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            TERMINALTOR is an official Telegram Mini App. All arena matchmaking, Python code submissions, and Telegram Stars prizes require a verified Telegram identity.
          </p>

          {/* Option 1: Native Telegram WebApp Launch */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400 -rotate-12" />
                <span className="text-xs font-mono font-bold text-sky-300 uppercase">
                  Recommended: Play In Telegram
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                1-Tap Instant Auth
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Open directly inside Telegram to sync your native Telegram Stars wallet and official avatar automatically.
            </p>

            <a
              href={`https://t.me/${botUsername}?startapp=play`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 fill-current -rotate-12" />
              <span>Launch in Telegram WebApp (@{botUsername})</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative px-3 bg-[#070b14] text-[10px] font-mono uppercase text-slate-500 tracking-wider">
              Or Connect in Web Browser
            </span>
          </div>

          {/* Option 2: Browser Username Entry */}
          <form onSubmit={handleManualLogin} className="space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              Enter your Telegram Username:
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-mono text-sm pointer-events-none">
                @
              </span>
              <input
                type="text"
                value={handleInput}
                onChange={(e) => {
                  setHandleInput(e.target.value);
                  setError(null);
                }}
                placeholder="your_telegram_username"
                className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition-colors"
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-xl font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !handleInput.trim()}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Verify &amp; Enter Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
>>>>>>> 9ff66a72d6618209fddfea5cd16b800fe285ce04

          <p className="text-[11px] text-slate-500 text-center font-mono leading-relaxed">
            🔒 By entering, you play as an independent Solo Developer. Your username will match your Telegram identity permanently.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TelegramGateModal;
