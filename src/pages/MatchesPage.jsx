import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { saveMatchResult, subscribeMatches } from "../api";

const groupOrder = { M_A: 1, M_B: 2, M_C: 3, M_D: 4, F_A: 5, F_B: 6 };

function labelGroup(g) {
  return (g || "").replace("M_", "남 ").replace("F_", "여 ");
}

export default function MatchesPage() {
  const { pollId } = useParams();

  const [matches, setMatches] = useState([]);
  const [scoreInput, setScoreInput] = useState({}); // matchId -> {a:'', b:''}

  useEffect(() => {
    const unsub = subscribeMatches(pollId, (data) => {
      data.sort((x, y) => {
        const xo = x.groupOrder ?? groupOrder[x.groupKey] ?? 999;
        const yo = y.groupOrder ?? groupOrder[y.groupKey] ?? 999;
        if (xo !== yo) return xo - yo;
        return (x.order ?? 0) - (y.order ?? 0);
      });
      setMatches(data);
    });

    return () => unsub();
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
      fontWeight: 800,
      border: "1px solid rgba(0,0,0,0.06)",
      whiteSpace: "nowrap",
    });

    const matchCard = {
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 14,
      padding: 12,
      background: "rgba(255,255,255,0.9)",
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      alignItems: "center",
      transition: "transform .08s ease, box-shadow .15s ease, border-color .15s ease",
    };

    const input = {
      padding: "8px 10px",
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      outline: "none",
      background: "rgba(255,255,255,0.95)",
      fontSize: 14,
      width: 72,
      textAlign: "center",
      transition: "box-shadow .15s ease",
    };

    const btn = (variant) => {
      const base = {
        padding: "9px 12px",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.12)",
        fontWeight: 800,
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
      return {
        ...base,
        color: "#0f172a",
        background: "rgba(255,255,255,0.9)",
      };
    };

    return { card, chipLink, pill, matchCard, input, btn };
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    for (const m of matches) {
      map[m.groupKey] ||= [];
      map[m.groupKey].push(m);
    }
    return map;
  }, [matches]);

  const groupKeysSorted = Object.keys(grouped).sort(
    (a, b) => (groupOrder[a] ?? 999) - (groupOrder[b] ?? 999)
  );

  function setA(matchId, v) {
    setScoreInput((prev) => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || {}), a: v.replace(/[^\d]/g, "").slice(0, 2) },
    }));
  }
  function setB(matchId, v) {
    setScoreInput((prev) => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || {}), b: v.replace(/[^\d]/g, "").slice(0, 2) },
    }));
  }

  async function onSave(matchId) {
    const a = Number(scoreInput[matchId]?.a);
    const b = Number(scoreInput[matchId]?.b);

    if (!Number.isFinite(a) || !Number.isFinite(b)) return alert("점수를 숫자로 입력해줘!");
    if (a < 0 || b < 0) return alert("점수는 0 이상이어야 해!");

    await saveMatchResult(pollId, matchId, a, b);
    alert("결과 저장 완료!");
  }

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
         {/* ✅ 여기! 홈 버튼 */}
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
                🏸
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, letterSpacing: -0.3 }}>경기 목록</h1>
                <p style={{ margin: "6px 0 0", color: "rgba(15,23,42,0.6)", fontSize: 13 }}>
                  각 경기의 점수를 입력하면 자동으로 랭킹에 반영돼요.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={styles.pill("rgba(99,102,241,0.12)", "#3730a3")}>총 {matches.length}경기</span>
              <span style={styles.pill("rgba(34,197,94,0.12)", "#065f46")}>
                완료 {matches.filter((m) => m.status === "finished").length}
              </span>
              <span style={styles.pill("rgba(148,163,184,0.20)", "#475569")}>
                대기 {matches.filter((m) => m.status !== "finished").length}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ marginTop: 14 }}>
          {matches.length === 0 ? (
            <div style={{ ...styles.card, padding: 16 }}>
              <p style={{ margin: 0, color: "rgba(15,23,42,0.65)" }}>
                경기가 없어. 투표 페이지에서 관리자 → 매칭 생성을 해줘.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {groupKeysSorted.map((gk) => {
                const list = grouped[gk];
                const finished = list.filter((m) => m.status === "finished").length;
                const pct = Math.round((finished / Math.max(list.length, 1)) * 100);

                return (
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
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={styles.pill("rgba(15,23,42,0.06)", "#0f172a")}>
                            ▣ {labelGroup(gk)} 경기
                          </span>
                          <span style={styles.pill("rgba(34,197,94,0.12)", "#065f46")}>
                            종료 {finished} / {list.length}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 140,
                              height: 10,
                              borderRadius: 999,
                              background: "rgba(15,23,42,0.08)",
                              overflow: "hidden",
                              border: "1px solid rgba(0,0,0,0.06)",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, rgba(34,197,94,0.75), rgba(99,102,241,0.75))",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(15,23,42,0.6)" }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, color: "rgba(15,23,42,0.5)", fontSize: 12 }}>
                        펼치기/접기 (클릭)
                      </div>
                    </summary>

                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                      {list.map((m) => {
                        const isFinished = m.status === "finished" && m.result;

                        return (
                          <div
                            key={m.id}
                            style={styles.matchCard}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-1px)";
                              e.currentTarget.style.boxShadow = "0 10px 18px rgba(0,0,0,0.06)";
                              e.currentTarget.style.borderColor = "rgba(99,102,241,0.28)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
                            }}
                          >
                            <div style={{ minWidth: 280 }}>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                <span style={styles.pill("rgba(99,102,241,0.12)", "#3730a3")}>#{m.order}</span>
                                <span style={styles.pill("rgba(15,23,42,0.06)", "#0f172a")}>
                                  {labelGroup(m.groupKey)}
                                </span>
                                {isFinished ? (
                                  <span style={styles.pill("rgba(34,197,94,0.12)", "#065f46")}>✅ 종료</span>
                                ) : (
                                  <span style={styles.pill("rgba(148,163,184,0.20)", "#475569")}>⏳ 대기</span>
                                )}
                              </div>

                              <div style={{ marginTop: 8, lineHeight: 1.35 }}>
                                <div style={{ fontSize: 14, color: "rgba(15,23,42,0.65)", fontWeight: 700 }}>
                                  팀 A
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                                  {m.teamA?.[0]?.name} / {m.teamA?.[1]?.name}
                                </div>

                                <div style={{ height: 8 }} />

                                <div style={{ fontSize: 14, color: "rgba(15,23,42,0.65)", fontWeight: 700 }}>
                                  팀 B
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                                  {m.teamB?.[0]?.name} / {m.teamB?.[1]?.name}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              {isFinished ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <span style={styles.pill("rgba(15,23,42,0.06)", "#0f172a")}>결과</span>
                                  <span style={styles.pill("rgba(34,197,94,0.12)", "#065f46")}>
                                    {m.result.teamAScore}
                                  </span>
                                  <span style={{ fontWeight: 900, color: "rgba(15,23,42,0.55)" }}>:</span>
                                  <span style={styles.pill("rgba(34,197,94,0.12)", "#065f46")}>
                                    {m.result.teamBScore}
                                  </span>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                  <input
                                    value={scoreInput[m.id]?.a ?? ""}
                                    onChange={(e) => setA(m.id, e.target.value)}
                                    placeholder="팀A"
                                    style={styles.input}
                                    inputMode="numeric"
                                    onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.18)")}
                                    onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                                  />
                                  <span style={{ fontWeight: 900, color: "rgba(15,23,42,0.55)" }}>:</span>
                                  <input
                                    value={scoreInput[m.id]?.b ?? ""}
                                    onChange={(e) => setB(m.id, e.target.value)}
                                    placeholder="팀B"
                                    style={styles.input}
                                    inputMode="numeric"
                                    onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.18)")}
                                    onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                                  />
                                  <button
                                    onClick={() => onSave(m.id)}
                                    style={styles.btn("primary")}
                                    onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                                    onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
                                  >
                                    저장
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 18, color: "rgba(15,23,42,0.45)", fontSize: 12 }}>
          Tip: 점수 입력은 숫자만 가능하게 해뒀고(최대 2자리), 저장하면 즉시 반영돼요.
        </div>
      </div>
    </div>
  );
}
