import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  cancelRegistration,
  generateMatches,
  getPoll,
  listRegistrations,
  upsertRegistration,
  subscribePoll,
  subscribeRegistrations,
} from "../api";

const GROUP_LABEL = (k) =>
  (k || "")
    .replace("M_A", "남 A")
    .replace("M_B", "남 B")
    .replace("M_C", "남 C")
    .replace("M_D", "남 D")
    .replace("F_A", "여 A")
    .replace("F_B", "여 B");

export default function PollPage() {
  const { pollId } = useParams();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);

  // 참석 입력
  const [name, setName] = useState("");
  const [gender, setGender] = useState("M");
  const [grade, setGrade] = useState("A");
  const [pin, setPin] = useState("");

  // 관리자
  const [adminPin, setAdminPin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // 참석자
  const [regs, setRegs] = useState([]);

  async function refresh() {
    const p = await getPoll(pollId);
    setPoll(p);

    const data = await listRegistrations(pollId);
    const order = { M_A: 1, M_B: 2, M_C: 3, M_D: 4, F_A: 5, F_B: 6 };
    data.sort((a, b) => {
      const ao = order[a.groupKey] ?? 999;
      const bo = order[b.groupKey] ?? 999;
      if (ao !== bo) return ao - bo;
      return (a.name || "").localeCompare(b.name || "");
    });
    setRegs(data);
  }

  useEffect(() => {
    const unsubPoll = subscribePoll(pollId, setPoll);

    const unsubRegs = subscribeRegistrations(pollId, (data) => {
      const order = { M_A: 1, M_B: 2, M_C: 3, M_D: 4, F_A: 5, F_B: 6 };
      data.sort((a, b) => {
        const ao = order[a.groupKey] ?? 999;
        const bo = order[b.groupKey] ?? 999;
        if (ao !== bo) return ao - bo;
        return (a.name || "").localeCompare(b.name || "");
      });
      setRegs(data);
    });

    return () => {
      unsubPoll();
      unsubRegs();
    };
  }, [pollId]);

  const counts = useMemo(() => {
    const map = { M_A: 0, M_B: 0, M_C: 0, M_D: 0, F_A: 0, F_B: 0, ETC: 0 };
    for (const r of regs) {
      if (r.groupKey in map) map[r.groupKey] += 1;
      else map.ETC += 1;
    }
    return map;
  }, [regs]);

  const totalCount = regs.length;

  function validateForAttend() {
    if (!name.trim()) return alert("이름을 입력해줘!");
    if (!/^\d{4}$/.test(pin)) return alert("암호는 숫자 4자리로 입력해줘! (예: 1234)");
    return true;
  }

  async function onAttend() {
    if (!validateForAttend()) return;

    await upsertRegistration(pollId, {
      name: name.trim(),
      gender,
      grade,
      pin,
    });

    alert("참석 완료!");
    await refresh();
  }

  async function onCancel() {
    if (!name.trim()) return alert("취소하려면 이름을 입력해줘!");
    if (!/^\d{4}$/.test(pin)) return alert("취소하려면 암호 4자리를 입력해줘!");

    await cancelRegistration(pollId, { name: name.trim(), pin });
    alert("취소 완료!");
    await refresh();
  }

  // ⚠️ 임시 관리자 PIN
  const ADMIN_PIN = "yoon511";

  function onAdminLogin() {
    if (!adminPin.trim()) return alert("관리자 암호를 입력해줘!");
    if (adminPin !== ADMIN_PIN) return alert("관리자 암호가 틀렸어!");
    setIsAdmin(true);
    setAdminPin("");
  }

  function onAdminLogout() {
    setIsAdmin(false);
  }

  async function onAdminGenerateMatches() {
    if (!confirm("매칭을 새로 생성할까? (기존 경기 결과는 유지되지 않음)")) return;

    // NOTE: 기존 api 시그니처가 {minGames, softMaxGames, hardMaxGames} 라면 아래처럼 맞춰줘.
    const created = await generateMatches(pollId, {
      minGames: 4,
      softMaxGames: 4,
      hardMaxGames: 5,
    });

    alert(`매칭 생성 완료! 총 ${created}경기 생성됨`);
    navigate(`/poll/${pollId}/matches`);
  }

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
      background: "rgba(255,255,255,0.8)",
      textDecoration: "none",
      color: "#0f172a",
      fontSize: 13,
      fontWeight: 650,
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
      fontWeight: 700,
      border: "1px solid rgba(0,0,0,0.06)",
      whiteSpace: "nowrap",
    });

    const input = {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      outline: "none",
      background: "rgba(255,255,255,0.95)",
      fontSize: 14,
      transition: "box-shadow .15s ease, border-color .15s ease",
    };

    const select = { ...input, paddingRight: 34 };

    const btn = (variant) => {
      const base = {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.12)",
        fontWeight: 750,
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

      if (variant === "danger") {
        return {
          ...base,
          color: "#7f1d1d",
          background: "rgba(239, 68, 68, 0.10)",
          border: "1px solid rgba(239, 68, 68, 0.22)",
        };
      }

      return {
        ...base,
        color: "#0f172a",
        background: "rgba(255,255,255,0.9)",
      };
    };

    return { card, chipLink, pill, input, select, btn };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(99,102,241,0.18), transparent 55%), radial-gradient(900px 500px at 80% 20%, rgba(34,197,94,0.14), transparent 55%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        {/* Top nav */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
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
            to={`/poll/${pollId}/matches`}
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
            🗓️ 경기 목록
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
            🏆 랭킹
          </Link>
        </div>

        {/* Header card */}
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
                📌
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, letterSpacing: -0.3 }}>참석 투표</h1>
                <p style={{ margin: "6px 0 0", color: "rgba(15,23,42,0.6)", fontSize: 13 }}>
                  참석 등록 후 관리자 매칭으로 경기표를 만들 수 있어요.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={styles.pill("rgba(99,102,241,0.12)", "#3730a3")}>
                👥 총 {totalCount}명
              </span>
              <span style={styles.pill("rgba(16,185,129,0.12)", "#065f46")}>
                남A {counts.M_A} / 남B {counts.M_B} / 남C {counts.M_C} / 남D {counts.M_D}
              </span>
              <span style={styles.pill("rgba(236,72,153,0.12)", "#9d174d")}>
                여A {counts.F_A} / 여B {counts.F_B}
                {counts.ETC ? ` / 기타 ${counts.ETC}` : ""}
              </span>
            </div>
          </div>

          <div style={{ height: 12 }} />

          {poll ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={styles.pill("rgba(15,23,42,0.06)", "#0f172a")}>📅 {poll.date}</span>
              <span style={styles.pill("rgba(15,23,42,0.06)", "#0f172a")}>⏰ {poll.time}</span>
              <span style={styles.pill("rgba(15,23,42,0.06)", "#0f172a")}>📍 {poll.location}</span>
            </div>
          ) : (
            <p style={{ margin: 0, color: "rgba(15,23,42,0.5)" }}>투표 정보를 불러오는 중...</p>
          )}
        </div>

        {/* Admin */}
        <div style={{ ...styles.card, marginTop: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, letterSpacing: -0.2 }}>관리자</h2>
              <p style={{ margin: "6px 0 0", color: "rgba(15,23,42,0.6)", fontSize: 13 }}>
                매칭 생성은 관리자만 가능해요.
              </p>
            </div>
            <span style={styles.pill(isAdmin ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.20)", isAdmin ? "#065f46" : "#475569")}>
              {isAdmin ? "✅ 관리자 모드 ON" : "🔒 관리자 모드 OFF"}
            </span>
          </div>

          <div style={{ height: 12 }} />

          {isAdmin ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={onAdminGenerateMatches}
                style={styles.btn("primary")}
                onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
              >
                매칭 생성하고 경기 목록 보기 →
              </button>

              <button onClick={onAdminLogout} style={styles.btn("secondary")}>
                로그아웃
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="관리자 암호"
                style={{ ...styles.input, width: 220 }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.18)")}
                onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
              />
              <button onClick={onAdminLogin} style={styles.btn("primary")}>
                관리자 로그인
              </button>
              <span style={{ color: "rgba(15,23,42,0.55)", fontSize: 12 }}>* 임시 기능(다음 단계에서 개선)</span>
            </div>
          )}
        </div>

        {/* Attend / Cancel */}
        <div style={{ ...styles.card, marginTop: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, letterSpacing: -0.2 }}>참석 / 취소</h2>
              <p style={{ margin: "6px 0 0", color: "rgba(15,23,42,0.6)", fontSize: 13 }}>
                로그인 없이 운영 중이라, 취소는 <b>이름 + 4자리 암호</b>로 처리돼요.
              </p>
            </div>
            <span style={styles.pill("rgba(15,23,42,0.06)", "#0f172a")}>🔑 PIN 4자리</span>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              style={{ ...styles.input, width: 160 }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.18)")}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
            />

            <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ ...styles.select, width: 130 }}>
              <option value="M">남자</option>
              <option value="F">여자</option>
            </select>

            <select value={grade} onChange={(e) => setGrade(e.target.value)} style={{ ...styles.select, width: 110 }}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>

            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="암호 4자리"
              style={{ ...styles.input, width: 130 }}
              inputMode="numeric"
            />

            <button
              onClick={onAttend}
              style={styles.btn("primary")}
              onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
            >
              참석하기
            </button>

            <button onClick={onCancel} style={styles.btn("danger")}>
              취소하기
            </button>
          </div>
        </div>

        {/* Registrations */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, letterSpacing: -0.2 }}>참석자 목록</h2>
            <span style={{ color: "rgba(15,23,42,0.55)", fontSize: 12 }}>
              클릭 기능은 아직 없고, 목록만 표시돼요
            </span>
          </div>

          <div style={{ height: 10 }} />

          {regs.length === 0 ? (
            <div style={{ ...styles.card, padding: 16 }}>
              <p style={{ margin: 0, color: "rgba(15,23,42,0.65)" }}>아직 참석자가 없어.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              {regs.map((r) => (
                <div
                  key={r.regId}
                  style={{
                    ...styles.card,
                    padding: 12,
                    boxShadow: "none",
                    background: "rgba(255,255,255,0.85)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <span
                      style={styles.pill(
                        r.groupKey?.startsWith("M_") ? "rgba(59,130,246,0.12)" : "rgba(236,72,153,0.12)",
                        r.groupKey?.startsWith("M_") ? "#1d4ed8" : "#9d174d"
                      )}
                    >
                      {GROUP_LABEL(r.groupKey)}
                    </span>
                    <span style={{ color: "rgba(15,23,42,0.35)", fontSize: 12 }}>#{r.regId?.split("#")?.[0]}</span>
                  </div>

                  <div style={{ height: 8 }} />

                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{r.name}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "rgba(15,23,42,0.55)" }}>
                    {r.gender === "M" ? "남자" : "여자"} · {r.grade} · 등록됨
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 18, color: "rgba(15,23,42,0.45)", fontSize: 12 }}>
          Tip: 관리자 로그인 후 “매칭 생성”을 누르면 경기 목록으로 바로 이동해요.
        </div>
      </div>
    </div>
  );
}
