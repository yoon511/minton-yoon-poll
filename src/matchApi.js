import { listMatches } from "./api";

function matchesKey(pollId) {
  return `yoon_matches_${pollId}`;
}
function statsKey(pollId) {
  return `yoon_stats_${pollId}`;
}

function loadMatches(pollId) {
  const raw = localStorage.getItem(matchesKey(pollId));
  return raw ? JSON.parse(raw) : [];
}
function saveMatches(pollId, matches) {
  localStorage.setItem(matchesKey(pollId), JSON.stringify(matches));
}

function loadStats(pollId) {
  const raw = localStorage.getItem(statsKey(pollId));
  return raw ? JSON.parse(raw) : {}; // regId -> stat
}
function saveStats(pollId, stats) {
  localStorage.setItem(statsKey(pollId), JSON.stringify(stats));
}

function addPoints(stats, player, points) {
  const cur = stats[player.regId] || {
    regId: player.regId,
    name: player.name,
    groupKey: player.groupKey,
    totalPoints: 0,
    gamesPlayed: 0,
    avgPoint: 0,
  };

  const totalPoints = cur.totalPoints + points;
  const gamesPlayed = cur.gamesPlayed + 1;
  const avgPoint = Number((totalPoints / gamesPlayed).toFixed(2));

  stats[player.regId] = { ...cur, totalPoints, gamesPlayed, avgPoint };
}

/**
 * 경기 결과 저장 + 개인 점수 누적
 * 규칙:
 *  - 팀A 점수가 19면 팀A 두 명 모두 19점 추가
 *  - 팀B 점수가 21이면 팀B 두 명 모두 21점 추가
 */
export async function submitMatchResult(pollId, matchId, teamAScore, teamBScore) {
  const matches = loadMatches(pollId);
  const idx = matches.findIndex((m) => m.id === matchId);
  if (idx < 0) throw new Error("match not found");

  const match = matches[idx];
  if (match.status === "finished") return; // 이미 저장된 경우 무시

  // match 갱신
  match.status = "finished";
  match.result = { teamAScore, teamBScore };
  matches[idx] = match;
  saveMatches(pollId, matches);

  // stats 갱신
  const stats = loadStats(pollId);

  for (const p of match.teamA) addPoints(stats, p, teamAScore);
  for (const p of match.teamB) addPoints(stats, p, teamBScore);

  saveStats(pollId, stats);
}

export async function listRanking(pollId) {
  const stats = loadStats(pollId);
  return Object.values(stats).sort((a, b) => {
    if (b.avgPoint !== a.avgPoint) return b.avgPoint - a.avgPoint;
    return b.gamesPlayed - a.gamesPlayed;
  });
}
