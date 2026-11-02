let currentPage = 1;
const pageSize = 25;
let totalPages = 1;

const leaderboardBody = document.getElementById("leaderboardBody");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageIndicator = document.getElementById("pageIndicator");
const myRankBadge = document.getElementById("myRankBadge");

async function fetchLeaderboard(page = 1) {
  const token = localStorage.getItem("sovereign_auth_token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`/api/v1/leaderboard/all_time?page=${page}&page_size=${pageSize}&include_me=true`, {
      headers
    });
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    const data = await res.json();

    currentPage = data.page;
    totalPages = Math.max(1, Math.ceil(data.total / pageSize));

    pageIndicator.textContent = `Page ${currentPage} of ${totalPages} (${data.total} total)`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;

    if (data.my_rank) {
      myRankBadge.textContent = `My Rank: #${data.my_rank}`;
      myRankBadge.classList.remove("hidden");
    }

    renderTable(data.entries);
  } catch (err) {
    leaderboardBody.innerHTML = `<tr><td colspan="5" class="table-empty-row">Error loading leaderboard: ${err.message}</td></tr>`;
  }
}

function renderTable(entries) {
  if (!entries || entries.length === 0) {
    leaderboardBody.innerHTML = `<tr><td colspan="5" class="table-empty-row">No ranked students yet. Solve a challenge to claim Rank #1!</td></tr>`;
    return;
  }

  leaderboardBody.innerHTML = "";
  entries.forEach((e) => {
    const tr = document.createElement("tr");

    let rankBadgeClass = "rank-num";
    if (e.rank === 1) rankBadgeClass += " rank-gold";
    else if (e.rank === 2) rankBadgeClass += " rank-silver";
    else if (e.rank === 3) rankBadgeClass += " rank-bronze";

    tr.innerHTML = `
      <td><span class="${rankBadgeClass}">#${e.rank}</span></td>
      <td>
        <div class="user-cell">
          <div class="user-avatar-sm">👤</div>
          <span class="user-name">${e.username}</span>
        </div>
      </td>
      <td style="text-align: right; font-weight: 700; color: #fbbf24; font-family: var(--font-mono);">${e.points} XP</td>
      <td style="text-align: right; font-family: var(--font-mono);">${e.challenges_solved}</td>
      <td style="text-align: right; color: #94a3b8; font-size: 0.8rem;">${e.last_submission_at ? new Date(e.last_submission_at).toLocaleDateString() : "--"}</td>
    `;
    leaderboardBody.appendChild(tr);
  });
}

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) fetchLeaderboard(currentPage - 1);
});

nextPageBtn.addEventListener("click", () => {
  if (currentPage < totalPages) fetchLeaderboard(currentPage + 1);
});

// Auto-refresh every 60s when tab is focused
let refreshInterval = setInterval(() => {
  if (document.visibilityState === "visible") {
    fetchLeaderboard(currentPage);
  }
}, 60000);

fetchLeaderboard(1);
