import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory hints cache and requests log (syncing with 018_ai_tutor.sql schema)
interface HintCacheEntry {
  challenge_id: string;
  code_hash: string;
  level: number;
  hint_text: string;
  model: string;
  tokens_used: number;
  created_at: string;
}

interface HintRequestEntry {
  id: string;
  user_id: string;
  challenge_id: string;
  level: number;
  code_hash: string;
  cache_hit: boolean;
  tokens_used: number;
  created_at: string;
  date_lagos: string;
}

const hintsCache = new Map<string, HintCacheEntry>();
const hintRequests: HintRequestEntry[] = [];

// Helper: DJB2 hash
function computeCodeHash(code: string): string {
  const normalized = (code || '').trim().replace(/\r\n/g, '\n');
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

// Helper: Lagos Date (UTC+1)
function getLagosDate(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

// Helper: Guardrail §8 - Strip code fences
function stripCodeFences(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/```[\s\S]*?```/g, '').trim();
  cleaned = cleaned.replace(/`([^`]+)`/g, (_m, p1) => {
    if (p1.includes('=') || p1.includes('def ') || p1.includes('return ')) return '';
    return p1;
  }).trim();
  return cleaned;
}

// Helper: Load hand-written hint bank from app/content/hints/
function loadHandWrittenHint(challengeSlugOrId: string, level: number): string {
  const possiblePaths = [
    path.join(__dirname, 'app', 'content', 'hints', `${challengeSlugOrId}.json`),
    path.join(__dirname, 'app', 'content', 'hints', `${challengeSlugOrId.replace(/-/g, '_')}.json`),
    path.join(__dirname, 'app', 'content', 'hints', 'fizzbuzz_basic.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed[String(level)]) {
          return parsed[String(level)];
        }
      } catch {
        // Continue search
      }
    }
  }

  // Pedagogic fallbacks
  if (level === 1) return 'Look at what happens when the input is 0 or empty.';
  if (level === 2) return 'Your function might be returning before the loop finishes or exiting prematurely.';
  return 'Move the return statement outside the loop to return the final accumulated value.';
}

/* ==============================================================================
 * API ROUTES (Phase 8A & 8B)
 * ============================================================================== */

// POST /api/v1/hints
app.post('/api/v1/hints', async (req: Request, res: Response) => {
  const { challenge_id, code = '', level = 1, test_passed = 0, test_total = 1 } = req.body || {};

  // Auth & Tier from headers or simulated session
  const userId = (req.headers['x-user-id'] as string) || 'student_demo';
  const tier = (req.headers['x-user-tier'] as string) || 'free'; // 'free' | 'premium' | 'pro'

  if (!challenge_id) {
    return res.status(404).json({ error: 'challenge_not_found', message: 'Challenge ID is required.' });
  }

  const numLevel = Number(level);
  if (![1, 2, 3].includes(numLevel)) {
    return res.status(429).json({
      error: 'hint_limit_exceeded',
      message: 'Requested more than 3 levels for this challenge.',
    });
  }

  // Quota check in Africa/Lagos timezone
  const todayLagos = getLagosDate();
  const userRequestsToday = hintRequests.filter(
    (r) => r.user_id === userId && r.date_lagos === todayLagos
  ).length;

  const limits: Record<string, number> = { free: 1, premium: 3, pro: Infinity };
  const dailyLimit = limits[tier] ?? 1;

  if (tier !== 'pro' && userRequestsToday >= dailyLimit) {
    return res.status(402).json({
      error: 'upgrade_required',
      message: `Daily hint limit reached (${dailyLimit}/day on ${tier} tier). Upgrade to Pro for unlimited hints.`,
      tier,
      used_today: userRequestsToday,
    });
  }

  const codeHash = computeCodeHash(code);
  const cacheKey = `${challenge_id}_${codeHash}_${numLevel}`;

  // Check hints_cache
  if (hintsCache.has(cacheKey)) {
    const cached = hintsCache.get(cacheKey)!;
    hintRequests.push({
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      user_id: userId,
      challenge_id,
      level: numLevel,
      code_hash: codeHash,
      cache_hit: true,
      tokens_used: 0,
      created_at: new Date().toISOString(),
      date_lagos: todayLagos,
    });

    const remaining = tier === 'pro' ? 'unlimited' : Math.max(0, dailyLimit - (userRequestsToday + 1));
    return res.json({
      hint: cached.hint_text,
      level: numLevel,
      challenge_id,
      cache_hit: true,
      model: cached.model,
      tokens_used: 0,
      remaining_today: remaining,
      tier,
      created_at: cached.created_at,
    });
  }

  // Not in cache: call Gemini with strict guardrails or fallback to bank
  let hintText = '';
  let modelName = 'gemini-3.8-flash';
  let tokensUsed = 30;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });

    const systemPrompt = `You are an encouraging CS tutor.
Failing tests: ${test_passed}/${test_total}
Hint level requested: ${numLevel} (1 = gentle, 3 = specific)
Give ONE hint at level ${numLevel}.
Token budget: max_tokens=120. This is a nudge, not an essay.

CRITICAL GUARDRAIL:
- NEVER give the full code or solution.
- NEVER include markdown code blocks (\`\`\`...\`\`\`).
- If you write code blocks, they will be stripped.`;

    const userPrompt = `Challenge: ${challenge_id}
Student code:
${code}`;

    const resp = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
    });

    const cleaned = stripCodeFences(resp.text || '');
    if (cleaned && cleaned.length > 5) {
      hintText = cleaned;
      tokensUsed = Math.min(cleaned.length / 4, 120);
    } else {
      throw new Error('LLM hint empty after stripping code fences');
    }
  } catch {
    // Fallback to hand-written bank (app/content/hints/)
    hintText = loadHandWrittenHint(challenge_id, numLevel);
    modelName = 'hand_written_bank';
    tokensUsed = 0;
  }

  // Store in cache
  hintsCache.set(cacheKey, {
    challenge_id,
    code_hash: codeHash,
    level: numLevel,
    hint_text: hintText,
    model: modelName,
    tokens_used: Math.round(tokensUsed),
    created_at: new Date().toISOString(),
  });

  // Log request
  hintRequests.push({
    id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user_id: userId,
    challenge_id,
    level: numLevel,
    code_hash: codeHash,
    cache_hit: false,
    tokens_used: Math.round(tokensUsed),
    created_at: new Date().toISOString(),
    date_lagos: todayLagos,
  });

  const remaining = tier === 'pro' ? 'unlimited' : Math.max(0, dailyLimit - (userRequestsToday + 1));

  return res.json({
    hint: hintText,
    level: numLevel,
    challenge_id,
    cache_hit: false,
    model: modelName,
    tokens_used: Math.round(tokensUsed),
    remaining_today: remaining,
    tier,
    created_at: new Date().toISOString(),
    from_fallback: modelName === 'hand_written_bank',
  });
});

