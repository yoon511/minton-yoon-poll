import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPoll, subscribePolls, listPolls, deletePoll } from "../api";

export default function Home() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [polls, setPolls] = useState([]);
  const [adminPin, setAdminPin] = useState("");
const [isAdmin, setIsAdmin] = useState(false);
const ADMIN_PIN = "yoon511"; // 너가 쓰는 관리자 암호


  async function refresh() {
    const data = await listPolls();
    setPolls(data);
  }

  useEffect(() => {
    const unsub = subscribePolls(setPolls);
    return () => unsub();
  }, []);

  function onAdminLogin() {
  if (!adminPin.trim()) {
    alert("관리자 암호를 입력해줘!");
    return;
  }

  if (adminPin !== ADMIN_PIN) {
    alert("관리자 암호가 틀렸어!");
    return;
  }

  setIsAdmin(true);
  setAdminPin("");
}

function onAdminLogout() {
  setIsAdmin(false);
}



  async function onCreate() {
    if (!isAdmin) return alert("관리자만 투표를 만들 수 있어!");

    if (!date) return alert("날짜를 선택해줘!");
    if (!time) return alert("시간을 선택해줘!");
    if (!location.trim()) return alert("장소를 입력해줘!");

    await createPoll({ date, time, location: location.trim() });

    setDate("");
    setTime("");
    setLocation("");
    await refresh();
  }

async function onDeletePoll(e, pollId) {
  e.preventDefault();   // Link 이동 막기
  e.stopPropagation();  // 카드 클릭 이벤트 막기

  console.log("삭제 버튼 클릭됨! pollId =", pollId);


  const ok = window.confirm("정말 이 투표를 삭제할까?");
  if (!ok) return;

  try {
    console.log("deletePoll 호출 직전");
    await deletePoll(pollId);
    console.log("deletePoll 호출 성공");

    await refresh(); // 목록 다시 불러오기
    console.log("refresh 완료");
  } catch (err) {
    console.error("삭제 에러:", err);
    alert("삭제에 실패했어. 잠시 후 다시 시도해줘!");
  }
}


  const styles = useMemo(() => {
    const chipBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.9)",
  color: "#0f172a",
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  transition: "transform .08s ease, box-shadow .15s ease, border-color .15s ease, opacity .15s ease",
};

const chipBtnActive = (bg, color, borderColor) => ({
  ...chipBtn,
  background: bg,
  color,
  borderColor,
});

    const card = {
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 16,
      boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    };

    const input = {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      outline: "none",
      background: "rgba(255,255,255,0.9)",
      fontSize: 14,
      minWidth: 180,
      transition: "box-shadow .15s ease, border-color .15s ease",
    };

    const button = {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      background: "linear-gradient(180deg, #111827 0%, #0b1220 100%)",
      color: "#fff",
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 10px 18px rgba(17,24,39,0.18)",
      transition: "transform .05s ease, box-shadow .15s ease, opacity .15s ease",
      whiteSpace: "nowrap",
    };

    const pill = {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: "rgba(17,24,39,0.06)",
      color: "#111827",
    };

    const linkCard = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "14px 14px",
      borderRadius: 14,
      border: "1px solid rgba(0,0,0,0.08)",
      background: "rgba(255,255,255,0.9)",
      textDecoration: "none",
      color: "#111827",
      transition: "transform .08s ease, box-shadow .15s ease, border-color .15s ease",
    };

    return { card, input, button, pill, linkCard, chipBtn, chipBtnActive };
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
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginTop: 12, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              <h1 style={{ margin: 0, fontSize: 26, letterSpacing: -0.4 }}>
                배드민턴 참석 투표
              </h1>
              <p style={{ margin: "6px 0 0", color: "rgba(17,24,39,0.6)", fontSize: 14 }}>
                모임을 만들고, 참석자 등록과 대진표를 한 번에 관리해요.
              </p>
            </div>
          </div>
        </div>

