"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

const PLANS = {
  starter: {
    label: "Starter", price: 249, mrp: 599,
    tag: "10 Mocks + 5 PYQs",
    features: ["10 Full JEE Mocks", "5 PYQ Papers", "Instant Scoring", "Basic Analytics"],
    badge: null, color: "#4a5580", couponEligible: false,
  },
  pro: {
    label: "Pro", price: 499, mrp: 999,
    tag: "10 Mocks + 5 PYQs + Chapter Tests",
    features: ["10 Full JEE Mocks", "5 PYQ Papers", "Chapter-wise Tests", "Deep Analytics", "Coupon eligible"],
    badge: "MOST POPULAR", color: "#2563eb", couponEligible: true,
  },
  elite: {
    label: "Elite", price: 749, mrp: 1799,
    tag: "15 Mocks + 10 PYQs + Chapter Tests + Mentorship",
    features: ["15 Full JEE Mocks", "10 PYQ Papers", "Chapter-wise Tests", "1-on-1 Mentorship", "Priority Support", "Coupon eligible"],
    badge: "BEST VALUE", color: "#7c3aed", couponEligible: true,
  },
} as const

type PlanId = keyof typeof PLANS

const COUPONS: Record<string, { discount: number; plans: PlanId[] }> = {
  "JEET100":  { discount: 100, plans: ["pro", "elite"] },
  "ELITE150": { discount: 150, plans: ["elite"]        },
  "LAUNCH50": { discount: 50,  plans: ["pro", "elite"] },
}

const SEATS = { starter: 47, pro: 12, elite: 5 }

