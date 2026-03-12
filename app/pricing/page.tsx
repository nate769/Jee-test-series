"use client"

import { useState, useRef } from "react"
import { motion, useInView, useScroll, useTransform, Variants } from "framer-motion"
import { useRouter } from "next/navigation"

const themes = {
  light: {
    bg: "#f6f5f0", bgCard: "#edecea", bgCardHov: "#e4e3df",
    border: "#dddbd2", border2: "#c8c6bb",
    text: "#18170f", muted: "#6b6a5e", subtle: "#9c9b8e",
    accent: "#b8962e", accentLight: "#f5edcf", accentBd: "#dfc876",
    navBg: "rgba(246,245,240,0.94)",
    green: "#2d7a3a", greenLight: "#edf7ef", greenBd: "#a8d5b0",
  },
  dark: {
    bg: "#0c0c09", bgCard: "#131310", bgCardHov: "#1a1a16",
    border: "#222219", border2: "#2e2e24",
    text: "#f0efe6", muted: "#87867a", subtle: "#52524a",
    accent: "#c8a84b", accentLight: "#1c1806", accentBd: "#3d3318",
    navBg: "rgba(12,12,9,0.94)",
    green: "#4caf6a", greenLight: "#0d1f11", greenBd: "#1e4428",
  },
}

const easing = [0.22, 1, 0.36, 1] as [number, number, number, number]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.09, ease: easing },
  }),
}
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: (i: number = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.55, delay: i * 0.1, ease: easing },
  }),
}

interface RevealProps {
  children: React.ReactNode
  variant?: Variants
  custom?: number
}
function Reveal({ children, variant = fadeUp, custom = 0 }: RevealProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-70px" })
  return (
    <motion.div ref={ref} variants={variant} initial="hidden"
      animate={inView ? "visible" : "hidden"} custom={custom}>
      {children}
    </motion.div>
  )
}

const COUPONS: Record<string, { discount: number; plans: string[] }> = {
  "JEET100":  { discount: 100, plans: ["pro", "elite"] },
  "ELITE150": { discount: 150, plans: ["elite"]        },
  "LAUNCH50": { discount: 50,  plans: ["pro", "elite"] },
}

type PlanId = "starter" | "pro" | "elite"

const plans: {
  id: PlanId; label: string; badge: string | null; price: number; mrp: number;
  unit: string; tag: string; desc: string; features: string[];
  cta: string; highlight: boolean; couponEligible: boolean;
}[] = [
  {
    id: "starter", label: "Starter", badge: null, price: 249, mrp: 399,
    unit: "one-time", tag: "10 Mocks + 5 PYQs",
    desc: "Everything you need to begin. Full mocks, past papers, instant analysis.",
    features: ["10 × Full JEE Main mock tests","5 × Previous Year Question papers (as mocks)","+4/−1 scoring, instant results","Step-by-step solutions — all questions","Subject-wise percentile breakdown","Time-per-question analysis","Valid for 90 days"],
    cta: "Get Starter", highlight: false, couponEligible: false,
  },
  {
    id: "pro", label: "Pro", badge: "Most Popular", price: 499, mrp: 799,
    unit: "one-time", tag: "10 Mocks + 5 PYQs + Chapter Tests",
    desc: "The complete preparation engine. Mocks, PYQs, and deep chapter-level drilling.",
    features: ["10 × Full JEE Main mock tests","5 × Previous Year Question papers (as mocks)","Chapter-wise tests across PCM","Cross-test progress dashboard","Accuracy & speed trend graphs","Weak-topic identification engine","Priority email support","Valid for 120 days"],
    cta: "Get Pro", highlight: true, couponEligible: true,
  },
  {
    id: "elite", label: "Elite", badge: "Best Value", price: 749, mrp: 1299,
    unit: "one-time", tag: "15 Mocks + 10 PYQs + Chapter Tests + Mentorship",
    desc: "Full-season prep with personal guidance. For students who want every edge.",
    features: ["15 × Full JEE Main mock tests","10 × Previous Year Question papers (as mocks)","Chapter-wise tests across PCM","All Pro features included","Personal contact & advice (WhatsApp)","Personalised revision strategy PDF","Difficulty progression (calibrated)","Valid for 180 days"],
    cta: "Get Elite", highlight: false, couponEligible: true,
  },
]