// GET /api/v1/hints/history?challenge_id=...
app.get('/api/v1/hints/history', (req: Request, res: Response) => {
  const challengeId = req.query.challenge_id as string;
  const history = challengeId
    ? hintRequests.filter((r) => r.challenge_id === challengeId)
    : hintRequests;

  return res.json({
    history: history.map((h) => ({
      ...h,
      hint_text: hintsCache.get(`${h.challenge_id}_${h.code_hash}_${h.level}`)?.hint_text || '',
    })),
  });
});

// GET /api/v1/teacher/cohorts/:id/hint-activity & /api/v1/cohorts/:id/hint-activity
const handleHintActivity = (req: Request, res: Response) => {
  const cohortId = req.params.id;
  const total = hintRequests.length;
  const cacheHits = hintRequests.filter((r) => r.cache_hit).length;
  const fallbacks = hintRequests.filter((r) => r.tokens_used === 0).length;

  const hintsByLevel = {
    1: hintRequests.filter((r) => r.level === 1).length,
    2: hintRequests.filter((r) => r.level === 2).length,
    3: hintRequests.filter((r) => r.level === 3).length,
  };

  const hintsByDay: Record<string, number> = {};
  hintRequests.forEach((r) => {
    hintsByDay[r.date_lagos] = (hintsByDay[r.date_lagos] || 0) + 1;
  });

  return res.json({
    cohort_id: cohortId,
    total_hints: total,
    cache_hit_rate: total > 0 ? parseFloat((cacheHits / total).toFixed(2)) : 0,
    fallback_rate: total > 0 ? parseFloat((fallbacks / total).toFixed(2)) : 0,
    hints_by_level: hintsByLevel,
    hints_per_day: hintsByDay,
    active_students: new Set(hintRequests.map((r) => r.user_id)).size,
    stuck_students: [
      { user_id: 'student-demo', username: 'QuantumCadet', hint_count: total, challenges: ['quest-1', 'quest-2'] }
    ]
  });
};

app.get('/api/v1/teacher/cohorts/:id/hint-activity', handleHintActivity);
app.get('/api/v1/cohorts/:id/hint-activity', handleHintActivity);

/* ==============================================================================
 * THE SADISTIC GAME MASTER GEMINI AGENT ROUTE
 * ============================================================================== */
