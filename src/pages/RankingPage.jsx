import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { computeRanking } from "../api";

const groupOrder = { M_A: 1, M_B: 2, M_C: 3, M_D: 4, F_A: 5, F_B: 6 };

function labelGroup(g) {
  return (g || "").replace("M_", "남 ").replace("F_", "여 ");
}

function RankTable({ rows }) {
  // 공동 순위 계산: avgPoint가 같으면 같은 rank, 다음은 건너뛰기
  const ranks = useMemo(() => {
    const out = [];
    let currentRank = 0;
    let lastAvg = null;

    for (let i = 0; i < rows.length; i++) {
      const avg = Number(rows[i].avgPoint);

      // 첫 항목이거나 avg가 달라지면 rank 갱신
      if (i === 0 || avg !== lastAvg) {
        currentRank = i + 1; // competition ranking: i+1
        lastAvg = avg;
      }
      out.push(currentRank);
    }
    return out;
  }, [rows]);

  return (
    <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 760 }}>
      <thead>
        <tr>
          <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>순위</th>
          <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>이름</th>
          <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>그룹</th>
          <th style={{ borderBottom: "1px solid #ddd", textAlign: "right", padding: 8 }}>경기수</th>
          <th style={{ borderBottom: "1px solid #ddd", textAlign: "right", padding: 8 }}>총점</th>
          <th style={{ borderBottom: "1px solid #ddd", textAlign: "right", padding: 8 }}>평균</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.regId}>
            <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
              {ranks[i]}
            </td>
            <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{r.name}</td>
            <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{labelGroup(r.groupKey)}</td>
            <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8, textAlign: "right" }}>{r.gamesPlayed}</td>
            <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8, textAlign: "right" }}>{r.totalPoints}</td>
            <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8, textAlign: "right" }}>{r.avgPoint}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


function Top3({ rows, styles }) {
  const top = rows.slice(0, 3);
  if (top.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
      {top.map((r, idx) => (
        <div
          key={r.regId}
          style={{
            ...styles.card,
            padding: 14,
            boxShadow: "none",
            background:
              idx === 0
                ? "linear-gradient(180deg, rgba(234,179,8,0.18), rgba(255,255,255,0.88))"
                : "rgba(255,255,255,0.88)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span style={styles.pill("rgba(15,23,42,0.06)", "#0f172a")}>
              {medals[idx]} TOP {idx + 1}
            </span>
            <span style={styles.pill("rgba(99,102,241,0.12)", "#3730a3")}>평균 {r.avgPoint}</span>
          </div>

          <div style={{ height: 10 }} />

          <div style={{ fontSize: 18, fontWeight: 950, color: "#0f172a" }}>{r.name}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={styles.pill(
                r.groupKey?.startsWith("M_") ? "rgba(59,130,246,0.12)" : "rgba(236,72,153,0.12)",
                r.groupKey?.startsWith("M_") ? "#1d4ed8" : "#9d174d"
              )}
            >
              {labelGroup(r.groupKey)}
            </span>
            <span style={styles.pill("rgba(34,197,94,0.12)", "#065f46")}>
              {r.gamesPlayed}경기 / {r.totalPoints}점
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RankingPage() {
  const { pollId } = useParams();

  const [tab, setTab] = useState("all"); // "all" | "group"
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    try {
      setLoading(true);
      const data = await computeRanking(pollId);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [pollId]);

  const styles = useMemo(() => {
    const card = {
      background: "rgba(255,255,255,0.92)",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 16,
      boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
    };

    const chipLink = {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderRadius: 999,
      border: "1px solid rgba(0,0,0,0.10)",
      background: "rgba(255,255,255,0.85)",
      textDecoration: "none",
      color: "#0f172a",
      fontSize: 13,
      fontWeight: 700,
      transition: "transform .08s ease, box-shadow .15s ease, border-color .15s ease",
    };

    const pill = (bg, color) => ({
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: 999,
      background: bg,
      color,
      fontSize: 12,
      fontWeight: 850,
      border: "1px solid rgba(0,0,0,0.06)",
      whiteSpace: "nowrap",
    });

    const segWrap = {
      display: "inline-flex",
      borderRadius: 14,
      border: "1px solid rgba(0,0,0,0.10)",
      background: "rgba(255,255,255,0.8)",
      padding: 4,
      gap: 4,
      flexWrap: "wrap",
    };

    const segBtn = (active) => ({
      padding: "9px 12px",
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.10)",
      background: active ? "linear-gradient(180deg, #111827 0%, #0b1220 100%)" : "transparent",
      color: active ? "#fff" : "#0f172a",
      fontWeight: 900,
      cursor: "pointer",
      transition: "opacity .15s ease, transform .05s ease",
      opacity: active ? 1 : 0.8,
    });

    const btn = (variant) => {
      const base = {
        padding: "9px 12px",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.12)",
        fontWeight: 900,
        cursor: "pointer",
        transition: "transform .05s ease, box-shadow .15s ease, opacity .15s ease",
        whiteSpace: "nowrap",
      };
      if (variant === "primary") {
        return {
          ...base,
          color: "#fff",
          background: "linear-gradient(180deg, #111827 0%, #0b1220 100%)",
          boxShadow: "0 10px 18px rgba(17,24,39,0.18)",
        };
      }
      return { ...base, background: "rgba(255,255,255,0.9)", color: "#0f172a" };
    };

    return { card, chipLink, pill, segWrap, segBtn, btn };
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    for (const r of rows) {
      map[r.groupKey] ||= [];
      map[r.groupKey].push(r);
    }
    for (const gk of Object.keys(map)) {
      map[gk].sort((a, b) => {
        if (b.avgPoint !== a.avgPoint) return b.avgPoint - a.avgPoint;
        if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
        return b.totalPoints - a.totalPoints;
      });
    }
    return map;
  }, [rows]);

  const groupKeysSorted = Object.keys(grouped).sort(
    (a, b) => (groupOrder[a] ?? 999) - (groupOrder[b] ?? 999)
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(99,102,241,0.18), transparent 55%), radial-gradient(900px 500px at 80% 20%, rgba(34,197,94,0.14), transparent 55%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Top nav */}
<div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
  {/* ✅ 홈으로 추가 */}
  <Link
    to="/"
    style={styles.chipLink}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.boxShadow = "0 10px 18px rgba(0,0,0,0.06)";
      e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = "rgba(0,0,0,0.10)";
    }}
  >
     홈
  </Link>

  {/* 기존 */}
  <Link
    to={`/poll/${pollId}`}
    style={styles.chipLink}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.boxShadow = "0 10px 18px rgba(0,0,0,0.06)";
      e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = "rgba(0,0,0,0.10)";
    }}
  >
    ← 투표로
  </Link>

  <Link
    to={`/poll/${pollId}/ranking`}
    style={styles.chipLink}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.boxShadow = "0 10px 18px rgba(0,0,0,0.06)";
      e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = "rgba(0,0,0,0.10)";
    }}
  >
    🏆 랭킹 →
  </Link>
