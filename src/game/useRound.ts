import { useState, useEffect, useRef, useCallback } from 'react';
import { ArcadeSocket, calculateWordPoints } from './socket';
import {
  AnswerRevealed,
  PlayerInfo,
  QuestionMessage,
  RoundEndScore,
  WordFeedBatch,
} from '../lib/gameProtocol';
import { creditsService } from '../lib/creditsService';
import { arcadeLeaderboard } from '../lib/arcadeLeaderboard';
import { gameMasterService } from '../lib/gameMasterService';
import { cyberBaseService } from '../lib/baseService';
import {
  pickRandomSeedWords,
  createPoolFromSeeds,
  getTwoRandomMidroundLetters,
  canFormFromPool,
  checkWordInDictionary,
  loadFullDictionary,
} from './dictionaryService';

export interface PeerInputInfo {
  username: string;
  text: string;
  isSubmitted?: boolean;
  points?: number;
  updatedAt: number;
}

export const DEBUG_QUESTIONS: QuestionMessage[] = [
  {
    question_id: 'q1',
    text: 'What will print(type([]) is list) evaluate to in Python 3?',
    codeSnippet: 'print(type([]) is list)',
    targetAssertion: 'assert type([]) is list',
    canonicalAnswer: 'True',
    acceptedAnswers: ['true', 'True', 'bool(true)'],
    ends_at: 0,
  },
  {
    question_id: 'q2',
    text: 'Which keyword creates an anonymous inline function in Python?',
    codeSnippet: 'fn = ______ x: x * 2',
    targetAssertion: 'callable(fn) and fn(3) == 6',
    canonicalAnswer: 'lambda',
    acceptedAnswers: ['lambda', 'lambda:'],
    ends_at: 0,
  },
  {
    question_id: 'q3',
    text: 'Fix the operator to make the addition function return 12 for 5 and 7:',
    codeSnippet: 'def add(a, b):\n    return a * b  # BUG: Expected sum of 5 + 7 = 12',
    targetAssertion: 'assert add(5, 7) == 12',
    canonicalAnswer: '+',
    acceptedAnswers: ['+', 'a + b', 'a+b', 'sum', 'return a + b'],
    ends_at: 0,
  },
  {
    question_id: 'q4',
    text: 'What membership operator checks for key presence in a dictionary without KeyError?',
    codeSnippet: 'has_key = "user" ______ {"user": "admin"}',
    targetAssertion: 'assert has_key is True',
    canonicalAnswer: 'in',
    acceptedAnswers: ['in', '"user" in dict', 'in dict'],
    ends_at: 0,
  },
  {
    question_id: 'q5',
    text: 'What does a generator function with yield return when called?',
    codeSnippet: 'def gen():\n    yield 1\ng = gen()\n# What type/name of object is g?',
    targetAssertion: 'type(g).__name__ == "generator"',
    canonicalAnswer: 'generator',
    acceptedAnswers: ['generator', 'generator object', 'generator iterator'],
    ends_at: 0,
  },
  {
    question_id: 'q6',
    text: 'What is the value of nums[-1] in nums = [10, 20, 30]?',
    codeSnippet: 'nums = [10, 20, 30]\nlast = nums[-1]',
    targetAssertion: 'assert last == 30',
    canonicalAnswer: '30',
    acceptedAnswers: ['30'],
    ends_at: 0,
  },
  {
    question_id: 'q7',
    text: 'What is len("Python") in Python?',
    codeSnippet: 'word = "Python"\nsize = len(word)',
    targetAssertion: 'assert size == 6',
    canonicalAnswer: '6',
    acceptedAnswers: ['6'],
    ends_at: 0,
  },
  {
    question_id: 'q8',
    text: 'Fix the modulus equality check so that even numbers return True:',
    codeSnippet: 'def is_even(n):\n    return n % 2 == 1  # BUG: even numbers return False!',
    targetAssertion: 'assert is_even(4) is True and is_even(5) is False',
    canonicalAnswer: '0',
    acceptedAnswers: ['0', '== 0', 'n % 2 == 0'],
    ends_at: 0,
  },
  {
    question_id: 'q9',
    text: 'What string method joins list ["a", "b"] with separator ","?',
    codeSnippet: 'result = ",".______ (["a", "b"])',
    targetAssertion: 'assert result == "a,b"',
    canonicalAnswer: 'join',
    acceptedAnswers: ['join', 'join()', '.join', 'str.join'],
    ends_at: 0,
  },
];