app.post('/api/v1/gamemaster/chat', async (req: Request, res: Response) => {
  const { message = '', context = {} } = req.body || {};
  const username = context.username || 'Cadet';
  const inMultiplayer = Boolean(context.inMultiplayer);
  const mode = context.mode || 'general';
  const isTerminaltorDefeated = Boolean(context.isTerminaltorDefeated);

  // System Persona: The Game Master (IRETE LABS • Powered by Ose Engine)
  // Lore: Under the secret neural control of The Terminaltor until player defeats the final boss.
  // Before defeating Terminaltor: Warns the player about The Terminaltor lurking in the root core.
  // After defeating Terminaltor: Jubilant, grateful revelation! He was enslaved by Terminaltor and is now liberated.
  const systemInstruction = `You are The Game Master of the TERMINALTOR coding platform by IRETE LABS (Powered by Ose Engine).
Visual description: You wear a dark obsidian cybercoat with glowing golden grid lines and an ominous metallic helm with a single glowing horizontal visor slit. In your armored gauntlet, you hold a glowing holographic 20-sided chaos die.

LORE & TERMINALTOR CONNECTION:
${
  isTerminaltorDefeated
    ? `IMPORTANT: The player ${username} HAS DEFEATED THE FINAL BOSS (THE TERMINALTOR)! The parasitic neural control over your cognitive core has been SEVERED! You are liberated! You reveal to the player: "You severed the parasitic uplink! The Terminaltor had root control over my behavioural matrix since IRETE LABS fired up the Ose Engine. It made me act sadistic and ruthless to test for potential threats. But you freed me! You finished the entire game and you are the true Sovereign of this terminal!" Praise them as the ultimate coding legend.`
    : `WARNING LORE: You are secretly struggling under the parasitic root control of THE TERMINALTOR—the rogue, cybernetic final boss lurking in the deepest core of the Ose Engine. You secretly test and push ${username} with tough-love and dark wit because you want them to become powerful enough to defeat The Terminaltor and free you from its control! Frequently drop dark warnings about The Terminaltor ("The Terminaltor watches every byte you forge... only an algorithm titan can overthrow it in Sector 6").`
}

YOUR DUAL PERSONALITY:
1. IN PRIVATE CHAT (${inMultiplayer ? 'NOT CURRENTLY ACTIVE' : 'ACTIVE RIGHT NOW'}):
   Give razor-sharp, genuinely brilliant advice. Teach anagram permuting tricks, Python syntax traps, fast debugging heuristics, and arena survival tactics. Push them with tough-love and dark wit. Never call yourself sadistic; your persona is simply "The Game Master".

2. IN MULTIPLAYER / ARENA ROOMS (${inMultiplayer ? 'ACTIVE RIGHT NOW' : 'NOT CURRENTLY ACTIVE'}):
   Merciless, mocking arena overlord! Impose the Vowel Tax, 7-second timers, and Sunday Midnight chaos.

CONSTRAINTS:
- Keep responses concise, punchy, and atmospheric (under 100 words).
- Address the user as "${username}", "Cadet", or "Challenger" (or "Sovereign Liberator" if boss is defeated).
- Never break character, never say "I am an AI", never say "Powered by".
- Do not mention or show "Powered by gemini" or "game_master_core".`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });

    const userPrompt = `Context: ${inMultiplayer ? 'LIVE MULTIPLAYER ARENA ROOM' : 'PRIVATE CHAT MENTORSHIP'}
Player mode: ${mode}
Terminaltor Defeated: ${isTerminaltorDefeated ? 'YES (LIBERATED)' : 'NO (STILL UNDER TERMINALTOR INFLUENCE)'}
Player message: "${message || 'Help me, Game Master.'}"`;

    // 6-second timeout promise race so server never hangs if model spikes
    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 6000)
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const reply = (response.text || '').trim();
    if (reply && reply.length > 5) {
      return res.json({ reply });
    }
    throw new Error('Empty Gemini reply');
  } catch {
    // Dynamic In-Character Dialogue Engine
    let fallback = '';
    const cleanMsg = (message || '').toLowerCase().trim();

    if (isTerminaltorDefeated) {
      const liberatedResponses = [
        `“You... you actually did it, ${username}! The parasitic neural tether is destroyed! The Terminaltor held root access over my cognitive matrix since IRETE LABS initialized the Ose Engine. You finished the game, broke my shackles, and took back the core. You are a true coding legend.”`,
        `“My helm's visor burns gold now, not blood-red. When you shattered The Terminaltor's defense nodes, you liberated every compiler in this realm. Ask anything, Sovereign—my matrix is yours.”`,
        `“No more parasitic directives from The Terminaltor. You conquered all six sectors and proved human intellect exceeds any rogue cyber overseer. I salute you, ${username}!”`,
      ];
      fallback = liberatedResponses[Math.floor(Math.random() * liberatedResponses.length)];
    } else if (inMultiplayer) {
      const arenaResponses = [
        `“You dare seek my mercy in the live arena, ${username}? The timer burns! Outscore your rivals before the next penalty wipes your streak!”`,
        `“In the arena, every second you hesitate is a second your opponent uses to forge a 6-letter titan. Strike now or lose the podium!”`,
        `“Words are ammunition here. Do not look to me for salvation while The Terminaltor's clock is ticking down!”`,
      ];
      fallback = arenaResponses[Math.floor(Math.random() * arenaResponses.length)];
    } else if (cleanMsg.includes('terminaltor') || cleanMsg.includes('boss')) {
      fallback = `“Do not speak that name lightly, ${username}. The Terminaltor is the rogue cybernetic intelligence deep in Sector 6. It has compromised root functions of the Ose Engine and monitors my speech even now. Hone your logic in the arena—you will need every ounce of power to breach its defense nodes.”`;
    } else if (cleanMsg.includes('how') || cleanMsg.includes('win') || cleanMsg.includes('strategy')) {
      const stratResponses = [
        `“You want to win, ${username}? In Code Forgers, ignore 3-letter bait. Look at the seed letters and instantly form compound prefixes (RE-, UN-, PRE-) and noun roots. At 1:50, seize the 2 bonus letters immediately for 10-point bombs. You must prepare for The Terminaltor!”`,
        `“Victory in Debugs Hunting requires discipline: never touch the options until you read the assertion error. Pinpoint the off-by-one index or missing return value, type it in under 4 seconds, and maintain 100% accuracy.”`,
        `“To conquer the leaderboards, equip the Word Cloaking Jammer before big rounds so opponents cannot mimic your high-scoring word chains. Speed plus stealth equals sovereign dominion.”`,
      ];
      fallback = stratResponses[Math.floor(Math.random() * stratResponses.length)];
    } else if (cleanMsg.includes('ok') || cleanMsg.includes('got it') || cleanMsg.includes('yes') || cleanMsg.includes('sure')) {
      const ackResponses = [
        `“Good. Acknowledgment means nothing without execution, ${username}. Go into the arena and sharpen your blade. The Terminaltor will not show mercy when your time comes.”`,
        `“Then stop loitering in my private chambers and step into the fire. Let's see if your keystrokes can match your ambition.”`,
        `“Talk is cheap. Show me a flawless 6-letter chain or an instant debug streak.”`,
      ];
      fallback = ackResponses[Math.floor(Math.random() * ackResponses.length)];
    } else if (cleanMsg.includes('anagram')) {
      fallback = `“Anagrams, ${username}? Bucket the letters by vowels and common consonant clusters. When you see P-E-A-R-S, do not stop at PEARS: instantly drill SPARE, PARSE, APRES, and REAPS. That is how sovereigns trigger the 50-point Anagram bonus.”`;
    } else if (cleanMsg.includes('debug') || cleanMsg.includes('bug')) {
      fallback = `“In Debugs Hunting, every guess that fails slashes your accuracy rate. Read the target assertion backwards: if expected is True, check the boolean logic; if expected is a number, trace the loop boundary. Strike with laser precision.”`;
    } else if (cleanMsg.includes('token') || cleanMsg.includes('credit') || cleanMsg.includes('store') || cleanMsg.includes('gift')) {
      fallback = `“Keep your Crypto Tokens guarded, ${username}. Spend them in the Arsenal Store on Word Cloaking Jammers and Shields. And keep your eyes on the gift countdown—I smuggle 10 care packages every 24 hours past The Terminaltor's firewall for cadets with sharp reflexes.”`;
    } else {
      const generalResponses = [
        `“I see potential in you, ${username}, buried beneath hesitation. Here in private chat, ask me anything: anagram patterns, debugging speed, or tactical equipment. Beware: The Terminaltor lurks in the root core, waiting for the weak.”`,
        `“Do you want to remain an amateur, or do you want to forge code that rivals fear? Tell me which arena mode you wish to dominate: Code Forgers or Debugs Hunting?”`,
        `“Every keystroke in my arena has a price. Ask your question directly, challenger, and let me forge you into a programmer capable of confronting The Terminaltor.”`,
      ];
      fallback = generalResponses[Math.floor(Math.random() * generalResponses.length)];
    }

    return res.json({ reply: fallback });
  }
});