function use24hTimer() {
  const [timeLeft, setTimeLeft] = useState({ h: 23, m: 59, s: 59 })

  useEffect(() => {
    const KEY = "jeet_offer_end"
    let end = parseInt(sessionStorage.getItem(KEY) || "0")
    if (!end || end < Date.now()) {
      end = Date.now() + 24 * 60 * 60 * 1000
      sessionStorage.setItem(KEY, String(end))
    }
    const tick = () => {
      const diff = Math.max(0, end - Date.now())
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ h, m, s })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  return timeLeft
}

// ── Inner component that uses useSearchParams ──────────────────────────────
function SignupInner() {
  const { signUp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const timeLeft = use24hTimer()

  const [selectedPlan, setSelectedPlan] = useState<PlanId>(
    (searchParams.get("plan") as PlanId) || "pro"
  )
  const plan = PLANS[selectedPlan]

  const [couponInput,   setCouponInput]   = useState(searchParams.get("coupon") || "")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponError,   setCouponError]   = useState("")
  const [fullName,      setFullName]      = useState("")
  const [email,         setEmail]         = useState("")
  const [confirmEmail,  setConfirmEmail]  = useState("")
  const [mobile,        setMobile]        = useState("")
  const [password,      setPassword]      = useState("")
  const [showPassword,  setShowPassword]  = useState(false)
  const [error,         setError]         = useState("")
  const [success,       setSuccess]       = useState("")
  const [loading,       setLoading]       = useState(false)

  useEffect(() => {
    const c = searchParams.get("coupon")
    if (c) tryApplyCoupon(c, (searchParams.get("plan") as PlanId) || "pro")
  }, [])

  const tryApplyCoupon = (code = couponInput, planId = selectedPlan) => {
    const upper = code.trim().toUpperCase()
    const coupon = COUPONS[upper]
    if (!coupon) { setCouponError("Invalid coupon code."); setAppliedCoupon(null); return }
    if (!coupon.plans.includes(planId)) {
      setCouponError(`"${upper}" is not valid for the ${PLANS[planId].label} plan.`)
      setAppliedCoupon(null); return
    }
    setCouponError("")
    setAppliedCoupon({ code: upper, discount: coupon.discount })
  }

  const removeCoupon = () => { setAppliedCoupon(null); setCouponInput(""); setCouponError("") }

  const getFinalPrice = () => {
    if (!plan.couponEligible || !appliedCoupon) return plan.price
    return Math.max(0, plan.price - appliedCoupon.discount)
  }

  const finalPrice  = getFinalPrice()
  const hasCoupon   = !!appliedCoupon && plan.couponEligible

  const handleSubmit = async () => {
    setError(""); setSuccess("")
    if (!fullName.trim())             { setError("Please enter your full name."); return }
    if (!email.trim())                { setError("Please enter your email."); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address."); return }
    if (email !== confirmEmail)       { setError("Emails do not match."); return }
    if (!/^\d{10}$/.test(mobile))    { setError("Enter a valid 10-digit mobile number."); return }
    if (password.length < 6)         { setError("Password must be at least 6 characters."); return }
    setLoading(true)
    const { error } = await signUp(email, password, fullName)
    if (error) { setError(error.message); setLoading(false) }
    else { setSuccess("Account created! Check your email to confirm, then sign in."); setLoading(false) }
  }

  const pad = (n: number) => String(n).padStart(2, "0")
  const timerStr = `${pad(timeLeft.h)}:${pad(timeLeft.m)}:${pad(timeLeft.s)}`

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.3} }

    html, body { height: 100%; background: #f8f9fe; }

    .urgency-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 200;
      background: linear-gradient(90deg, #1e3a8a, #2563eb);
      padding: 8px 20px;
      display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap;
    }
    .ub-dot { width: 7px; height: 7px; border-radius: 50%; background: #86efac; animation: blink 1.2s infinite; flex-shrink: 0; }
    .ub-text { font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.9); }
    .ub-timer {
      font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 500; color: #fff;
      background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22);
      border-radius: 6px; padding: 2px 10px; letter-spacing: 1px;
    }
    .ub-code { color: #fde68a; font-weight: 800; }

    .page {
      min-height: 100vh;
      padding-top: 38px;
      display: grid;
      grid-template-columns: 3fr 2fr;
      font-family: 'DM Sans', sans-serif;
      color: #0f1733;
    }
    @media(max-width:960px) {
      .page { grid-template-columns: 1fr; }
      .pricing-col { order: -1; }
    }

    .form-col {
      background: #fff;
      border-right: 1px solid #e2e6f3;
      padding: 52px 60px 72px;
      display: flex; flex-direction: column; justify-content: center;
      overflow-y: auto;
    }
    @media(max-width:960px) { .form-col { padding: 36px 20px 52px; border-right: none; } }

    .form-inner { max-width: 500px; width: 100%; margin: 0 auto; animation: fadeUp .4s ease; }

    .form-nav {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 36px;
    }
    .brand-btn {
      display: flex; align-items: center; gap: 9px;
      background: none; border: none; cursor: pointer;
    }
    .brand-logo {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, #1d4ed8, #3b82f6);
      border-radius: 9px; display: flex; align-items: center; justify-content: center;
      font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; color: #fff;
      box-shadow: 0 2px 10px rgba(37,99,235,0.25);
    }
    .brand-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: #0f1733; }
    .brand-name span { color: #2563eb; }
    .home-link {
      font-size: 12.5px; font-weight: 600; color: #4a5580; cursor: pointer;
      background: none; border: none; font-family: 'DM Sans', sans-serif;
      display: flex; align-items: center; gap: 4px; transition: color .15s;
    }
    .home-link:hover { color: #2563eb; }

    .form-eyebrow {
      font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500;
      text-transform: uppercase; letter-spacing: 2.5px; color: #2563eb; margin-bottom: 8px;
    }
    .form-title {
      font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 600;
      color: #0f1733; line-height: 1.1; margin-bottom: 6px; letter-spacing: -1px;
    }
    .form-sub { font-size: 14px; color: #4a5580; line-height: 1.65; margin-bottom: 28px; }
    .form-sub-link {
      color: #2563eb; font-weight: 700; cursor: pointer;
      background: none; border: none; font-family: inherit; font-size: inherit;
      text-decoration: underline; text-underline-offset: 2px;
    }
    .form-sub-link:hover { color: #1d4ed8; }

    .active-plan-pill {
      display: flex; align-items: center; justify-content: space-between;
      background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 12px;
      padding: 12px 16px; margin-bottom: 24px; cursor: pointer; transition: all .2s;
    }
    .active-plan-pill:hover { border-color: #2563eb; background: #dbeafe; }
    .app-left { display: flex; align-items: center; gap: 10px; }
    .app-dot { width: 8px; height: 8px; border-radius: 50%; background: #2563eb; animation: blink 2s infinite; }
    .app-plan { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #1d4ed8; }
    .app-right { display: flex; align-items: baseline; gap: 8px; }
    .app-mrp { font-family: 'DM Mono', monospace; font-size: 12px; color: #b0b8d4; text-decoration: line-through; }
    .app-price { font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 400; color: #2563eb; letter-spacing: -0.5px; }
    .app-change { font-size: 11px; color: #60a5fa; font-weight: 600; margin-left: 4px; }

    .field { margin-bottom: 14px; }
    .field-label {
      font-family: 'DM Mono', monospace; font-size: 10.5px; font-weight: 500;
      text-transform: uppercase; letter-spacing: 1.5px; color: #4a5580;
      margin-bottom: 6px; display: block;
    }
    .field-req { color: #2563eb; margin-left: 2px; }
    .field-input {
      width: 100%; background: #fff; border: 1.5px solid #e2e6f3;
      border-radius: 11px; padding: 13px 15px;
      font-family: 'DM Sans', sans-serif; font-size: 14.5px; font-weight: 500;
      color: #0f1733; outline: none; transition: all .18s;
    }
    .field-input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.08); }
    .field-input::placeholder { color: #b0b8d4; font-weight: 400; }
    .field-hint { font-size: 11px; color: #8892b8; margin-top: 4px; font-family: 'DM Mono', monospace; }

    .password-wrap { position: relative; }
    .pw-toggle {
      position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      font-size: 10.5px; font-weight: 700; color: #8892b8;
      font-family: 'DM Mono', monospace; letter-spacing: 1px; transition: color .15s;
    }
    .pw-toggle:hover { color: #2563eb; }

    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media(max-width:520px) { .field-row { grid-template-columns: 1fr; } }

    .coupon-wrap {
      background: #f7f8fc; border: 1px solid #e2e6f3;
      border-radius: 12px; padding: 14px 16px; margin-bottom: 18px;
    }
    .coupon-label {
      font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
      text-transform: uppercase; letter-spacing: 2px; color: #4a5580;
      margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
    }
    .coupon-row { display: flex; gap: 8px; }
    .coupon-input {
      flex: 1; padding: 10px 13px; border-radius: 9px;
      border: 1.5px solid #e2e6f3; background: #fff;
      font-family: 'DM Mono', monospace; font-size: 12px; color: #0f1733;
      outline: none; letter-spacing: 1px; transition: border-color .18s;
    }
    .coupon-input:focus { border-color: #2563eb; }
    .coupon-input::placeholder { color: #b0b8d4; letter-spacing: 0; font-family: 'DM Sans', sans-serif; font-size: 12px; }
    .coupon-btn {
      padding: 10px 16px; border-radius: 9px; background: #2563eb; border: none; color: #fff;
      font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 700;
      cursor: pointer; transition: all .18s; white-space: nowrap;
    }
    .coupon-btn:hover { background: #1d4ed8; transform: translateY(-1px); }
    .coupon-error { font-size: 11px; color: #dc2626; margin-top: 6px; font-family: 'DM Mono', monospace; }
    .coupon-success {
      display: flex; align-items: center; justify-content: space-between;
      background: #eff6ff; border: 1px solid #bfdbfe;
      border-radius: 9px; padding: 9px 12px; animation: slideIn .25s ease;
    }
    .coupon-success-text { font-size: 12px; font-weight: 700; color: #2563eb; font-family: 'DM Mono', monospace; }
    .coupon-remove { font-size: 11px; color: #8892b8; cursor: pointer; background: none; border: none; font-family: 'DM Sans', sans-serif; font-weight: 600; transition: color .15s; }
    .coupon-remove:hover { color: #dc2626; }
    .coupon-locked { font-size: 12px; color: #8892b8; font-style: italic; }

    .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 15px; font-size: 13.5px; color: #dc2626; margin-bottom: 16px; line-height: 1.5; }
    .success-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 15px; font-size: 13.5px; color: #2563eb; margin-bottom: 16px; line-height: 1.5; }

    .submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #1d4ed8, #3b82f6);
      border: none; border-radius: 14px; padding: 18px 24px;
      font-family: 'DM Sans', sans-serif; font-size: 18px; font-weight: 800; color: #fff;
      cursor: pointer; transition: all .2s;
      box-shadow: 0 6px 24px rgba(37,99,235,0.32);
      display: flex; align-items: center; justify-content: center; gap: 10px;
      margin-top: 6px; letter-spacing: -0.2px;
    }
    .submit-btn:hover:not(:disabled) { opacity: .92; transform: translateY(-2px); box-shadow: 0 10px 32px rgba(37,99,235,0.38); }
    .submit-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    .submit-sub { font-size: 12px; font-weight: 500; opacity: .75; margin-top: 2px; }

    .spinner { width: 17px; height: 17px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }

    .terms { font-size: 11.5px; color: #8892b8; text-align: center; line-height: 1.65; margin-top: 14px; }
    .signin-prompt { text-align: center; font-size: 13px; color: #4a5580; margin-top: 12px; }

    .pricing-col {
      background: #f8f9fe;
      padding: 52px 32px 72px;
      display: flex; flex-direction: column;
      overflow-y: auto;
      position: sticky; top: 38px; max-height: calc(100vh - 38px);
    }
    @media(max-width:960px) {
      .pricing-col { position: static; max-height: none; padding: 32px 20px 40px; }
    }

    .pc-eyebrow {
      font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
      text-transform: uppercase; letter-spacing: 2.5px; color: #2563eb; margin-bottom: 6px;
    }
    .pc-title {
      font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600;
      color: #0f1733; line-height: 1.2; letter-spacing: -0.3px; margin-bottom: 14px;
    }
    .pc-title em { font-style: italic; color: #2563eb; }

    .offer-chip {
      display: flex; align-items: center; gap: 8px;
      background: linear-gradient(90deg, #fef3c7, #fde68a);
      border: 1px solid #f59e0b; border-radius: 8px;
      padding: 7px 12px; margin-bottom: 18px;
    }
    .oc-text { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700; color: #92400e; }
    .oc-timer { font-family: 'DM Mono', monospace; font-size: 12px; color: #b45309; letter-spacing: .5px; }

    .plan-cards { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }

    .plan-card {
      background: #fff; border: 2px solid #e2e6f3; border-radius: 14px;
      padding: 16px 18px; cursor: pointer; transition: all .2s; position: relative; overflow: hidden;
    }
    .plan-card:hover { border-color: #bfdbfe; box-shadow: 0 3px 16px rgba(37,99,235,0.1); transform: translateY(-1px); }
    .plan-card.sel-pro   { border-color: #2563eb; box-shadow: 0 3px 18px rgba(37,99,235,0.18); }
    .plan-card.sel-elite { border-color: #7c3aed; box-shadow: 0 3px 18px rgba(124,58,237,0.18); }

    .card-shine {
      position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: shimmer 2.8s infinite; pointer-events: none;
    }

    .card-badge {
      position: absolute; top: 12px; right: 12px;
      padding: 2px 8px; border-radius: 20px;
      font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 800;
      letter-spacing: .8px; text-transform: uppercase;
    }
    .badge-pop  { background: #dbeafe; color: #1d4ed8; }
    .badge-best { background: #ede9fe; color: #6d28d9; }

    .card-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
    .card-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; color: #0f1733; }
    .card-tag  { font-size: 11px; color: #4a5580; margin-top: 2px; line-height: 1.4; max-width: 140px; }

    .card-price-block { text-align: right; flex-shrink: 0; }
    .card-mrp {
      font-family: 'DM Mono', monospace; font-size: 11.5px;
      color: #b0b8d4; text-decoration: line-through; line-height: 1;
    }
    .card-disc {
      display: inline-block; background: #dcfce7; color: #15803d;
      font-family: 'DM Sans', sans-serif; font-size: 9.5px; font-weight: 800;
      padding: 1px 6px; border-radius: 20px; margin: 2px 0; letter-spacing: .3px;
    }
    .card-price {
      font-family: 'DM Mono', monospace; font-size: 26px; font-weight: 400;
      color: #0f1733; line-height: 1; letter-spacing: -1px;
    }
    .card-price.col-pro   { color: #2563eb; }
    .card-price.col-elite { color: #7c3aed; }

    .card-seats { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
    .seats-bg { flex: 1; height: 3px; background: #e2e6f3; border-radius: 2px; overflow: hidden; }
    .seats-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #f59e0b, #ef4444); }
    .seats-txt { font-size: 10.5px; font-weight: 700; color: #ef4444; font-family: 'DM Mono', monospace; white-space: nowrap; }

    .card-feats { display: flex; flex-wrap: wrap; gap: 4px; padding-top: 8px; border-top: 1px solid #f0f2fa; }
    .card-feat  { font-size: 11px; color: #4a5580; display: flex; align-items: center; gap: 3px; }
    .feat-ck    { color: #2563eb; font-size: 10px; }

    .trust-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .trust-badge {
      display: flex; align-items: center; gap: 4px;
      background: #fff; border: 1px solid #e2e6f3; border-radius: 7px;
      padding: 5px 10px; font-size: 11px; font-weight: 600; color: #4a5580;
      font-family: 'DM Sans', sans-serif;
    }
  `

  return (
    <>
      <style>{CSS}</style>

      {/* URGENCY BAR */}
      <div className="urgency-bar">
        <span className="ub-dot" />
        <span className="ub-text">🔥 Launch offer ends in</span>
        <span className="ub-timer">{timerStr}</span>
        <span className="ub-text">· Code <span className="ub-code">JEET100</span> = ₹100 off Pro/Elite</span>
      </div>

      <div className="page">

        {/* ══ LEFT — FORM ══ */}
        <div className="form-col">
          <div className="form-inner">

            <div className="form-nav">
              <button className="brand-btn" onClick={() => router.push("/")}>
                <div className="brand-logo">J</div>
                <span className="brand-name">JEET<span>.</span></span>
              </button>
              <button className="home-link" onClick={() => router.push("/")}>← Home</button>
            </div>

            <div className="form-eyebrow">JEET · Create Account</div>
            <div className="form-title">Register now.</div>
            <div className="form-sub">
              Already have an account?{" "}
              <button className="form-sub-link" onClick={() => router.push("/login")}>Sign in →</button>
            </div>

            <div className="active-plan-pill" onClick={() => document.getElementById("pricing-col")?.scrollIntoView({ behavior: "smooth" })}>
              <div className="app-left">
                <span className="app-dot" />
                <span className="app-plan">{plan.label} Plan selected</span>
              </div>
              <div className="app-right">
                <span className="app-mrp">₹{plan.mrp}</span>
                <span className="app-price">₹{finalPrice}</span>
                <span className="app-change">Change →</span>
              </div>
            </div>

            {error   && <div className="error-box">⚠ {error}</div>}
            {success && <div className="success-box">✓ {success}</div>}

            <div className="field">
              <label className="field-label">Full Name <span className="field-req">*</span></label>
              <input className="field-input" type="text" placeholder="Arjun Sharma"
                value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field-label">Email <span className="field-req">*</span></label>
                <input className="field-input" type="email" placeholder="arjun@gmail.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Confirm Email <span className="field-req">*</span></label>
                <input className="field-input" type="email" placeholder="Re-enter email"
                  value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field-label">Mobile <span className="field-req">*</span></label>
                <input className="field-input" type="tel" placeholder="10-digit number" maxLength={10}
                  value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ""))} />
                <div className="field-hint">↳ No country code needed</div>
              </div>
              <div className="field">
                <label className="field-label">Password <span className="field-req">*</span></label>
                <div className="password-wrap">
                  <input className="field-input" type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters" style={{ paddingRight: "54px" }}
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                  <button className="pw-toggle" type="button" onClick={() => setShowPassword(s => !s)}>
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>
            </div>

            <div className="coupon-wrap">
              <div className="coupon-label">🏷 Coupon Code</div>
              {!plan.couponEligible ? (
                <div className="coupon-locked">Starter is already our lowest price — no coupon needed.</div>
              ) : !appliedCoupon ? (
                <>
                  <div className="coupon-row">
                    <input className="coupon-input" placeholder="e.g. JEET100"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value); setCouponError("") }}
                      onKeyDown={e => e.key === "Enter" && tryApplyCoupon()} />
                    <button className="coupon-btn" onClick={() => tryApplyCoupon()}>Apply</button>
                  </div>
                  {couponError && <div className="coupon-error">✗ {couponError}</div>}
                </>
              ) : (
                <div className="coupon-success">
                  <span className="coupon-success-text">✓ {appliedCoupon.code} — ₹{appliedCoupon.discount} off applied!</span>
                  <button className="coupon-remove" onClick={removeCoupon}>Remove</button>
                </div>
              )}
            </div>

            <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <><div className="spinner" /> Creating your account…</>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div>Register &amp; Pay ₹{finalPrice} →</div>
                  <div className="submit-sub">You save ₹{plan.mrp - finalPrice} vs MRP · Instant access</div>
                </div>
              )}
            </button>

            <div className="terms">
              By registering you agree to JEET's Terms of Service &amp; Privacy Policy.<br />
              Payment is collected after email confirmation.
            </div>
            <div className="signin-prompt">
              Already registered?{" "}
              <button className="form-sub-link" onClick={() => router.push("/login")}>Sign in →</button>
            </div>

          </div>
        </div>

        {/* ══ RIGHT — PRICING ══ */}
        <div className="pricing-col" id="pricing-col">

          <div className="pc-eyebrow">Choose your plan</div>
          <div className="pc-title">Prices going up <em>soon.</em><br />Lock in now.</div>

          <div className="offer-chip">
            <span>🔥</span>
            <span className="oc-text">Up to 58% off — ends in</span>
            <span className="oc-timer">{timerStr}</span>
          </div>

          <div className="plan-cards">
            {(Object.entries(PLANS) as [PlanId, typeof PLANS[PlanId]][]).map(([id, p]) => {
              const disc      = Math.round((1 - p.price / p.mrp) * 100)
              const isSelected = selectedPlan === id
              const isElite   = id === "elite"
              const isPro     = id === "pro"
              const cardSeats = SEATS[id]
              const cardTotal = id === "starter" ? 100 : id === "pro" ? 50 : 20
              const fill      = Math.round((1 - cardSeats / cardTotal) * 100)

              return (
                <div
                  key={id}
                  className={`plan-card ${isSelected ? (isElite ? "sel-elite" : isPro ? "sel-pro" : "") : ""}`}
                  onClick={() => { setSelectedPlan(id); if (appliedCoupon && !p.couponEligible) removeCoupon() }}
                >
                  {isSelected && <div className="card-shine" />}
                  {p.badge && (
                    <div className={`card-badge ${isElite ? "badge-best" : "badge-pop"}`}>{p.badge}</div>
                  )}

                  <div className="card-row">
                    <div>
                      <div className="card-name">{p.label}</div>
                      <div className="card-tag">{p.tag}</div>
                    </div>
                    <div className="card-price-block">
                      <div className="card-mrp">₹{p.mrp}</div>
                      <div className="card-disc">{disc}% OFF</div>
                      <div className={`card-price ${isSelected ? (isElite ? "col-elite" : isPro ? "col-pro" : "") : ""}`}>
                        ₹{p.price}
                      </div>
                    </div>
                  </div>

                  <div className="card-seats">
                    <div className="seats-bg">
                      <div className="seats-fill" style={{ width: `${fill}%` }} />
                    </div>
                    <span className="seats-txt">
                      {cardSeats <= 5 ? `⚠ Only ${cardSeats} left!` : `${cardSeats} seats left`}
                    </span>
                  </div>

                  <div className="card-feats">
                    {p.features.map(f => (
                      <span key={f} className="card-feat">
                        <span className="feat-ck">✓</span> {f}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="trust-row">
            <div className="trust-badge">🔒 Secure</div>
            <div className="trust-badge">✓ No subscription</div>
            <div className="trust-badge">📧 Instant access</div>
            <div className="trust-badge">💬 WhatsApp support</div>
          </div>

        </div>
      </div>
    </>
  )
}

// ── Default export wraps inner component in Suspense ──────────────────────
export default function SignupPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "sans-serif", color: "#4a5580", fontSize: 14
      }}>
        Loading…
      </div>
    }>
      <SignupInner />
    </Suspense>
  )
}