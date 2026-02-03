import { db } from "./firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

// 구조:
// polls/{pollId}
// polls/{pollId}/registrations/{regId}
// polls/{pollId}/matches/{matchId}

const groupOrder = { M_A: 1, M_B: 2, M_C: 3, M_D: 4, F_A: 5, F_B: 6 };

// ---------- Polls ----------
export async function createPoll({ date, time, location }) {
  const pollRef = doc(collection(db, "polls")); // 자동 ID
  await setDoc(pollRef, {
    date,
    time,
    location,
    createdAt: serverTimestamp(),
  });
  return pollRef.id;
}

export async function listPolls() {
  const q = query(collection(db, "polls"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPoll(pollId) {
  const snap = await getDoc(doc(db, "polls", pollId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// 실시간 구독
export function subscribePolls(callback) {
  const q = query(collection(db, "polls"), orderBy("date", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribePoll(pollId, callback) {
  return onSnapshot(doc(db, "polls", pollId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// ---------- Registrations ----------
export async function listRegistrations(pollId) {
  const snap = await getDocs(collection(db, "polls", pollId, "registrations"));
  return snap.docs.map((d) => d.data());
}

export function subscribeRegistrations(pollId, callback) {
  return onSnapshot(collection(db, "polls", pollId, "registrations"), (snap) => {
    callback(snap.docs.map((d) => d.data()));
  });
}

/**
 * reg: { name, gender, grade, pin }
 * regId = `${name}#${pin}`
 */
export async function upsertRegistration(pollId, reg) {
  const groupKey = `${reg.gender}_${reg.grade}`;
  const regId = `${reg.name}#${reg.pin}`;

  await setDoc(
    doc(db, "polls", pollId, "registrations", regId),
    {
      regId,
      name: reg.name,
      gender: reg.gender,
      grade: reg.grade,
      pin: reg.pin, // ⚠️ 지금은 개발용(추후 해시 추천)
      groupKey,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function cancelRegistration(pollId, { name, pin }) {
  const regId = `${name}#${pin}`;
  await deleteDoc(doc(db, "polls", pollId, "registrations", regId));
}

// ---------- Matches ----------
export async function listMatches(pollId) {
  const snap = await getDocs(collection(db, "polls", pollId, "matches"));
  return snap.docs.map((d) => d.data());
}

export function subscribeMatches(pollId, callback) {
  return onSnapshot(collection(db, "polls", pollId, "matches"), (snap) => {
    callback(snap.docs.map((d) => d.data()));
  });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export async function generateMatches(
  pollId,
  { minGames = 4, bestGames = 4, allowMaxGames = 5 } = {}
) {
  const regs = await listRegistrations(pollId);

  const batch = writeBatch(db);
  const matchesCol = collection(db, "polls", pollId, "matches");

  // 기존 matches 삭제
  const existing = await getDocs(matchesCol);
  existing.docs.forEach((d) => batch.delete(d.ref));

  // groupKey별로 묶기
  const groups = {};
  for (const r of regs) {
    groups[r.groupKey] ||= [];
    groups[r.groupKey].push({
      regId: r.regId,
      name: r.name,
      groupKey: r.groupKey,
    });
  }

  let order = 1;
  let created = 0;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  const makeMatch = (groupKey, chosen, count) => {
    shuffle(chosen);
    const teamA = [chosen[0], chosen[1]];
    const teamB = [chosen[2], chosen[3]];

    for (const p of chosen) count.set(p.regId, (count.get(p.regId) ?? 0) + 1);

    const matchRef = doc(matchesCol);
    batch.set(matchRef, {
      id: matchRef.id,
      groupKey,
      groupOrder: groupOrder[groupKey] ?? 999,
      order: order++,
      teamA,
      teamB,
      status: "scheduled",
      result: null,
      createdAt: serverTimestamp(),
    });
    created++;
  };

  // count 오름차순
  const sortByCount = (arr, count) =>
    [...arr].sort((a, b) => (count.get(a.regId) ?? 0) - (count.get(b.regId) ?? 0));

  for (const groupKey of Object.keys(groups)) {
    const players = groups[groupKey];
    if (players.length < 4) continue;

    const count = new Map(players.map((p) => [p.regId, 0]));

    // -------------------------
    // 1) "가능하면 정확히 bestGames(=4)씩" 라운드 방식
    // -------------------------
    // bestGames 라운드 동안 매 라운드: 섞고 4명씩 끊어서 경기 생성
    for (let round = 0; round < bestGames; round++) {
      const pool = [...players];
      shuffle(pool);

      // 4명씩 끊기
      for (let i = 0; i + 3 < pool.length; i += 4) {
        const chosen = pool.slice(i, i + 4);
        makeMatch(groupKey, chosen, count);
      }
      // 남는 1~3명은 이번 라운드 bye(휴식) -> 이 때문에 어떤 사람은 3경기 될 수 있음
    }

    // -------------------------
    // 2) minGames(=4) 못 채운 사람이 있으면 "추가 경기"로만 보정
    //    (이때만 5경기 허용)
    // -------------------------
    const minCount = () => Math.min(...players.map((p) => count.get(p.regId) ?? 0));

    let safety = 0;
    while (minCount() < minGames) {
      safety++;
      if (safety > 5000) break;

      // 4경기 미만인 사람 우선
      const need = players.filter((p) => (count.get(p.regId) ?? 0) < minGames);
      const chosen = sortByCount(need, count).slice(0, 4);

      // 부족하면, 전체에서 "가장 적게 뛴 사람"으로 채우되 allowMaxGames(=5)까지만
      if (chosen.length < 4) {
        const fillersPool = players.filter(
          (p) =>
            (count.get(p.regId) ?? 0) < allowMaxGames &&
            !chosen.some((c) => c.regId === p.regId)
        );
        const fillers = sortByCount(fillersPool, count);
        for (const f of fillers) {
          if (chosen.length >= 4) break;
          chosen.push(f);
        }
      }

      if (chosen.length < 4) break; // 더 못 만들면 종료
      makeMatch(groupKey, chosen, count);
    }
  }

  await batch.commit();
  return created;
}




export async function saveMatchResult(pollId, matchId, teamAScore, teamBScore) {
  await updateDoc(doc(db, "polls", pollId, "matches", matchId), {
    status: "finished",
    result: { teamAScore, teamBScore },
    finishedAt: serverTimestamp(),
  });
}

// ---------- Ranking ----------
export async function computeRanking(pollId) {
  const matches = await listMatches(pollId);

  const map = new Map();
  const ensure = (p) => {
    if (!map.has(p.regId)) {
      map.set(p.regId, {
        regId: p.regId,
        name: p.name,
        groupKey: p.groupKey,
        totalPoints: 0,
        gamesPlayed: 0,
        avgPoint: 0,
      });
    }
    return map.get(p.regId);
  };

  for (const m of matches) {
    if (m.status !== "finished" || !m.result) continue;
    const aScore = Number(m.result.teamAScore);
    const bScore = Number(m.result.teamBScore);

    for (const p of m.teamA) {
      const s = ensure(p);
      s.totalPoints += aScore;
      s.gamesPlayed += 1;
    }
    for (const p of m.teamB) {
      const s = ensure(p);
      s.totalPoints += bScore;
      s.gamesPlayed += 1;
    }
  }

  for (const s of map.values()) {
    s.avgPoint = s.gamesPlayed ? Number((s.totalPoints / s.gamesPlayed).toFixed(2)) : 0;
  }

  const rows = Array.from(map.values());
  rows.sort((a, b) => {
    if (b.avgPoint !== a.avgPoint) return b.avgPoint - a.avgPoint;
    if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
    return b.totalPoints - a.totalPoints;
  });

  return rows;
}
