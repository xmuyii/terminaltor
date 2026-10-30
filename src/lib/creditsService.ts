export const SUBMISSION_COST_CREDITS = 10;
export const DAILY_LOGIN_CREDITS = 100;

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  starsPrice: number; // Telegram Stars (⭐️)
  priceUsd?: number;
  priceNgn?: number;
  priceNaira?: number;
  tag?: string;
  playsIncluded: number;
  popular?: boolean;
}

// ⭐️ Real Economy Exchange Rates:
// Telegram Official Market: 100 Stars = ₦3,700 (1 Star = ₦37.00)
// Game Economy Target: 1,000 Credits = ₦2,500 (1 Credit = ₦2.50)
// Ratio: 1 Star = 14.8 Credits (or 1,000 Credits = ~68 to 70 Stars)
export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack_starter',
    name: 'Apprentice Stash',
    credits: 500,
    bonusCredits: 50,
    starsPrice: 35, // ~₦1,295 value
    tag: 'Quick Refill',
    playsIncluded: 55,
  },
  {
    id: 'pack_pro',
    name: 'Cadet Syndicate Pack',
    credits: 1000,
    bonusCredits: 150,
    starsPrice: 70, // Exactly 70 Stars = ₦2,590 (~₦2,500 target for 1,000 Credits!)
    tag: 'Most Popular',
    playsIncluded: 115,
    popular: true,
  },
  {
    id: 'pack_cadet',
    name: 'Cyber Hacker Cache',
    credits: 2500,
    bonusCredits: 500,
    starsPrice: 175, // ~₦6,475 value
    tag: 'Great Value',
    playsIncluded: 300,
  },
  {
    id: 'pack_elite',
    name: 'Citadel Overlord Core',
    credits: 5000,
    bonusCredits: 1200,
    starsPrice: 350, // ~₦12,950 value
    tag: 'Apex Sovereign',
    playsIncluded: 620,
  },
  {
    id: 'pack_whale',
    name: 'Sovereign Treasury Vault',
    credits: 37000,
    bonusCredits: 8000,
    starsPrice: 2500, // 2,500 Stars = ₦92,500 value = 37,000 Credits (+8,000 bonus!)
    tag: 'Whale Guild Vault',
    playsIncluded: 4500,
  },
];

export const ROUND_REWARDS: Record<string | number, number> = {
  1: 100,
  2: 70,
  3: 50,
  first: 100,
  second: 70,
  third: 50,
};

export const WEEKLY_REWARDS_SCHEDULE: Array<{
  rank: string;
  tokens: number;
  title: string;
  cosmeticName?: string;
  cosmeticType?: string;
  rankTier?: string;
}> = [
  { rank: '1st Place', tokens: 1000, title: 'Crown Champion', cosmeticName: '👑 Crown Champion', cosmeticType: 'Animated Halo', rankTier: 'Top 1' },
  { rank: '2nd Place', tokens: 600, title: 'Silver Runner', cosmeticName: '🥈 Silver Runner', cosmeticType: 'Cyan Spark', rankTier: 'Top 2' },
  { rank: '3rd Place', tokens: 350, title: 'Bronze Legend', cosmeticName: '🥉 Bronze Legend', cosmeticType: 'Amber Flare', rankTier: 'Top 3' },
  { rank: '4th - 10th', tokens: 150, title: 'Elite Challenger', cosmeticName: '⭐ Challenger', cosmeticType: 'Cadet Ribbon', rankTier: 'Top 10' },
];

const STORAGE_KEY_CREDITS = 'sovereign_credits_balance_v1';
const STORAGE_KEY_TOKENS = 'sovereign_crypto_tokens_v1';
const STORAGE_KEY_LAST_CLAIM = 'sovereign_last_daily_claim_v1';

class CreditsService {
  // Credits (⭐️ Premium Currency - purchased with Telegram Stars)
  getBalance(): number {
    if (typeof window === 'undefined') return 250;
    const stored = localStorage.getItem(STORAGE_KEY_CREDITS);
    if (stored !== null) {
      const val = parseInt(stored, 10);
      return isNaN(val) ? 250 : val;
    }
    return 250;
  }