const comparisonRows: { feature: string; starter: string | boolean; pro: string | boolean; elite: string | boolean }[] = [
  { feature: "Full JEE Main mocks",            starter: "10",   pro: "10",   elite: "15"   },
  { feature: "PYQ papers (as mocks)",          starter: "5",    pro: "5",    elite: "10"   },
  { feature: "Chapter-wise tests",             starter: false,  pro: true,   elite: true   },
  { feature: "+4/−1 scoring",                  starter: true,   pro: true,   elite: true   },
  { feature: "Step-by-step solutions",         starter: true,   pro: true,   elite: true   },
  { feature: "Subject-wise percentile",        starter: true,   pro: true,   elite: true   },
  { feature: "Cross-test progress dashboard",  starter: false,  pro: true,   elite: true   },
  { feature: "Weak-topic identification",      starter: false,  pro: true,   elite: true   },
  { feature: "Priority email support",         starter: false,  pro: true,   elite: true   },
  { feature: "Personal mentorship (WhatsApp)", starter: false,  pro: false,  elite: true   },
  { feature: "Revision strategy PDF",          starter: false,  pro: false,  elite: true   },
  { feature: "Validity",                       starter: "90d",  pro: "120d", elite: "180d" },
]

const faqs = [
  { q: "Why no coupon on the Starter plan?", a: "Starter is already priced at ₹249 — that's our loss-leader rate. Coupons apply to Pro and Elite where the value difference is substantial enough to justify a discount." },
  { q: "What are the coupon codes?", a: "Use JEET100 for ₹100 off Pro or Elite. Use ELITE150 for ₹150 off Elite only. Use LAUNCH50 for ₹50 off Pro or Elite. Codes are case-sensitive." },
  { q: "What payment methods are accepted?", a: "UPI (GPay, PhonePe, Paytm), Net Banking, and all major debit/credit cards via Razorpay." },
  { q: "Are the questions original?", a: "Every mock question is written to NTA difficulty and pattern standards. PYQs are official past-year papers presented in exam interface." },
  { q: "What does 'personal mentorship' mean?", a: "Elite plan holders get direct WhatsApp access to Nathan for strategy advice, doubt resolution, and revision planning — not a bot, not a form." },
  { q: "Can I upgrade plans later?", a: "Yes — reach out via email or WhatsApp with your account details and we'll upgrade you at the price difference." },
]

