// Sovereign Academy Phase 2 Frontend Application
let editor = null;
let currentChallenge = null;
let challengesCache = [];

const API_BASE = window.location.origin;
const TOKEN_KEY = "sovereign_auth_token";
const USER_KEY = "sovereign_user";

// Synthetic demo JWT for zero-friction student testing
const DEMO_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6InN0dWRlbnRAc292ZXJlaWduLmFjYWRlbXkiLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.simulated_signature";

// DOM Elements
const challengesListEl = document.getElementById("challengesList");
const challengeCountBadge = document.getElementById("challengeCountBadge");
const currentTitleEl = document.getElementById("currentTitle");
const currentTierEl = document.getElementById("currentTier");
const currentDescriptionEl = document.getElementById("currentDescription");
const runCodeBtn = document.getElementById("runCodeBtn");
const resetCodeBtn = document.getElementById("resetCodeBtn");
const runtimeBadge = document.getElementById("runtimeBadge");
const overallBanner = document.getElementById("overallBanner");
const rewardsStrip = document.getElementById("rewardsStrip");
const xpPill = document.getElementById("xpPill");
const xpPillText = document.getElementById("xpPillText");
const streakPill = document.getElementById("streakPill");
const streakPillText = document.getElementById("streakPillText");
const badgesUnlockedContainer = document.getElementById("badgesUnlockedContainer");
const testCardsGrid = document.getElementById("testCardsGrid");
const userStatusText = document.getElementById("userStatusText");
const authActionBtn = document.getElementById("authActionBtn");
const loginModal = document.getElementById("loginModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const loginForm = document.getElementById("loginForm");
const demoStudentBtn = document.getElementById("demoStudentBtn");

// 1. Monaco Editor Initialization
function initMonaco() {
  require.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs" } });
  require(["vs/editor/editor.main"], function () {
    editor = monaco.editor.create(document.getElementById("monacoContainer"), {
      value: "# Select a challenge to begin",
      language: "python",
      theme: "vs-dark",
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () {
      executeCurrentCode();
    });

    if (currentChallenge) {
      editor.setValue(currentChallenge.starter_code);
    }
  });
}

// 2. Auth State
function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || DEMO_JWT;
}

function updateAuthUI() {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  if (token) {
    userStatusText.textContent = user || "student@sovereign.academy";
    authActionBtn.textContent = "Logout";
  } else {
    userStatusText.textContent = "Demo Session (Active)";
    authActionBtn.textContent = "Login";
  }
}

authActionBtn.addEventListener("click", () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    updateAuthUI();
  } else {
    loginModal.classList.remove("hidden");
  }
});

closeModalBtn.addEventListener("click", () => loginModal.classList.add("hidden"));

demoStudentBtn.addEventListener("click", () => {
  localStorage.setItem(TOKEN_KEY, DEMO_JWT);
  localStorage.setItem(USER_KEY, "student_demo");
  loginModal.classList.add("hidden");
  updateAuthUI();
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("studentEmail").value;
  localStorage.setItem(TOKEN_KEY, DEMO_JWT);
  localStorage.setItem(USER_KEY, email);
  loginModal.classList.add("hidden");
  updateAuthUI();
});

// 3. Challenge Loading
async function loadChallenges() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/challenges`);
    if (!res.ok) throw new Error("Failed to fetch challenges");
    const data = await res.json();
    challengesCache = data;
    challengeCountBadge.textContent = data.length;
    renderChallengesList(data);

    if (data.length > 0) {
      selectChallenge(data[0].id);
    }
  } catch (err) {
    challengesListEl.innerHTML = `<div class="empty-tests-placeholder">Error loading challenges: ${err.message}</div>`;
  }
}

function renderChallengesList(challenges) {
  challengesListEl.innerHTML = "";
  challenges.forEach((c) => {
    const item = document.createElement("div");
    item.className = "challenge-item";
    item.id = `challenge-item-${c.id}`;
    item.innerHTML = `
      <div class="challenge-item-header">
        <span class="challenge-item-title">${c.title}</span>
        <span class="tier-tag">T${c.tier}</span>
      </div>
      <div class="challenge-item-topic">${c.topic} · 10 XP</div>
    `;
    item.addEventListener("click", () => selectChallenge(c.id));
    challengesListEl.appendChild(item);
  });
}

async function selectChallenge(challengeId) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/challenges/${challengeId}`);
    if (!res.ok) throw new Error("Challenge details failed");
    currentChallenge = await res.json();

    document.querySelectorAll(".challenge-item").forEach((el) => el.classList.remove("active"));
    const activeEl = document.getElementById(`challenge-item-${challengeId}`);
    if (activeEl) activeEl.classList.add("active");

    currentTitleEl.textContent = currentChallenge.title;
    currentTierEl.textContent = `Tier ${currentChallenge.tier} · ${currentChallenge.topic}`;
    currentDescriptionEl.textContent = currentChallenge.description;

    if (editor) {
      editor.setValue(currentChallenge.starter_code);
    }

    overallBanner.classList.add("hidden");
    rewardsStrip.classList.add("hidden");
    runtimeBadge.textContent = "Runtime: -- ms";
    testCardsGrid.innerHTML = '<div class="empty-tests-placeholder">Click "Run Solution" to evaluate code against 5 test cases.</div>';
  } catch (err) {
    console.error("Failed to select challenge", err);
  }
}

resetCodeBtn.addEventListener("click", () => {
  if (currentChallenge && editor) {
    editor.setValue(currentChallenge.starter_code);
  }
});

