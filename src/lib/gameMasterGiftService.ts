import { creditsService } from './creditsService';
import { cyberBaseService, ARSENAL_ITEMS, StoreItem } from './baseService';

export interface GiftStatus {
  claimedCountToday: number;
  totalDailyGifts: number;
  remainingGiftsToday: number;
  isReady: boolean;
  timeRemainingMs: number;
  formattedCountdown: string;
  nextDropTimestamp: number;
}

export interface ClaimedGiftResult {
  success: boolean;
  tokens: number;
  item: StoreItem | null;
  message: string;
  remainingGiftsToday: number;
  nextDropTimestamp: number;
}

const STORAGE_KEY_GIFTS = 'sovereign_gm_gifts_v2';
const TOTAL_DAILY_GIFTS = 10;

function getTodayKey(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

interface StoredGiftState {
  dateKey: string;
  claimedCountToday: number;
  nextDropTimestamp: number;
}

class GameMasterGiftService {
  private getState(): StoredGiftState {
    const today = getTodayKey();
    const defaultState: StoredGiftState = {
      dateKey: today,
      claimedCountToday: 0,
      // First gift drops within 2 to 15 minutes of first play
      nextDropTimestamp: Date.now() + (Math.floor(Math.random() * 8) + 2) * 60 * 1000,
    };

    if (typeof window === 'undefined') return defaultState;

    try {
      const raw = localStorage.getItem(STORAGE_KEY_GIFTS);
      if (!raw) {
        this.saveState(defaultState);
        return defaultState;
      }
      const parsed: StoredGiftState = JSON.parse(raw);
      // Reset if new day
      if (parsed.dateKey !== today) {
        const resetState: StoredGiftState = {
          dateKey: today,
          claimedCountToday: 0,
          nextDropTimestamp: Date.now() + (Math.floor(Math.random() * 8) + 2) * 60 * 1000,
        };
        this.saveState(resetState);
        return resetState;
      }
      return parsed;
    } catch {
      return defaultState;
    }
  }

  private saveState(state: StoredGiftState): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_GIFTS, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('sovereign_gm_gift_status_changed'));
  }

  getStatus(): GiftStatus {
    const state = this.getState();
    const now = Date.now();
    const remainingGiftsToday = Math.max(0, TOTAL_DAILY_GIFTS - state.claimedCountToday);
    const hasMoreGiftsToday = remainingGiftsToday > 0;
    const isReady = hasMoreGiftsToday && now >= state.nextDropTimestamp;
    const timeRemainingMs = isReady ? 0 : Math.max(0, state.nextDropTimestamp - now);

    const totalSeconds = Math.floor(timeRemainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let formattedCountdown = '00:00';
    if (!hasMoreGiftsToday) {
      formattedCountdown = 'Daily Limit Reached';
    } else if (isReady) {
      formattedCountdown = 'READY TO CLAIM!';
    } else if (hours > 0) {
      formattedCountdown = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      formattedCountdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return {
      claimedCountToday: state.claimedCountToday,
      totalDailyGifts: TOTAL_DAILY_GIFTS,
      remainingGiftsToday,
      isReady,
      timeRemainingMs,
      formattedCountdown,
      nextDropTimestamp: state.nextDropTimestamp,
    };
  }

  claimGift(): ClaimedGiftResult {
    const state = this.getState();
    const now = Date.now();
    const remaining = Math.max(0, TOTAL_DAILY_GIFTS - state.claimedCountToday);

    if (remaining <= 0) {
      return {
        success: false,
        tokens: 0,
        item: null,
        message: 'All 10 daily Game Master gifts claimed! Next batch unlocks at midnight.',
        remainingGiftsToday: 0,
        nextDropTimestamp: state.nextDropTimestamp,
      };
    }

    if (now < state.nextDropTimestamp) {
      const waitMins = Math.ceil((state.nextDropTimestamp - now) / 60000);
      return {
        success: false,
        tokens: 0,
        item: null,
        message: `The Game Master has not dropped the next package yet. Arriving in ~${waitMins} min!`,
        remainingGiftsToday: remaining,
        nextDropTimestamp: state.nextDropTimestamp,
      };
    }

    // Reward: 75 to 150 Crypto Tokens
    const tokensWon = Math.floor(Math.random() * 76) + 75;
    creditsService.addTokens(tokensWon);

    // Reward: Random tactical equipment from Arsenal
    const availableItems = ARSENAL_ITEMS.filter((i) => i.id !== 'item_citadel_core');
    const randomItem = availableItems.length > 0
      ? availableItems[Math.floor(Math.random() * availableItems.length)]
      : null;

    if (randomItem) {
      cyberBaseService.addItem(randomItem.id, 1);
    }

    const nextClaimed = state.claimedCountToday + 1;
    // Next drop randomly between 45 and 90 minutes (spreads 10 drops across 24h)
    const nextIntervalMs = (Math.floor(Math.random() * 45) + 45) * 60 * 1000;
    const nextDropTimestamp = now + nextIntervalMs;

    this.saveState({
      dateKey: state.dateKey,
      claimedCountToday: nextClaimed,
      nextDropTimestamp,
    });

    const itemName = randomItem ? randomItem.name : 'Tactical Booster';
    const message = `🎁 The Game Master: “Here is your contraband drop, Cadet: +${tokensWon} Crypto Tokens and 1x ${itemName}! Smuggled past The Terminaltor's firewall. (${TOTAL_DAILY_GIFTS - nextClaimed} drops left today)”`;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sovereign_gm_gift_claimed', {
        detail: { tokens: tokensWon, item: randomItem, remaining: TOTAL_DAILY_GIFTS - nextClaimed, message },
      }));

      window.dispatchEvent(new CustomEvent('sovereign_gm_notification', {
        detail: { title: 'The Game Master Care Package', message },
      }));

      // Native browser notification if user permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('The Game Master', {
            body: message,
            icon: '/assets/irete_labs_logo.jpg',
          });
        } catch {
          // Non-blocking
        }
      }
    }

    return {
      success: true,
      tokens: tokensWon,
      item: randomItem,
      message,
      remainingGiftsToday: Math.max(0, TOTAL_DAILY_GIFTS - nextClaimed),
      nextDropTimestamp,
    };
  }
}

export const gameMasterGiftService = new GameMasterGiftService();
