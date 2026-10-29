# Phase 7 — Real-Time Multiplayer Arcade Architecture & Operations

## 1. Overview & Service Boundaries
The Phase 7 Arcade is a dedicated, real-time multiplayer subsystem extending the Sovereign LMS.
The main LMS API remains the source of truth for user authentication, persistent identity, subscriptions, and global leaderboards. The Arcade service runs as an independent, high-concurrency WebSocket process (FastAPI + WebSockets) on port `8001`.

```
Frontend (React /arcade) <==== WebSocket (port 8001) ====> Arcade Service (phase7.game.main)
                                                                 │
                                                    ┌────────────┴────────────┐
                                                    ▼                         ▼
                                           Redis Pub/Sub (Rooms)     PostgreSQL (game_rounds)
```

---

## 2. How to Run the Game Server

### Local Development:
```bash
# 1. Compile binary wordlists from sources:
python3 phase7/game/wordlists/build.py

# 2. Run the game server on port 8001:
python3 -m uvicorn phase7.game.main:app --host 0.0.0.0 --port 8001 --reload
```

### Docker Compose Deployment:
```bash
docker build -t sovereign-arcade:latest -f phase7/docker/game.Dockerfile .
docker run -p 8001:8001 --env-file .env sovereign-arcade:latest
```

---

## 3. The Two Game Modes and Their Rules

### Mode 1: Word Forge
- **Round Duration**: 180 seconds (3 minutes) of intense letter-scrambling battle.
- **Pool & Seed Words**:
  - The server selects 2 random 6-letter seed words from the round's language wordlist.
  - The 12 letters from both seed words form the initial shared pool.
  - Seed words themselves are excluded from valid submissions.
- **Mid-Round Letter Injection (t=90s)**:
  - At exactly 90 seconds (1:30), the server injects 2 new random letters into the pool (pool expands to 14 letters).
  - Any pending word feed is flushed prior to broadcasting `pool_update`.
  - Words containing mid-round letters receive a **1.5x multiplier**.
- **Scoring Formula**:
  $$\text{base} = \text{len}(\text{word})$$
  $$\text{bonus} = 5 \quad \text{if word starts with the first letter of either seed word, else } 0$$
  $$\text{rarity} = 2 \quad \text{if len}(\text{word}) \ge 7 \text{, else } 0$$
  $$\text{midround} = 1.5 \quad \text{if word contains any mid-round letter, else } 1.0$$
  $$\text{total} = \lfloor \text{base} \times \text{midround} \rfloor + \text{bonus} + \text{rarity}$$

### Mode 2: Debugs Hunting
- **Structure**: A rapid sequence of code inspection questions (defaults to 10 questions per round from `questions/{lang}.json`).
- **Timing**: Up to 10 seconds per question.
- **Early Resolution**:
  - The question ends **immediately** when the first player submits the correct answer.
  - If no player answers correctly within 10 seconds, the question resolves on timer expiration.
- **Scoring**:
  - Correct & Fastest: **+100 pts**
  - Correct & 2nd or 3rd: **+60 pts**
  - Correct & 4th+: **+30 pts**
  - Wrong: **0 pts**
- **Reveal**: A 1.5-second pause (`REVEAL_PAUSE_MS`) follows each answer reveal before the next challenge begins.

---

## 4. The Language Rotation Rule (English x3 Cap)
Each room maintains its own recent language history (`room.recent_languages`):
- **English Cap**: English can appear at most 3 times in a row. On the 4th consecutive round, English is strictly forbidden.
- **No Non-English Consecutive Repeats**: If the previous round was `python`, the next round cannot be `python`. It may be `english` (subject to the cap) or one of the other non-English options (`javascript`, `rust`, `csharp`).
- **Isolation**: Language rotation is per-room. Room A on English does not influence Room B on Rust.

---

## 5. Word Feed Batching (4 Words or 15 Seconds)
To prevent chat flooding and UI jank with concurrent players:
- The server batches accepted submissions on a per-room basis.
- **Flush Triggers** (whichever occurs first):
  1. **Batch Size**: 4 accepted words accumulate in `feed_pending`.
  2. **Batch Interval**: 15 seconds elapse since the previous flush.
- The 15-second timer measures from the **last flush**, not from round start.
- On round end and mid-round injection, pending words are flushed before the lifecycle state transition.
- The frontend live feed shows at most **4 batches** with fixed height; older batches slide out without causing page scroll.

---

## 6. Submission Feedback & Silent Drops
- **Valid Word**: Player receives `word_accepted` with points and updated score; input box flashes green for 200ms.
- **Already Guessed**: If the word was previously found by the submitting player or anyone else in the room, the server sends `word_rejected` with reason `"already_guessed"`, rendering a 1.5-second inline warning.
- **Invalid Words (Silent Drop)**:
  - If the word is not in the language dictionary
  - If the word is not formable from the current letter pool
  - If the word is a seed word
  - If the word has length $< 4$
  - If the player violates the 400ms submission rate limit
  The server produces **NO message**. The input box clears silently, mimicking real puzzle behavior.

---

## 7. Debugs Hunting Hidden Question Count
- The total question count is kept **server-side only**.
- Neither `round_start`, `question`, nor `answer_revealed` messages contain ordinal indexes (`3 of 10`) or total counters.
- This prevents players from gaming their risk tolerance on the final question.

---

## 8. 30-Second Intermissions
- Between every round (Word Forge and Debugs Hunting), rooms transition to an `intermission` state lasting exactly 30 seconds.
- Final round standings are displayed with a synchronized countdown timer before the next battle automatically begins with a rotated language.

---

## 9. Why `possible_count` is Static
- `possible_count` is computed exactly **twice**:
  1. At $t=0$: all distinct words formable from the 12-letter pool (excluding seed words).
  2. At $t=90$: all distinct words formable from the 14-letter pool (excluding seed words and already-found words).
- It does **not decrement** as players discover words during the round. A decrementing counter would reveal whether unfound words remain and leak dictionary frequency hints.

---

## 10. How to Add New Words and Trivia

### Adding Vocabulary:
1. Append 4+ letter words to `phase7/game/wordlists/source/{language}.txt`. Ensure 6-letter words are present for seed generation.
2. Recompile binary wordlists:
   ```bash
   python3 phase7/game/wordlists/build.py
   ```

### Adding Trivia:
1. Edit or add questions in `phase7/questions/{language}.json` (or `general.json`).
2. Schema required for each item:
   ```json
   {
     "id": "py-99",
     "text": "Question text here?",
     "options": ["Option A", "Option B", "Option C", "Option D"],
     "correct_index": 0
   }
   ```
