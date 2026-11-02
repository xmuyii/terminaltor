import React, { useState, useEffect } from 'react';
import { X, Shield, Zap, Sparkles, Plus, Award, AlertCircle, CheckCircle2, Gift, Clock, Radio, EyeOff } from 'lucide-react';
import { ARSENAL_ITEMS, StoreItem, InventoryItem, arsenalService } from '../lib/baseService';
import { creditsService } from '../lib/creditsService';
import { gameMasterGiftService, GiftStatus } from '../lib/gameMasterGiftService';
import { CryptoTokenArt, ArcadeCreditArt } from './CurrencyArt';

interface ArsenalStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCredits?: number;
  onCreditsUpdated?: () => void;
}

export const ArsenalStoreModal: React.FC<ArsenalStoreModalProps> = ({
  isOpen,
  onClose,
  onCreditsUpdated,
}) => {
  const [tokensBalance, setTokensBalance] = useState<number>(() => creditsService.getTokensBalance());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => arsenalService.getInventory());
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [giftStatus, setGiftStatus] = useState<GiftStatus>(() => gameMasterGiftService.getStatus());
  const [claimingGift, setClaimingGift] = useState(false);

  // Sync balances and inventory
  useEffect(() => {
    const handleUpdate = () => {
      setTokensBalance(creditsService.getTokensBalance());
      setInventory(arsenalService.getInventory());
      setGiftStatus(gameMasterGiftService.getStatus());
    };
    window.addEventListener('sovereign_tokens_updated', handleUpdate);
    window.addEventListener('sovereign_inventory_updated', handleUpdate);
    window.addEventListener('sovereign_gm_gift_claimed', handleUpdate);
    window.addEventListener('sovereign_gm_gift_status_changed', handleUpdate);
    return () => {
      window.removeEventListener('sovereign_tokens_updated', handleUpdate);
      window.removeEventListener('sovereign_inventory_updated', handleUpdate);
      window.removeEventListener('sovereign_gm_gift_claimed', handleUpdate);
      window.removeEventListener('sovereign_gm_gift_status_changed', handleUpdate);
    };
  }, []);

  // Live countdown ticker
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setGiftStatus(gameMasterGiftService.getStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBuy = (item: StoreItem) => {
    const res = arsenalService.buyItem(item.id);
    setActionNotice(res.message);
    setTokensBalance(creditsService.getTokensBalance());
    setInventory(arsenalService.getInventory());
    onCreditsUpdated?.();
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleUse = (itemId: string) => {
    const res = arsenalService.useItem(itemId);
    setActionNotice(res.message);
    setInventory(arsenalService.getInventory());
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleClaimGift = () => {
    if (claimingGift) return;
    setClaimingGift(true);
    try {
      const res = gameMasterGiftService.claimGift();
      setActionNotice(res.message);
      setGiftStatus(gameMasterGiftService.getStatus());
      setTokensBalance(creditsService.getTokensBalance());
      setInventory(arsenalService.getInventory());
      onCreditsUpdated?.();
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setClaimingGift(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#080d1a] border border-cyan-500/40 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Arsenal Store</span>
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  Tactical Gear
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Spend your combat Crypto Tokens (🪙) on tactical combat equipment &amp; word jammers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 font-mono font-bold text-emerald-300 text-xs shadow-xs">
              <CryptoTokenArt size={16} />
              <span>{tokensBalance.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-400 font-normal">TOKENS</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-3.5 rounded-2xl bg-cyan-950/70 border border-cyan-500/60 text-cyan-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* The Game Master Surprise Gift Drop Countdown Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900 border border-purple-500/50 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-purple-400/60 shrink-0">
              <img
                src="/assets/aistudio/Gemini_Generated_Image_4emglu4emglu4emg_baf4003d.png"
                alt="The Game Master"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-200">The Game Master Gift Package</span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-900/60 border border-purple-600 px-1.5 py-0.2 rounded">
                  {giftStatus.claimedCountToday}/{giftStatus.totalDailyGifts} Claimed Today
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                10 random surprise care packages dropped every 24 hours with free Crypto Tokens + tactical items.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Next Gift In</span>
              <span className={`text-sm font-mono font-black ${giftStatus.isReady ? 'text-emerald-400 animate-pulse' : 'text-purple-300'}`}>
                {giftStatus.formattedCountdown}
              </span>
            </div>

            {giftStatus.isReady ? (
              <button
                type="button"
                onClick={handleClaimGift}
                disabled={claimingGift}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform animate-bounce"
              >
                <Gift className="w-4 h-4 fill-current" />
                <span>Claim Gift</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-500 font-semibold text-xs flex items-center gap-1.5 cursor-not-allowed"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Locked</span>
              </button>
            )}
          </div>
        </div>

        {/* Arsenal Equipment Catalog */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Combat Equipment &amp; Jammers
            </h3>
            <span className="text-[11px] text-slate-500">
              Acquired via Crypto Tokens (🪙)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {ARSENAL_ITEMS.map((item) => {
              const invCount = inventory.find((i) => i.itemId === item.id)?.quantity || 0;
              const canAfford = tokensBalance >= item.priceTokens;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3 relative group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <h4 className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-mono text-cyan-400/80 block">
                            {item.category.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs">
                        <CryptoTokenArt size={14} />
                        <span>{item.priceTokens}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="text-[10px] font-mono text-cyan-300/90 bg-cyan-950/40 border border-cyan-800/40 px-2 py-1 rounded-lg">
                      ⚡ {item.effect}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-400">
                      Owned: <strong className="text-white font-bold">{invCount}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Purchase' : 'Need More Tokens'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Owned Active Inventory */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Your Active Tactical Inventory</span>
            <span className="text-[10px] font-mono text-slate-500">Auto-ready in matches</span>
          </h3>

          {inventory.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              No equipment in inventory. Purchase tactical gear above or wait for The Game Master gift drops!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {inventory.map((inv) => {
                const item = ARSENAL_ITEMS.find((i) => i.id === inv.itemId);
                if (!item) return null;
                return (
                  <div
                    key={inv.itemId}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-lg">{item.icon}</span>
                      <div className="truncate">
                        <span className="font-bold text-white block truncate text-[11px]">{item.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">Qty: {inv.quantity}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUse(inv.itemId)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-700 hover:bg-cyan-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      Deploy
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CyberBaseStoreModal = ArsenalStoreModal;
export default ArsenalStoreModal;