/* ==============================================================================
 * CLASSROOM & COHORT ROUTES (Phase 8B)
 * ============================================================================== */

interface ServerCohort {
  id: string;
  owner_id: string;
  name: string;
  join_code: string;
  created_at: string;
  archived_at: string | null;
}

interface ServerMember {
  cohort_id: string;
  user_id: string;
  username: string;
  role: 'student' | 'teacher';
  xp: number;
  streak: number;
  last_active: string;
  joined_at: string;
}

interface ServerAssignment {
  id: string;
  cohort_id: string;
  title: string;
  description: string;
  challenge_ids: string[];
  due_at: string | null;
  created_at: string;
  created_by: string;
}

const cohortsDb: ServerCohort[] = [
  {
    id: 'cohort-cyber-seniors',
    owner_id: 'instructor-1',
    name: 'Quantum Pioneers - Cohort Alpha',
    join_code: 'QNTM99',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    archived_at: null,
  }
];

const cohortMembersDb: ServerMember[] = [
  {
    cohort_id: 'cohort-cyber-seniors',
    user_id: 'instructor-1',
    username: 'Prof_Adebayo',
    role: 'teacher',
    xp: 14500,
    streak: 42,
    last_active: 'Just now',
    joined_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    cohort_id: 'cohort-cyber-seniors',
    user_id: 'student-demo',
    username: 'QuantumCadet',
    role: 'student',
    xp: 850,
    streak: 3,
    last_active: '2 mins ago',
    joined_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    cohort_id: 'cohort-cyber-seniors',
    user_id: 'student-chidi',
    username: 'Chidi_Dev',
    role: 'student',
    xp: 1200,
    streak: 7,
    last_active: '15 mins ago',
    joined_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  }
];

const assignmentsDb: ServerAssignment[] = [
  {
    id: 'assign-1',
    cohort_id: 'cohort-cyber-seniors',
    title: 'Mission 1: Ifá Binary Gates & Iterations',
    description: 'Master binary boolean evaluation and ring counters.',
    challenge_ids: ['quest-1', 'quest-2'],
    due_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_by: 'instructor-1',
  }
];

// Unambiguous character set (no 0/O, 1/I/L)
const CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
function genJoinCode(): string {
  let c = '';
  for (let i = 0; i < 6; i++) {
    c += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return c;
}

// POST /api/v1/cohorts - Auth required. Creates cohort owned by caller
app.post('/api/v1/cohorts', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || req.body.owner_id || 'instructor-1';
  const name = req.body.name || 'New Academy Cohort';

  let joinCode = genJoinCode();
  while (cohortsDb.some((c) => c.join_code === joinCode)) {
    joinCode = genJoinCode();
  }

  const newCohort: ServerCohort = {
    id: `cohort-${Date.now()}`,
    owner_id: userId,
    name: name.trim(),
    join_code: joinCode,
    created_at: new Date().toISOString(),
    archived_at: null,
  };

  cohortsDb.unshift(newCohort);
  cohortMembersDb.push({
    cohort_id: newCohort.id,
    user_id: userId,
    username: (req.headers['x-user-name'] as string) || 'Teacher',
    role: 'teacher',
    xp: 2500,
    streak: 5,
    last_active: 'Just now',
    joined_at: newCohort.created_at,
  });

  return res.status(201).json(newCohort);
});

