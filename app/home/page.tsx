"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"

interface Test {
  id: string
  title: string
  duration_minutes: number
  is_live: boolean
  created_at: string
}

interface Attempt {
  test_id: string
  score: number
  max_score: number
  completed_at: string
}

export default function HomePage() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading])

  useEffect(() => {
    if (user) { fetchTests(); fetchAttempts() }
  }, [user])

  async function fetchTests() {
    const { data } = await supabase
      .from("tests")
      .select("*")
      .eq("is_live", true)
      .order("title")
    setTests(data || [])
    setLoading(false)
  }

  async function fetchAttempts() {
    const { data } = await supabase
      .from("attempts")
      .select("test_id, score, max_score, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
    setAttempts(data || [])
  }

  function getBestAttempt(testId: string) {
    const testAttempts = attempts.filter(a => a.test_id === testId)
    if (!testAttempts.length) return null
    return testAttempts.reduce((best, a) => a.score > best.score ? a : best)
  }

  function getAttemptCount(testId: string) {
    return attempts.filter(a => a.test_id === testId).length
  }

  if (authLoading || loading) return <Loader />

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

        :root {
          --blue-900: #0a1628;
          --blue-800: #0f2040;
          --blue-700: #163256;
          --blue-600: #1e4480;
          --blue-500: #2563b0;
          --blue-400: #3b82d4;
          --blue-300: #60a5e8;
          --blue-200: #93c5f8;
          --blue-100: #dbeafe;
          --blue-50:  #eff6ff;
          --accent:   #38bdf8;
          --accent2:  #0ea5e9;
          --gold:     #f59e0b;
          --surface:  #f0f6ff;
          --card:     #ffffff;
          --border:   #c7ddf8;
          --text:     #0f2040;
          --muted:    #5d7fa3;
          --subtle:   #8fb0d4;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }

        html, body { min-height: 100%; }

        .page {
          min-height: 100vh;
          background: var(--surface);
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
        }

        /* ── NAV ── */
        .nav {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1.5px solid var(--border);
          padding: 0 36px;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 12px rgba(37,99,176,0.06);
        }
        .nav-left { display: flex; align-items: center; gap: 12px; }
        .nav-logo {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--blue-500), var(--accent2));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          box-shadow: 0 4px 12px rgba(37,99,176,0.3);
        }
        .nav-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px; font-weight: 700;
          color: var(--blue-800);
          letter-spacing: -0.2px;
        }
        .nav-right { display: flex; align-items: center; gap: 10px; }
        .nav-avatar {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, var(--blue-500), var(--accent));
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 13px; font-weight: 800;
          box-shadow: 0 2px 8px rgba(37,99,176,0.3);
          flex-shrink: 0;
        }
        .nav-name { font-size: 13px; font-weight: 600; color: var(--muted); }
        .nav-btn {
          padding: 8px 14px;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 700;
          cursor: pointer;
          transition: all .15s;
          border: 1.5px solid var(--border);
          background: white;
          color: var(--muted);
        }
        .nav-btn:hover { background: var(--blue-50); border-color: var(--blue-300); color: var(--blue-600); }
        .nav-btn.blue {
          background: linear-gradient(135deg, var(--blue-500), var(--blue-400));
          color: #fff; border-color: transparent;
          box-shadow: 0 3px 10px rgba(37,99,176,0.3);
        }
        .nav-btn.blue:hover { background: linear-gradient(135deg, var(--blue-600), var(--blue-500)); }

        /* ── TABS ── */
        .tabs {
          background: white;
          border-bottom: 1.5px solid var(--border);
          padding: 0 36px;
          display: flex; gap: 2px;
        }
        .tab {
          padding: 0 18px; height: 46px;
          border: none; background: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          color: var(--subtle);
          cursor: pointer;
          border-bottom: 2.5px solid transparent;
          transition: all .15s;
        }
        .tab.active { color: var(--blue-500); border-bottom-color: var(--blue-500); }
        .tab:hover:not(.active) { color: var(--muted); }

        /* ── HERO ── */
        .hero {
          background: linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 50%, #112244 100%);
          padding: 60px 36px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(circle at 15% 50%, rgba(56,189,248,0.08) 0%, transparent 55%),
            radial-gradient(circle at 85% 20%, rgba(37,99,176,0.15) 0%, transparent 50%);
        }
        .hero::after {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .hero-inner { position: relative; z-index: 1; }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 10px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 3px;
          color: var(--accent);
          background: rgba(56,189,248,0.1);
          border: 1px solid rgba(56,189,248,0.2);
          padding: 5px 14px; border-radius: 100px;
          margin-bottom: 16px;
        }
        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: 34px; font-weight: 700;
          color: #fff; margin-bottom: 12px;
          line-height: 1.25;
          letter-spacing: -0.5px;
        }
        .hero-title em { font-style: italic; color: var(--accent); }
        .hero-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          max-width: 460px; margin: 0 auto;
          line-height: 1.75; font-weight: 400;
        }
        .hero-stats {
          display: flex; justify-content: center;
          gap: 14px; margin-top: 32px;
          flex-wrap: wrap;
        }
        .hstat {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 14px 22px;
          transition: all .2s;
        }
        .hstat:hover {
          background: rgba(56,189,248,0.08);
          border-color: rgba(56,189,248,0.25);
          transform: translateY(-2px);
        }
        .hstat-n {
          font-family: 'JetBrains Mono', monospace;
          font-size: 22px; font-weight: 600;
          color: #fff; line-height: 1;
        }
        .hstat-l {
          font-size: 9px; text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.35);
          margin-top: 4px; font-weight: 700;
        }

        /* ── CONTENT ── */
        .content { max-width: 900px; margin: 0 auto; padding: 36px 24px; }
        .section-hd {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 20px;
        }
        .section-title {
          font-size: 10px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 2px;
          color: var(--subtle);
        }
        .section-count {
          font-size: 12px; font-weight: 700;
          color: var(--blue-300);
          background: var(--blue-50);
          border: 1px solid var(--border);
          padding: 3px 10px; border-radius: 100px;
        }

        /* ── TEST GRID ── */
        .test-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
          gap: 16px;
        }
        .test-card {
          background: white;
          border: 1.5px solid var(--border);
          border-radius: 20px;
          padding: 22px;
          cursor: pointer;
          transition: all .22s cubic-bezier(.4,0,.2,1);
          animation: fadeUp .35s ease both;
          display: flex; flex-direction: column; gap: 14px;
          position: relative; overflow: hidden;
        }
        .test-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--blue-400), var(--accent));
          opacity: 0; transition: opacity .2s;
          border-radius: 20px 20px 0 0;
        }
        .test-card:hover {
          border-color: var(--blue-300);
          box-shadow: 0 8px 32px rgba(37,99,176,0.14);
          transform: translateY(-3px);
        }
        .test-card:hover::before { opacity: 1; }
        .test-card.attempted { border-color: #bdd9f8; }

        .tc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .tc-icon {
          width: 42px; height: 42px;
          background: linear-gradient(135deg, var(--blue-50), #dbeafe);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 19px; flex-shrink: 0;
        }
        .tc-title {
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 600;
          line-height: 1.35; color: var(--blue-900);
        }
        .tc-num { font-size: 11px; color: var(--subtle); font-weight: 500; margin-top: 3px; }
        .tc-badge {
          font-size: 10px; font-weight: 800;
          padding: 3px 9px; border-radius: 6px; flex-shrink: 0;
          text-transform: uppercase; letter-spacing: .5px;
        }
        .tc-badge.new { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
        .tc-badge.done { background: var(--blue-50); color: var(--blue-600); border: 1px solid var(--blue-200); }

        .tc-info { display: flex; gap: 10px; flex-wrap: wrap; }
        .tc-info-item {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: var(--muted); font-weight: 600;
          background: var(--surface);
          padding: 4px 9px; border-radius: 6px;
          border: 1px solid var(--border);
        }

        /* ── SUBJECT TAGS ── */
        .subj-dots { display: flex; gap: 5px; flex-wrap: wrap; }
        .sdot {
          font-size: 9px; font-weight: 800;
          padding: 3px 8px; border-radius: 5px;
          text-transform: uppercase; letter-spacing: .5px;
        }

        /* ── SCORE BAR ── */
        .score-section {}
        .score-label {
          display: flex; justify-content: space-between;
          font-size: 11px; font-weight: 700; margin-bottom: 6px;
        }
        .score-label-left { color: var(--muted); }
        .score-label-right {
          font-family: 'JetBrains Mono', monospace;
          color: var(--blue-500);
        }
        .score-track {
          height: 5px; background: var(--blue-100);
          border-radius: 3px; overflow: hidden;
        }
        .score-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--blue-500), var(--accent));
          border-radius: 3px; transition: width .5s ease;
        }

        /* ── FOOTER ── */
        .tc-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 12px; border-top: 1px solid #e8f0fb;
        }
        .tc-attempts { font-size: 11px; color: var(--subtle); font-weight: 600; }
        .start-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 16px;
          background: linear-gradient(135deg, var(--blue-500), var(--blue-400));
          border: none; border-radius: 9px;
          color: #fff;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 800;
          cursor: pointer; transition: all .15s;
          box-shadow: 0 3px 10px rgba(37,99,176,0.3);
        }
        .start-btn:hover {
          background: linear-gradient(135deg, var(--blue-600), var(--blue-500));
          box-shadow: 0 4px 16px rgba(37,99,176,0.4);
          transform: translateY(-1px);
        }
        .retry-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 16px;
          background: white;
          border: 1.5px solid var(--border);
          border-radius: 9px; color: var(--muted);
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700;
          cursor: pointer; transition: all .15s;
        }
        .retry-btn:hover {
          background: var(--blue-50);
          border-color: var(--blue-300);
          color: var(--blue-600);
        }

        /* ── EMPTY ── */
        .empty { text-align: center; padding: 80px 24px; }
        .empty-icon { font-size: 52px; margin-bottom: 16px; }
        .empty-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 700;
          margin-bottom: 8px; color: var(--blue-800);
        }
        .empty-sub { font-size: 14px; color: var(--subtle); }
      `}</style>

      <div className="page">
        {/* NAV */}
        <div className="nav">
          <div className="nav-left">
            <div className="nav-logo">🎓</div>
            <div className="nav-title">JEE Platform</div>
          </div>
          <div className="nav-right">
            <div className="nav-avatar">{profile?.full_name?.[0]?.toUpperCase() ?? "S"}</div>
            <span className="nav-name">{profile?.full_name ?? "Student"}</span>
            {profile?.role === "admin" && (
              <button className="nav-btn blue" onClick={() => router.push("/admin")}>⚙ Admin</button>
            )}
            <button className="nav-btn" onClick={() => router.push("/history")}>📊 History</button>
            <button className="nav-btn" onClick={signOut}>Sign Out</button>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          <button className="tab active">📋 Tests</button>
          <button className="tab" onClick={() => router.push("/history")}>📊 My History</button>
          {profile?.role === "admin" && (
            <button className="tab" onClick={() => router.push("/admin")}>⚙ Admin</button>
          )}
        </div>

        {/* HERO */}
        <div className="hero">
          <div className="hero-inner">
            <div className="hero-eyebrow">✦ JEE Mains Preparation</div>
            <div className="hero-title">
              Welcome back, <em>{profile?.full_name?.split(" ")[0] ?? "Student"}</em> 👋
            </div>
            <div className="hero-sub">
              Practice with full-length mock tests. Each test has 75 questions across Physics, Chemistry &amp; Maths.
            </div>
            <div className="hero-stats">
              <div className="hstat">
                <div className="hstat-n">{tests.length}</div>
                <div className="hstat-l">Live Tests</div>
              </div>
              <div className="hstat">
                <div className="hstat-n">{attempts.length}</div>
                <div className="hstat-l">Attempts</div>
              </div>
              <div className="hstat">
                <div className="hstat-n">{attempts.length ? Math.max(...attempts.map(a => a.score)) : 0}</div>
                <div className="hstat-l">Best Score</div>
              </div>
              <div className="hstat">
                <div className="hstat-n">3h</div>
                <div className="hstat-l">Per Test</div>
              </div>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="section-hd">
            <div className="section-title">Available Tests</div>
            <div className="section-count">{tests.length} tests</div>
          </div>

          {tests.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <div className="empty-title">No tests available</div>
              <div className="empty-sub">Check back soon — tests will appear here when published.</div>
            </div>
          ) : (
            <div className="test-grid">
              {tests.map((test, idx) => {
                const best = getBestAttempt(test.id)
                const attemptCount = getAttemptCount(test.id)
                const pct = best ? Math.round((best.score / (best.max_score || 300)) * 100) : 0

                return (
                  <div
                    key={test.id}
                    className={`test-card ${best ? "attempted" : ""}`}
                    style={{ animationDelay: `${idx * 0.06}s` }}
                    onClick={() => router.push(`/test/${test.id}`)}
                  >
                    <div className="tc-header">
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div className="tc-icon">📝</div>
                        <div>
                          <div className="tc-title">{test.title.replace(/_/g, " ")}</div>
                          <div className="tc-num">75 questions · 3 subjects</div>
                        </div>
                      </div>
                      <span className={`tc-badge ${best ? "done" : "new"}`}>
                        {best ? "✓ Done" : "New"}
                      </span>
                    </div>

                    <div className="subj-dots">
                      {[
                        ["⚡", "Physics",   "#dbeafe", "#1e4480", "#bdd9f8"],
                        ["🧪", "Chemistry", "#e0f2fe", "#0369a1", "#bae6fd"],
                        ["∑",  "Maths",     "#ede9fe", "#5b21b6", "#c4b5fd"],
                      ].map(([e, l, bg, c, bd]) => (
                        <span
                          key={l as string}
                          className="sdot"
                          style={{ background: bg as string, color: c as string, border: `1px solid ${bd}` }}
                        >
                          {e} {l}
                        </span>
                      ))}
                    </div>

                    <div className="tc-info">
                      <div className="tc-info-item">⏱ {test.duration_minutes} min</div>
                      <div className="tc-info-item">📊 +4 / −1</div>
                      <div className="tc-info-item">🎯 300 marks</div>
                    </div>

                    {best && (
                      <div className="score-section">
                        <div className="score-label">
                          <span className="score-label-left">Best score</span>
                          <span className="score-label-right">{best.score} / {best.max_score || 300} ({pct}%)</span>
                        </div>
                        <div className="score-track">
                          <div className="score-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="tc-footer" onClick={e => e.stopPropagation()}>
                      <div className="tc-attempts">
                        {attemptCount > 0 ? `${attemptCount} attempt${attemptCount > 1 ? "s" : ""}` : "Not attempted"}
                      </div>
                      {best
                        ? <button className="retry-btn" onClick={() => router.push(`/test/${test.id}`)}>🔄 Retake</button>
                        : <button className="start-btn" onClick={() => router.push(`/test/${test.id}`)}>Start →</button>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Loader() {
  return (
    <div style={{ minHeight: "100vh", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ textAlign: "center", fontFamily: "sans-serif", color: "#5d7fa3" }}>
        <div style={{
          width: 38, height: 38,
          border: "3px solid #bdd9f8",
          borderTopColor: "#2563b0",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 14px"
        }} />
        Loading…
      </div>
    </div>
  )
}