</div>


        {/* Header */}
        <div style={{ ...styles.card, marginTop: 14, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: "linear-gradient(180deg, #111827, #334155)",
                  boxShadow: "0 10px 18px rgba(17,24,39,0.18)",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontSize: 20,
                }}
              >
                🏆
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, letterSpacing: -0.3 }}>랭킹</h1>
                <p style={{ margin: "6px 0 0", color: "rgba(15,23,42,0.6)", fontSize: 13 }}>
                  평균 점수 기준으로 정렬돼요. 
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={styles.pill("rgba(99,102,241,0.12)", "#3730a3")}>총 {rows.length}명</span>
              <span style={styles.pill(loading ? "rgba(148,163,184,0.20)" : "rgba(34,197,94,0.12)", loading ? "#475569" : "#065f46")}>
                {loading ? "불러오는 중..." : "업데이트됨"}
              </span>
            </div>
          </div>

          <div style={{ height: 12 }} />

          {/* Tabs */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={styles.segWrap}>
              <button
                onClick={() => setTab("all")}
                style={styles.segBtn(tab === "all")}
                onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
              >
                전체 랭킹
              </button>
              <button
                onClick={() => setTab("group")}
                style={styles.segBtn(tab === "group")}
                onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
              >
                그룹별 랭킹
              </button>
            </div>

            <button
              onClick={refresh}
              style={styles.btn("primary")}
              disabled={loading}
              onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
            >
              {loading ? "새로고침..." : "새로고침"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ marginTop: 14 }}>
          {rows.length === 0 ? (
            <div style={{ ...styles.card, padding: 16 }}>
              <p style={{ margin: 0, color: "rgba(15,23,42,0.65)" }}>
                아직 결과가 없어. 경기 결과를 입력하면 랭킹이 생겨.
              </p>
            </div>
          ) : tab === "all" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Top3 rows={rows} styles={styles} />
              <div style={{ ...styles.card, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <h2 style={{ margin: 0, fontSize: 16, letterSpacing: -0.2 }}>전체 순위표</h2>
                  <span style={{ color: "rgba(15,23,42,0.55)", fontSize: 12 }}>
                    
                  </span>
                </div>
                <div style={{ height: 10 }} />
                <RankTable rows={rows} styles={styles} />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {groupKeysSorted.map((gk) => (
                <details
                  key={gk}
                  open
                  style={{
                    ...styles.card,
                    padding: 14,
                    boxShadow: "none",
                    background: "rgba(255,255,255,0.88)",
                  }}
                >
                  <summary style={{ cursor: "pointer", listStyle: "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={styles.pill("rgba(15,23,42,0.06)", "#0f172a")}>
                          ▣ {labelGroup(gk)} 랭킹
                        </span>
                        <span style={styles.pill("rgba(99,102,241,0.12)", "#3730a3")}>{grouped[gk].length}명</span>
                      </div>
                      <span style={{ color: "rgba(15,23,42,0.5)", fontSize: 12 }}>펼치기/접기</span>
                    </div>
                  </summary>

                  <div style={{ marginTop: 12 }}>
                    <RankTable rows={grouped[gk]} styles={styles} />
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 18, color: "rgba(15,23,42,0.45)", fontSize: 12 }}>
          Tip: “그룹별 랭킹”은 같은 그룹 안에서만 다시 정렬돼요.
        </div>
      </div>
    </div>
  );
}
