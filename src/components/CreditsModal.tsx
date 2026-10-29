import React, { useState } from 'react';
import {
  X,
  Coins,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Zap,
  TrendingUp,
  CreditCard,
  Crown
} from 'lucide-react';
import { ArcadeCreditArt, CryptoTokenArt } from './CurrencyArt';
import { Profile } from '../types';
import {
  creditsService,
  CREDIT_PACKS,
  WEEKLY_REWARDS_SCHEDULE,
  SUBMISSION_COST_CREDITS,
  ROUND_REWARDS
} from '../lib/creditsService';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onCreditsUpdated?: (newBalance: number) => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onCreditsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'balance' | 'buy' | 'weekly'>('buy');
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
  const [claimStatusMsg, setClaimStatusMsg] = useState<string | null>(null);
  const [tokensBalance, setTokensBalance] = useState<number>(() => creditsService.getTokensBalance());

  if (!isOpen) return null;

  const currentCredits = creditsService.getBalance();
  const dailyClaimStatus = creditsService.checkDailyClaimStatus();

  const handleClaimDaily = () => {
    const res = creditsService.claimDailyCredits();
    setClaimStatusMsg(res.message);
    setTokensBalance(creditsService.getTokensBalance());
    if (res.success && onCreditsUpdated) {
      onCreditsUpdated(res.balance);
    }
  };

  const handleBuyPack = async (packId: string) => {
    setPurchasingPackId(packId);
    try {
      const res = await creditsService.purchasePack(packId);
      if (res.success && onCreditsUpdated) {
        onCreditsUpdated(res.newBalance);
      }
    } finally {
      setPurchasingPackId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-amber-200/90 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 text-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                SHOP
              </h2>
              <p className="text-xs text-slate-500">
                Purchase Arcade Credits with Telegram Stars or view placement winnings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Dual Balance Banner */}
        <div className="bg-gradient-to-r from-cyan-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-200/90 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ArcadeCreditArt size={14} />
                <span>Arcade Credits</span>
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-700">
                  {currentCredits.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-cyan-800">Credits</span>
                <span className="text-xs text-slate-500 font-medium">
                  ({Math.floor(currentCredits / SUBMISSION_COST_CREDITS)} plays left)
                </span>
              </div>
            </div>

            <div className="border-l border-amber-200/80 pl-6">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CryptoTokenArt size={14} />
                <span>Crypto Tokens</span>
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700">
                  {tokensBalance.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-800">Tokens</span>
              </div>
            </div>
          </div>

          <div>
            {dailyClaimStatus.canClaim ? (
              <button
                type="button"
                onClick={handleClaimDaily}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Claim Daily Gift</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Today&apos;s Gift Claimed</span>
              </div>
            )}
          </div>
        </div>

        {claimStatusMsg && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>{claimStatusMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
              activeTab === 'buy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Buy Credits (⭐️ Telegram Stars)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('balance')}
            className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
              activeTab === 'balance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Round Placement Winnings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
              activeTab === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Cosmetics &amp; Prizes
          </button>
        </div>

        {/* Tab 1: Round Placement Winnings (Rewarding Crypto Tokens) */}
        {activeTab === 'balance' && (
          <div className="space-y-4 text-xs">
            {/* Round Placement Winnings */}
            <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Round Placement Winnings</span>
                </span>
                <span className="text-[11px] font-semibold text-amber-800">Earned in Combat</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 bg-white border border-amber-200 rounded-xl shadow-xs">
                  <div className="text-xl">🥇</div>
                  <div className="font-bold text-slate-900 text-xs mt-1">1st Place</div>
                  <div className="font-mono font-extrabold text-amber-600 text-sm mt-0.5">
                    +{ROUND_REWARDS[1]} 🪙 Tokens
                  </div>
                </div>
                <div className="p-3.5 bg-white border border-amber-200 rounded-xl shadow-xs">
                  <div className="text-xl">🥈</div>
                  <div className="font-bold text-slate-900 text-xs mt-1">2nd Place</div>
                  <div className="font-mono font-extrabold text-slate-700 text-sm mt-0.5">
                    +{ROUND_REWARDS[2]} 🪙 Tokens
                  </div>
                </div>
                <div className="p-3.5 bg-white border border-amber-200 rounded-xl shadow-xs">
                  <div className="text-xl">🥉</div>
                  <div className="font-bold text-slate-900 text-xs mt-1">3rd Place</div>
                  <div className="font-mono font-extrabold text-amber-800 text-sm mt-0.5">
                    +{ROUND_REWARDS[3]} 🪙 Tokens
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 text-center leading-relaxed">
                Podium placements award <strong>Crypto Tokens (🪙)</strong> to acquire Word Cloaking Jammers and tactical equipment in the Arsenal Store. Arcade Credits are a sinking resource required for arena submissions.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Buy Credits with Telegram Stars */}
        {activeTab === 'buy' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className={`p-5 rounded-2xl border transition-all shadow-xs flex flex-col justify-between space-y-4 relative ${
                    pack.popular
                      ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20'
                      : 'border-slate-200 bg-white hover:border-amber-300'
                  }`}
                >
                  {pack.tag && (
                    <span
                      className={`absolute -top-2.5 right-4 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs ${
                        pack.popular
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {pack.tag}
                    </span>
                  )}

                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm">{pack.name}</h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black font-mono text-slate-900">
                        {pack.credits.toLocaleString()}
                      </span>
                      {pack.bonusCredits > 0 && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          +{pack.bonusCredits.toLocaleString()} Bonus
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-semibold">Credits</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Supports up to {pack.playsIncluded} arena match submissions
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-amber-700 font-mono flex items-center gap-1">
                        <span>⭐️</span>
                        <span>{pack.starsPrice.toLocaleString()} Stars</span>
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ≈ ₦{Math.round(pack.starsPrice * 37).toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuyPack(pack.id)}
                      disabled={purchasingPackId === pack.id}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {purchasingPackId === pack.id
                          ? 'Opening Invoice...'
                          : `Pay ⭐️ ${pack.starsPrice.toLocaleString()} Stars`}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              ⭐️ Dual Economy: Credits (⭐️) are a sinking resource required for arena play. Crypto Tokens (🪙) are earned in combat for base building and arsenal.
            </p>
          </div>
        )}

        {/* Tab 3: Weekly Cosmetics & Prestige Rewards (Tokens only, no credits) */}
        {activeTab === 'weekly' && (
          <div className="space-y-4 text-xs">
            <div className="space-y-2.5">
              {WEEKLY_REWARDS_SCHEDULE.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-slate-700">#{idx + 1}</span>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{item.cosmeticName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          {item.cosmeticType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{item.rankTier}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700">+{item.tokens} 🪙 Tokens</span>
                    <div className="text-[10px] text-emerald-700 font-semibold">Weekly Trophy</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditsModal;
