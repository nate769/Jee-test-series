"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface AttemptWithStats {
  id: string; test_id: string; score: number; max_score: number
  physics_score: number; chemistry_score: number; maths_score: number
  total_correct: number; total_wrong: number; total_attempted: number
  start_time: string; end_time: string | null
  tests: { title: string; duration_minutes: number } | null
}

export default function HistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [attempts, setAttempts] = useState<AttemptWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push("/login"); return }
      setUser(u); await fetchAttempts(u.id); setLoading(false)
    }
    init()
  }, [])

  async function fetchAttempts(userId: string) {
    const { data: attemptsData, error } = await supabase
      .from("attempts")
      .select(`id,test_id,score,max_score,physics_score,chemistry_score,maths_score,total_correct,total_wrong,total_attempted,start_time,end_time,tests(title,duration_minutes)`)
      .eq("user_id", userId).order("start_time", { ascending: false })
    if (error || !attemptsData) return
    const enriched = await Promise.all(attemptsData.map(async (attempt: any) => {
      if (attempt.score !== 0 || attempt.total_correct !== 0) return attempt
      const { data: answers } = await supabase.from("answers")
        .select(`selected_option_id,question_id,options(is_correct),questions(marks,negative_marks)`)
        .eq("attempt_id", attempt.id)
      if (!answers || answers.length === 0) return attempt
      let correct = 0, wrong = 0, score = 0
      answers.forEach((a: any) => {
        if (!a.selected_option_id) return
        if (a.options?.is_correct) { correct++; score += (a.questions?.marks ?? 4) }
        else { wrong++; score += (a.questions?.negative_marks ?? -1) }
      })
      const attempted = correct + wrong
      await supabase.from("attempts").update({ score, max_score: answers.length * 4, total_correct: correct, total_wrong: wrong, total_attempted: attempted, end_time: attempt.start_time, completed_at: attempt.start_time }).eq("id", attempt.id)
      return { ...attempt, score, max_score: answers.length * 4, total_correct: correct, total_wrong: wrong, total_attempted: attempted }
    }))
    setAttempts(enriched)
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push("/login") }
  if (loading) return <Loader />

  const totalTests = attempts.length
  const bestScore  = totalTests ? Math.max(...attempts.map(a => a.score)) : 0
  const avgScore   = totalTests ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / totalTests) : 0
  const avgAccuracy = totalTests ? Math.round(attempts.reduce((s, a) => s + (a.total_attempted > 0 ? (a.total_correct / a.total_attempted) * 100 : 0), 0) / totalTests) : 0

  function getGrade(pct: number) {
    if (pct >= 90) return { label: "A+", color: "#059669", bg: "#D1FAE5", border: "#6EE7B7" }
    if (pct >= 75) return { label: "A",  color: "#059669", bg: "#D1FAE5", border: "#6EE7B7" }
    if (pct >= 60) return { label: "B",  color: "#2563EB", bg: "#DBEAFE", border: "#93C5FD" }
    if (pct >= 45) return { label: "C",  color: "#D97706", bg: "#FEF3C7", border: "#FCD34D" }
    return             { label: "D",  color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5" }
  }

  function formatDate(dt: string) {
    if (!dt) return "—"
    return new Date(dt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "S"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        :root {
          --bp:#2563EB;--bh:#1D4ED8;--bd:#1E3A5F;--bm:#3B82F6;--bl:#DBEAFE;--bb:#93C5FD;
          --bg:#F0F4FF;--bgc:#FFFFFF;--bgs:#EEF2FF;
          --tp:#0F172A;--ts:#475569;--tm:#94A3B8;
          --br:#CBD5E1;--brl:#E2E8F0;
          --ag:#059669;--agl:#D1FAE5;--agb:#6EE7B7;
          --rd:#DC2626;--rdl:#FEE2E2;--rdb:#FCA5A5;
          --or:#D97706;--orl:#FEF3C7;--orb:#FCD34D;
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes barGrow{from{width:0}}
        html,body{height:100%;}
        .page{min-height:100vh;background:var(--bg);font-family:'Nunito',sans-serif;color:var(--tp);}
        .nav{background:rgba(240,244,255,0.97);backdrop-filter:blur(10px);border-bottom:1.5px solid var(--brl);padding:0 32px;height:62px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
        .nav-brand{display:flex;align-items:center;gap:10px;cursor:pointer;}
        .nav-logo{width:34px;height:34px;background:var(--bl);border:2px solid var(--bb);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;}
        .nav-title{font-family:'Lora',serif;font-size:16px;font-weight:700;color:var(--tp);}
        .nav-right{display:flex;align-items:center;gap:10px;}
        .nav-avatar{width:32px;height:32px;background:var(--bp);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;flex-shrink:0;}
        .nav-email{font-size:13px;font-weight:600;color:var(--ts);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .nbtn{padding:8px 14px;border-radius:9px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;border:1.5px solid var(--br);background:var(--bgc);color:var(--ts);}
        .nbtn:hover{background:var(--bgs);}
        .nbtn.blue{background:var(--bp);color:#fff;border-color:var(--bp);box-shadow:0 2px 8px rgba(37,99,235,0.25);}
        .nbtn.blue:hover{background:var(--bh);}
        .nbtn.red{background:var(--rdl);color:var(--rd);border-color:var(--rdb);}
        .nbtn.red:hover{background:#FECACA;}
        .tabs{border-bottom:1.5px solid var(--brl);background:var(--bgc);padding:0 32px;display:flex;gap:2px;}
        .tab{padding:0 16px;height:44px;border:none;background:none;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;color:var(--tm);cursor:pointer;border-bottom:2.5px solid transparent;transition:all .15s;}
        .tab.active{color:var(--bp);border-bottom-color:var(--bp);}
        .tab:hover:not(.active){color:var(--ts);}
        .content{max-width:920px;margin:0 auto;padding:32px 24px 80px;}
        .page-hd{margin-bottom:28px;animation:fadeUp .3s ease;}
        .page-hd-eye{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--tm);margin-bottom:6px;}
        .page-hd-title{font-family:'Lora',serif;font-size:26px;font-weight:700;letter-spacing:-.3px;color:var(--tp);}
        .page-hd-sub{font-size:14px;color:var(--tm);margin-top:4px;}
        .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;}
        @media(max-width:640px){.summary{grid-template-columns:repeat(2,1fr);}}
        .scard{background:var(--bgc);border:1.5px solid var(--brl);border-radius:16px;padding:18px 20px;animation:fadeUp .35s ease;box-shadow:0 1px 4px rgba(37,99,235,0.05);}
        .scard-icon{font-size:22px;margin-bottom:8px;}
        .scard-val{font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:600;color:var(--tp);line-height:1;}
        .scard-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--tm);margin-top:5px;}
        .chart-wrap{background:var(--bgc);border:1.5px solid var(--brl);border-radius:16px;padding:22px 24px;margin-bottom:28px;animation:fadeUp .4s ease;box-shadow:0 1px 4px rgba(37,99,235,0.05);}
        .chart-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:var(--tm);margin-bottom:14px;}
        .chart-inner{display:flex;gap:6px;align-items:flex-end;height:80px;}
        .bar-col{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;}
        .bar-val{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;color:var(--ts);}
        .bar-body{width:100%;border-radius:4px 4px 0 0;min-height:3px;transition:height .4s;}
        .bar-lbl{font-size:8px;font-weight:700;color:var(--tm);text-align:center;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .sec-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:var(--tm);margin-bottom:12px;}
        .attempt-list{display:flex;flex-direction:column;gap:10px;}
        .acard{background:var(--bgc);border:1.5px solid var(--brl);border-radius:16px;overflow:hidden;cursor:pointer;transition:all .18s;box-shadow:0 1px 4px rgba(37,99,235,0.04);animation:fadeUp .3s ease;}
        .acard:hover{border-color:var(--bb);box-shadow:0 4px 16px rgba(37,99,235,0.1);transform:translateY(-1px);}
        .acard.open{border-color:var(--bp);box-shadow:0 4px 20px rgba(37,99,235,0.12);}
        .acard-main{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;padding:18px 22px;}
        .ac-title{font-family:'Lora',serif;font-size:16px;font-weight:600;margin-bottom:3px;color:var(--tp);}
        .ac-date{font-size:12px;color:var(--tm);font-weight:600;margin-bottom:12px;}
        .ac-bars{display:flex;gap:14px;flex-wrap:wrap;}
        .bar-item{display:flex;flex-direction:column;gap:3px;}
        .bar-name{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;}
        .bar-track{height:5px;background:var(--brl);border-radius:3px;overflow:hidden;width:88px;}
        .bar-fill{height:100%;border-radius:3px;animation:barGrow .7s ease;}
        .ac-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;}
        .ac-score{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:600;color:var(--tp);line-height:1;}
        .ac-max{font-size:11px;color:var(--tm);font-weight:600;}
        .ac-grade{font-size:11px;font-weight:800;padding:4px 10px;border-radius:6px;}
        .ac-pct{font-size:12px;color:var(--ts);font-weight:700;}
        .ac-chevron{font-size:11px;color:var(--tm);transition:transform .2s;}
        .acard.open .ac-chevron{transform:rotate(180deg);}
        .detail{background:var(--bg);border-top:1px solid var(--brl);padding:18px 22px 22px;}
        .detail-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;}
        @media(max-width:500px){.detail-row{grid-template-columns:1fr 1fr;}}
        .dbox{background:var(--bgc);border:1px solid var(--brl);border-radius:11px;padding:13px 10px;text-align:center;}
        .dbox-n{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:600;}
        .dbox-l{font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:var(--tm);margin-top:3px;font-weight:700;}
        .subj-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
        .sbj{border-radius:11px;padding:13px;border:1.5px solid;}
        .sbj-name{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;}
        .sbj-score{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:600;}
        .sbj-max{font-size:11px;opacity:.55;font-weight:600;}
        .detail-btns{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;}
        .det-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:9px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;border:none;}
        .det-btn.blue{background:var(--bp);color:#fff;box-shadow:0 2px 8px rgba(37,99,235,0.25);}
        .det-btn.blue:hover{background:var(--bh);}
        .det-btn.outline{background:var(--bg);color:var(--ts);border:1.5px solid var(--br);}
        .det-btn.outline:hover{background:var(--bgs);color:var(--tp);}
        .empty{text-align:center;padding:80px 20px;animation:fadeUp .3s ease;}
        .empty-icon{font-size:52px;margin-bottom:16px;}
        .empty-title{font-family:'Lora',serif;font-size:22px;font-weight:700;margin-bottom:8px;color:var(--tp);}
        .empty-sub{font-size:14px;color:var(--tm);margin-bottom:24px;line-height:1.6;}
        .empty-btn{display:inline-flex;align-items:center;gap:8px;padding:13px 24px;background:var(--bp);color:#fff;border:none;border-radius:11px;font-family:'Nunito',sans-serif;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,0.28);transition:all .15s;}
        .empty-btn:hover{background:var(--bh);transform:translateY(-1px);}
      `}</style>

      <div className="page">
        <div className="nav">
          <div className="nav-brand" onClick={() => router.push("/home")}>
            <div className="nav-logo">🎯</div>
            <div className="nav-title">JEE Test Series</div>
          </div>
          <div className="nav-right">
            <button className="nbtn blue" onClick={() => router.push("/home")}>Take Test →</button>
            <div className="nav-avatar">{initials}</div>
            <span className="nav-email">{user?.email}</span>
            <button className="nbtn red" onClick={handleSignOut}>Sign out</button>
          </div>
        </div>

        <div className="tabs">
          <button className="tab" onClick={() => router.push("/home")}>📋 Tests</button>
          <button className="tab active">📊 My History</button>
        </div>

        <div className="content">
          <div className="page-hd">
            <div className="page-hd-eye">Dashboard</div>
            <div className="page-hd-title">Your Attempt History</div>
            <div className="page-hd-sub">Track your progress across all mock tests</div>
          </div>

          <div className="summary">
            {[
              { icon:"📝", val:totalTests,    lbl:"Tests Taken" },
              { icon:"🏆", val:bestScore,     lbl:"Best Score" },
              { icon:"📈", val:avgScore,      lbl:"Avg Score" },
              { icon:"🎯", val:`${avgAccuracy}%`, lbl:"Avg Accuracy" },
            ].map((s, i) => (
              <div className="scard" key={i} style={{ animationDelay:`${i*0.05}s` }}>
                <div className="scard-icon">{s.icon}</div>
                <div className="scard-val">{s.val}</div>
                <div className="scard-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>

          {attempts.length > 1 && (
            <div className="chart-wrap">
              <div className="chart-title">Score Trend — last {Math.min(attempts.length, 10)} attempts</div>
              <div className="chart-inner">
                {[...attempts].reverse().slice(-10).map((a, i) => {
                  const maxP = a.max_score || 120
                  const pct  = maxP > 0 ? Math.round((a.score / maxP) * 100) : 0
                  const h    = Math.max(4, (pct / 100) * 76)
                  const col  = pct >= 60 ? "#2563EB" : pct >= 40 ? "#D97706" : "#DC2626"
                  return (
                    <div className="bar-col" key={a.id}>
                      <div className="bar-val">{a.score}</div>
                      <div className="bar-body" style={{ height: h, background: col, opacity: 0.75 + i * 0.025 }} />
                      <div className="bar-lbl">#{attempts.length - i}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {attempts.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <div className="empty-title">No attempts yet</div>
              <div className="empty-sub">You haven't taken any tests yet.<br />Start your first mock test to see your progress here.</div>
              <button className="empty-btn" onClick={() => router.push("/home")}>Start Your First Test →</button>
            </div>
          ) : (
            <>
              <div className="sec-title">All Attempts — {attempts.length} total</div>
              <div className="attempt-list">
                {attempts.map((attempt, idx) => {
                  const maxP  = attempt.max_score || 120
                  const pct   = maxP > 0 ? Math.round((attempt.score / maxP) * 100) : 0
                  const grade = getGrade(pct)
                  const isOpen = selected === attempt.id
                  const physPct = Math.min(100, attempt.physics_score   > 0 ? Math.round((attempt.physics_score   / (maxP / 3)) * 100) : 0)
                  const chemPct = Math.min(100, attempt.chemistry_score > 0 ? Math.round((attempt.chemistry_score / (maxP / 3)) * 100) : 0)
                  const mathPct = Math.min(100, attempt.maths_score     > 0 ? Math.round((attempt.maths_score     / (maxP / 3)) * 100) : 0)
                  return (
                    <div key={attempt.id} className={`acard ${isOpen ? "open" : ""}`} style={{ animationDelay:`${idx*0.04}s` }} onClick={() => setSelected(isOpen ? null : attempt.id)}>
                      <div className="acard-main">
                        <div>
                          <div className="ac-title">{attempt.tests?.title?.replace(/_/g," ") ?? "Mock Test"}</div>
                          <div className="ac-date">🕐 {formatDate(attempt.end_time || attempt.start_time)}</div>
                          <div className="ac-bars">
                            {[
                              { label:"Physics",   pct:physPct, color:"#0369A1" },
                              { label:"Chemistry", pct:chemPct, color:"#0F766E" },
                              { label:"Maths",     pct:mathPct, color:"#6D28D9" },
                            ].map(({ label, pct: p, color }) => (
                              <div className="bar-item" key={label}>
                                <span className="bar-name" style={{ color }}>{label}</span>
                                <div className="bar-track"><div className="bar-fill" style={{ width:`${p}%`, background:color }} /></div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="ac-right">
                          <div><div className="ac-score">{attempt.score}</div><div className="ac-max">/ {maxP}</div></div>
                          <div className="ac-grade" style={{ background:grade.bg, color:grade.color, border:`1px solid ${grade.border}` }}>{grade.label}</div>
                          <div className="ac-pct">{pct}%</div>
                          <div className="ac-chevron">▼</div>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="detail" onClick={e => e.stopPropagation()}>
                          <div className="detail-row">
                            <div className="dbox"><div className="dbox-n" style={{ color:"var(--ag)" }}>{attempt.total_correct}</div><div className="dbox-l">Correct</div></div>
                            <div className="dbox"><div className="dbox-n" style={{ color:"var(--rd)" }}>{attempt.total_wrong}</div><div className="dbox-l">Wrong</div></div>
                            <div className="dbox"><div className="dbox-n" style={{ color:"var(--tm)" }}>{(attempt.max_score / 4 || 0) - attempt.total_attempted}</div><div className="dbox-l">Skipped</div></div>
                          </div>
                          <div className="subj-row">
                            {[
                              { s:"Physics",   sc:attempt.physics_score,   color:"#0369A1", bg:"#E0F2FE", border:"#BAE6FD" },
                              { s:"Chemistry", sc:attempt.chemistry_score, color:"#0F766E", bg:"#CCFBF1", border:"#99F6E4" },
                              { s:"Maths",     sc:attempt.maths_score,     color:"#6D28D9", bg:"#EDE9FE", border:"#DDD6FE" },
                            ].map(({ s, sc, color, bg, border }) => (
                              <div key={s} className="sbj" style={{ background:bg, borderColor:border }}>
                                <div className="sbj-name" style={{ color }}>{s}</div>
                                <div className="sbj-score" style={{ color }}>{sc} <span className="sbj-max">pts</span></div>
                              </div>
                            ))}
                          </div>
                          <div className="detail-btns">
                            <button className="det-btn blue" onClick={() => router.push(`/result/${attempt.id}`)}>📊 View Full Result</button>
                            <button className="det-btn outline" onClick={() => router.push(`/test/${attempt.test_id}`)}>🔄 Retake Test</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function Loader() {
  return (
    <div style={{ minHeight:"100vh", background:"#F0F4FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap');`}</style>
      <div style={{ textAlign:"center", fontFamily:"Nunito,sans-serif", color:"#94A3B8" }}>
        <div style={{ width:36, height:36, border:"3px solid #E2E8F0", borderTopColor:"#2563EB", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 14px" }} />
        Loading your history…
      </div>
    </div>
  )
}