// 4. Code Execution & Gamified Feedback
async function executeCurrentCode() {
  if (!currentChallenge || !editor) return;

  const code = editor.getValue();
  runCodeBtn.disabled = true;
  runCodeBtn.innerHTML = '<span>Evaluating...</span>';
  runtimeBadge.textContent = "Running...";

  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        challenge_id: currentChallenge.id,
        code: code,
      }),
    });

    if (res.status === 401) {
      alert("Authentication required. Please sign in or use the Instant Demo Session.");
      loginModal.classList.remove("hidden");
      return;
    }

    const payload = await res.json();
    if (!res.ok) {
      throw new Error(payload.detail || "Execution failed");
    }

    renderExecutionResults(payload);
  } catch (err) {
    overallBanner.className = "overall-banner failure";
    overallBanner.textContent = `Error: ${err.message}`;
    overallBanner.classList.remove("hidden");
    rewardsStrip.classList.add("hidden");
    runtimeBadge.textContent = "Runtime: Error";
  } finally {
    runCodeBtn.disabled = false;
    runCodeBtn.innerHTML = '<span class="play-icon">▶</span><span>Run Solution</span>';
  }
}

runCodeBtn.addEventListener("click", executeCurrentCode);

// 5. Results & Rewards Rendering
function renderExecutionResults(payload) {
  const result = payload.result;
  const isPassed = payload.passed;
  const xpAwarded = payload.xp_awarded || 0;
  const newBadges = payload.new_badges || [];
  const profile = payload.profile || {};

  runtimeBadge.textContent = `Runtime: ${result.execution_ms} ms`;

  // Play audio chime & shoot multi-cannon confetti
  if (isPassed) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.1);
        osc.stop(audioCtx.currentTime + idx * 0.1 + 0.35);
      });
    } catch (_) {}

    if (window.confetti) {
      window.confetti({ particleCount: 70, spread: 60, origin: { x: 0.25, y: 0.6 }, colors: ['#38BDF8', '#34D399', '#FBBF24'] });
      window.confetti({ particleCount: 70, spread: 60, origin: { x: 0.75, y: 0.6 }, colors: ['#38BDF8', '#34D399', '#FBBF24'] });
      setTimeout(() => {
        window.confetti({ particleCount: 100, spread: 100, origin: { x: 0.5, y: 0.5 }, colors: ['#FBBF24', '#34D399', '#818CF8'] });
      }, 200);
    }
  }

  // Overall Banner
  overallBanner.className = `overall-banner ${isPassed ? "success juicy-glow" : "failure"}`;
  if (isPassed) {
    overallBanner.innerHTML = `<span>⚡</span> <strong>VICTORY!</strong> All ${result.total_tests} Test Cases Passed in ${result.execution_ms}ms!`;
  } else {
    overallBanner.innerHTML = `<span>✖</span> ${result.passed_tests} of ${result.total_tests} Tests Passed. Review output below.`;
  }
  overallBanner.classList.remove("hidden");

  // Rewards Strip (Phase 2 Gamification)
  if (isPassed) {
    rewardsStrip.classList.remove("hidden");
    if (xpAwarded > 0) {
      xpPill.className = "reward-item xp-active";
      xpPillText.textContent = `+${xpAwarded} XP`;
    } else {
      xpPill.className = "reward-item muted";
      xpPillText.textContent = "Already solved — no XP this time";
    }

    if (profile.current_streak > 0) {
      streakPill.classList.remove("hidden");
      streakPillText.textContent = `🔥 ${profile.current_streak} Day Streak`;
    }

    // Unlocked Badges
    badgesUnlockedContainer.innerHTML = "";
    if (newBadges.length > 0) {
      newBadges.forEach((bid) => {
        const badgeTag = document.createElement("div");
        badgeTag.className = "badge-unlocked-pill animate-bounce";
        badgeTag.innerHTML = `<span>🎉 Unlocked Badge: ${bid}</span>`;
        badgesUnlockedContainer.appendChild(badgeTag);
      });
    }
  } else {
    rewardsStrip.classList.add("hidden");
  }

  // Per-Test Cards
  testCardsGrid.innerHTML = "";
  if (result.results && result.results.length > 0) {
    result.results.forEach((tc) => {
      const card = document.createElement("div");
      card.className = `test-card ${tc.passed ? "passed" : "failed"}`;

      const inputStr = typeof tc.input === "object" ? JSON.stringify(tc.input) : String(tc.input);
      const expectedStr = JSON.stringify(tc.expected);
      const actualStr = tc.actual !== null ? JSON.stringify(tc.actual) : "None";

      card.innerHTML = `
        <div class="test-card-head">
          <span class="test-status ${tc.passed ? "passed" : "failed"}">
            ${tc.passed ? "✔ PASS" : "✖ FAIL"} (Test #${tc.index + 1})
          </span>
          <span class="test-duration">${tc.duration_ms} ms</span>
        </div>
        <div class="test-card-body">
          <div><span style="color:#64748b;">Input:</span> ${inputStr}</div>
          <div><span style="color:#64748b;">Expected:</span> ${expectedStr}</div>
          <div><span style="color:${tc.passed ? "#34d399" : "#f87171"};">Actual:</span> ${actualStr}</div>
        </div>
        ${tc.error ? `<div style="color:#f87171; font-family:var(--font-mono); font-size:0.75rem; margin-top:4px;">Error: ${tc.error}</div>` : ""}
      `;
      testCardsGrid.appendChild(card);
    });
  }

  if (result.stderr) {
    const errBox = document.createElement("div");
    errBox.style.cssText = "background: rgba(239,68,68,0.1); border: 1px solid #ef4444; border-radius: 6px; padding: 10px; font-family: var(--font-mono); font-size: 0.8rem; color: #fca5a5; white-space: pre-wrap;";
    errBox.textContent = result.stderr;
    testCardsGrid.appendChild(errBox);
  }
}

updateAuthUI();
initMonaco();
loadChallenges();
