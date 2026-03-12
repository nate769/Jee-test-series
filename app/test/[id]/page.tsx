"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function TestPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [test, setTest] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<any>({})
  const [reviewQuestions, setReviewQuestions] = useState<any>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchTest(); fetchQuestions() }, [])

  async function fetchTest() {
    const { data } = await supabase.from("tests").select("*").eq("id", id).single()
    setTest(data)
    setTimeLeft(data.duration_minutes * 60)
  }

  async function fetchQuestions() {
    const { data } = await supabase
      .from("test_questions")
      .select(`questions(id, question_text, marks, negative_marks, options(id, option_text))`)
      .eq("test_id", id)
    setQuestions(data || [])
  }

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const isUrgent = timeLeft <= 300

  function handleSelect(questionId: string, optionId: string) {
    setSelectedAnswers((prev: any) => ({ ...prev, [questionId]: optionId }))
  }

  function toggleReview(questionId: string) {
    setReviewQuestions((prev: any) => ({ ...prev, [questionId]: !prev[questionId] }))
  }

  function clearResponse(questionId: string) {
    setSelectedAnswers((prev: any) => { const copy = { ...prev }; delete copy[questionId]; return copy })
  }

  async function submitTest() {
    setSubmitting(true)
    try {
      // Get current logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        alert("You are not logged in. Please sign in and try again.")
        setSubmitting(false)
        return
      }

      // Insert attempt with user_id and start_time
      const { data: attempt, error: attemptError } = await supabase
        .from("attempts")
        .insert({
          test_id:    id,
          user_id:    user.id,
          start_time: new Date().toISOString(),
        })
        .select()
        .single()

      if (attemptError) {
        console.error("❌ attempts insert error:", attemptError)
        alert(`Submit failed (attempts):\n${attemptError.message}\n\nCode: ${attemptError.code}\nHint: ${attemptError.hint ?? "none"}`)
        setSubmitting(false)
        return
      }

      // Build and insert answer rows
      const answerRows = questions
        .filter(q => q.questions?.id)
        .map(q => ({
          attempt_id:         attempt.id,
          question_id:        q.questions.id,
          selected_option_id: selectedAnswers[q.questions.id] ?? null,
        }))

      const { error: answersError } = await supabase.from("answers").insert(answerRows)

      if (answersError) {
        console.error("❌ answers insert error:", answersError)
        await supabase.from("attempts").delete().eq("id", attempt.id)
        alert(`Submit failed (answers):\n${answersError.message}\n\nCode: ${answersError.code}`)
        setSubmitting(false)
        return
      }

      // Compute score from answers and save back to attempt row
      const { data: scoredAnswers } = await supabase
        .from("answers")
        .select(`selected_option_id, options(is_correct), questions(marks, negative_marks)`)
        .eq("attempt_id", attempt.id)

      if (scoredAnswers) {
        let correct = 0, wrong = 0, score = 0
        scoredAnswers.forEach((a: any) => {
          if (!a.selected_option_id) return
          if (a.options?.is_correct) { correct++; score += (a.questions?.marks ?? 4) }
          else                       { wrong++;   score += (a.questions?.negative_marks ?? -1) }
        })
        await supabase.from("attempts").update({
          end_time:        new Date().toISOString(),
          score,
          max_score:       scoredAnswers.length * 4,
          total_correct:   correct,
          total_wrong:     wrong,
          total_attempted: correct + wrong,
          completed_at:    new Date().toISOString(),
        }).eq("id", attempt.id)
      }

      setSubmitted(true)
      setShowSubmitModal(false)
      router.push(`/result/${attempt.id}`)
    } catch (err: any) {
      console.error("❌ submitTest unexpected error:", err)
      alert(`Unexpected error: ${err?.message ?? JSON.stringify(err)}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!test || questions.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf8f4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap'); @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center", fontFamily: "Nunito, sans-serif", color: "#9e9589" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #ddd5c8", borderTopColor: "#5c7c4a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          Loading test…
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion].questions
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const answeredCount = Object.keys(selectedAnswers).length
  const reviewCount = Object.values(reviewQuestions).filter(Boolean).length
  const totalQ = questions.length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }

        .test { min-height: 100vh; background: #faf8f4; font-family: 'Nunito', sans-serif; color: #2d2a24; display: flex; flex-direction: column; }

        /* TOP BAR */
        .topbar { position: sticky; top: 0; z-index: 50; background: rgba(250,248,244,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #ddd5c8; padding: 0 28px; height: 62px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }

        .tb-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .tb-logo { width: 34px; height: 34px; background: #eef3ea; border: 2px solid #c4d4b8; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .tb-title { font-family: 'Lora', serif; font-size: 15px; font-weight: 700; color: #2d2a24; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tb-sub { font-size: 12px; color: #9e9589; margin-top: 1px; }

        .tb-timer { display: flex; align-items: center; gap: 8px; background: #fff; border: 1.5px solid #ddd5c8; border-radius: 10px; padding: 8px 16px; flex-shrink: 0; }
        .timer-val { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 600; transition: color 0.3s; }
        .timer-val.ok { color: #5c7c4a; }
        .timer-val.urgent { color: #b85c3a; animation: pulse 1s ease-in-out infinite; }
        .timer-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9e9589; align-self: flex-end; padding-bottom: 1px; }

        .tb-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .prog-wrap { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #9e9589; font-weight: 600; }
        .prog-bg { width: 100px; height: 5px; background: #ece7de; border-radius: 5px; overflow: hidden; }
        .prog-fill { height: 100%; background: #5c7c4a; border-radius: 5px; transition: width 0.4s; }

        .submit-top-btn { background: #5c7c4a; border: none; border-radius: 9px; padding: 9px 18px; font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 800; color: #fff; cursor: pointer; transition: all 0.15s; box-shadow: 0 2px 8px rgba(92,124,74,0.2); }
        .submit-top-btn:hover { background: #4e6b3e; transform: translateY(-1px); }

        /* LAYOUT */
        .layout { display: flex; flex: 1; overflow: hidden; height: calc(100vh - 62px); }

        /* LEFT */
        .left-panel { flex: 1; overflow-y: auto; padding: 28px; scrollbar-width: thin; scrollbar-color: #ddd5c8 transparent; }

        .q-card { background: #fff; border: 1.5px solid #ddd5c8; border-radius: 20px; padding: 32px; max-width: 780px; margin: 0 auto; box-shadow: 0 2px 12px rgba(45,42,36,0.05); }

        .q-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .q-num { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #9e9589; }
        .marks-badges { display: flex; gap: 8px; }
        .mbadge { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; }
        .mbadge.pos { background: #eef3ea; border: 1px solid #c4d4b8; color: #5c7c4a; }
        .mbadge.neg { background: #fdf0ec; border: 1px solid #e8b5a4; color: #b85c3a; }

        .q-text { font-family: 'Lora', serif; font-size: 18px; font-weight: 400; line-height: 1.75; color: #2d2a24; margin-bottom: 28px; }
        .q-divider { height: 1px; background: #ece7de; margin-bottom: 24px; }

        /* OPTIONS */
        .options { display: flex; flex-direction: column; gap: 10px; }

        .opt-btn { width: 100%; display: flex; align-items: center; gap: 14px; padding: 15px 18px; border-radius: 13px; border: 1.5px solid #ddd5c8; background: #faf8f4; cursor: pointer; text-align: left; font-family: 'Nunito', sans-serif; font-size: 15px; color: #2d2a24; transition: all 0.16s; }
        .opt-btn:hover:not(.sel) { border-color: #7a9e65; background: #f4f9f1; transform: translateX(2px); }
        .opt-btn.sel { border-color: #5c7c4a; background: #eef3ea; color: #2d2a24; box-shadow: 0 2px 10px rgba(92,124,74,0.12); }

        .opt-alpha { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; transition: all 0.16s; background: #fff; border: 1.5px solid #ddd5c8; color: #9e9589; }
        .opt-btn.sel .opt-alpha { background: #5c7c4a; border-color: #5c7c4a; color: #fff; }

        /* ACTIONS */
        .actions { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; }

        .act-btn { display: flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 9px; font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s; }
        .act-btn.review { background: #fdf3e7; border-color: #e8c99a; color: #c17f3a; }
        .act-btn.review:hover, .act-btn.review.active { background: #f9e8cc; border-color: #c17f3a; }
        .act-btn.clear { background: #faf8f4; border-color: #ddd5c8; color: #9e9589; }
        .act-btn.clear:hover { background: #f4f0e8; color: #6b6358; }

        /* NAV */
        .nav-row { display: flex; justify-content: space-between; margin-top: 32px; padding-top: 22px; border-top: 1px solid #ece7de; }

        .nav-btn { display: flex; align-items: center; gap: 7px; padding: 11px 20px; border-radius: 11px; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: all 0.16s; }
        .nav-btn.prev { background: #faf8f4; color: #6b6358; border: 1.5px solid #ddd5c8; }
        .nav-btn.prev:hover:not(:disabled) { background: #f4f0e8; color: #2d2a24; }
        .nav-btn.prev:disabled { opacity: 0.35; cursor: not-allowed; }
        .nav-btn.next { background: #5c7c4a; color: #fff; box-shadow: 0 3px 10px rgba(92,124,74,0.2); }
        .nav-btn.next:hover:not(:disabled) { background: #4e6b3e; transform: translateY(-1px); }
        .nav-btn.next:disabled { opacity: 0.35; cursor: not-allowed; }

        /* RIGHT PANEL */
        .right-panel { width: 266px; flex-shrink: 0; background: #fff; border-left: 1px solid #ddd5c8; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #ddd5c8 transparent; }

        .pal-header { padding: 18px 18px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.8px; color: #9e9589; }

        .stats-mini { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 14px 18px; }
        .stat-box { background: #faf8f4; border: 1px solid #ece7de; border-radius: 10px; padding: 10px 8px; text-align: center; }
        .stat-n { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 600; }
        .stat-l { font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: #9e9589; margin-top: 3px; font-weight: 700; }

        .legend { display: flex; flex-direction: column; gap: 6px; padding: 0 18px 14px; }
        .leg { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b6358; }
        .leg-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }

        .pal-div { height: 1px; background: #ece7de; margin: 0 18px 14px; }
        .pal-lbl { padding: 0 18px 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #c4bdb4; }

        .pal-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; padding: 0 18px 24px; }

        .pal-btn { aspect-ratio: 1; border-radius: 9px; border: 1.5px solid transparent; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
        .pal-btn.unanswered { background: #faf8f4; border-color: #ddd5c8; color: #9e9589; }
        .pal-btn.answered { background: #eef3ea; border-color: #c4d4b8; color: #5c7c4a; }
        .pal-btn.review-only { background: #fdf3e7; border-color: #e8c99a; color: #c17f3a; }
        .pal-btn.ans-review { background: #eef3ea; border-color: #c17f3a; color: #5c7c4a; }
        .pal-btn.current { box-shadow: 0 0 0 2.5px #5c7c4a; }
        .pal-btn:hover { transform: scale(1.1); }

        /* SUBMITTED */
        .submitted-wrap { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; }
        .submitted-card { max-width: 440px; width: 100%; background: #fff; border: 1.5px solid #ddd5c8; border-radius: 22px; padding: 48px 40px; text-align: center; box-shadow: 0 4px 20px rgba(45,42,36,0.07); }
        .sub-icon { font-size: 52px; margin-bottom: 16px; }
        .sub-title { font-family: 'Lora', serif; font-size: 26px; font-weight: 700; color: #2d2a24; margin-bottom: 8px; }
        .sub-body { font-size: 15px; color: #9e9589; margin-bottom: 28px; line-height: 1.6; }
        .sub-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 28px; }
        .sub-stat { background: #faf8f4; border: 1px solid #ece7de; border-radius: 12px; padding: 14px 8px; }
        .sub-stat-n { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 600; }
        .sub-stat-l { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #9e9589; margin-top: 3px; font-weight: 700; }
        .back-btn { padding: 12px 24px; border-radius: 11px; background: #faf8f4; border: 1.5px solid #ddd5c8; color: #6b6358; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .back-btn:hover { background: #f4f0e8; color: #2d2a24; }

        /* MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(45,42,36,0.35); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }
        .modal { background: #fff; border: 1.5px solid #ddd5c8; border-radius: 22px; padding: 40px; width: 400px; box-shadow: 0 12px 40px rgba(45,42,36,0.14); animation: slideUp 0.25s ease; }
        .modal-icon { font-size: 40px; margin-bottom: 14px; }
        .modal-title { font-family: 'Lora', serif; font-size: 22px; font-weight: 700; color: #2d2a24; margin-bottom: 8px; }
        .modal-body { font-size: 14px; color: #6b6358; line-height: 1.6; margin-bottom: 22px; }
        .modal-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 24px; }
        .modal-stat { background: #faf8f4; border: 1px solid #ece7de; border-radius: 11px; padding: 13px 8px; text-align: center; }
        .modal-stat-n { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 600; }
        .modal-stat-l { font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: #9e9589; margin-top: 3px; font-weight: 700; }
        .modal-actions { display: flex; gap: 10px; }
        .modal-cancel { flex: 1; padding: 13px; border-radius: 11px; background: #faf8f4; border: 1.5px solid #ddd5c8; color: #6b6358; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .modal-cancel:hover { background: #f4f0e8; }
        .modal-confirm { flex: 1.5; padding: 13px; border-radius: 11px; background: #5c7c4a; border: none; color: #fff; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.15s; box-shadow: 0 3px 10px rgba(92,124,74,0.22); }
        .modal-confirm:hover:not(:disabled) { background: #4e6b3e; }
        .modal-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="test">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="tb-left">
            <div className="tb-logo">🌿</div>
            <div>
              <div className="tb-title">{test.title}</div>
              <div className="tb-sub">{totalQ} questions</div>
            </div>
          </div>
          <div className="tb-timer">
            <div className={`timer-val ${isUrgent ? "urgent" : "ok"}`}>
              {isUrgent && "⚠ "}{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <div className="timer-lbl">left</div>
          </div>
          <div className="tb-right">
            <div className="prog-wrap">
              <div className="prog-bg"><div className="prog-fill" style={{ width: `${(answeredCount / totalQ) * 100}%` }} /></div>
              <span>{answeredCount}/{totalQ}</span>
            </div>
            {!submitted && <button className="submit-top-btn" onClick={() => setShowSubmitModal(true)}>Submit</button>}
          </div>
        </div>

        {submitted ? (
          <div className="submitted-wrap">
            <div className="submitted-card">
              <div className="sub-icon">🌿</div>
              <div className="sub-title">Test submitted!</div>
              <div className="sub-body">Redirecting to your results… hang on!</div>
              <div className="sub-stats">
                <div className="sub-stat"><div className="sub-stat-n" style={{ color: "#5c7c4a" }}>{answeredCount}</div><div className="sub-stat-l">Answered</div></div>
                <div className="sub-stat"><div className="sub-stat-n" style={{ color: "#c17f3a" }}>{reviewCount}</div><div className="sub-stat-l">Reviewed</div></div>
                <div className="sub-stat"><div className="sub-stat-n" style={{ color: "#9e9589" }}>{totalQ - answeredCount}</div><div className="sub-stat-l">Skipped</div></div>
              </div>
              <button className="back-btn" onClick={() => router.push("/home")}>← Back to Home</button>
            </div>
          </div>
        ) : (
          <div className="layout">
            {/* LEFT PANEL */}
            <div className="left-panel">
              <div className="q-card">
                <div className="q-meta">
                  <div className="q-num">Question {currentQuestion + 1} of {totalQ}</div>
                  <div className="marks-badges">
                    {question.marks && <span className="mbadge pos">+{question.marks}</span>}
                    {question.negative_marks && <span className="mbadge neg">{question.negative_marks}</span>}
                  </div>
                </div>

                <div className="q-text">{question.question_text}</div>
                <div className="q-divider" />

                <div className="options">
                  {question.options.map((opt: any, i: number) => {
                    const sel = selectedAnswers[question.id] === opt.id
                    return (
                      <button key={opt.id} className={`opt-btn ${sel ? "sel" : ""}`} onClick={() => handleSelect(question.id, opt.id)}>
                        <div className="opt-alpha">{["A","B","C","D","E","F"][i]}</div>
                        <span>{opt.option_text}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="actions">
                  <button className={`act-btn review ${reviewQuestions[question.id] ? "active" : ""}`} onClick={() => toggleReview(question.id)}>
                    {reviewQuestions[question.id] ? "🔖 Marked" : "🔖 Mark for Review"}
                  </button>
                  <button className="act-btn clear" onClick={() => clearResponse(question.id)}>✕ Clear</button>
                </div>

                <div className="nav-row">
                  <button className="nav-btn prev" onClick={() => setCurrentQuestion(p => Math.max(p - 1, 0))} disabled={currentQuestion === 0}>← Previous</button>
                  <button className="nav-btn next" onClick={() => setCurrentQuestion(p => Math.min(p + 1, totalQ - 1))} disabled={currentQuestion === totalQ - 1}>Save & Next →</button>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="right-panel">
              <div className="pal-header">Question Palette</div>

              <div className="stats-mini">
                <div className="stat-box"><div className="stat-n" style={{ color: "#5c7c4a" }}>{answeredCount}</div><div className="stat-l">Done</div></div>
                <div className="stat-box"><div className="stat-n" style={{ color: "#c17f3a" }}>{reviewCount}</div><div className="stat-l">Review</div></div>
                <div className="stat-box"><div className="stat-n" style={{ color: "#9e9589" }}>{totalQ - answeredCount}</div><div className="stat-l">Left</div></div>
              </div>

              <div className="legend">
                <div className="leg"><div className="leg-dot" style={{ background: "#eef3ea", border: "1.5px solid #c4d4b8" }} />Answered</div>
                <div className="leg"><div className="leg-dot" style={{ background: "#fdf3e7", border: "1.5px solid #e8c99a" }} />Marked for Review</div>
                <div className="leg"><div className="leg-dot" style={{ background: "#faf8f4", border: "1.5px solid #ddd5c8" }} />Not Answered</div>
              </div>

              <div className="pal-div" />
              <div className="pal-lbl">Jump to</div>
              <div className="pal-grid">
                {questions.map((q, i) => {
                  const qd = q.questions
                  const answered = !!selectedAnswers[qd.id]
                  const review = !!reviewQuestions[qd.id]
                  let cls = "unanswered"
                  if (answered && review) cls = "ans-review"
                  else if (answered) cls = "answered"
                  else if (review) cls = "review-only"
                  return (
                    <button key={qd.id} className={`pal-btn ${cls} ${i === currentQuestion ? "current" : ""}`} onClick={() => setCurrentQuestion(i)}>
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL */}
        {showSubmitModal && (
          <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-icon">📋</div>
              <div className="modal-title">Submit test?</div>
              <div className="modal-body">Once submitted you won't be able to change your answers.</div>
              <div className="modal-stats">
                <div className="modal-stat"><div className="modal-stat-n" style={{ color: "#5c7c4a" }}>{answeredCount}</div><div className="modal-stat-l">Answered</div></div>
                <div className="modal-stat"><div className="modal-stat-n" style={{ color: "#c17f3a" }}>{reviewCount}</div><div className="modal-stat-l">Review</div></div>
                <div className="modal-stat"><div className="modal-stat-n" style={{ color: "#9e9589" }}>{totalQ - answeredCount}</div><div className="modal-stat-l">Skipped</div></div>
              </div>
              <div className="modal-actions">
                <button className="modal-cancel" onClick={() => setShowSubmitModal(false)}>Go Back</button>
                <button className="modal-confirm" onClick={submitTest} disabled={submitting}>{submitting ? "Saving…" : "Submit Now 🌿"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}