export default function PricingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [couponInputs, setCouponInputs] = useState<Record<string, string>>({ pro: "", elite: "" })
  const [appliedCoupons, setAppliedCoupons] = useState<Record<string, { code: string; discount: number } | null>>({ pro: null, elite: null })
  const [couponErrors, setCouponErrors] = useState<Record<string, string>>({ pro: "", elite: "" })
  const router = useRouter()
  const t = themes[theme]
  const isDark = theme === "dark"

  const { scrollYProgress } = useScroll()
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

  const applyCoupon = (planId: string) => {
    const code = couponInputs[planId].trim().toUpperCase()
    const coupon = COUPONS[code]
    if (!coupon) {
      setCouponErrors(e => ({ ...e, [planId]: "Invalid coupon code." }))
      setAppliedCoupons(a => ({ ...a, [planId]: null }))
      return
    }
    if (!coupon.plans.includes(planId)) {
      setCouponErrors(e => ({ ...e, [planId]: `Code "${code}" is not valid for this plan.` }))
      setAppliedCoupons(a => ({ ...a, [planId]: null }))
      return
    }
    setCouponErrors(e => ({ ...e, [planId]: "" }))
    setAppliedCoupons(a => ({ ...a, [planId]: { code, discount: coupon.discount } }))
  }

  const removeCoupon = (planId: string) => {
    setAppliedCoupons(a => ({ ...a, [planId]: null }))
    setCouponInputs(i => ({ ...i, [planId]: "" }))
    setCouponErrors(e => ({ ...e, [planId]: "" }))
  }

  const getFinalPrice = (plan: typeof plans[number]) => {
    if (!plan.couponEligible) return plan.price
    const applied = appliedCoupons[plan.id]
    if (!applied) return plan.price
    return Math.max(0, plan.price - applied.discount)
  }

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'DM Sans', sans-serif; background: ${t.bg}; color: ${t.text}; -webkit-font-smoothing: antialiased; transition: background 0.4s, color 0.4s; }
    ::selection { background: ${t.accent}33; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${t.bg}; }
    ::-webkit-scrollbar-thumb { background: ${t.border2}; border-radius: 2px; }

    .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 200; height: 62px; background: ${t.navBg}; backdrop-filter: blur(20px) saturate(180%); border-bottom: 1px solid ${t.border}; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; transition: background 0.4s, border-color 0.4s; }
    .nav-brand { display: flex; align-items: center; gap: 12px; cursor: pointer; background: none; border: none; }
    .nav-logo { width: 34px; height: 34px; background: ${t.accent}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800; color: #fff; }
    .nav-wordmark { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: ${t.text}; letter-spacing: -0.3px; }
    .nav-wordmark span { color: ${t.accent}; }
    .nav-right { display: flex; align-items: center; gap: 6px; }
    .nav-link { padding: 7px 16px; border-radius: 8px; font-size: 13.5px; font-weight: 500; color: ${t.muted}; cursor: pointer; border: none; background: transparent; font-family: 'DM Sans', sans-serif; transition: all .15s; }
    .nav-link:hover { color: ${t.text}; background: ${t.bgCard}; }
    .nav-link.active { color: ${t.text}; font-weight: 600; }
    .theme-toggle { width: 36px; height: 36px; border-radius: 8px; border: 1px solid ${t.border}; background: ${t.bgCard}; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 15px; transition: all .2s; margin-left: 4px; }
    .theme-toggle:hover { border-color: ${t.border2}; }
    .nav-cta { margin-left: 6px; padding: 8px 20px; border-radius: 8px; background: ${t.text}; border: none; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; color: ${isDark ? "#0c0c09" : "#f6f5f0"}; cursor: pointer; transition: opacity .15s, transform .15s; }
    .nav-cta:hover { opacity: 0.85; transform: translateY(-1px); }

    .progress-bar { position: fixed; top: 62px; left: 0; height: 2px; background: ${t.accent}; z-index: 300; transform-origin: left; }

    .page { padding-top: 62px; }

    .pricing-hero { text-align: center; padding: 80px 48px 60px; max-width: 720px; margin: 0 auto; }
    .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: ${t.accentLight}; border: 1px solid ${t.accentBd}; border-radius: 100px; padding: 5px 14px; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; color: ${t.accent}; letter-spacing: 0.5px; margin-bottom: 28px; }
    .eyebrow-dot { width: 5px; height: 5px; border-radius: 50%; background: ${t.accent}; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .pricing-hero h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(44px, 7vw, 76px); font-weight: 600; line-height: 0.97; letter-spacing: -2px; color: ${t.text}; margin-bottom: 20px; }
    .pricing-hero h1 em { font-style: italic; color: ${t.accent}; }
    .pricing-hero p { font-size: 16px; color: ${t.muted}; line-height: 1.75; max-width: 480px; margin: 0 auto; }
    .pricing-hero p strong { color: ${t.text}; font-weight: 600; }

    .section { max-width: 1060px; margin: 0 auto; padding: 72px 48px; }
    .divider-wrap { max-width: 1060px; margin: 0 auto; padding: 0 48px; }
    .divider-line { height: 1px; background: ${t.border}; }
    .sec-label { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 2.5px; color: ${t.subtle}; margin-bottom: 8px; }
    .sec-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(26px, 3.5vw, 38px); font-weight: 600; color: ${t.text}; letter-spacing: -0.8px; line-height: 1.1; margin-bottom: 48px; }
    .sec-title em { font-style: italic; color: ${t.accent}; }

    .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-items: start; }
    .plan-card { background: ${t.bgCard}; border: 1.5px solid ${t.border}; border-radius: 18px; padding: 32px 28px; position: relative; transition: border-color .2s, background .2s, transform .25s, box-shadow .25s; display: flex; flex-direction: column; }
    .plan-card:hover { border-color: ${t.border2}; background: ${t.bgCardHov}; transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,${isDark ? ".3" : ".07"}); }
    .plan-card.highlighted { border-color: ${t.accent}; background: ${isDark ? "#161208" : "#fefbf2"}; transform: scale(1.025); }
    .plan-card.highlighted:hover { transform: scale(1.025) translateY(-4px); box-shadow: 0 16px 48px rgba(184,150,46,${isDark ? ".2" : ".14"}); }
    .plan-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: ${t.accent}; color: #fff; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 1px; padding: 4px 14px; border-radius: 100px; white-space: nowrap; text-transform: uppercase; }
    .plan-label { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: ${t.subtle}; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px; }
    .plan-tag { font-size: 11px; color: ${t.accent}; font-family: 'DM Mono', monospace; letter-spacing: 0.3px; margin-bottom: 20px; line-height: 1.5; }

    .plan-price-area { margin-bottom: 16px; }
    .plan-mrp { font-family: 'DM Mono', monospace; font-size: 15px; color: ${t.subtle}; text-decoration: line-through; margin-bottom: 2px; }
    .plan-price-row { display: flex; align-items: baseline; gap: 4px; }
    .plan-currency { font-family: 'DM Mono', monospace; font-size: 20px; color: ${t.accent}; }
    .plan-amount { font-family: 'DM Mono', monospace; font-size: 52px; font-weight: 300; color: ${t.text}; line-height: 1; letter-spacing: -2px; }
    .plan-amount.struck { text-decoration: line-through; color: ${t.subtle}; font-size: 32px; }
    .plan-final-price { display: flex; align-items: baseline; gap: 4px; margin-top: 4px; }
    .plan-final-currency { font-family: 'DM Mono', monospace; font-size: 16px; color: ${t.green}; }
    .plan-final-amount { font-family: 'DM Mono', monospace; font-size: 40px; font-weight: 400; color: ${t.green}; line-height: 1; letter-spacing: -1.5px; }
    .plan-savings-badge { display: inline-flex; align-items: center; gap: 5px; background: ${t.greenLight}; border: 1px solid ${t.greenBd}; border-radius: 6px; padding: 3px 10px; font-family: 'DM Mono', monospace; font-size: 10px; color: ${t.green}; font-weight: 600; margin-top: 8px; letter-spacing: 0.3px; }
    .plan-unit { font-size: 11px; color: ${t.subtle}; margin-top: 4px; font-family: 'DM Mono', monospace; margin-bottom: 6px; }
    .plan-desc { font-size: 13px; color: ${t.muted}; line-height: 1.65; margin-bottom: 20px; }
    .plan-divider { height: 1px; background: ${t.border}; margin-bottom: 18px; }
    .plan-features { list-style: none; flex: 1; margin-bottom: 24px; }
    .plan-features li { display: flex; align-items: flex-start; gap: 9px; font-size: 12.5px; color: ${t.muted}; line-height: 1.55; margin-bottom: 9px; }
    .plan-features li::before { content: "✓"; color: ${t.accent}; font-weight: 700; font-size: 11px; margin-top: 1px; flex-shrink: 0; }

    .coupon-box { margin-bottom: 16px; }
    .coupon-row { display: flex; gap: 8px; }
    .coupon-input { flex: 1; padding: 9px 12px; border-radius: 8px; border: 1px solid ${t.border2}; background: ${t.bg}; font-family: 'DM Mono', monospace; font-size: 12px; color: ${t.text}; outline: none; letter-spacing: 1px; transition: border-color .2s; }
    .coupon-input:focus { border-color: ${t.accent}; }
    .coupon-input::placeholder { color: ${t.subtle}; letter-spacing: 0; }
    .coupon-apply-btn { padding: 9px 14px; border-radius: 8px; background: ${t.accentLight}; border: 1px solid ${t.accentBd}; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; color: ${t.accent}; cursor: pointer; white-space: nowrap; transition: all .2s; }
    .coupon-apply-btn:hover { background: ${t.accent}; color: #fff; border-color: ${t.accent}; }
    .coupon-error { font-size: 11px; color: #d94f4f; margin-top: 6px; font-family: 'DM Mono', monospace; }
    .coupon-success { display: flex; align-items: center; justify-content: space-between; background: ${t.greenLight}; border: 1px solid ${t.greenBd}; border-radius: 8px; padding: 8px 12px; }
    .coupon-success-text { font-family: 'DM Mono', monospace; font-size: 11px; color: ${t.green}; font-weight: 600; }
    .coupon-remove { font-size: 11px; color: ${t.subtle}; cursor: pointer; background: none; border: none; font-family: 'DM Mono', monospace; transition: color .2s; }
    .coupon-remove:hover { color: #d94f4f; }
    .coupon-hint { font-size: 10.5px; color: ${t.subtle}; font-family: 'DM Mono', monospace; margin-top: 5px; }

    .plan-cta { width: 100%; padding: 13px 20px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; letter-spacing: -0.1px; }
    .plan-cta.default { background: ${t.bgCard}; border: 1.5px solid ${t.border2}; color: ${t.text}; }
    .plan-cta.default:hover { background: ${t.bgCardHov}; border-color: ${t.subtle}; transform: translateY(-1px); }
    .plan-cta.accent-btn { background: ${t.accent}; border: none; color: #fff; }
    .plan-cta.accent-btn:hover { opacity: 0.88; transform: translateY(-2px); }

    .coupon-banner { display: flex; align-items: flex-start; gap: 16px; background: ${isDark ? "#161208" : "#fffbf0"}; border: 1.5px dashed ${t.accentBd}; border-radius: 14px; padding: 24px 28px; margin-bottom: 48px; }
    .coupon-banner-icon { font-size: 28px; flex-shrink: 0; margin-top: 2px; }
    .coupon-banner-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: ${t.text}; margin-bottom: 8px; }
    .coupon-code-pill { display: inline-block; background: ${t.accentLight}; border: 1px solid ${t.accentBd}; border-radius: 6px; padding: 3px 10px; font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 600; color: ${t.accent}; margin: 2px 4px 2px 0; letter-spacing: 1px; cursor: default; }
    .coupon-banner-note { font-size: 12px; color: ${t.muted}; margin-top: 8px; line-height: 1.6; }

    .compare-wrap { overflow-x: auto; }
    .compare-table { width: 100%; border-collapse: collapse; border: 1px solid ${t.border}; border-radius: 14px; overflow: hidden; }
    .compare-table th { background: ${t.bgCard}; padding: 16px 20px; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px; color: ${t.subtle}; border-bottom: 1px solid ${t.border}; text-align: left; }
    .compare-table th:not(:first-child) { text-align: center; }
    .compare-table td { padding: 13px 20px; font-size: 12.5px; color: ${t.muted}; border-bottom: 1px solid ${t.border}; background: ${t.bgCard}; }
    .compare-table tr:last-child td { border-bottom: none; }
    .compare-table tr:hover td { background: ${t.bgCardHov}; }
    .compare-table td:not(:first-child) { text-align: center; }
    .compare-table td.check { color: ${t.accent}; font-size: 15px; font-weight: 700; }
    .compare-table td.dash { color: ${t.subtle}; }
    .compare-table td.val { color: ${t.text}; font-family: 'DM Mono', monospace; font-size: 12px; }
    .compare-table th.hl, .compare-table td.hl { background: ${isDark ? "#161208" : "#fefbf2"}; }
    .compare-table tr:hover td.hl { background: ${isDark ? "#1c1609" : "#fdf8ed"}; }

    .faq-list { display: flex; flex-direction: column; }
    .faq-item { border-bottom: 1px solid ${t.border}; overflow: hidden; }
    .faq-item:first-child { border-top: 1px solid ${t.border}; }
    .faq-question { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 20px 0; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: ${t.text}; text-align: left; gap: 16px; transition: color .15s; }
    .faq-question:hover { color: ${t.accent}; }
    .faq-chevron { font-size: 18px; color: ${t.subtle}; flex-shrink: 0; transition: transform .3s ease; }
    .faq-chevron.open { transform: rotate(45deg); color: ${t.accent}; }
    .faq-answer { font-size: 13.5px; color: ${t.muted}; line-height: 1.75; padding-bottom: 20px; max-width: 680px; }

    .guarantee-bar { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; background: ${t.accentLight}; border: 1px solid ${t.accentBd}; border-radius: 14px; padding: 28px 32px; }
    .guarantee-icon { font-size: 32px; flex-shrink: 0; }
    .guarantee-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: ${t.text}; margin-bottom: 5px; }
    .guarantee-body { font-size: 13px; color: ${t.muted}; line-height: 1.65; }

    .cta-section { text-align: center; padding: 80px 48px 100px; background: ${t.bgCard}; border-top: 1px solid ${t.border}; }
    .cta-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(36px, 5.5vw, 56px); font-weight: 600; color: ${t.text}; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px; }
    .cta-title em { font-style: italic; color: ${t.accent}; }
    .cta-sub { font-size: 15px; color: ${t.muted}; margin-bottom: 36px; }
    .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn-primary { padding: 14px 28px; border-radius: 10px; background: ${t.text}; border: none; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; color: ${isDark ? "#0c0c09" : "#f6f5f0"}; cursor: pointer; transition: transform .2s, opacity .2s; }
    .btn-primary:hover { opacity: 0.82; transform: translateY(-2px); }
    .btn-accent { padding: 14px 28px; border-radius: 10px; background: ${t.accent}; border: none; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; transition: transform .2s, opacity .2s; }
    .btn-accent:hover { opacity: 0.88; transform: translateY(-2px); }
    .btn-secondary { padding: 14px 28px; border-radius: 10px; background: transparent; border: 1.5px solid ${t.border2}; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: ${t.muted}; cursor: pointer; transition: all .2s; }
    .btn-secondary:hover { color: ${t.text}; border-color: ${t.subtle}; transform: translateY(-2px); }
    .cta-note { margin-top: 18px; font-size: 12px; color: ${t.subtle}; font-family: 'DM Mono', monospace; }

    .footer { border-top: 1px solid ${t.border}; padding: 32px 48px; display: flex; align-items: center; justify-content: space-between; }
    .footer-brand { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; color: ${t.text}; background: none; border: none; cursor: pointer; }
    .footer-brand span { color: ${t.accent}; }
    .footer-right { font-family: 'DM Mono', monospace; font-size: 11px; color: ${t.subtle}; }

    @media (max-width: 900px) { .plans-grid { grid-template-columns: 1fr; } .plan-card.highlighted { transform: none; } .plan-card.highlighted:hover { transform: translateY(-4px); } }
    @media (max-width: 768px) { .nav { padding: 0 20px; } .section { padding: 56px 20px; } .divider-wrap { padding: 0 20px; } .pricing-hero { padding: 60px 20px 48px; } .cta-section { padding: 60px 20px 80px; } .footer { padding: 24px 20px; flex-direction: column; gap: 12px; text-align: center; } .coupon-banner { padding: 18px 20px; } }
  `

  return (
    <>
      <style>{CSS}</style>
      <motion.div className="progress-bar" style={{ width: progressWidth }} />

      <motion.nav className="nav" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easing }}>
        <button className="nav-brand" onClick={() => router.push("/")}>
          <div className="nav-logo">J</div>
          <span className="nav-wordmark">JEET<span>.</span></span>
        </button>
        <div className="nav-right">
          <button className="nav-link" onClick={() => router.push("/")}>About</button>
          <button className="nav-link active">Pricing</button>
          <button className="theme-toggle" onClick={() => setTheme(isDark ? "light" : "dark")}>{isDark ? "☀" : "◑"}</button>
          <button className="nav-cta" onClick={() => router.push("/signup")}>Register Now →</button>
        </div>
      </motion.nav>

      <div className="page">
        <div className="pricing-hero">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <div className="hero-eyebrow"><span className="eyebrow-dot" />No subscriptions · One-time · Pay per plan</div>
          </motion.div>
          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}>
            Serious prep.<br /><em>Fair price.</em>
          </motion.h1>
          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            Coaching institutes charge <strong>₹50,000+</strong>. JEET charges ₹249 to start.
            The difference is ideology, not quality.
          </motion.p>
        </div>

        <div className="section">
          <Reveal>
            <div className="sec-label">Choose Your Plan</div>
            <div className="sec-title">Mock <em>Test Series</em></div>
            <div className="coupon-banner">
              <span className="coupon-banner-icon">🏷</span>
              <div>
                <div className="coupon-banner-title">Launch Offer — Coupon Codes Available</div>
                <div>
                  <span className="coupon-code-pill">JEET100</span> — ₹100 off Pro or Elite<br />
                  <span className="coupon-code-pill">ELITE150</span> — ₹150 off Elite only<br />
                  <span className="coupon-code-pill">LAUNCH50</span> — ₹50 off Pro or Elite
                </div>
                <div className="coupon-banner-note">↳ Enter the code in the coupon box on the plan card. Starter plan is already at minimum price — no coupon needed.</div>
              </div>
            </div>
          </Reveal>

          <div className="plans-grid">
            {plans.map((plan, i) => {
              const applied = appliedCoupons[plan.id]
              const finalPrice = getFinalPrice(plan)
              const hasCoupon = !!applied

              return (
                <Reveal key={plan.id} variant={scaleIn} custom={i * 0.1}>
                  <div className={`plan-card ${plan.highlight ? "highlighted" : ""}`}>
                    {plan.badge && <div className="plan-badge">{plan.badge}</div>}
                    <div className="plan-label">{plan.label}</div>
                    <div className="plan-tag">{plan.tag}</div>
                    <div className="plan-price-area">
                      <div className="plan-mrp">₹{plan.mrp}</div>
                      <div className="plan-price-row">
                        <span className="plan-currency" style={{ opacity: hasCoupon ? 0.4 : 1 }}>₹</span>
                        <span className={`plan-amount ${hasCoupon ? "struck" : ""}`}>{plan.price}</span>
                      </div>
                      {hasCoupon && (
                        <div className="plan-final-price">
                          <span className="plan-final-currency">₹</span>
                          <span className="plan-final-amount">{finalPrice}</span>
                        </div>
                      )}
                      {hasCoupon && applied ? (
                        <div className="plan-savings-badge">🎉 YOU SAVE ₹{plan.price - finalPrice + (plan.mrp - plan.price)}</div>
                      ) : (
                        <div className="plan-savings-badge" style={{ background: "transparent", border: "none", color: t.subtle }}>
                          Save ₹{plan.mrp - plan.price} vs MRP
                        </div>
                      )}
                    </div>
                    <div className="plan-unit">{plan.unit}</div>
                    <div className="plan-desc">{plan.desc}</div>
                    <div className="plan-divider" />
                    <ul className="plan-features">
                      {plan.features.map(f => <li key={f}>{f}</li>)}
                    </ul>

                    {plan.couponEligible && (
                      <div className="coupon-box">
                        {!applied ? (
                          <>
                            <div className="coupon-row">
                              <input className="coupon-input" placeholder="Enter coupon code"
                                value={couponInputs[plan.id] ?? ""}
                                onChange={e => setCouponInputs(prev => ({ ...prev, [plan.id]: e.target.value }))}
                                onKeyDown={e => e.key === "Enter" && applyCoupon(plan.id)} />
                              <button className="coupon-apply-btn" onClick={() => applyCoupon(plan.id)}>Apply</button>
                            </div>
                            {couponErrors[plan.id] && <div className="coupon-error">✗ {couponErrors[plan.id]}</div>}
                            <div className="coupon-hint">↳ Have a code? Enter above for instant discount</div>
                          </>
                        ) : (
                          <div className="coupon-success">
                            <span className="coupon-success-text">✓ {applied.code} — ₹{applied.discount} off applied</span>
                            <button className="coupon-remove" onClick={() => removeCoupon(plan.id)}>Remove</button>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      className={`plan-cta ${plan.highlight ? "accent-btn" : "default"}`}
                      onClick={() => router.push(`/signup?plan=${plan.id}${hasCoupon && applied ? `&coupon=${applied.code}` : ""}`)}>
                      {plan.cta} →
                    </button>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>

        <div className="divider-wrap"><div className="divider-line" /></div>

        <div className="section">
          <Reveal>
            <div className="sec-label">Compare Plans</div>
            <div className="sec-title">What's <em>included</em></div>
          </Reveal>
          <Reveal variant={scaleIn} custom={0.1}>
            <div className="compare-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th style={{ width: "40%" }}>Feature</th>
                    <th>Starter · ₹249</th>
                    <th className="hl">Pro · ₹499</th>
                    <th>Elite · ₹749</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map(row => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>
                      {(["starter", "pro", "elite"] as const).map((key, ci) => {
                        const val = row[key]
                        const cls = ci === 1 ? "hl" : ""
                        if (val === true)  return <td key={key} className={`check ${cls}`}>✓</td>
                        if (val === false) return <td key={key} className={`dash ${cls}`}>—</td>
                        return <td key={key} className={`val ${cls}`}>{val}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>

        <div className="divider-wrap"><div className="divider-line" /></div>

        <div className="section" style={{ paddingBottom: 0 }}>
          <Reveal>
            <div className="guarantee-bar">
              <span className="guarantee-icon">🛡</span>
              <div>
                <div className="guarantee-title">Quality Guarantee</div>
                <div className="guarantee-body">If any test has a verified factual error, we'll credit the full amount back — no questions asked. Report within 48 hours via email or WhatsApp.</div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="section">
          <Reveal>
            <div className="sec-label">Common Questions</div>
            <div className="sec-title"><em>FAQ</em></div>
          </Reveal>
          <Reveal custom={0.1}>
            <div className="faq-list">
              {faqs.map((faq, i) => (
                <div className="faq-item" key={i}>
                  <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{faq.q}</span>
                    <span className={`faq-chevron ${openFaq === i ? "open" : ""}`}>+</span>
                  </button>
                  <motion.div initial={false}
                    animate={{ height: openFaq === i ? "auto" : 0, opacity: openFaq === i ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: easing }}
                    style={{ overflow: "hidden" }}>
                    <div className="faq-answer">{faq.a}</div>
                  </motion.div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="cta-section">
          <Reveal>
            <div className="cta-title">Still deciding?<br /><em>Start at ₹249.</em></div>
            <div className="cta-sub">One plan. Full analysis. No subscription.</div>
            <div className="cta-btns">
              <button className="btn-accent" onClick={() => router.push("/signup")}>Register Now →</button>
              <button className="btn-primary" onClick={() => router.push("/")}>About JEET</button>
            </div>
            <div className="cta-note">No subscription · One-time payment · Instant access</div>
          </Reveal>
        </div>

        <footer className="footer">
          <button className="footer-brand" onClick={() => router.push("/")}>JEET<span>.</span></button>
          <div className="footer-right">India's sharpest JEE test series · © 2025 JEET</div>
        </footer>
      </div>
    </>
  )
}