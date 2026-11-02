import React, { useState } from 'react';
import { X, Sparkles, Shield, Gamepad2, Award, Zap, Check, Lock, ExternalLink, AlertCircle } from 'lucide-react';
import { Profile } from '../types';
import { SupabaseStore } from '../lib/supabase';
import { getTelegramBotUsername } from '../lib/telegramAuth';

interface PassModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onPassUpdated: (updatedProfile: Profile) => void;
}

export const PassModal: React.FC<PassModalProps> = ({
  isOpen,
  onClose,
  profile,
  onPassUpdated,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const botUsername = getTelegramBotUsername();

  if (!isOpen) return null;

  const win = typeof window !== 'undefined' ? (window as any) : null;
  const isInsideTelegram = Boolean(win?.Telegram?.WebApp?.initData);

  const handlePurchaseCreatorPass = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    // If outside Telegram, direct user to open within Telegram WebApp where native Stars wallet operates
    if (!isInsideTelegram) {
      setIsProcessing(false);
      window.open(`https://t.me/${botUsername}?startapp=pass`, '_blank');
      return;
    }

    try {
      const resp = await fetch('/api/v1/telegram/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Sovereign Creator Pass',
          description: 'Lifetime Access to Tier 6-10 Quests and AI Tutor',
          payload: `stars_creator_pass_${profile.id}_${Date.now()}`,
          stars_amount: 675,
        }),
      });

      if (!resp.ok) {
        throw new Error('Invoice service currently unavailable. Please try again.');
      }

      const data = await resp.json();

      if (data.success && data.invoiceLink && win?.Telegram?.WebApp?.openInvoice) {
        win.Telegram.WebApp.openInvoice(data.invoiceLink, (status: string) => {
          setIsProcessing(false);
          if (status === 'paid') {
            const updated = SupabaseStore.setProPassExplicit(true);
            onPassUpdated(updated);
          } else if (status === 'cancelled') {
            setErrorMessage('Stars payment was cancelled. Your account was not charged.');
          } else if (status === 'failed') {
            setErrorMessage('Stars payment failed. Please check your Telegram Stars balance.');
          }
        });
        return;
      }

      // If no valid invoice link returned from Bot API
      setIsProcessing(false);
      setErrorMessage(
        data.message || 'Telegram Stars invoice could not be created. Ensure TELEGRAM_BOT_TOKEN is configured.'
      );
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Payment request failed. Please check your connection.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0a0f1d] border-2 border-amber-500/50 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden text-slate-100 font-sans">
        {/* Header Ribbon */}
        <div className="p-6 bg-gradient-to-r from-amber-950/70 via-slate-900 to-[#0a0f1d] border-b border-amber-500/30 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-400/20 shrink-0">
              <Sparkles className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                Full Mainframe Access
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Sovereign Creator Pass</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close pass modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 text-sm">
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Unlock advanced coding modules, capstone game projects, dedicated Pyodide execution threads, and verified digital certifications for young developers.
          </p>

          <div className="space-y-3">
            <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Included Creator Perks:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-start gap-2.5">
                <Gamepad2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Level 5 RPG Engine Quest</div>
                  <div className="text-slate-400 text-[11px]">Turn-based battle state machine</div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Dedicated Pyodide Worker</div>
                  <div className="text-slate-400 text-[11px]">Zero UI thread stutters</div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-start gap-2.5">
                <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Verified Python Medal</div>
                  <div className="text-slate-400 text-[11px]">Cryptographic completion badge</div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Offline-First Cloud Sync</div>
                  <div className="text-slate-400 text-[11px]">Zero progress loss</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-5 bg-gradient-to-r from-amber-950/40 to-slate-900/80 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div>
              <div className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                Student Lifetime Grant (Telegram Stars)
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono flex items-center gap-1.5 mt-0.5">
                <span>⭐️ 675 Stars</span>
                <span className="text-xs text-slate-400 font-normal">/ lifetime (≈ ₦25,000)</span>
              </div>
            </div>

            {profile.has_pro_pass ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-xs">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>Creator Pass Active</span>
              </div>
            ) : isInsideTelegram ? (
              <button
                type="button"
                onClick={handlePurchaseCreatorPass}
                disabled={isProcessing}
                className="px-6 py-3 rounded-xl font-black text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>{isProcessing ? 'Opening Telegram Stars...' : 'Unlock Lifetime Pass (⭐️ 675 Stars)'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePurchaseCreatorPass}
                className="px-6 py-3 rounded-xl font-black text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Telegram to Pay (⭐️ 675)</span>
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="text-[11px] text-center text-slate-500 font-mono">
            {profile.has_pro_pass
              ? 'Status: Verified Lifetime Access Active'
              : isInsideTelegram
              ? 'Payment will be confirmed securely via Telegram Stars dialog'
              : 'Official Telegram Mini App purchase: open in Telegram to settle invoice'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassModal;
