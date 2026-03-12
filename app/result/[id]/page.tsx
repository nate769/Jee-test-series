"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

export default function ResultPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchResults = async () => {
      const { data } = await supabase
        .from("answers")
        .select(`question_id, selected_option_id, options(is_correct)`)
        .eq("attempt_id", id)

      let correct = 0, wrong = 0, skipped = 0
      data?.forEach((row: any) => {
        if (!row.selected_option_id) skipped++
        else if (row.options?.is_correct) correct++
        else wrong++
      })

      const total = data?.length || 0
      const attempted = correct + wrong
      const accuracy = attempted > 0 ? ((correct / attempted) * 100).toFixed(1) : "0.0"
      const score = correct * 4 + wrong * -1
      const maxScore = total * 4
      setStats({ correct, wrong, skipped, total, attempted, accuracy, score, maxScore })
    }
    fetchResults()
  }, [id])

  if (!stats) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf8f4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap'); @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center", fontFamily: "Nunito, sans-serif", color: "#9e9589" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #ddd5c8", borderTopColor: "#5c7c4a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          Loading results…
        </div>
      </div>
    )
  }

  const scorePercent = stats.maxScore > 0 ? (stats.score / stats.maxScore) * 100 : 0
  const grade =
    scorePercent >= 85 ? { label: "Excellent! 🏆", color: "#5c7c4a", bg: "#eef3ea", border: "#c4d4b8" }
    : scorePercent >= 65 ? { label: "Great work! 🎯", color: "#4a7c59", bg: "#eef3ea", border: "#c4d4b8" }
    : scorePercent >= 45 ? { label: "Good effort! 📈", color: "#c17f3a", bg: "#fdf3e7", border: "#e8c99a" }
    : { label: "Keep going! 💪", color: "#b85c3a", bg: "#fdf0ec", border: "#e8b5a4" }

  const chartData = [
    { name: "Correct", value: stats.correct, color: "#5c7c4a" },
    { name: "Wrong", value: stats.wrong, color: "#b85c3a" },
    { name: "Skipped", value: stats.skipped, color: "#ddd5c8" },
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const d = payload[0].payload
      return (
        <div style={{ background: "#fff", border: "1.5px solid #ddd5c8", borderRadius: 10, padding: "9px 14px", fontFamily: "Nunito, sans-serif", fontSize: 13, boxShadow: "0 4px 12px rgba(45,42,36,0.1)" }}>
          <span style={{ color: d.color, fontWeight: 700 }}>{d.name}</span>
          <span style={{ color: "#9e9589", marginLeft: 8 }}>{d.value} questions</span>
        </div>
      )
    }
    return null
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes growBar { from { width: 0 } }

        .result { min-height: 100vh; background: #faf8f4; font-family: 'Nunito', sans-serif; color: #2d2a24; }

        /* NAV */
        .nav { position: sticky; top: 0; z-index: 50; background: rgba(250,248,244,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #ddd5c8; padding: 0 40px; height: 62px; display: flex; align-items: center; justify-content: space-between; }
        .nav-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .nav-logo { width: 34px; height: 34px; background: #eef3ea; border: 2px solid #c4d4b8; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .nav-title { font-family: 'Lora', serif; font-size: 16px; font-weight: 700; color: #2d2a24; }
        .nav-home-btn { background: #faf8f4; border: 1.5px solid #ddd5c8; border-radius: 9px; padding: 8px 16px; font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 700; color: #6b6358; cursor: pointer; transition: all 0.15s; }
        .nav-home-btn:hover { background: #f4f0e8; color: #2d2a24; }

        /* CONTENT */
        .content { max-width: 820px; margin: 0 auto; padding: 48px 40px 80px; display: flex; flex-direction: column; gap: 22px; }

        /* HEADER */
        .page-header { text-align: center; animation: fadeUp 0.5s ease; }
        .page-emoji { font-size: 52px; margin-bottom: 12px; display: block; }
        .page-title { font-family: 'Lora', serif; font-size: 34px; font-weight: 700; color: #2d2a24; letter-spacing: -0.5px; margin-bottom: 8px; }
        .page-sub { font-size: 15px; color: #9e9589; }

        /* SCORE HERO */
        .score-card { background: #fff; border: 1.5px solid #ddd5c8; border-radius: 22px; padding: 36px; box-shadow: 0 3px 14px rgba(45,42,36,0.06); position: relative; overflow: hidden; animation: fadeUp 0.5s 0.05s ease both; }
        .score-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #5c7c4a, #7a9e65, #c17f3a); }

        .score-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 28px; flex-wrap: wrap; }
        .score-lbl { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #9e9589; margin-bottom: 8px; }
        .score-num { font-family: 'JetBrains Mono', monospace; font-size: 60px; font-weight: 600; color: #2d2a24; line-height: 1; }
        .score-max { font-size: 20px; color: #c4bdb4; }
        .grade-chip { display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 800; margin-top: 10px; width: fit-content; }

        .score-right { text-align: right; }
        .accuracy-num { font-family: 'JetBrains Mono', monospace; font-size: 38px; font-weight: 600; color: #2d2a24; }
        .accuracy-lbl { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #9e9589; margin-top: 4px; }

        .score-bar-lbl { display: flex; justify-content: space-between; font-size: 12px; color: #9e9589; font-weight: 600; margin-bottom: 6px; }
        .score-bar-bg { height: 8px; background: #ece7de; border-radius: 8px; overflow: hidden; }
        .score-bar-fill { height: 100%; background: linear-gradient(90deg, #5c7c4a, #7a9e65); border-radius: 8px; animation: growBar 1s ease; }

        /* STAT GRID */
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; animation: fadeUp 0.5s 0.1s ease both; }
        .stat-card { background: #fff; border: 1.5px solid #ddd5c8; border-radius: 16px; padding: 20px 16px; box-shadow: 0 2px 8px rgba(45,42,36,0.04); transition: box-shadow 0.2s; }
        .stat-card:hover { box-shadow: 0 4px 16px rgba(45,42,36,0.08); }
        .stat-icon { font-size: 20px; margin-bottom: 8px; }
        .stat-val { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 600; line-height: 1; }
        .stat-name { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #9e9589; margin-top: 5px; }

        /* BOTTOM */
        .bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; animation: fadeUp 0.5s 0.15s ease both; }

        .panel { background: #fff; border: 1.5px solid #ddd5c8; border-radius: 18px; padding: 26px; box-shadow: 0 2px 8px rgba(45,42,36,0.04); }
        .panel-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #9e9589; margin-bottom: 18px; }

        .chart-legend { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
        .leg-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
        .leg-left { display: flex; align-items: center; gap: 8px; color: #6b6358; }
        .leg-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
        .leg-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; }

        .breakdown { display: flex; flex-direction: column; gap: 16px; }
        .brow { display: flex; flex-direction: column; gap: 6px; }
        .brow-meta { display: flex; justify-content: space-between; font-size: 13px; }
        .brow-name { color: #6b6358; font-weight: 600; }
        .brow-frac { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #9e9589; }
        .brow-bg { height: 7px; background: #ece7de; border-radius: 7px; overflow: hidden; }
        .brow-fill { height: 100%; border-radius: 7px; animation: growBar 1.1s ease; }

        .jee-panel { background: #faf8f4; border: 1px solid #ece7de; border-radius: 12px; padding: 14px 16px; margin-top: 16px; }
        .jee-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #9e9589; margin-bottom: 10px; }
        .jee-row { display: flex; gap: 20px; }
        .jee-item { font-size: 13px; display: flex; align-items: center; gap: 6px; }
        .jee-num { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 15px; }

        /* CTA */
        .cta { display: flex; gap: 12px; justify-content: center; margin-top: 8px; animation: fadeUp 0.5s 0.2s ease both; }
        .cta-primary { padding: 14px 30px; border-radius: 12px; background: #5c7c4a; border: none; font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 800; color: #fff; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 12px rgba(92,124,74,0.2); }
        .cta-primary:hover { background: #4e6b3e; transform: translateY(-1px); }
        .cta-secondary { padding: 14px 30px; border-radius: 12px; background: #fff; border: 1.5px solid #ddd5c8; font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 700; color: #6b6358; cursor: pointer; transition: all 0.18s; }
        .cta-secondary:hover { background: #f4f0e8; color: #2d2a24; }

        @media (max-width: 640px) { .stat-grid { grid-template-columns: 1fr 1fr; } .bottom { grid-template-columns: 1fr; } .score-top { flex-direction: column; } .score-right { text-align: left; } }
      `}</style>

      <div className="result">
        <nav className="nav">
          <div className="nav-brand" onClick={() => router.push("/home")}>
            <div className="nav-logo">🌿</div>
            <span className="nav-title">JEE Test Series</span>
          </div>
          <button className="nav-home-btn" onClick={() => router.push("/home")}>← Home</button>
        </nav>

        <div className="content">
          {/* HEADER */}
          <div className="page-header">
            <span className="page-emoji">{grade.label.split(" ")[0]}</span>
            <div className="page-title">Test Complete</div>
            <div className="page-sub">Here's how you did — every attempt makes you sharper 🌱</div>
          </div>

          {/* SCORE CARD */}
          <div className="score-card">
            <div className="score-top">
              <div>
                <div className="score-lbl">Your Score</div>
                <div className="score-num">{stats.score}<span className="score-max"> / {stats.maxScore}</span></div>
                <div className="grade-chip" style={{ background: grade.bg, border: `1.5px solid ${grade.border}`, color: grade.color }}>
                  {grade.label}
                </div>
              </div>
              <div className="score-right">
                <div className="accuracy-lbl">Accuracy</div>
                <div className="accuracy-num">{stats.accuracy}%</div>
              </div>
            </div>
            <div className="score-bar-lbl">
              <span>Score progress</span>
              <span>{Math.max(0, scorePercent).toFixed(1)}%</span>
            </div>
            <div className="score-bar-bg">
              <div className="score-bar-fill" style={{ width: `${Math.max(0, scorePercent)}%` }} />
            </div>
          </div>

          {/* STAT GRID */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-val" style={{ color: "#2d2a24" }}>{stats.total}</div>
              <div className="stat-name">Total</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-val" style={{ color: "#5c7c4a" }}>{stats.correct}</div>
              <div className="stat-name">Correct</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">❌</div>
              <div className="stat-val" style={{ color: "#b85c3a" }}>{stats.wrong}</div>
              <div className="stat-name">Wrong</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏭</div>
              <div className="stat-val" style={{ color: "#9e9589" }}>{stats.skipped}</div>
              <div className="stat-name">Skipped</div>
            </div>
          </div>

          {/* BOTTOM */}
          <div className="bottom">
            <div className="panel">
              <div className="panel-title">Distribution</div>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={chartData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" strokeWidth={0} paddingAngle={3}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {chartData.map(d => (
                  <div key={d.name} className="leg-row">
                    <div className="leg-left"><div className="leg-dot" style={{ background: d.color }} />{d.name}</div>
                    <span className="leg-val" style={{ color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">Breakdown</div>
              <div className="breakdown">
                {[
                  { name: "Correct", val: stats.correct, color: "#5c7c4a" },
                  { name: "Wrong", val: stats.wrong, color: "#b85c3a" },
                  { name: "Skipped", val: stats.skipped, color: "#c4bdb4" },
                ].map(r => (
                  <div key={r.name} className="brow">
                    <div className="brow-meta">
                      <span className="brow-name">{r.name}</span>
                      <span className="brow-frac">{r.val}/{stats.total}</span>
                    </div>
                    <div className="brow-bg">
                      <div className="brow-fill" style={{ width: `${stats.total > 0 ? (r.val / stats.total) * 100 : 0}%`, background: r.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="jee-panel">
                <div className="jee-title">JEE Scoring</div>
                <div className="jee-row">
                  <div className="jee-item"><span className="jee-num" style={{ color: "#5c7c4a" }}>+{stats.correct * 4}</span><span style={{ color: "#9e9589" }}>earned</span></div>
                  <div className="jee-item"><span className="jee-num" style={{ color: "#b85c3a" }}>{stats.wrong * -1}</span><span style={{ color: "#9e9589" }}>penalty</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="cta">
            <button className="cta-secondary" onClick={() => router.push("/home")}>← Back to Home</button>
            <button className="cta-primary" onClick={() => router.push(`/test/${id}`)}>Try Again 🌱</button>
          </div>
        </div>
      </div>
    </>
  )
}