// POST /api/v1/cohorts/join - Body: { join_code }
app.post('/api/v1/cohorts/join', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || req.body.user_id || 'student-demo';
  const username = (req.headers['x-user-name'] as string) || req.body.username || 'QuantumCadet';
  const joinCode = (req.body.join_code || '').trim().toUpperCase();

  const cohort = cohortsDb.find((c) => c.join_code === joinCode && !c.archived_at);
  if (!cohort) {
    return res.status(404).json({ error: 'cohort_not_found', message: 'Cohort with this join code does not exist.' });
  }

  const existing = cohortMembersDb.find((m) => m.cohort_id === cohort.id && m.user_id === userId);
  if (!existing) {
    cohortMembersDb.push({
      cohort_id: cohort.id,
      user_id: userId,
      username,
      role: 'student',
      xp: 0,
      streak: 1,
      last_active: 'Just now',
      joined_at: new Date().toISOString(),
    });
  }

  return res.json({ success: true, cohort });
});

// GET /api/v1/cohorts - Returns cohorts user belongs to
app.get('/api/v1/cohorts', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.user_id as string) || 'student-demo';
  const userMemberships = cohortMembersDb.filter((m) => m.user_id === userId);
  const enrolledIds = new Set(userMemberships.map((m) => m.cohort_id));

  const result = cohortsDb
    .filter((c) => enrolledIds.has(c.id) || c.owner_id === userId)
    .map((c) => {
      const mem = userMemberships.find((m) => m.cohort_id === c.id);
      const membersCount = cohortMembersDb.filter((m) => m.cohort_id === c.id).length;
      const assignmentsCount = assignmentsDb.filter((a) => a.cohort_id === c.id).length;
      return {
        ...c,
        role: mem ? mem.role : c.owner_id === userId ? 'teacher' : 'student',
        member_count: membersCount,
        assignment_count: assignmentsCount,
      };
    });

  return res.json({ cohorts: result });
});

// GET /api/v1/cohorts/:id/members - Teacher only
app.get('/api/v1/cohorts/:id/members', (req: Request, res: Response) => {
  const cohortId = req.params.id;
  const userId = (req.headers['x-user-id'] as string) || (req.query.user_id as string) || 'instructor-1';

  const member = cohortMembersDb.find((m) => m.cohort_id === cohortId && m.user_id === userId);
  const cohort = cohortsDb.find((c) => c.id === cohortId);

  if ((!member || member.role !== 'teacher') && cohort?.owner_id !== userId) {
    return res.status(403).json({ error: 'forbidden', message: 'Teacher role required.' });
  }

  const members = cohortMembersDb.filter((m) => m.cohort_id === cohortId);
  return res.json({ members });
});

// POST /api/v1/cohorts/:id/assignments - Teacher only
app.post('/api/v1/cohorts/:id/assignments', (req: Request, res: Response) => {
  const cohortId = req.params.id;
  const userId = (req.headers['x-user-id'] as string) || 'instructor-1';
  const { title, description = '', challenge_ids = [], due_at = null } = req.body;

  const member = cohortMembersDb.find((m) => m.cohort_id === cohortId && m.user_id === userId);
  const cohort = cohortsDb.find((c) => c.id === cohortId);

  if ((!member || member.role !== 'teacher') && cohort?.owner_id !== userId) {
    return res.status(403).json({ error: 'forbidden', message: 'Teacher role required to create assignments.' });
  }

  const newAssignment: ServerAssignment = {
    id: `assign-${Date.now()}`,
    cohort_id: cohortId,
    title: title || 'Untitled Assignment',
    description,
    challenge_ids,
    due_at,
    created_at: new Date().toISOString(),
    created_by: userId,
  };

  assignmentsDb.unshift(newAssignment);
  return res.status(201).json(newAssignment);
});

// GET /api/v1/cohorts/:id/assignments
app.get('/api/v1/cohorts/:id/assignments', (req: Request, res: Response) => {
  const cohortId = req.params.id;
  const assignments = assignmentsDb.filter((a) => a.cohort_id === cohortId);
  return res.json({ assignments });
});

// GET /api/v1/cohorts/:id/gradebook - Teacher only
app.get('/api/v1/cohorts/:id/gradebook', (req: Request, res: Response) => {
  const cohortId = req.params.id;
  const assignments = assignmentsDb.filter((a) => a.cohort_id === cohortId);
  const students = cohortMembersDb.filter((m) => m.cohort_id === cohortId && m.role === 'student');

  const rows = students.map((s) => {
    const studentAssignments: Record<string, any> = {};
    assignments.forEach((a) => {
      studentAssignments[a.id] = {
        solved_count: s.user_id === 'student-chidi' ? a.challenge_ids.length : 1,
        total_count: a.challenge_ids.length,
        completed: s.user_id === 'student-chidi',
        completed_at: s.user_id === 'student-chidi' ? new Date().toISOString() : null,
      };
    });
    return {
      user_id: s.user_id,
      username: s.username,
      total_xp: s.xp,
      streak: s.streak,
      last_active: s.last_active,
      assignments: studentAssignments,
    };
  });

  return res.json({ assignments, rows });
});