{/* 관리자 로그인 */}
<div style={{ ...styles.card, padding: 16, marginBottom: 16 }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
    <h2 style={{ margin: 0, fontSize: 16 }}>관리자</h2>
    <span style={styles.pill}>
      {isAdmin ? "✅ 관리자 모드 ON" : "🔒 관리자 모드 OFF"}
    </span>
  </div>

  <div style={{ height: 10 }} />

  {isAdmin ? (
    <button onClick={onAdminLogout} style={styles.button}>
      로그아웃
    </button>
  ) : (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <input
        value={adminPin}
        onChange={(e) => setAdminPin(e.target.value)}
        placeholder="관리자 암호"
        style={styles.input}
      />
      <button onClick={onAdminLogin} style={styles.button}>
        관리자 로그인
      </button>
    </div>
  )}
</div>


        {/* Create Card */}
       {isAdmin && (
         <div style={{ ...styles.card, padding: 18 }}>
          <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",      // ✅ 변경
    gap: 12,
    flexWrap: "wrap",          // ✅ 추가
  }}
>
  <div>
    <h2 style={{ margin: 0, fontSize: 18, letterSpacing: -0.2 }}>모임 투표 만들기</h2>
    <p style={{ margin: "6px 0 0", color: "rgba(17,24,39,0.6)", fontSize: 13 }}>
      날짜/시간/장소를 입력하면 투표가 생성돼요.
    </p>
  </div>
  <span style={styles.pill}>✨ quick create</span>
</div>


          <div style={{ height: 12 }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              type="date"
              style={{ ...styles.input, minWidth: 170 }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.18)")}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
            />
            <input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="시간 (예: 19:00 ~ 21:00)"
              style={{ ...styles.input, minWidth: 220 }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.18)")}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="장소 (예: OO체육관)"
              style={{ ...styles.input, minWidth: 260, flex: 1 }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.18)")}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
            />

            <button
              onClick={onCreate}
              style={styles.button}
              onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.95")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              만들기 →
            </button>
          </div>
        </div>
)}

       
                {/* List */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: 18, letterSpacing: -0.2 }}>투표 목록</h2>
            <span style={{ color: "rgba(17,24,39,0.55)", fontSize: 13 }}>
              총 {polls.length}개
            </span>
          </div>

          <div style={{ height: 10 }} />

          {polls.length === 0 ? (
            <div style={{ ...styles.card, padding: 16 }}>
              <p style={{ margin: 0, color: "rgba(17,24,39,0.65)" }}>
                아직 투표가 없어. 위에서 하나 만들어봐!
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {polls.map((p) => (
                <Link
                  key={p.id}
                  to={`/poll/${p.id}`}
                  style={styles.linkCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 10px 18px rgba(0,0,0,0.07)";
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ ...styles.pill, background: "rgba(99,102,241,0.12)", color: "#3730a3" }}>
                        {p.date}
                      </span>
                      <span style={{ ...styles.pill, background: "rgba(16,185,129,0.12)", color: "#065f46" }}>
                        {p.time}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 650,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={p.location}
                    >
                      {p.location}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Link
                      to={`/poll/${p.id}`}
                      style={styles.pill}
                      onClick={(e) => e.stopPropagation()}
                    >
                      📌 투표
                    </Link>

                    <Link
                      to={`/poll/${p.id}/matches`}
                      style={{ ...styles.pill, background: "rgba(99,102,241,0.12)", color: "#3730a3" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      🗓️ 경기
                    </Link>

                    <Link
                      to={`/poll/${p.id}/ranking`}
                      style={{ ...styles.pill, background: "rgba(34,197,94,0.12)", color: "#065f46" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      🏆 랭킹
                    </Link>

                    {isAdmin && (
                      <button
                        onClick={(e) => onDeletePoll(e, p.id)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 12,
                          border: "1px solid rgba(239,68,68,0.25)",
                          background: "rgba(239,68,68,0.10)",
                          color: "#7f1d1d",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{ marginTop: 22, color: "rgba(17,24,39,0.45)", fontSize: 12 }}>
          Tip: 목록 카드를 클릭하면 해당 투표 상세 페이지로 이동해요.
        </div>

