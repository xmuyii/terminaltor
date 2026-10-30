import { creditsService } from './creditsService';

export interface StoreItem {
  id: string;
  name: string;
  category: 'attack' | 'shield' | 'defend' | 'utility';
  icon: string;
  priceTokens: number;
  description: string;
  effect: string;
}

export const ARSENAL_ITEMS: StoreItem[] = [
  {
    id: 'item_word_jammer',
    name: 'Word Cloaking Jammer',
    category: 'utility',
    icon: '📡',
    priceTokens: 40,
    description: 'Scrambles your active keystrokes and forged words in the live room feed into encrypted cyber ciphers (█▓░▒█) so rivals cannot copy your words to score!',
    effect: 'Single-use stealth cloak per round: masks your words from all room opponents',
  },
  {
    id: 'item_firewall_shield',
    name: 'Firewall Aegis',
    category: 'shield',
    icon: '🛡️',
    priceTokens: 50,
    description: 'Deploys an energy shield protecting you from Game Master penalties and incoming rival disruptions.',
    effect: 'Immunity from Game Master rank shuffles & player attacks for 1 round',
  },
  {
    id: 'item_syntax_emp',
    name: 'Syntax EMP Cannon',
    category: 'attack',
    icon: '⚡',
    priceTokens: 50,
    description: 'Fires an electromagnetic pulse into the arena room, scrambling rival active letters for 10 seconds.',
    effect: 'Inflicts 10s letter-shuffle disruption on room rivals',
  },
  {
    id: 'item_cipher_decrypter',
    name: 'Cipher Decrypter',
    category: 'utility',
    icon: '🔍',
    priceTokens: 60,
    description: 'Quantum-analyzes the active letter pool and highlights the root anagram vowels and suffixes.',
    effect: 'Highlights key 6-letter anagram clusters for 15 seconds',
  },
  {
    id: 'item_double_overdrive',
    name: '2x Overdrive Booster',
    category: 'attack',
    icon: '🚀',
    priceTokens: 75,
    description: 'Injects high-frequency clock cycles into your next successful word or debug assertion.',
    effect: 'Doubles points on next 2 correct submissions',
  },
  {
    id: 'item_time_freeze',
    name: 'Time Freeze Matrix',
    category: 'shield',
    icon: '⏳',
    priceTokens: 50,
    description: 'Temporal distortion field that extends your current question response window by 5 seconds.',
    effect: '+5 seconds cushion on next active debug question',
  },
];

export interface InventoryItem {
  itemId: string;
  quantity: number;
  equipped?: boolean;
}

// Backwards compatibility base type (stubbed)
export interface CyberBase {
  level: number;
  name: string;
  coreHp: number;
  maxHp: number;
  shieldHp: number;
  maxShieldHp: number;
  dailyCoinYield: number;
  defenseRating: number;
  modules: {
    firewall: number;
    forgeCore: number;
    sentryTurret: number;
    quantumRelay: number;
  };
}

const STORAGE_KEY_INVENTORY = 'sovereign_player_inventory_v2';

class ArsenalService {
  getInventory(): InventoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INVENTORY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [
      { itemId: 'item_word_jammer', quantity: 1, equipped: true },
      { itemId: 'item_firewall_shield', quantity: 1, equipped: false },
    ];
  }

  saveInventory(inv: InventoryItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inv));
    window.dispatchEvent(new CustomEvent('sovereign_inventory_updated'));
  }

  addItem(itemId: string, qty: number = 1): void {
    const inv = this.getInventory();
    const existing = inv.find((i) => i.itemId === itemId);
    if (existing) {
      existing.quantity += qty;
    } else {
      inv.push({ itemId, quantity: qty, equipped: false });
    }
    this.saveInventory(inv);
  }

  buyItem(itemId: string): { success: boolean; message: string } {
    const item = ARSENAL_ITEMS.find((i) => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found in Arsenal.' };

    const currentTokens = creditsService.getTokensBalance();
    if (currentTokens < item.priceTokens) {
      return {
        success: false,
        message: `Insufficient Crypto Tokens. You need ${item.priceTokens} 🪙 (Balance: ${currentTokens} 🪙).`,
      };
    }

    const deducted = creditsService.deductTokens(item.priceTokens);
    if (!deducted) {
      return { success: false, message: 'Transaction failed.' };
    }

    this.addItem(itemId, 1);
    return {
      success: true,
      message: `Purchased 1x ${item.name} for ${item.priceTokens} 🪙 Tokens!`,
    };
  }

  useItem(itemId: string): { success: boolean; message: string } {
    const inv = this.getInventory();
    const itemIdx = inv.findIndex((i) => i.itemId === itemId);
    if (itemIdx === -1 || inv[itemIdx].quantity <= 0) {
      return { success: false, message: 'Item not in inventory.' };
    }

    inv[itemIdx].quantity -= 1;
    if (inv[itemIdx].quantity <= 0) {
      inv.splice(itemIdx, 1);
    }
    this.saveInventory(inv);

    const storeItem = ARSENAL_ITEMS.find((i) => i.id === itemId);
    const itemName = storeItem ? storeItem.name : 'Arsenal Item';
    return { success: true, message: `Activated ${itemName}! Effect: ${storeItem?.effect}` };
  }

  // Backwards compatibility methods for any legacy calls
  getBase(): CyberBase {
    return {
      level: 1,
      name: 'Operative Arsenal Station',
      coreHp: 500,
      maxHp: 500,
      shieldHp: 200,
      maxShieldHp: 200,
      dailyCoinYield: 0,
      defenseRating: 50,
      modules: { firewall: 1, forgeCore: 1, sentryTurret: 1, quantumRelay: 1 },
    };
  }
}

export const arsenalService = new ArsenalService();
export const cyberBaseService = arsenalService;
