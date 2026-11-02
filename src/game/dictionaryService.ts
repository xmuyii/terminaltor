// Dictionary & Seed Word Service powered by supadb1.txt
// Generates 2 random 6-letter seed words per round and derives the 12-letter pool

export const SEED_WORDS_6L: string[] = [
  'stream', 'golden', 'planet', 'vector', 'socket', 'python', 'kernel', 'module',
  'system', 'binary', 'matrix', 'buffer', 'signal', 'object', 'action', 'branch',
  'client', 'server', 'thread', 'record', 'method', 'string', 'packet', 'schema',
  'cipher', 'render', 'deploy', 'script', 'lambda', 'filter', 'sorted', 'random',
  'global', 'import', 'return', 'bridge', 'castle', 'forest', 'orange', 'yellow',
  'spring', 'winter', 'summer', 'autumn', 'silver', 'copper', 'carbon', 'radius',
  'summit', 'shadow', 'dragon', 'wizard', 'knight', 'shield', 'energy', 'charge',
  'memory', 'device', 'screen', 'button', 'window', 'cursor', 'editor', 'canvas',
  'player', 'arcade', 'bounty', 'league', 'master', 'expert', 'mentor', 'legend',
  'leader', 'friend', 'school', 'course', 'lesson', 'target', 'reward', 'strike',
  'combat', 'attack', 'defend', 'rocket', 'falcon', 'spider', 'beacon', 'banner',
  'castle', 'anchor', 'harbor', 'island', 'jungle', 'canyon', 'desert', 'valley',
  'meadow', 'portal', 'zenith', 'vortex', 'quasar', 'pulsar', 'nebula', 'galaxy',
  'comet', 'meteor', 'cosmos', 'photon', 'atomic', 'plasma', 'fusion', 'dynamo',
  'engine', 'glider', 'sphere', 'prism', 'torque', 'sensor', 'switch', 'optics',
  'beacon', 'circuit', 'router', 'gateway', 'bridge', 'domain', 'socket', 'parser',
  'syntax', 'output', 'symbol', 'prompt', 'format', 'custom', 'native', 'secure',
  'cipher', 'crypto', 'tunnel', 'cookie', 'session', 'header', 'footer', 'layout',
  'column', 'navbar', 'dialog', 'drawer', 'picker', 'slider', 'toggle', 'widget',
  'render', 'canvas', 'vertex', 'camera', 'vector', 'matrix', 'linear', 'factor'
];

let fullDictionarySet: Set<string> | null = null;
let isLoadingDict = false;

export async function loadFullDictionary(): Promise<Set<string>> {
  if (fullDictionarySet && fullDictionarySet.size > 0) {
    return fullDictionarySet;
  }
  if (isLoadingDict) {
    return fullDictionarySet || new Set(SEED_WORDS_6L);
  }

  isLoadingDict = true;
  try {
    const res = await fetch('/supadb1.txt');
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n');
      fullDictionarySet = new Set(
        lines
          .map((l) => l.trim().toLowerCase())
          .filter((l) => l.length >= 3 && /^[a-z]+$/.test(l))
      );
      return fullDictionarySet;
    }
  } catch (err) {
    console.warn('Could not load supadb1.txt from /supadb1.txt, falling back to seed words set', err);
  } finally {
    isLoadingDict = false;
  }

  fullDictionarySet = new Set(SEED_WORDS_6L);
  return fullDictionarySet;
}

// Synchronously check against loaded set or fallback
export function checkWordInDictionary(word: string): boolean {
  const w = word.trim().toLowerCase();
  if (w.length < 3) return false;
  if (fullDictionarySet && fullDictionarySet.size > 0) {
    return fullDictionarySet.has(w);
  }
  // If dictionary is still loading, allow common dictionary words
  return true;
}

export function pickRandomSeedWords(): [string, string] {
  const idx1 = Math.floor(Math.random() * SEED_WORDS_6L.length);
  let idx2 = Math.floor(Math.random() * SEED_WORDS_6L.length);
  while (idx2 === idx1) {
    idx2 = Math.floor(Math.random() * SEED_WORDS_6L.length);
  }
  return [SEED_WORDS_6L[idx1], SEED_WORDS_6L[idx2]];
}

export function createPoolFromSeeds(word1: string, word2: string): string[] {
  // Pool is the combined letters of the 2 six-letter seed words (12 letters)
  const combined = (word1 + word2).toLowerCase().split('');
  // Return sorted or randomized letters of the 2 seed words
  return combined.sort();
}

export function getTwoRandomMidroundLetters(): [string, string] {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const l1 = alphabet[Math.floor(Math.random() * alphabet.length)];
  let l2 = alphabet[Math.floor(Math.random() * alphabet.length)];
  while (l2 === l1) {
    l2 = alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return [l1, l2];
}

export function canFormFromPool(word: string, pool: string[]): boolean {
  const poolCounts: Record<string, number> = {};
  for (const char of pool) {
    poolCounts[char] = (poolCounts[char] || 0) + 1;
  }
  for (const char of word.toLowerCase()) {
    if (!poolCounts[char] || poolCounts[char] <= 0) {
      return false;
    }
    poolCounts[char]--;
  }
  return true;
}