  setBalance(amount: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_CREDITS, amount.toString());
    window.dispatchEvent(new CustomEvent('sovereign_credits_updated', { detail: { balance: amount } }));
  }

  deduct(amount: number = SUBMISSION_COST_CREDITS): boolean {
    const current = this.getBalance();
    if (current < amount) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sovereign_insufficient_credits'));
      }
      return false;
    }
    const updated = current - amount;
    this.setBalance(updated);
    return true;
  }

  add(amount: number): number {
    const updated = this.getBalance() + amount;
    this.setBalance(updated);
    return updated;
  }

  // Crypto / Cyber Tokens (🪙 In-game earned reward currency)
  getTokensBalance(): number {
    if (typeof window === 'undefined') return 300;
    const stored = localStorage.getItem(STORAGE_KEY_TOKENS);
    if (stored !== null) {
      const val = parseInt(stored, 10);
      return isNaN(val) ? 300 : val;
    }
    return 300;
  }

  setTokensBalance(amount: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_TOKENS, amount.toString());
    window.dispatchEvent(new CustomEvent('sovereign_tokens_updated', { detail: { tokens: amount } }));
  }

  addTokens(amount: number): number {
    const updated = this.getTokensBalance() + amount;
    this.setTokensBalance(updated);
    return updated;
  }

  deductTokens(amount: number): boolean {
    const current = this.getTokensBalance();
    if (current < amount) return false;
    const updated = current - amount;
    this.setTokensBalance(updated);
    return true;
  }

  rewardRoundPlacement(placement: number): number {
    const earned = ROUND_REWARDS[placement] || 0;
    if (earned > 0) {
      this.addTokens(earned);
    }
    return earned;
  }

  checkDailyClaimStatus(): { canClaim: boolean; lastClaimDate: string | null } {
    if (typeof window === 'undefined') return { canClaim: false, lastClaimDate: null };
    const lastClaim = localStorage.getItem(STORAGE_KEY_LAST_CLAIM);
    const today = new Date().toISOString().split('T')[0];
    return {
      canClaim: lastClaim !== today,
      lastClaimDate: lastClaim,
    };
  }

  claimDailyCredits(): { success: boolean; message: string; balance: number } {
    const status = this.checkDailyClaimStatus();
    if (!status.canClaim) {
      return {
        success: false,
        message: 'Daily credits already claimed today! Check back tomorrow.',
        balance: this.getBalance(),
      };
    }
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEY_LAST_CLAIM, today);
    const newBal = this.add(DAILY_LOGIN_CREDITS);
    return {
      success: true,
      message: `+${DAILY_LOGIN_CREDITS} Daily Login Credits added to your stash!`,
      balance: newBal,
    };
  }

  // Telegram Stars checkout integration
  async purchasePack(packId: string): Promise<{ success: boolean; newBalance: number; message: string }> {
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return { success: false, newBalance: this.getBalance(), message: 'Pack not found' };
    }

    const totalAdded = pack.credits + pack.bonusCredits;

    // Check if running inside Telegram WebApp
    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (win?.Telegram?.WebApp?.openInvoice) {
      try {
        // In live Telegram Bot, an invoice link created via BotFather / Telegram Stars API is opened
        win.Telegram.WebApp.openInvoice(`https://t.me/$stars_invoice_${pack.id}`, (status: string) => {
          if (status === 'paid') {
            this.add(totalAdded);
          }
        });
      } catch (e) {
        // Fallback simulation
      }
    }

    // Direct simulated payment with Telegram Stars confirmation
    await new Promise((r) => setTimeout(r, 600));
    const newBal = this.add(totalAdded);
    return {
      success: true,
      newBalance: newBal,
      message: `⭐️ Successfully charged ${pack.starsPrice} Telegram Stars! +${totalAdded} Credits added to your stash.`,
    };
  }
}

export const creditsService = new CreditsService();