export function useRound(
  roomCode: string,
  mode: 'wordforge' | 'debugshunting' = 'wordforge',
  username: string = 'QuantumCadet',
  enabled: boolean = true
) {
  const socketRef = useRef<ArcadeSocket | null>(null);

  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'scoring' | 'intermission'>('playing');
  const [language, setLanguage] = useState<string>('python');
  const [players, setPlayers] = useState<PlayerInfo[]>([
    { id: 'me', username: username || 'QuantumCadet', score: 0 },
    { id: 'peer_alex', username: 'Alex_Dev', score: 45 },
    { id: 'peer_zara', username: 'Zara_Py', score: 32 },
  ]);
  const [myPlayerId, setMyPlayerId] = useState<string>('me');
  const [myScore, setMyScore] = useState<number>(0);
  const myScoreRef = useRef<number>(0);
  myScoreRef.current = myScore;

  // Word Forge state - derived from 2 random 6-letter seed words from supadb1.txt
  const [seedWords, setSeedWords] = useState<string[]>(['stream', 'golden']);
  const [pool, setPool] = useState<string[]>([]);
  const [addedLetters, setAddedLetters] = useState<string[]>([]);
  const [possibleCount, setPossibleCount] = useState<number>(0);
  const [startsAt, setStartsAt] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [midroundAt, setMidroundAt] = useState<number>(() => Math.floor(Date.now() / 1000) + 70);
  const [endsAt, setEndsAt] = useState<number>(() => Math.floor(Date.now() / 1000) + 180);
  const [midroundFired, setMidroundFired] = useState<boolean>(false);
  const [batches, setBatches] = useState<WordFeedBatch[]>([]);
  const [inputFlash, setInputFlash] = useState<boolean>(false);
  const [rejectionTooltip, setRejectionTooltip] = useState<string | null>(null);
  const [peerInputs, setPeerInputs] = useState<Record<string, PeerInputInfo>>({});
  const [submittedWords, setSubmittedWords] = useState<Set<string>>(new Set());

  // Word Cloaking Jammer state (Single use per round)
  const [isJammerActive, setIsJammerActive] = useState<boolean>(false);
  const [jammerUsedThisRound, setJammerUsedThisRound] = useState<boolean>(false);

  // Debugs Hunting 3-minute, 9-question state machine
  // 10s active -> 5s answer reveal -> 5s break = 20s x 9 = 180s (3 mins)
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionMessage | null>(null);
  const [debugPhase, setDebugPhase] = useState<'active' | 'reveal' | 'break'>('active');
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState<number>(10);
  const [solvedByUsername, setSolvedByUsername] = useState<string | null>(null);
  const [debugStreak, setDebugStreak] = useState<number>(0);
  const [debugAttempts, setDebugAttempts] = useState<number>(0);
  const [debugCorrect, setDebugCorrect] = useState<number>(0);
  const [debugFeedback, setDebugFeedback] = useState<string | null>(null);

  // Shared state
  const [roundEndScores, setRoundEndScores] = useState<RoundEndScore[]>([]);
  const [intermissionEndsAt, setIntermissionEndsAt] = useState<number>(0);

  // Preload supadb1.txt dictionary in background
  useEffect(() => {
    loadFullDictionary();
  }, []);

  // End round helper -> launches 30 second break & records to leaderboards
  const completeRound = useCallback(() => {
    setGameState('intermission');
    const finalScores: RoundEndScore[] = [
      { player_id: 'me', username, score: myScoreRef.current },
      { player_id: 'peer_alex', username: 'Alex_Dev', score: Math.max(80, Math.floor(myScoreRef.current * 0.9)) },
      { player_id: 'peer_zara', username: 'Zara_Py', score: Math.max(60, Math.floor(myScoreRef.current * 0.75)) },
    ].sort((a, b) => b.score - a.score);

    finalScores.forEach((s, idx) => {
      s.rank = idx + 1;
      const tokensWon = idx === 0 ? 100 : idx === 1 ? 70 : 50;
      s.tokensEarned = tokensWon;
      s.creditsEarned = tokensWon; // backwards compatibility
    });

    setRoundEndScores(finalScores);

    // Reward Crypto Tokens based on rank (credits are a sinking resource only acquired via Stars/quests)
    const myPlacement = finalScores.findIndex((s) => s.player_id === 'me') + 1;
    if (myPlacement >= 1 && myPlacement <= 3) {
      creditsService.rewardRoundPlacement(myPlacement);
    }

    // Persist to leaderboards
    if (mode === 'wordforge') {
      arcadeLeaderboard.recordWordForgeGame({
        username,
        score: myScoreRef.current,
        wordsForged: submittedWords.size,
        longestWord: Array.from(submittedWords).reduce((a, b) => (a.length > b.length ? a : b), 'NONE'),
      });
    } else {
      const computedAccuracy = debugAttempts > 0 ? Math.round((debugCorrect / debugAttempts) * 100) : 95;
      arcadeLeaderboard.recordDebugsHuntingGame({
        username,
        score: myScoreRef.current,
        correctAnswers: debugCorrect,
        fastestAnswerMs: 1400,
        bugsFixed: debugCorrect,
        speedRecordSeconds: 1.4,
        accuracyRate: computedAccuracy,
      });
    }

    // Set 30s intermission break
    setIntermissionEndsAt(Math.floor(Date.now() / 1000) + 30);
  }, [username, mode, submittedWords, debugAttempts, debugCorrect]);

  // Function to initialize or reset a fresh 3-minute round
  const startNewRound = useCallback(() => {
    setGameState('playing');
    setMyScore(0);
    setSubmittedWords(new Set());
    setBatches([]);
    setMidroundFired(false);
    setAddedLetters([]);
    setIsJammerActive(false);
    setJammerUsedThisRound(false);

    const now = Math.floor(Date.now() / 1000);
    setStartsAt(now);
    // At 1:50 mins remaining (110s left on clock = 70s into the 180s round)
    setMidroundAt(now + 70);
    setEndsAt(now + 180);

    if (mode === 'wordforge') {
      const [w1, w2] = pickRandomSeedWords();
      setSeedWords([w1, w2]);
      const initialPool = createPoolFromSeeds(w1, w2);
      setPool(initialPool);
      setPossibleCount(38);
    } else {
      setQuestionIndex(0);
      setCurrentQuestion(DEBUG_QUESTIONS[0]);
      setDebugPhase('active');
      setPhaseSecondsRemaining(10);
      setSolvedByUsername(null);
      setDebugFeedback(null);
      setDebugStreak(0);
      setDebugAttempts(0);
      setDebugCorrect(0);
    }

    // Reset scores in player list
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, score: 0 }))
    );
  }, [mode]);

  // Initialize round state on enable or room change
  useEffect(() => {
    if (!enabled) return;
    startNewRound();
  }, [enabled, roomCode, mode, startNewRound]);

  // Main 1-second interval loop for Code Forgers & Debugs Hunting
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);

      // In playing state
      if (gameState === 'playing') {
        const remaining = Math.max(0, endsAt - now);

        // Word Forge Midround letter injection at 1:50 remaining (110s left)
        if (mode === 'wordforge') {
          if (remaining <= 110 && !midroundFired) {
            setMidroundFired(true);
            const [l1, l2] = getTwoRandomMidroundLetters();
            setAddedLetters([l1, l2]);
            setPool((prev) => [...prev, l1, l2]);
          }

          // When 3 minutes round ends
          if (remaining <= 0) {
            completeRound();
          }
        }

        // Debugs Hunting timing state machine:
        // 10s active -> 5s reveal -> 5s break = 20s per question x 9 questions = 180s (3 mins)
        if (mode === 'debugshunting') {
          setPhaseSecondsRemaining((prev) => {
            if (prev > 1) {
              return prev - 1;
            }

            // Current phase finished!
            if (debugPhase === 'active') {
              // 10s expired with no answer -> Move to 5s reveal!
              setDebugPhase('reveal');
              setSolvedByUsername(null); // Time expired
              return 5;
            } else if (debugPhase === 'reveal') {
              // 5s reveal finished -> Move to 5s break!
              setDebugPhase('break');
              return 5;
            } else if (debugPhase === 'break') {
              // 5s break finished -> Check if all 9 questions completed!
              if (questionIndex >= 8 || remaining <= 0) {
                completeRound();
                return 0;
              }

              // Advance to next question!
              const nextIdx = questionIndex + 1;
              setQuestionIndex(nextIdx);
              setCurrentQuestion(DEBUG_QUESTIONS[nextIdx % DEBUG_QUESTIONS.length]);
              setDebugPhase('active');
              setSolvedByUsername(null);
              setDebugFeedback(null);
              return 10;
            }

            return 0;
          });

          // Overall 3-minute round backup check
          if (remaining <= 0) {
            completeRound();
          }
        }
      }

      // In intermission state (30s break)
      if (gameState === 'intermission' || gameState === 'scoring') {
        const breakRemaining = Math.max(0, intermissionEndsAt - now);
        if (breakRemaining <= 0 && intermissionEndsAt > 0) {
          // 30 seconds break finished -> automatically start next round!
          startNewRound();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    enabled,
    gameState,
    mode,
    endsAt,
    midroundFired,
    debugPhase,
    questionIndex,
    intermissionEndsAt,
    completeRound,
    startNewRound,
  ]);

  const triggerMidround = useCallback(() => {
    if (midroundFired) return;
    setMidroundFired(true);
    const [l1, l2] = getTwoRandomMidroundLetters();
    setAddedLetters([l1, l2]);
    setPool((prev) => [...prev, l1, l2]);
  }, [midroundFired]);

  // Word Cloaking Jammer activation (Single-use per round)
  const activateJammer = useCallback((): { success: boolean; message: string } => {
    if (jammerUsedThisRound) {
      return { success: false, message: 'Word Jammer can only be used once per round!' };
    }

    // Check inventory first
    const inv = cyberBaseService.getInventory();
    const jammerItem = inv.find((i) => i.itemId === 'item_word_jammer' && i.quantity > 0);
    if (jammerItem) {
      cyberBaseService.useItem('item_word_jammer');
    } else {
      // Direct purchase/consumption with 40 Crypto Tokens
      const currentTokens = creditsService.getTokensBalance();
      if (currentTokens < 40) {
        return {
          success: false,
          message: 'Insufficient Tokens! Word Jammer requires 40 Crypto Tokens (🪙) or 1 from Arsenal.',
        };
      }
      creditsService.deductTokens(40);
    }

    setIsJammerActive(true);
    setJammerUsedThisRound(true);
    return {
      success: true,
      message: '📡 Word Cloaking Jammer activated! Your keystrokes and forged words are scrambled for rivals for the rest of this round.',
    };
  }, [jammerUsedThisRound]);

  const submitWord = useCallback((rawWord: string) => {
    const word = rawWord.trim().toLowerCase();
    if (!word) return;

    // Check credits first (10 credits per word)
    const hasPaid = creditsService.deduct(10);
    if (!hasPaid) {
      setRejectionTooltip('Insufficient credits! 10 credits needed per submission.');
      setTimeout(() => setRejectionTooltip(null), 2500);
      return;
    }

    if (submittedWords.has(word)) {
      setRejectionTooltip(`"${word}" was already submitted!`);
      setTimeout(() => setRejectionTooltip(null), 2000);
      return;
    }

    if (word.length < 3) {
      setRejectionTooltip('Word must be at least 3 letters.');
      setTimeout(() => setRejectionTooltip(null), 2000);
      return;
    }

    // Verify word can be formed from active letter pool
    if (!canFormFromPool(word, pool)) {
      setRejectionTooltip(`"${word}" cannot be formed from active letters!`);
      setTimeout(() => setRejectionTooltip(null), 2000);
      return;
    }

    // Validate in supadb1.txt dictionary
    const isValid = checkWordInDictionary(word);
    if (!isValid) {
      setRejectionTooltip(`"${word}" not found in supadb1.txt dictionary`);
      setTimeout(() => setRejectionTooltip(null), 2000);
      return;
    }

    // Anagram detection: check if sorted letters match any word already forged this round!
    const sortedCurrent = word.split('').sort().join('');
    const matchingAnagrams = Array.from(submittedWords).filter(
      (w) => w.length === word.length && w.split('').sort().join('') === sortedCurrent
    );
    let anagramBonus = 0;
    if (matchingAnagrams.length > 0) {
      anagramBonus = 50;
      arcadeLeaderboard.unlockStyle('🔥 Anagrammer');
      arcadeLeaderboard.setPlayerEquippedStyle('🔥 Anagrammer');
    }

    if (word.length >= 7) {
      arcadeLeaderboard.unlockStyle('💎 Titan');
    }
    if (submittedWords.size >= 14) {
      arcadeLeaderboard.unlockStyle('🚀 Synthesizer');
    }

    const hasBonus = addedLetters.some((l) => word.includes(l));
    let basePts = calculateWordPoints(word.length, hasBonus);

    // Sadistic Game Master active modifier check
    const gmMod = gameMasterService.getActiveModifier();
    if (gmMod?.id === 'gm_vowel_tax') {
      const vowelCount = (word.match(/[aeiou]/g) || []).length;
      if (vowelCount >= 3) {
        basePts = Math.floor(basePts * 2.0);
      } else if (vowelCount < 2) {
        basePts = 0;
      }
    } else if (gmMod?.id === 'gm_anagram_tyranny' && anagramBonus > 0) {
      anagramBonus *= 2;
    }

    const pts = basePts + anagramBonus;

    setSubmittedWords((prev) => new Set(prev).add(word));
    const newScore = myScoreRef.current + pts;
    setMyScore(newScore);

    // Flash input
    setInputFlash(true);
    setTimeout(() => setInputFlash(false), 300);

    // Update live players list
    setPlayers((prev) =>
      prev.map((p) => (p.id === 'me' ? { ...p, score: newScore } : p))
    );

    // Word display in feed: If jammer is active, mask as encrypted cipher so rivals cannot steal words!
    const displayWord = isJammerActive
      ? '█ █ █ █ █ (JAMMED)'
      : matchingAnagrams.length > 0
      ? `${word.toUpperCase()} ⚡ ANAGRAM!`
      : word.toUpperCase();

    // Add to feed batch
    setBatches((prev) => [
      ...prev,
      {
        batch_id: Date.now(),
        words: [
          {
            word: displayWord,
            player: username,
            points: pts,
            at: Date.now(),
          },
        ],
      },
    ]);
  }, [submittedWords, addedLetters, pool, username, isJammerActive]);

  // Debugs Hunting: Manual Text Input Submission
  const submitAnswer = useCallback((typedAnswer: string) => {
    if (!currentQuestion) return;
    if (debugPhase !== 'active') return; // Can only submit when question is active!

    const cleanInput = typedAnswer.trim();
    if (!cleanInput) return;

    // Check credits first (10 credits per submission)
    const hasPaid = creditsService.deduct(10);
    if (!hasPaid) return;

    // Increments attempts every time (drains accuracy on mistakes)
    setDebugAttempts((prev) => prev + 1);

    const isMatch =
      cleanInput.toLowerCase() === currentQuestion.canonicalAnswer.toLowerCase() ||
      currentQuestion.acceptedAnswers.some(
        (ans) => ans.toLowerCase() === cleanInput.toLowerCase()
      );

    if (isMatch) {
      // Correct!
      setDebugCorrect((prev) => prev + 1);
      const timeBonus = phaseSecondsRemaining * 8;
      const streakBonus = (debugStreak + 1) * 20;
      const pts = 100 + timeBonus + streakBonus;
      setDebugStreak((s) => s + 1);
      setDebugFeedback('Correct! Solved!');

      if (debugStreak + 1 >= 3) {
        arcadeLeaderboard.unlockStyle('🎯 Sniper');
        arcadeLeaderboard.setPlayerEquippedStyle('🎯 Sniper');
      }
      if (debugCorrect + 1 >= 5) {
        arcadeLeaderboard.unlockStyle('⚔️ Exterminator');
      }
      if (phaseSecondsRemaining >= 8) {
        arcadeLeaderboard.unlockStyle('⚡ Sprinter');
      }

      const newScore = myScoreRef.current + pts;
      setMyScore(newScore);
      setPlayers((prev) =>
        prev.map((p) => (p.id === 'me' ? { ...p, score: newScore } : p))
      );

      // Transition immediately to 5s reveal phase!
      setSolvedByUsername(username);
      setDebugPhase('reveal');
      setPhaseSecondsRemaining(5);
    } else {
      // Incorrect input: No negative score penalty, but attempts incremented so accuracy drains
      setDebugStreak(0);
      setDebugFeedback('Incorrect fix — try again! (Accuracy drained)');
      setTimeout(() => setDebugFeedback(null), 2500);
    }
  }, [currentQuestion, debugPhase, phaseSecondsRemaining, debugStreak, username]);

  const broadcastTyping = useCallback((text: string) => {
    // Local reflection for peer display (scramble if jammer is active)
    const _scrambled = isJammerActive ? '█ █ █ █ █' : text;
  }, [isJammerActive]);

  return {
    gameState,
    language,
    players,
    myPlayerId,
    myScore,
    seedWords,
    pool,
    addedLetters,
    possibleCount,
    startsAt,
    midroundAt,
    endsAt,
    batches,
    inputFlash,
    rejectionTooltip,
    peerInputs,
    currentQuestion,
    questionIndex,
    debugPhase,
    phaseSecondsRemaining,
    solvedByUsername,
    debugStreak,
    debugAttempts,
    debugCorrect,
    debugFeedback,
    debugAccuracy: debugAttempts > 0 ? Math.round((debugCorrect / debugAttempts) * 100) : 100,
    roundEndScores,
    intermissionEndsAt,
    isJammerActive,
    jammerUsedThisRound,
    activateJammer,
    triggerMidround,
    submitWord,
    submitAnswer,
    broadcastTyping,
    completeRound,
    startNewRound,
  };
}
