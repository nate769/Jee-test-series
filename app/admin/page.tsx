"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Option = { id?: string; option_text: string; is_correct: boolean }
type Question = {
  id: string
  question_text: string
  subject: string
  question_type: string
  marks: number
  negative_marks: number
  correct_answer?: string
  options: Option[]
}

const LABELS = ["A", "B", "C", "D", "E", "F"]
const SUBJECTS = ["physics", "chemistry", "maths"]

export default function AdminPage() {
  const [tests, setTests] = useState<any[]>([])
  const [selectedTest, setSelectedTest] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [filterSubject, setFilterSubject] = useState("all")
  const [view, setView] = useState<"list" | "add" | "edit">("list")
  const [editingQ, setEditingQ] = useState<Question | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchText, setSearchText] = useState("")

  // Form state
  const [questionText, setQuestionText] = useState("")
  const [subject, setSubject] = useState("physics")
  const [questionType, setQuestionType] = useState<"mcq" | "numerical">("mcq")
  const [marks, setMarks] = useState(4)
  const [negativeMarks, setNegativeMarks] = useState(-1)
  const [options, setOptions] = useState(["", "", "", ""])
  const [correctOption, setCorrectOption] = useState<number | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState("")

  useEffect(() => { fetchTests() }, [])
  useEffect(() => { if (selectedTest) fetchQuestions() }, [selectedTest])

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchTests = async () => {
    const { data } = await supabase.from("tests").select("*")
    setTests(data || [])
  }

  const fetchQuestions = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("test_questions")
      .select(`questions(id, question_text, subject, question_type, marks, negative_marks, correct_answer, options(id, option_text, is_correct))`)
      .eq("test_id", selectedTest)
    const qs = (data || []).map((r: any) => r.questions).filter(Boolean)
    setQuestions(qs)
    setLoading(false)
  }

  const resetForm = () => {
    setQuestionText("")
    setSubject("physics")
    setQuestionType("mcq")
    setMarks(4)
    setNegativeMarks(-1)
    setOptions(["", "", "", ""])
    setCorrectOption(null)
    setCorrectAnswer("")
  }

  const openAdd = () => { resetForm(); setEditingQ(null); setView("add") }

  const openEdit = (q: Question) => {
    setEditingQ(q)
    setQuestionText(q.question_text)
    setSubject(q.subject || "physics")
    setQuestionType((q.question_type as "mcq" | "numerical") || "mcq")
    setMarks(q.marks)
    setNegativeMarks(q.negative_marks)
    setCorrectAnswer(q.correct_answer || "")
    if (q.options?.length) {
      setOptions(q.options.map(o => o.option_text))
      const ci = q.options.findIndex(o => o.is_correct)
      setCorrectOption(ci >= 0 ? ci : null)
    } else {
      setOptions(["", "", "", ""])
      setCorrectOption(null)
    }
    setView("edit")
  }

  const saveQuestion = async () => {
    if (!selectedTest) { showToast("Select a test first", "error"); return }
    if (!questionText.trim()) { showToast("Question text cannot be empty", "error"); return }
    if (questionType === "mcq") {
      if (options.some(o => !o.trim())) { showToast("Fill all options", "error"); return }
      if (correctOption === null) { showToast("Select the correct option", "error"); return }
    } else {
      if (!correctAnswer.trim()) { showToast("Enter the correct numerical answer", "error"); return }
    }

    setLoading(true)
    try {
      const qData = {
        question_text: questionText,
        subject,
        question_type: questionType,
        marks,
        negative_marks: negativeMarks,
        correct_answer: questionType === "numerical" ? correctAnswer : null,
      }

      if (editingQ) {
        // UPDATE existing
        const { error } = await supabase.from("questions").update(qData).eq("id", editingQ.id)
        if (error) throw error

        if (questionType === "mcq") {
          // Delete old options and reinsert
          await supabase.from("options").delete().eq("question_id", editingQ.id)
          for (let i = 0; i < options.length; i++) {
            await supabase.from("options").insert({ question_id: editingQ.id, option_text: options[i], is_correct: i === correctOption })
          }
        }
        showToast("Question updated!", "success")
      } else {
        // INSERT new
        const { data: newQ, error: qErr } = await supabase.from("questions").insert(qData).select().single()
        if (qErr) throw qErr
        if (questionType === "mcq") {
          for (let i = 0; i < options.length; i++) {
            await supabase.from("options").insert({ question_id: newQ.id, option_text: options[i], is_correct: i === correctOption })
          }
        }
        await supabase.from("test_questions").insert({ test_id: selectedTest, question_id: newQ.id })
        showToast("Question added!", "success")
      }

      await fetchQuestions()
      setView("list")
      resetForm()
    } catch (err: any) {
      console.error(err)
      showToast(err.message || "Something went wrong", "error")
    } finally {
      setLoading(false)
    }
  }

  const deleteQuestion = async (qid: string) => {
    setLoading(true)
    try {
      await supabase.from("test_questions").delete().eq("question_id", qid).eq("test_id", selectedTest)
      await supabase.from("options").delete().eq("question_id", qid)
      await supabase.from("questions").delete().eq("id", qid)
      setQuestions(prev => prev.filter(q => q.id !== qid))
      showToast("Question deleted", "success")
    } catch (err) {
      showToast("Delete failed", "error")
    } finally {
      setLoading(false)
      setDeleteConfirm(null)
    }
  }

  const filtered = questions.filter(q => {
    const matchSubject = filterSubject === "all" || q.subject === filterSubject
    const matchSearch = q.question_text.toLowerCase().includes(searchText.toLowerCase())
    return matchSubject && matchSearch
  })

  const subjectCount = (s: string) => questions.filter(q => q.subject === s).length
  const numericalCount = (s: string) => questions.filter(q => q.subject === s && q.question_type === "numerical").length
  const mcqCount = (s: string) => questions.filter(q => q.subject === s && q.question_type === "mcq").length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        .admin { min-height: 100vh; background: #faf8f4; font-family: 'Nunito', sans-serif; color: #2d2a24; }

        /* TOP NAV */
        .topnav { background: #fff; border-bottom: 1.5px solid #ddd5c8; padding: 0 32px; height: 62px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
        .nav-brand { display: flex; align-items: center; gap: 10px; }
        .nav-icon { width: 36px; height: 36px; background: #eef3ea; border: 2px solid #c4d4b8; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .nav-title { font-family: 'Lora', serif; font-size: 17px; font-weight: 700; }
        .nav-sub { font-size: 11px; color: #9e9589; }

        /* MAIN */
        .main { max-width: 960px; margin: 0 auto; padding: 36px 24px; }

        /* TEST SELECTOR BAR */
        .test-bar { background: #fff; border: 1.5px solid #ddd5c8; border-radius: 16px; padding: 18px 22px; margin-bottom: 28px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .test-bar-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #9e9589; white-space: nowrap; }
        .test-select { flex: 1; min-width: 200px; background: #faf8f4; border: 1.5px solid #ddd5c8; border-radius: 10px; padding: 10px 36px 10px 13px; font-family: 'Nunito', sans-serif; font-size: 14px; color: #2d2a24; outline: none; cursor: pointer; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239e9589' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; transition: border-color 0.18s; }
        .test-select:focus { border-color: #7a9e65; }

        /* STATS STRIP */
        .stats-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        .stat-card { background: #fff; border: 1.5px solid #ddd5c8; border-radius: 14px; padding: 16px 18px; }
        .stat-subject { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .stat-subject.physics { color: #5c7c4a; }
        .stat-subject.chemistry { color: #4a6c7c; }
        .stat-subject.maths { color: #7c5c4a; }
        .stat-nums { display: flex; gap: 12px; }
        .stat-num { text-align: center; }
        .stat-n { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 600; color: #2d2a24; }
        .stat-l { font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: #9e9589; font-weight: 700; margin-top: 1px; }
        .stat-divider { width: 1px; background: #ece7de; }

        /* TOOLBAR */
        .toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
        .search-wrap { flex: 1; min-width: 200px; position: relative; }
        .search-input { width: 100%; background: #fff; border: 1.5px solid #ddd5c8; border-radius: 10px; padding: 10px 14px 10px 38px; font-family: 'Nunito', sans-serif; font-size: 14px; color: #2d2a24; outline: none; transition: border-color 0.18s; }
        .search-input:focus { border-color: #7a9e65; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9e9589; font-size: 15px; pointer-events: none; }
        .filter-tabs { display: flex; gap: 6px; }
        .ftab { padding: 8px 14px; border-radius: 8px; border: 1.5px solid #ddd5c8; background: #fff; font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 700; color: #9e9589; cursor: pointer; transition: all 0.15s; }
        .ftab.active { background: #eef3ea; border-color: #c4d4b8; color: #5c7c4a; }
        .ftab:hover:not(.active) { border-color: #c4bdb4; color: #6b6358; }
        .add-btn { display: flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 10px; background: #5c7c4a; border: none; color: #fff; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.15s; box-shadow: 0 2px 8px rgba(92,124,74,0.2); white-space: nowrap; }
        .add-btn:hover { background: #4e6b3e; transform: translateY(-1px); }

        /* QUESTION LIST */
        .q-list { display: flex; flex-direction: column; gap: 10px; }
        .q-item { background: #fff; border: 1.5px solid #ddd5c8; border-radius: 14px; padding: 18px 20px; display: flex; align-items: flex-start; gap: 14px; transition: all 0.15s; animation: fadeIn 0.2s ease; }
        .q-item:hover { border-color: #c4bdb4; box-shadow: 0 2px 10px rgba(45,42,36,0.06); }
        .q-index { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: #9e9589; min-width: 28px; padding-top: 2px; }
        .q-body { flex: 1; min-width: 0; }
        .q-badges { display: flex; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
        .badge { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 8px; border-radius: 5px; }
        .badge.physics { background: #eef3ea; color: #5c7c4a; border: 1px solid #c4d4b8; }
        .badge.chemistry { background: #e8f3f8; color: #4a6c7c; border: 1px solid #b4cfd4; }
        .badge.maths { background: #f3ede8; color: #7c5c4a; border: 1px solid #d4c4b4; }
        .badge.mcq { background: #faf8f4; color: #6b6358; border: 1px solid #ddd5c8; }
        .badge.numerical { background: #fdf3e7; color: #c17f3a; border: 1px solid #e8c99a; }
        .q-text { font-size: 14px; line-height: 1.5; color: #2d2a24; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .q-opts-preview { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
        .opt-preview { font-size: 11px; padding: 3px 9px; border-radius: 5px; border: 1px solid #ece7de; background: #faf8f4; color: #9e9589; }
        .opt-preview.correct { background: #eef3ea; border-color: #c4d4b8; color: #5c7c4a; font-weight: 700; }
        .q-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .edit-btn { padding: 7px 14px; border-radius: 8px; border: 1.5px solid #ddd5c8; background: #faf8f4; font-family: 'Nunito', sans-serif; font-size: 12px; font-weight: 700; color: #6b6358; cursor: pointer; transition: all 0.15s; }
        .edit-btn:hover { border-color: #7a9e65; color: #5c7c4a; background: #f4faf0; }
        .del-btn { padding: 7px 14px; border-radius: 8px; border: 1.5px solid #e8b5a4; background: #fdf0ec; font-family: 'Nunito', sans-serif; font-size: 12px; font-weight: 700; color: #b85c3a; cursor: pointer; transition: all 0.15s; }
        .del-btn:hover { background: #fae0d8; border-color: #b85c3a; }

        /* FORM */
        .form-wrap { background: #fff; border: 1.5px solid #ddd5c8; border-radius: 20px; padding: 36px; animation: slideUp 0.2s ease; }
        .form-header { display: flex; align-items: center; gap: 14px; margin-bottom: 32px; }
        .back-btn2 { padding: 8px 14px; border-radius: 9px; border: 1.5px solid #ddd5c8; background: #faf8f4; font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 700; color: #6b6358; cursor: pointer; transition: all 0.15s; }
        .back-btn2:hover { background: #f4f0e8; }
        .form-title { font-family: 'Lora', serif; font-size: 20px; font-weight: 700; }
        .form-sub { font-size: 12px; color: #9e9589; margin-top: 2px; }

        .field { margin-bottom: 20px; }
        .label { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6b6358; margin-bottom: 7px; }
        .input, .select-f, .textarea-f { width: 100%; background: #faf8f4; border: 1.5px solid #ddd5c8; border-radius: 11px; padding: 11px 14px; font-family: 'Nunito', sans-serif; font-size: 14px; color: #2d2a24; outline: none; transition: all 0.18s; }
        .input:focus, .select-f:focus, .textarea-f:focus { border-color: #7a9e65; background: #f7faf4; box-shadow: 0 0 0 3px rgba(92,124,74,0.08); }
        .textarea-f { resize: vertical; min-height: 90px; line-height: 1.6; }
        .select-f { -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239e9589' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; cursor: pointer; }

        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

        .type-toggle { display: flex; gap: 8px; }
        .type-btn { flex: 1; padding: 10px; border-radius: 10px; border: 1.5px solid #ddd5c8; background: #faf8f4; font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 700; color: #9e9589; cursor: pointer; transition: all 0.15s; text-align: center; }
        .type-btn.active.mcq { border-color: #5c7c4a; background: #eef3ea; color: #5c7c4a; }
        .type-btn.active.numerical { border-color: #c17f3a; background: #fdf3e7; color: #c17f3a; }

        .marks-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .marks-box { background: #faf8f4; border: 1.5px solid #ddd5c8; border-radius: 12px; padding: 14px; transition: border-color 0.18s; }
        .marks-box:focus-within { border-color: #7a9e65; }
        .marks-box.neg:focus-within { border-color: #e8b5a4; }
        .marks-num { background: transparent; border: none; font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 600; width: 100%; outline: none; }
        .marks-box.pos .marks-num { color: #5c7c4a; }
        .marks-box.neg .marks-num { color: #b85c3a; }

        .divider { height: 1px; background: #ece7de; margin: 24px 0; }

        .opts-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .correct-hint { font-size: 11px; font-weight: 700; color: #5c7c4a; background: #eef3ea; border: 1px solid #c4d4b8; border-radius: 5px; padding: 3px 9px; }
        .no-correct { font-size: 11px; color: #c17f3a; background: #fdf3e7; border: 1px solid #e8c99a; border-radius: 5px; padding: 3px 9px; font-weight: 700; }

        .opt-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .opt-letter { width: 34px; height: 34px; border-radius: 9px; border: 1.5px solid #ddd5c8; background: #faf8f4; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: #9e9589; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .opt-letter:hover { border-color: #7a9e65; color: #5c7c4a; }
        .opt-letter.correct { border-color: #5c7c4a; background: #eef3ea; color: #5c7c4a; }
        .opt-input-wrap { flex: 1; position: relative; }
        .opt-input { width: 100%; background: #faf8f4; border: 1.5px solid #ddd5c8; border-radius: 10px; padding: 10px 38px 10px 13px; font-family: 'Nunito', sans-serif; font-size: 13px; color: #2d2a24; outline: none; transition: all 0.18s; }
        .opt-input:focus { border-color: #7a9e65; background: #f7faf4; }
        .opt-input.is-correct { border-color: #5c7c4a; background: #f4faf0; }
        .opt-tag { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 800; color: #5c7c4a; pointer-events: none; }
        .remove-btn { width: 30px; height: 30px; border-radius: 7px; border: 1.5px solid #e8b5a4; background: #fdf0ec; color: #b85c3a; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px; transition: all 0.15s; flex-shrink: 0; }
        .remove-btn:hover { background: #fae0d8; }
        .remove-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .add-opt-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 10px; border-radius: 10px; border: 1.5px dashed #ddd5c8; background: transparent; font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 600; color: #9e9589; cursor: pointer; transition: all 0.18s; margin-top: 4px; }
        .add-opt-btn:hover { border-color: #7a9e65; color: #5c7c4a; background: #f4faf0; }

        .save-btn { width: 100%; background: #5c7c4a; border: none; border-radius: 12px; padding: 15px; font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 800; color: #fff; cursor: pointer; transition: all 0.18s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 3px 12px rgba(92,124,74,0.22); }
        .save-btn:hover:not(:disabled) { background: #4e6b3e; transform: translateY(-1px); }
        .save-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }

        /* EMPTY STATE */
        .empty { text-align: center; padding: 60px 20px; color: #9e9589; }
        .empty-icon { font-size: 42px; margin-bottom: 12px; }
        .empty-title { font-family: 'Lora', serif; font-size: 18px; font-weight: 600; color: #6b6358; margin-bottom: 6px; }
        .empty-sub { font-size: 13px; }

        /* DELETE MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(45,42,36,0.35); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }
        .modal { background: #fff; border: 1.5px solid #ddd5c8; border-radius: 18px; padding: 32px; width: 360px; box-shadow: 0 12px 40px rgba(45,42,36,0.14); animation: slideUp 0.2s ease; }
        .modal-icon { font-size: 36px; margin-bottom: 12px; }
        .modal-title { font-family: 'Lora', serif; font-size: 19px; font-weight: 700; margin-bottom: 6px; }
        .modal-body { font-size: 13px; color: #6b6358; margin-bottom: 22px; line-height: 1.5; }
        .modal-actions { display: flex; gap: 10px; }
        .modal-cancel { flex: 1; padding: 12px; border-radius: 10px; background: #faf8f4; border: 1.5px solid #ddd5c8; color: #6b6358; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; }
        .modal-del { flex: 1; padding: 12px; border-radius: 10px; background: #b85c3a; border: none; color: #fff; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 800; cursor: pointer; }

        /* TOAST */
        .toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); padding: 12px 20px; border-radius: 11px; font-size: 13px; font-weight: 700; font-family: 'Nunito', sans-serif; z-index: 200; animation: slideUp 0.3s ease; white-space: nowrap; box-shadow: 0 6px 24px rgba(45,42,36,0.15); }
        .toast.success { background: #eef3ea; border: 1.5px solid #c4d4b8; color: #4e6b3e; }
        .toast.error { background: #fdf0ec; border: 1.5px solid #e8b5a4; color: #b85c3a; }

        .no-results { text-align: center; padding: 40px; color: #9e9589; font-size: 14px; }
      `}</style>

      <div className="admin">
        {/* TOP NAV */}
        <div className="topnav">
          <div className="nav-brand">
            <div className="nav-icon">✏️</div>
            <div>
              <div className="nav-title">Admin Panel</div>
              <div className="nav-sub">JEE Test Series</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#9e9589", fontWeight: 600 }}>
            {questions.length} questions loaded
          </div>
        </div>

        <div className="main">
          {/* TEST SELECTOR */}
          <div className="test-bar">
            <span className="test-bar-label">Test</span>
            <select className="test-select" value={selectedTest} onChange={e => { setSelectedTest(e.target.value); setView("list") }}>
              <option value="">Choose a test…</option>
              {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>

          {selectedTest && view === "list" && (
            <>
              {/* STATS STRIP */}
              <div className="stats-strip">
                {SUBJECTS.map(s => (
                  <div className="stat-card" key={s}>
                    <div className={`stat-subject ${s}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</div>
                    <div className="stat-nums">
                      <div className="stat-num">
                        <div className="stat-n">{subjectCount(s)}</div>
                        <div className="stat-l">Total</div>
                      </div>
                      <div className="stat-divider" />
                      <div className="stat-num">
                        <div className="stat-n">{mcqCount(s)}</div>
                        <div className="stat-l">MCQ</div>
                      </div>
                      <div className="stat-divider" />
                      <div className="stat-num">
                        <div className="stat-n">{numericalCount(s)}</div>
                        <div className="stat-l">Num</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* TOOLBAR */}
              <div className="toolbar">
                <div className="search-wrap">
                  <span className="search-icon">🔍</span>
                  <input className="search-input" placeholder="Search questions…" value={searchText} onChange={e => setSearchText(e.target.value)} />
                </div>
                <div className="filter-tabs">
                  <button className={`ftab ${filterSubject === "all" ? "active" : ""}`} onClick={() => setFilterSubject("all")}>All</button>
                  {SUBJECTS.map(s => (
                    <button key={s} className={`ftab ${filterSubject === s ? "active" : ""}`} onClick={() => setFilterSubject(s)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <button className="add-btn" onClick={openAdd}>+ Add Question</button>
              </div>

              {/* QUESTION LIST */}
              {loading ? (
                <div style={{ textAlign: "center", padding: "50px", color: "#9e9589" }}>
                  <div style={{ width: 32, height: 32, border: "3px solid #ddd5c8", borderTopColor: "#5c7c4a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                  Loading…
                </div>
              ) : filtered.length === 0 ? (
                searchText ? (
                  <div className="no-results">No questions matching "{searchText}"</div>
                ) : (
                  <div className="empty">
                    <div className="empty-icon">📝</div>
                    <div className="empty-title">No questions yet</div>
                    <div className="empty-sub">Add your first question using the button above</div>
                  </div>
                )
              ) : (
                <div className="q-list">
                  {filtered.map((q, i) => (
                    <div key={q.id} className="q-item">
                      <div className="q-index">#{i + 1}</div>
                      <div className="q-body">
                        <div className="q-badges">
                          <span className={`badge ${q.subject}`}>{q.subject}</span>
                          <span className={`badge ${q.question_type}`}>{q.question_type}</span>
                          <span className="badge" style={{ background: "#eef3ea", color: "#5c7c4a", border: "1px solid #c4d4b8" }}>+{q.marks}</span>
                          <span className="badge" style={{ background: "#fdf0ec", color: "#b85c3a", border: "1px solid #e8b5a4" }}>{q.negative_marks}</span>
                        </div>
                        <div className="q-text" title={q.question_text}>{q.question_text}</div>
                        {q.question_type === "mcq" && q.options?.length > 0 && (
                          <div className="q-opts-preview">
                            {q.options.map((o, oi) => (
                              <span key={oi} className={`opt-preview ${o.is_correct ? "correct" : ""}`}>
                                {LABELS[oi]}: {o.option_text.length > 20 ? o.option_text.slice(0, 20) + "…" : o.option_text}
                              </span>
                            ))}
                          </div>
                        )}
                        {q.question_type === "numerical" && q.correct_answer && (
                          <div style={{ marginTop: 6, fontSize: 12, color: "#5c7c4a", fontWeight: 700 }}>
                            ✓ Answer: {q.correct_answer}
                          </div>
                        )}
                      </div>
                      <div className="q-actions">
                        <button className="edit-btn" onClick={() => openEdit(q)}>✏ Edit</button>
                        <button className="del-btn" onClick={() => setDeleteConfirm(q.id)}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ADD / EDIT FORM */}
          {(view === "add" || view === "edit") && (
            <div className="form-wrap">
              <div className="form-header">
                <button className="back-btn2" onClick={() => { setView("list"); resetForm() }}>← Back</button>
                <div>
                  <div className="form-title">{view === "edit" ? "Edit Question" : "Add New Question"}</div>
                  <div className="form-sub">{view === "edit" ? "Update the question details below" : "Fill in the details to add to the test"}</div>
                </div>
              </div>

              <div className="row-2">
                <div className="field">
                  <label className="label">Subject</label>
                  <select className="select-f" value={subject} onChange={e => setSubject(e.target.value)}>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Question Type</label>
                  <div className="type-toggle">
                    <button className={`type-btn ${questionType === "mcq" ? "active mcq" : ""}`} onClick={() => setQuestionType("mcq")}>MCQ</button>
                    <button className={`type-btn ${questionType === "numerical" ? "active numerical" : ""}`} onClick={() => setQuestionType("numerical")}>Numerical</button>
                  </div>
                </div>
              </div>

              <div className="field">
                <label className="label">Question Text</label>
                <textarea className="textarea-f" value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Type the question here…" />
              </div>

              <div className="marks-row">
                <div className="marks-box pos">
                  <div className="label" style={{ color: "#5c7c4a" }}>Marks</div>
                  <input type="number" className="marks-num" value={marks} onChange={e => setMarks(Number(e.target.value))} />
                </div>
                <div className="marks-box neg">
                  <div className="label" style={{ color: "#b85c3a" }}>Negative Marks</div>
                  <input type="number" className="marks-num" value={negativeMarks} onChange={e => setNegativeMarks(Number(e.target.value))} />
                </div>
              </div>

              <div className="divider" />

              {questionType === "mcq" ? (
                <>
                  <div className="opts-header">
                    <label className="label" style={{ margin: 0 }}>Answer Options</label>
                    {correctOption !== null
                      ? <span className="correct-hint">✓ Option {LABELS[correctOption]} is correct</span>
                      : <span className="no-correct">⚠ Click a letter to mark correct</span>
                    }
                  </div>
                  {options.map((opt, i) => (
                    <div key={i} className="opt-row">
                      <button className={`opt-letter ${correctOption === i ? "correct" : ""}`} onClick={() => setCorrectOption(i === correctOption ? null : i)}>
                        {LABELS[i]}
                      </button>
                      <div className="opt-input-wrap">
                        <input type="text" className={`opt-input ${correctOption === i ? "is-correct" : ""}`} value={opt}
                          placeholder={`Option ${LABELS[i]}`}
                          onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n) }} />
                        {correctOption === i && <span className="opt-tag">✓</span>}
                      </div>
                      <button className="remove-btn" onClick={() => {
                        if (options.length <= 2) return
                        const newOpts = options.filter((_, idx) => idx !== i)
                        setOptions(newOpts)
                        if (correctOption === i) setCorrectOption(null)
                        else if (correctOption !== null && correctOption > i) setCorrectOption(correctOption - 1)
                      }} disabled={options.length <= 2}>×</button>
                    </div>
                  ))}
                  {options.length < 6 && (
                    <button className="add-opt-btn" onClick={() => setOptions([...options, ""])}>
                      <span style={{ fontSize: 17 }}>+</span> Add option
                    </button>
                  )}
                </>
              ) : (
                <div className="field">
                  <label className="label">Correct Numerical Answer</label>
                  <input type="text" className="input" value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)}
                    placeholder="e.g. 42 or 3.14" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 600, color: "#5c7c4a" }} />
                </div>
              )}

              <div className="divider" />

              <button className="save-btn" onClick={saveQuestion} disabled={loading}>
                {loading ? <><div className="spinner" />Saving…</> : view === "edit" ? "Update Question 🌿" : "Add Question 🌿"}
              </button>
            </div>
          )}

          {!selectedTest && (
            <div className="empty">
              <div className="empty-icon">📋</div>
              <div className="empty-title">Select a test to get started</div>
              <div className="empty-sub">Choose a test series from the dropdown above</div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🗑️</div>
            <div className="modal-title">Delete question?</div>
            <div className="modal-body">This will permanently remove the question and all its options from this test. This cannot be undone.</div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="modal-del" onClick={() => deleteQuestion(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.type === "success" ? "✓ " : "⚠ "}{toast.message}</div>}
    </>
  )
}