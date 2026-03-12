"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()

  const [email, setEmail]               = useState("")
  const [password, setPassword]         = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState("")
  const [loading, setLoading]           = useState(false)

  async function handleSubmit() {
    setError("")
    if (!email || !password) { setError("Please fill in all fields."); return }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) { setError(error.message); setLoading(false) }
    else router.push("/home")
  }

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes spin     { to { transform: rotate(360deg) } }
    @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes rise     { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

    html, body { height: 100%; }

    .page {
      min-height: 100vh;
      display: flex;
      font-family: 'DM Sans', sans-serif;
      color: #0f1733;
      background: #f8f9fe;
    }

    /* ── LEFT PANEL ── */
    .left-panel {
      width: 46%;
      background: linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%);
      display: flex; flex-direction: column;
      justify-content: space-between;
      padding: 52px 52px 44px;
      position: relative; overflow: hidden;
    }
    @media(max-width:800px) { .left-panel { display: none; } .right-panel { width: 100% !important; } }

    .lp-glow1 { position:absolute; width:500px; height:500px; border-radius:50%; top:-160px; left:-160px; background:radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 65%); pointer-events:none; }
    .lp-glow2 { position:absolute; width:360px; height:360px; border-radius:50%; bottom:-100px; right:-80px; background:radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 65%); pointer-events:none; }
    .lp-grid  { position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px); background-size:48px 48px; pointer-events:none; }

    .lp-brand { display:flex; align-items:center; gap:10px; position:relative; z-index:1; cursor:pointer; background:none; border:none; }
    .lp-logo  { width:38px; height:38px; background:rgba(255,255,255,0.15); border:1.5px solid rgba(255,255,255,0.25); border-radius:10px; display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:15px; font-weight:800; color:#fff; backdrop-filter:blur(8px); }
    .lp-name  { font-family:'Syne',sans-serif; font-size:17px; font-weight:800; color:#fff; }
    .lp-name span { opacity:.6; }

    .lp-body { position:relative; z-index:1; }

    .lp-tag {
      display:inline-flex; align-items:center; gap:7px;
      background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2);
      border-radius:100px; padding:5px 14px;
      font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:600; color:rgba(255,255,255,0.85);
      margin-bottom:22px;
    }
    .lp-tag-dot { width:6px; height:6px; border-radius:50%; background:#86efac; animation:blink 1.8s infinite; }

    .lp-icon {
      width:62px; height:62px;
      background:rgba(255,255,255,0.12); border:1.5px solid rgba(255,255,255,0.22);
      border-radius:18px; display:flex; align-items:center; justify-content:center;
      font-size:26px; margin-bottom:24px;
      animation:float 5s ease-in-out infinite;
      backdrop-filter:blur(10px);
    }

    .lp-title {
      font-family:'Cormorant Garamond',serif;
      font-size:40px; font-weight:600; color:#fff;
      line-height:1.15; letter-spacing:-1px; margin-bottom:14px;
    }
    .lp-title em { font-style:italic; color:#bfdbfe; }

    .lp-sub { font-size:14px; color:rgba(255,255,255,0.55); line-height:1.8; margin-bottom:36px; max-width:290px; }

    .lp-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:36px; }
    .lp-stat {
      background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
      border-radius:14px; padding:16px 12px; text-align:center;
      transition:all .2s; cursor:default;
    }
    .lp-stat:hover { background:rgba(255,255,255,0.12); transform:translateY(-2px); }
    .lp-stat-n { font-family:'DM Mono',monospace; font-size:22px; color:#fff; display:block; margin-bottom:4px; }
    .lp-stat-l { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:1.2px; color:rgba(255,255,255,0.38); display:block; }

    .lp-feats { display:flex; flex-direction:column; gap:9px; }
    .lp-feat { display:flex; align-items:center; gap:10px; font-size:13px; color:rgba(255,255,255,0.6); }
    .lp-feat-ic { width:28px; height:28px; border-radius:8px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }

    .lp-quote {
      position:relative; z-index:1;
      border-top:1px solid rgba(255,255,255,0.1); padding-top:18px;
      font-family:'Cormorant Garamond',serif; font-style:italic;
      font-size:13.5px; color:rgba(255,255,255,0.3); line-height:1.65;
    }
    .lp-quote-attr { font-family:'DM Sans',sans-serif; font-style:normal; font-size:11px; color:rgba(255,255,255,0.2); margin-top:6px; }

    /* ── RIGHT PANEL ── */
    .right-panel {
      width: 54%;
      display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      padding: 60px 40px;
      background: #ffffff;
      position: relative; overflow: hidden;
    }

    .rp-bg {
      position:absolute; inset:0; pointer-events:none;
      background:
        radial-gradient(ellipse 60% 40% at 85% 15%, rgba(37,99,235,0.04) 0%, transparent 60%),
        radial-gradient(ellipse 50% 50% at 10% 90%, rgba(59,130,246,0.03) 0%, transparent 60%);
    }

    .form-card {
      width: 100%; max-width: 400px;
      position: relative; z-index: 1;
      animation: rise .5s ease;
    }

    .rp-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:36px; }
    .rp-home { display:flex; align-items:center; gap:5px; font-size:12.5px; font-weight:600; color:#4a5580; cursor:pointer; background:none; border:none; font-family:'DM Sans',sans-serif; transition:color .15s; }
    .rp-home:hover { color:#2563eb; }
    .rp-brand { display:flex; align-items:center; gap:8px; background:none; border:none; cursor:pointer; }
    .rp-logo { width:32px; height:32px; background:linear-gradient(135deg,#1d4ed8,#3b82f6); border-radius:8px; display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:13px; font-weight:800; color:#fff; box-shadow:0 2px 10px rgba(37,99,235,0.22); }
    .rp-name { font-family:'Syne',sans-serif; font-size:15px; font-weight:800; color:#0f1733; }
    .rp-name span { color:#2563eb; }

    .form-eyebrow {
      font-family:'DM Mono',monospace; font-size:11px; font-weight:500;
      text-transform:uppercase; letter-spacing:2.5px; color:#2563eb; margin-bottom:8px;
    }
    .form-title {
      font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:600;
      color:#0f1733; line-height:1.1; letter-spacing:-0.8px; margin-bottom:6px;
    }
    .form-sub { font-size:14px; color:#4a5580; line-height:1.65; margin-bottom:32px; }

    /* FIELDS */
    .field { margin-bottom:15px; }
    .field-label {
      font-family:'DM Mono',monospace; font-size:10.5px; font-weight:500;
      text-transform:uppercase; letter-spacing:1.5px; color:#4a5580;
      margin-bottom:7px; display:block;
    }
    .field-input {
      width:100%; background:#fff; border:1.5px solid #e2e6f3;
      border-radius:11px; padding:13px 16px;
      font-family:'DM Sans',sans-serif; font-size:14.5px; font-weight:500;
      color:#0f1733; outline:none; transition:all .18s;
      box-shadow:0 1px 3px rgba(15,23,51,0.04);
    }
    .field-input:focus { border-color:#2563eb; box-shadow:0 0 0 4px rgba(37,99,235,0.09),0 1px 3px rgba(15,23,51,0.04); }
    .field-input::placeholder { color:#c0c8e0; font-weight:400; }
    .field-input.pr { padding-right:60px; }

    .pw-wrap { position:relative; }
    .pw-toggle {
      position:absolute; right:12px; top:50%; transform:translateY(-50%);
      background:#f0f2fa; border:none; border-radius:7px; padding:5px 8px;
      font-size:10px; font-weight:700; color:#8892b8;
      font-family:'DM Mono',monospace; letter-spacing:.8px; cursor:pointer; transition:all .15s;
    }
    .pw-toggle:hover { background:#e2e6f3; color:#2563eb; }

    /* FORGOT */
    .forgot { font-size:12px; color:#8892b8; font-weight:600; background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; text-decoration:underline; text-underline-offset:3px; margin-top:6px; display:block; text-align:right; transition:color .15s; }
    .forgot:hover { color:#2563eb; }

    /* ERROR */
    .error-box {
      display:flex; align-items:flex-start; gap:10px;
      background:#fef2f2; border:1px solid #fecaca; border-radius:12px;
      padding:12px 14px; font-size:13.5px; color:#dc2626;
      margin-bottom:16px; line-height:1.5;
    }
    .err-icon { width:18px; height:18px; border-radius:50%; background:#ef4444; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:900; flex-shrink:0; margin-top:1px; }

    /* SUBMIT */
    .submit-btn {
      width:100%;
      background:linear-gradient(135deg,#1d4ed8,#3b82f6);
      border:none; border-radius:13px; padding:15px 20px;
      font-family:'DM Sans',sans-serif; font-size:16px; font-weight:800; color:#fff;
      cursor:pointer; transition:all .2s;
      box-shadow:0 4px 18px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.12);
      display:flex; align-items:center; justify-content:center; gap:8px;
      margin-top:8px; letter-spacing:-0.1px; position:relative; overflow:hidden;
    }
    .submit-btn::after { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent); transition:left .5s; }
    .submit-btn:hover::after { left:100%; }
    .submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 26px rgba(37,99,235,0.36); }
    .submit-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }

    .spinner { width:16px; height:16px; border:2.5px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }

    /* DIVIDER */
    .divider {
      display:flex; align-items:center; gap:12px;
      margin:22px 0 18px;
    }
    .divider-line { flex:1; height:1px; background:#e2e6f3; }
    .divider-text { font-size:11.5px; color:#b0b8d4; font-family:'DM Mono',monospace; font-weight:500; white-space:nowrap; }

    /* REGISTER CTA */
    .register-cta {
      display:flex; align-items:center; justify-content:space-between;
      background:linear-gradient(135deg,#f8f9fe,#eff6ff);
      border:1.5px solid #e2e6f3; border-radius:14px;
      padding:16px 18px; cursor:pointer; transition:all .2s;
      text-decoration:none;
    }
    .register-cta:hover { border-color:#bfdbfe; box-shadow:0 4px 18px rgba(37,99,235,0.1); transform:translateY(-1px); }
    .rc-left { display:flex; flex-direction:column; gap:2px; }
    .rc-label { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#4a5580; }
    .rc-action { font-family:'Syne',sans-serif; font-size:15px; font-weight:800; color:#2563eb; }
    .rc-right { font-size:22px; opacity:.4; }

    /* REASSURANCE */
    .reassurance {
      margin-top:18px;
      background:linear-gradient(135deg,#f8f9fe,#eff6ff);
      border:1px solid #e2e6f3; border-radius:14px;
      padding:14px 16px;
      display:flex; align-items:flex-start; gap:10px;
    }
    .rea-icon { font-size:18px; flex-shrink:0; margin-top:1px; }
    .rea-title { font-family:'Syne',sans-serif; font-size:12.5px; font-weight:700; color:#0f1733; margin-bottom:2px; }
    .rea-body  { font-size:12px; color:#4a5580; line-height:1.6; }
  `

  return (
    <>
      <style>{CSS}</style>
      <div className="page">

        {/* ── LEFT PANEL ── */}
        <motion.div className="left-panel"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div className="lp-glow1" /><div className="lp-glow2" /><div className="lp-grid" />

          <button className="lp-brand" onClick={() => router.push("/")}>
            <div className="lp-logo">J</div>
            <span className="lp-name">JEET<span>.</span></span>
          </button>

          <motion.div className="lp-body"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55 }}>

            <div className="lp-tag">
              <span className="lp-tag-dot" />
              Your JEE prep, powered by someone who cracked it
            </div>

            <div className="lp-icon">📚</div>

            <div className="lp-title">
              Welcome<br />back<em>.</em>
            </div>
            <div className="lp-sub">
              Your mocks are waiting. Your analytics are ready. Everything you need is right here — let's pick up where you left off.
            </div>

            <div className="lp-stats">
              {[
                { n: "96.93", l: "Founder %ile" },
                { n: "750+",  l: "Questions"    },
                { n: "3 hrs", l: "Per Mock"     },
              ].map((s, i) => (
                <motion.div key={s.l} className="lp-stat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}>
                  <span className="lp-stat-n">{s.n}</span>
                  <span className="lp-stat-l">{s.l}</span>
                </motion.div>
              ))}
            </div>

            <div className="lp-feats">
              {[
                { ic: "📊", tx: "Deep performance analytics after every mock"   },
                { ic: "⏱", tx: "Real JEE exam timer and marking conditions"     },
                { ic: "🔍", tx: "Step-by-step solutions with concept tagging"    },
              ].map(f => (
                <div key={f.tx} className="lp-feat">
                  <div className="lp-feat-ic">{f.ic}</div>
                  {f.tx}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="lp-quote">
            "The last 2 weeks before JEE aren't about learning more — they're about executing better."
            <div className="lp-quote-attr">— Nathan Joseph Diniz · Founder, JEET · 96.93 %ile</div>
          </div>
        </motion.div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="rp-bg" />
          <motion.div className="form-card"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}>

            {/* nav row */}
            <div className="rp-nav">
              <button className="rp-brand" onClick={() => router.push("/")}>
                <div className="rp-logo">J</div>
                <span className="rp-name">JEET<span>.</span></span>
              </button>
              <button className="rp-home" onClick={() => router.push("/")}>← Home</button>
            </div>

            <div className="form-eyebrow">JEET · Sign In</div>
            <div className="form-title">Welcome back.</div>
            <div className="form-sub">
              Your mocks, analytics and progress are right where you left them.
            </div>

            {/* error */}
            <AnimatePresence>
              {error && (
                <motion.div className="error-box"
                  initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.2 }}>
                  <div className="err-icon">!</div><span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* email */}
            <div className="field">
              <label className="field-label">Email</label>
              <input className="field-input" type="email" placeholder="arjun@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>

            {/* password */}
            <div className="field">
              <label className="field-label">Password</label>
              <div className="pw-wrap">
                <input className="field-input pr" type={showPassword ? "text" : "password"}
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                <button className="pw-toggle" type="button" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
              <button className="forgot">Forgot password?</button>
            </div>

            <motion.button className="submit-btn" onClick={handleSubmit} disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}>
              {loading
                ? <><div className="spinner" /> Signing in…</>
                : "Sign In →"
              }
            </motion.button>

            {/* divider */}
            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">New to JEET?</span>
              <div className="divider-line" />
            </div>

            {/* register CTA card */}
            <motion.div className="register-cta"
              onClick={() => router.push("/signup")}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <div className="rc-left">
                <span className="rc-label">Don't have an account yet?</span>
                <span className="rc-action">Register now →</span>
              </div>
              <span className="rc-right">🎓</span>
            </motion.div>

            <div className="reassurance">
              <span className="rea-icon">🛡️</span>
              <div>
                <div className="rea-title">You're in safe hands.</div>
                <div className="rea-body">Your data is secure and your progress is always saved. Just sign in and keep going — you've got this.</div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </>
  )
}