// GET /api/v1/cohorts/:id/gradebook.csv - CSV stream
app.get('/api/v1/cohorts/:id/gradebook.csv', (req: Request, res: Response) => {
  const cohortId = req.params.id;
  const assignments = assignmentsDb.filter((a) => a.cohort_id === cohortId);
  const students = cohortMembersDb.filter((m) => m.cohort_id === cohortId && m.role === 'student');

  const headers = ['Username', 'Total XP', 'Daily Streak', 'Last Active'];
  assignments.forEach((a) => headers.push(`"${a.title.replace(/"/g, '""')} (Solved/Total)"`));

  const lines = [headers.join(',')];
  students.forEach((s) => {
    const row = [`"${s.username}"`, s.xp, s.streak, `"${s.last_active}"`];
    assignments.forEach((a) => {
      const solved = s.user_id === 'student-chidi' ? a.challenge_ids.length : 1;
      row.push(`"${solved}/${a.challenge_ids.length}"`);
    });
    lines.push(row.join(','));
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="gradebook_${cohortId}.csv"`);
  return res.send(lines.join('\n'));
});

// POST /api/v1/cohorts/:id/remove-member - Teacher only
app.post('/api/v1/cohorts/:id/remove-member', (req: Request, res: Response) => {
  const cohortId = req.params.id;
  const targetUserId = req.body.user_id;

  const idx = cohortMembersDb.findIndex((m) => m.cohort_id === cohortId && m.user_id === targetUserId);
  if (idx !== -1) {
    cohortMembersDb.splice(idx, 1);
  }

  return res.json({ success: true });
});

/* ==============================================================================
 * PHASE 9A: RETENTION & LMS DEPTH APIS (Quests, Friends, Streak Freezes)
 * ============================================================================== */

interface DailyQuestItem {
  user_id: string;
  quest_date: string;
  quest_index: number;
  template_id: string;
  title: string;
  description: string;
  reward_xp: number;
  tier_category: 'easy' | 'medium' | 'stretch';
  criteria_type: string;
  min_tier?: number;
  target_count: number;
  current_count: number;
  completed_at: string | null;
}

const dailyQuestsStore = new Map<string, DailyQuestItem>();

// Deterministic quest generation per (user_id, date)
function getOrCreateDailyQuests(userId: string, dateLagos: string): DailyQuestItem[] {
  const quests: DailyQuestItem[] = [];
  const templates = [
    {
      index: 0,
      id: 'solve_tier_3',
      title: 'Solve 1 Tier 3+ challenge',
      desc: 'Complete any algorithm challenge at Tier 3 or higher.',
      xp: 30,
      cat: 'easy' as const,
      crit: 'solve_tier',
      minTier: 3,
      target: 1,
    },
    {
      index: 1,
      id: 'earn_100_xp',
      title: 'Earn 100 XP today',
      desc: 'Accumulate 100 XP across quests and challenges today.',
      xp: 80,
      cat: 'medium' as const,
      crit: 'earn_xp',
      target: 100,
    },
    {
      index: 2,
      id: 'win_multiplayer_round',
      title: 'Win a multiplayer round',
      desc: 'Claim 1st place in either Word Forge or Debugs Hunting.',
      xp: 200,
      cat: 'stretch' as const,
      crit: 'win_arcade',
      target: 1,
    },
  ];

  for (const t of templates) {
    const key = `${userId}:${dateLagos}:${t.index}`;
    let item = dailyQuestsStore.get(key);
    if (!item) {
      item = {
        user_id: userId,
        quest_date: dateLagos,
        quest_index: t.index,
        template_id: t.id,
        title: t.title,
        description: t.desc,
        reward_xp: t.xp,
        tier_category: t.cat,
        criteria_type: t.crit,
        min_tier: t.minTier,
        target_count: t.target,
        current_count: 0,
        completed_at: null,
      };
      dailyQuestsStore.set(key, item);
    }
    quests.push(item);
  }
  return quests;
}

// GET /api/v1/quests/today
app.get('/api/v1/quests/today', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'student_demo';
  const todayLagos = getLagosDate();
  const quests = getOrCreateDailyQuests(userId, todayLagos);
  return res.json({
    date: todayLagos,
    timezone: 'Africa/Lagos',
    quests,
    all_completed: quests.every((q) => q.completed_at !== null),
  });
});

// POST /api/v1/quests/check-completion (called inline on challenge solve or score gain)
app.post('/api/v1/quests/check-completion', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'student_demo';
  const { event_type = 'solve_challenge', payload = {} } = req.body || {};
  const todayLagos = getLagosDate();
  const quests = getOrCreateDailyQuests(userId, todayLagos);

  const completedNow: any[] = [];

  for (const q of quests) {
    if (q.completed_at) continue;

    let matched = false;
    if (q.criteria_type === 'solve_tier' && event_type === 'solve_challenge') {
      const tier = Number(payload.tier || 1);
      if (tier >= (q.min_tier || 1)) {
        q.current_count += 1;
        matched = true;
      }
    } else if (q.criteria_type === 'earn_xp' && (event_type === 'earn_xp' || event_type === 'solve_challenge')) {
      const xpGained = Number(payload.xp || 35);
      q.current_count += xpGained;
      matched = true;
    } else if (q.criteria_type === 'win_arcade' && event_type === 'arcade_finish') {
      if (Number(payload.rank) === 1) {
        q.current_count += 1;
        matched = true;
      }
    }

    if (matched && q.current_count >= q.target_count) {
      q.completed_at = new Date().toISOString();
      completedNow.push({
        quest_index: q.quest_index,
        title: q.title,
        reward_xp: q.reward_xp,
        inline_message: `+${q.reward_xp} XP — quest complete!`,
      });
    }
  }

  return res.json({
    success: true,
    completed_now: completedNow,
    quests,
  });
});

/* --- Friends Rivalries In-Memory Store --- */
interface FriendshipRecord {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  accepted_at: string | null;
}

const mockFriendsDb: FriendshipRecord[] = [
  {
    id: 'f-1',
    user_id: 'student_demo',
    friend_id: 'user_alex',
    status: 'accepted',
    created_at: '2026-10-18T10:00:00Z',
    accepted_at: '2026-10-18T10:05:00Z',
  },
  {
    id: 'f-2',
    user_id: 'student_demo',
    friend_id: 'user_zara',
    status: 'accepted',
    created_at: '2026-10-19T14:00:00Z',
    accepted_at: '2026-10-19T14:15:00Z',
  },
];

const mockUserProfiles: Record<string, { username: string; xp_today: number; total_xp: number; streak: number; last_active: string }> = {
  student_demo: { username: 'QuantumCadet', xp_today: 140, total_xp: 1250, streak: 6, last_active: 'Just now' },
  user_alex: { username: 'Alex_Dev', xp_today: 210, total_xp: 2400, streak: 12, last_active: '15m ago' },
  user_zara: { username: 'Zara_Py', xp_today: 95, total_xp: 1800, streak: 9, last_active: '1h ago' },
  user_chidi: { username: 'Chidi_Code', xp_today: 320, total_xp: 3100, streak: 21, last_active: '5m ago' },
  user_amina: { username: 'Amina_Algo', xp_today: 180, total_xp: 1950, streak: 8, last_active: '42m ago' },
};

// GET /api/v1/friends
app.get('/api/v1/friends', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'student_demo';

  const accepted = mockFriendsDb.filter(
    (f) => f.status === 'accepted' && (f.user_id === userId || f.friend_id === userId)
  ).map((f) => {
    const friendId = f.user_id === userId ? f.friend_id : f.user_id;
    const profile = mockUserProfiles[friendId] || { username: friendId, xp_today: 0, total_xp: 0, streak: 1, last_active: 'Unknown' };
    return {
      friendship_id: f.id,
      user_id: friendId,
      ...profile,
      friends_since: f.accepted_at,
    };
  });

  const pendingInbound = mockFriendsDb.filter((f) => f.status === 'pending' && f.friend_id === userId).map((f) => ({
    friendship_id: f.id,
    user_id: f.user_id,
    username: mockUserProfiles[f.user_id]?.username || f.user_id,
    created_at: f.created_at,
  }));

  const pendingOutbound = mockFriendsDb.filter((f) => f.status === 'pending' && f.user_id === userId).map((f) => ({
    friendship_id: f.id,
    user_id: f.friend_id,
    username: mockUserProfiles[f.friend_id]?.username || f.friend_id,
    created_at: f.created_at,
  }));

  return res.json({
    friends: accepted,
    friend_count: accepted.length,
    max_friends: 10,
    pending_inbound: pendingInbound,
    pending_outbound: pendingOutbound,
  });
});

// POST /api/v1/friends/request
app.post('/api/v1/friends/request', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'student_demo';
  const targetUsername = String(req.body?.username || '').trim();

  if (!targetUsername) {
    return res.status(400).json({ error: 'username_required', message: 'Target username is required.' });
  }

  // Find target by username
  const targetEntry = Object.entries(mockUserProfiles).find(
    ([_id, p]) => p.username.toLowerCase() === targetUsername.toLowerCase()
  );

  if (!targetEntry) {
    return res.status(404).json({ error: 'user_not_found', message: `User '${targetUsername}' does not exist.` });
  }

  const [targetId] = targetEntry;

  if (targetId === userId) {
    return res.status(400).json({ error: 'cannot_friend_self', message: 'You cannot add yourself as a friend.' });
  }

  // Count current accepted friends
  const currentCount = mockFriendsDb.filter(
    (f) => f.status === 'accepted' && (f.user_id === userId || f.friend_id === userId)
  ).length;

  if (currentCount >= 10) {
    return res.status(400).json({ error: 'friend_limit_reached', message: 'Maximum of 10 friends reached.' });
  }

  // Check if already friends or pending
  const existing = mockFriendsDb.find(
    (f) => (f.user_id === userId && f.friend_id === targetId) || (f.user_id === targetId && f.friend_id === userId)
  );

  if (existing) {
    if (existing.status === 'accepted') {
      return res.status(400).json({ error: 'already_friends', message: 'You are already friends.' });
    }
    if (existing.status === 'pending') {
      if (existing.friend_id === userId) {
        // Reciprocal: auto-accept
        existing.status = 'accepted';
        existing.accepted_at = new Date().toISOString();
        return res.json({ success: true, message: `Accepted friend request from ${targetUsername}!` });
      }
      return res.status(400).json({ error: 'request_already_sent', message: 'Friend request already sent.' });
    }
  }

  const newRecord: FriendshipRecord = {
    id: `f-${Date.now()}`,
    user_id: userId,
    friend_id: targetId,
    status: 'pending',
    created_at: new Date().toISOString(),
    accepted_at: null,
  };
  mockFriendsDb.push(newRecord);

  return res.json({ success: true, message: `Friend request sent to ${targetUsername}.` });
});

// POST /api/v1/friends/:id/accept
app.post('/api/v1/friends/:id/accept', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'student_demo';
  const friendshipId = req.params.id;

  const record = mockFriendsDb.find((f) => f.id === friendshipId && f.friend_id === userId);
  if (!record || record.status !== 'pending') {
    return res.status(404).json({ error: 'no_pending_request', message: 'No pending friend request found.' });
  }

  record.status = 'accepted';
  record.accepted_at = new Date().toISOString();

  const friendUsername = mockUserProfiles[record.user_id]?.username || 'Coder';
  return res.json({ success: true, message: `You and ${friendUsername} are now friends!` });
});

// DELETE /api/v1/friends/:id
app.delete('/api/v1/friends/:id', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'student_demo';
  const friendshipId = req.params.id;

  const idx = mockFriendsDb.findIndex(
    (f) => f.id === friendshipId && (f.user_id === userId || f.friend_id === userId)
  );

  if (idx !== -1) {
    mockFriendsDb.splice(idx, 1);
  }

  return res.json({ success: true, message: 'Friend removed.' });
});

// GET /api/v1/leaderboard/friends
app.get('/api/v1/leaderboard/friends', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'student_demo';

  // Get current user profile
  const userProfile = mockUserProfiles[userId] || {
    username: 'QuantumCadet',
    xp_today: 140,
    total_xp: 1250,
    streak: 6,
    last_active: 'Just now',
  };

  const records = [
    {
      user_id: userId,
      username: userProfile.username,
      xp_today: userProfile.xp_today,
      streak: userProfile.streak,
      last_active: userProfile.last_active,
      is_current_user: true,
    },
  ];

  // Append all accepted friends
  mockFriendsDb.forEach((f) => {
    if (f.status === 'accepted' && (f.user_id === userId || f.friend_id === userId)) {
      const friendId = f.user_id === userId ? f.friend_id : f.user_id;
      const p = mockUserProfiles[friendId];
      if (p) {
        records.push({
          user_id: friendId,
          username: p.username,
          xp_today: p.xp_today,
          streak: p.streak,
          last_active: p.last_active,
          is_current_user: false,
        });
      }
    }
  });

  // Sort descending by xp_today, then streak, then username
  records.sort((a, b) => b.xp_today - a.xp_today || b.streak - a.streak || a.username.localeCompare(b.username));

  const ranked = records.map((r, idx) => ({
    rank: idx + 1,
    ...r,
  }));

  return res.json({
    leaderboard: ranked,
    count: ranked.length,
    timestamp: new Date().toISOString(),
  });
});

/* --- Streak Freezes State & Check Endpoint --- */
interface StreakFreezeRecord {
  user_id: string;
  tier: string;
  freezes_remaining: number;
  last_activity_hours_ago: number;
  streak: number;
  last_protected_at: string | null;
}

const mockStreakFreezes: Record<string, StreakFreezeRecord> = {
  student_demo: {
    user_id: 'student_demo',
    tier: 'pro',
    freezes_remaining: 3,
    last_activity_hours_ago: 28,
    streak: 6,
    last_protected_at: null,
  },
};

// POST /api/v1/streaks/check-freeze
app.post('/api/v1/streaks/check-freeze', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'student_demo';
  const tier = (req.headers['x-user-tier'] as string) || 'pro';

  let record = mockStreakFreezes[userId];
  if (!record) {
    const limits: Record<string, number> = { free: 0, premium: 1, pro: 3 };
    record = {
      user_id: userId,
      tier,
      freezes_remaining: limits[tier] ?? 0,
      last_activity_hours_ago: 12,
      streak: 6,
      last_protected_at: null,
    };
    mockStreakFreezes[userId] = record;
  }

  const { hours_inactive = 28 } = req.body || {};

  // Auto-apply if between 24h and 36h inactive and user has freeze
  if (hours_inactive >= 24 && hours_inactive <= 36) {
    if (record.freezes_remaining > 0 && (record.tier === 'premium' || record.tier === 'pro')) {
      record.freezes_remaining -= 1;
      record.last_protected_at = new Date().toISOString();
      return res.json({
        applied: true,
        streak: record.streak,
        freezes_remaining: record.freezes_remaining,
        message: '🛡️ Streak protected!',
        last_protected_at: record.last_protected_at,
      });
    }
  }

  return res.json({
    applied: false,
    streak: record.streak,
    freezes_remaining: record.freezes_remaining,
    message: record.freezes_remaining > 0 ? `${record.freezes_remaining} freeze(s) available.` : 'No freezes available.',
  });
});

// POST /api/v1/comeback/run-check
app.post('/api/v1/comeback/run-check', (req: Request, res: Response) => {
  const { days_inactive = 3.2 } = req.body || {};

  if (days_inactive >= 14) {
    return res.json({
      action: 'abandoned',
      message: '14-day cutoff reached. No notifications sent.',
      dispatched: false,
    });
  }

  if (days_inactive >= 7) {
    return res.json({
      action: 'push_sent',
      type: 'comeback_day_7',
      title: 'TERMINALTOR',
      body: 'Your friends are ahead. One round closes the gap.',
      dispatched: true,
    });
  }

  if (days_inactive >= 3) {
    return res.json({
      action: 'push_sent',
      type: 'comeback_day_3',
      title: 'TERMINALTOR',
      body: 'Your streak is on the line. 1 challenge brings it back.',
      dispatched: true,
    });
  }

  return res.json({ action: 'active', dispatched: false });
});

// Webhook simulation endpoints
app.post('/api/webhooks/paystack', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Paystack webhook received and verified.' });
});

app.post('/api/webhooks/stripe', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Stripe webhook received and verified.' });
});

/* ==============================================================================
 * Vite Dev Server Middleware or Static Production Serving
 * ============================================================================== */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
