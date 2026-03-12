"use client"

import { useEffect, useRef } from "react"
import { motion, useInView, useScroll, useTransform, useSpring, Variants } from "framer-motion"
import { useRouter } from "next/navigation"

const c = {
  bg:          "#ffffff",
  bgCard:      "#f7f8fc",
  bgCardHov:   "#eef1f9",
  border:      "#e2e6f3",
  border2:     "#c8d0e8",
  text:        "#0f1733",
  muted:       "#4a5580",
  subtle:      "#8892b8",
  accent:      "#2563eb",
  accent2:     "#3b82f6",
  accentLight: "#eff6ff",
  accentBd:    "#bfdbfe",
  accentGlow:  "rgba(37,99,235,0.15)",
  navBg:       "rgba(255,255,255,0.95)",
}

const easing = [0.22, 1, 0.36, 1] as [number, number, number, number]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, delay: i * 0.09, ease: easing },
  }),
}
const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -28 },
  visible: (i: number = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: easing },
  }),
}
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: (i: number = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.55, delay: i * 0.09, ease: easing },
  }),
}

interface RevealProps {
  children: React.ReactNode
  variant?: Variants
  custom?: number
  className?: string
}
function Reveal({ children, variant = fadeUp, custom = 0, className = "" }: RevealProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div ref={ref} variants={variant} initial="hidden"
      animate={inView ? "visible" : "hidden"} custom={custom} className={className}>
      {children}
    </motion.div>
  )
}

function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scene: any, camera: any, renderer: any, particles: any, frame: number

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function init(THREE: any) {
      scene    = new THREE.Scene()
      camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
      camera.position.z = 5
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x000000, 0)
      if (mountRef.current) mountRef.current.appendChild(renderer.domElement)

      const count = 1800
      const geo   = new THREE.BufferGeometry()
      const pos   = new Float32Array(count * 3)
      const spd   = new Float32Array(count)
      for (let i = 0; i < count; i++) {
        pos[i*3]   = (Math.random()-0.5)*20
        pos[i*3+1] = (Math.random()-0.5)*14
        pos[i*3+2] = (Math.random()-0.5)*8
        spd[i]     = 0.15 + Math.random()*0.5
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
      geo.setAttribute("speed",    new THREE.BufferAttribute(spd, 1))
      const mat = new THREE.PointsMaterial({ color: 0x2563eb, size: 0.022, transparent: true, opacity: 0.35, sizeAttenuation: true })
      particles = new THREE.Points(geo, mat)
      scene.add(particles)

      const lineMat = new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.06 })
      for (let i = 0; i < 40; i++) {
        const pts = [
          new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*14, (Math.random()-0.5)*2),
          new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*14, (Math.random()-0.5)*2),
        ]
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat))
      }

      const mouse = { x: 0, y: 0 }
      window.addEventListener("mousemove", (e: MouseEvent) => {
        mouse.x = (e.clientX / window.innerWidth  - 0.5) * 0.5
        mouse.y = (e.clientY / window.innerHeight - 0.5) * 0.25
      })
      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      })

      let tick = 0
      function animate() {
        frame = requestAnimationFrame(animate)
        tick += 0.003
        const p = particles.geometry.attributes.position.array as Float32Array
        const s = particles.geometry.attributes.speed.array as Float32Array
        for (let i = 0; i < count; i++) {
          p[i*3+1] += s[i] * 0.0018
          if (p[i*3+1] > 7) p[i*3+1] = -7
        }
        particles.geometry.attributes.position.needsUpdate = true
        particles.rotation.y = mouse.x * 0.25 + tick * 0.04
        particles.rotation.x = mouse.y * 0.15
        renderer.render(scene, camera)
      }
      animate()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    if (w.__THREE__) {
      init(w.__THREE__)
    } else {
      const s = document.createElement("script")
      s.src    = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
      s.onload = () => { w.__THREE__ = w.THREE; init(w.THREE) }
      document.head.appendChild(s)
    }
    return () => {
      cancelAnimationFrame(frame)
      if (renderer && mountRef.current) {
        try { mountRef.current.removeChild(renderer.domElement) } catch {}
        renderer.dispose()
      }
    }
  }, [])
  return <div ref={mountRef} style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0 }} />
}

const LOTTIE_TROPHY = "https://assets10.lottiefiles.com/packages/lf20_touohxv0.json"
const LOTTIE_ROCKET = "https://assets3.lottiefiles.com/packages/lf20_jbb0zhng.json"

interface LottiePlayerProps { src: string; size?: number }
function LottiePlayer({ src, size = 80 }: LottiePlayerProps) {
  useEffect(() => {
    if (!customElements.get("lottie-player")) {
      const s = document.createElement("script")
      s.src = "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"
      document.head.appendChild(s)
    }
  }, [])
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      {/* @ts-expect-error – lottie-player is a custom element */}
      <lottie-player src={src} background="transparent" speed="1"
        style={{ width: size, height: size }} autoplay loop />
    </div>
  )
}

interface PulseBadgeProps { children: React.ReactNode }
function PulseBadge({ children }: PulseBadgeProps) {
  return (
    <motion.div
      style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}
      animate={{ y: [0, -7, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
      <motion.div
        style={{ position:"absolute", inset:-10, borderRadius:"50%", border:"1.5px solid #2563eb", opacity:0.25 }}
        animate={{ scale:[1,1.3,1], opacity:[0.25,0,0.25] }}
        transition={{ duration: 2.8, repeat: Infinity }} />
      {children}
    </motion.div>
  )
}

export default function JEETAboutPage() {
  const router = useRouter()
  const { scrollYProgress } = useScroll()
  const spring        = useSpring(scrollYProgress, { stiffness: 100, damping: 28 })
  const progressWidth = useTransform(spring, [0, 1], ["0%", "100%"])

  const subjects = [
    { name: "Chemistry",   percentile: 98.29, rank: "2%"  },
    { name: "Physics",     percentile: 94.44, rank: "6%"  },
    { name: "Mathematics", percentile: 94.43, rank: "6%"  },
  ]

  const stats = [
    { n: "96.93",   label: "Overall Percentile",               suffix: "%ile" },
    { n: "Top 3%",  label: "of all JEE candidates",            suffix: ""     },
    { n: "₹249",    label: "Starter plan — 10 mocks + PYQs",   suffix: ""     },
    { n: "2 weeks", label: "is all you need to turn it around", suffix: ""     },
  ]

  const pillars = [
    { num: "01", title: "Engineered for Accuracy",        body: "Every question calibrated to NTA difficulty. No filler, no recycled content — only questions that sharpen your actual exam instinct." },
    { num: "02", title: "Deep Performance Intelligence",  body: "Subject-wise percentile breakdowns, time-per-question analysis, concept tagging. Know precisely what to fix, not just your score." },
    { num: "03", title: "Real Exam Infrastructure",       body: "Timed, full-length 75-question papers. +4/−1 marking. Built on the same pattern as JEE Main. No compromises." },
    { num: "04", title: "Priced for Meritocracy",         body: "Coaching institutes charge ₹50,000. A JEET full series costs ₹249. Serious preparation should not be a privilege." },
  ]

  const features = [
    { icon: "◈", title: "Full JEE Pattern Mocks",    desc: "75Q · 3hrs · PCM — exact exam replication"         },
    { icon: "◈", title: "Instant Score & Breakdown", desc: "+4/−1 scored the moment you submit"                },
    { icon: "◈", title: "Step-by-step Solutions",    desc: "Formula, concept tag, and explanation per question" },
    { icon: "◈", title: "PYQ Papers as Mocks",       desc: "Past year papers in full exam interface"            },
    { icon: "◈", title: "Percentile Benchmarking",   desc: "See where you stand against all test-takers live"   },
    { icon: "◈", title: "Progress Dashboard",        desc: "Track accuracy, speed, and weak areas over time"    },
  ]

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'DM Sans', sans-serif; background: #ffffff; color: #0f1733; -webkit-font-smoothing: antialiased; }
    ::selection { background: rgba(37,99,235,0.12); }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #ffffff; }
    ::-webkit-scrollbar-thumb { background: #c8d0e8; border-radius: 2px; }

    .progress-bar { position: fixed; top: 0; left: 0; height: 2px; background: linear-gradient(90deg, #1d4ed8, #60a5fa); z-index: 400; }
    .nav { position: fixed; top: 2px; left: 0; right: 0; z-index: 300; height: 60px; background: rgba(255,255,255,0.95); backdrop-filter: blur(24px) saturate(180%); border-bottom: 1px solid #e2e6f3; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
    .nav-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; background: none; border: none; }
    .nav-logo { width: 32px; height: 32px; background: linear-gradient(135deg, #1d4ed8, #3b82f6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800; color: #fff; box-shadow: 0 2px 12px rgba(37,99,235,0.25); flex-shrink: 0; }
    .nav-wordmark { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: #0f1733; }
    .nav-wordmark span { color: #2563eb; }
    .nav-right { display: flex; align-items: center; gap: 4px; }
    .nav-link { padding: 7px 14px; border-radius: 8px; font-size: 14px; font-weight: 500; color: #4a5580; cursor: pointer; border: none; background: transparent; font-family: 'DM Sans', sans-serif; transition: all .15s; white-space: nowrap; }
    .nav-link:hover { color: #0f1733; background: #f7f8fc; }
    .nav-cta { margin-left: 6px; padding: 8px 18px; border-radius: 8px; background: linear-gradient(135deg, #1d4ed8, #3b82f6); border: none; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; color: #fff; cursor: pointer; transition: opacity .15s, transform .15s; box-shadow: 0 4px 14px rgba(37,99,235,0.25); white-space: nowrap; }
    .nav-cta:hover { opacity: 0.88; transform: translateY(-1px); }

    .urgency-banner { position: fixed; top: 62px; left: 0; right: 0; z-index: 290; background: linear-gradient(90deg, #1e3a8a, #1d4ed8, #2563eb); padding: 9px 40px; display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
    .urgency-text { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.93); }
    .urgency-btn { padding: 5px 14px; border-radius: 6px; background: #fff; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700; color: #1d4ed8; cursor: pointer; transition: opacity .15s; white-space: nowrap; }
    .urgency-btn:hover { opacity: 0.85; }

    .hero { position: relative; min-height: 100vh; display: flex; align-items: center; padding: 148px 40px 80px; overflow: hidden; background: #ffffff; }
    .hero-content { position: relative; z-index: 2; max-width: 760px; }
    .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 100px; padding: 6px 16px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #2563eb; margin-bottom: 28px; }
    .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2563eb; animation: blink 2s infinite; flex-shrink: 0; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
    .hero-h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(44px, 7.5vw, 86px); font-weight: 600; line-height: 0.97; letter-spacing: -2px; color: #0f1733; margin-bottom: 24px; }
    .hero-h1 em { font-style: italic; background: linear-gradient(135deg, #1d4ed8, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-sub { font-size: 17px; line-height: 1.82; color: #4a5580; max-width: 520px; margin-bottom: 40px; }
    .hero-sub strong { color: #0f1733; font-weight: 600; }
    .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .btn-accent { padding: 14px 26px; border-radius: 10px; background: linear-gradient(135deg, #1d4ed8, #3b82f6); border: none; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; color: #fff; cursor: pointer; transition: transform .2s, opacity .2s; box-shadow: 0 6px 22px rgba(37,99,235,0.25); }
    .btn-accent:hover { opacity: 0.88; transform: translateY(-2px); }
    .btn-primary { padding: 14px 26px; border-radius: 10px; background: #0f1733; border: none; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; cursor: pointer; transition: transform .2s, opacity .2s; }
    .btn-primary:hover { opacity: 0.85; transform: translateY(-2px); }
    .btn-secondary { padding: 14px 22px; border-radius: 10px; background: transparent; border: 1.5px solid #c8d0e8; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; color: #4a5580; cursor: pointer; transition: all .2s; }
    .btn-secondary:hover { color: #0f1733; border-color: #2563eb; transform: translateY(-2px); }
    .btn-free { display: inline-flex; align-items: center; gap: 6px; padding: 14px 22px; border-radius: 10px; background: #eff6ff; border: 1.5px solid #bfdbfe; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; color: #2563eb; cursor: pointer; transition: all .2s; }
    .btn-free:hover { transform: translateY(-2px); border-color: #2563eb; background: #dbeafe; }
    .hero-orb { position: absolute; right: -100px; top: 50%; transform: translateY(-50%); width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 68%); pointer-events: none; z-index: 1; }
    .hero-scroll-hint { position: absolute; bottom: 36px; left: 40px; display: flex; align-items: center; gap: 10px; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2.5px; color: #8892b8; text-transform: uppercase; }
    .scroll-line { width: 36px; height: 1px; background: #8892b8; }

    .page-body { background: #ffffff; }
    .section { max-width: 1020px; margin: 0 auto; padding: 80px 40px; }
    .section-divider { max-width: 1020px; margin: 0 auto; padding: 0 40px; }
    .divider-line { height: 1px; background: #e2e6f3; }
    .sec-label { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 2.5px; color: #2563eb; margin-bottom: 10px; }
    .sec-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(30px, 4vw, 46px); font-weight: 600; color: #0f1733; letter-spacing: -1px; line-height: 1.1; margin-bottom: 44px; }
    .sec-title em { font-style: italic; background: linear-gradient(135deg, #1d4ed8, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

    .urgency-block { background: #f0f5ff; border: 1.5px solid #bfdbfe; border-radius: 20px; padding: 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; position: relative; overflow: hidden; }
    .urgency-block::before { content:''; position:absolute; top:-80px; right:-80px; width:320px; height:320px; border-radius:50%; background: radial-gradient(circle, rgba(37,99,235,0.07), transparent 70%); pointer-events:none; }
    .ub-left-label { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: #2563eb; margin-bottom: 14px; }
    .ub-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(28px, 3.5vw, 44px); font-weight: 600; color: #0f1733; line-height: 1.07; letter-spacing: -1px; margin-bottom: 18px; }
    .ub-title em { font-style: italic; background: linear-gradient(135deg, #1d4ed8, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .ub-body { font-size: 15px; color: #4a5580; line-height: 1.82; }
    .ub-body strong { color: #0f1733; font-weight: 600; }
    .ub-right { display: flex; flex-direction: column; gap: 12px; }
    .ub-point { display: flex; align-items: flex-start; gap: 14px; padding: 16px 18px; background: #ffffff; border: 1px solid #e2e6f3; border-radius: 12px; transition: border-color .2s, transform .2s, box-shadow .2s; cursor: default; }
    .ub-point:hover { border-color: #bfdbfe; transform: translateX(4px); box-shadow: 0 2px 12px rgba(37,99,235,0.08); }
    .ub-point-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
    .ub-point-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #0f1733; margin-bottom: 4px; }
    .ub-point-body { font-size: 13px; color: #4a5580; line-height: 1.65; }

    .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: #e2e6f3; border: 1px solid #e2e6f3; border-radius: 16px; overflow: hidden; }
    .stat-cell { background: #f7f8fc; padding: 28px 22px; transition: background .2s; cursor: default; }
    .stat-cell:hover { background: #eef1f9; }
    .stat-n { font-family: 'DM Mono', monospace; font-size: 28px; font-weight: 400; color: #2563eb; line-height: 1; margin-bottom: 8px; }
    .stat-n .sfx { font-size: 14px; color: #8892b8; }
    .stat-label { font-size: 13px; color: #4a5580; line-height: 1.55; }

    .scorecard { border: 1px solid #e2e6f3; border-radius: 18px; overflow: hidden; background: #f7f8fc; }
    .scorecard-header { padding: 38px 42px; border-bottom: 1px solid #e2e6f3; display: flex; align-items: flex-start; justify-content: space-between; gap: 32px; flex-wrap: wrap; }
    .score-lbl { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #8892b8; margin-bottom: 12px; }
    .score-main { font-family: 'DM Mono', monospace; font-size: 72px; font-weight: 300; color: #0f1733; line-height: 1; letter-spacing: -3px; }
    .score-main .dec { font-size: 36px; }
    .score-main .sfx { font-size: 18px; color: #8892b8; letter-spacing: 0; }
    .score-badge { display: inline-flex; align-items: center; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 600; color: #2563eb; margin-top: 16px; }
    .score-right-text { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 500; color: #0f1733; line-height: 1.45; max-width: 230px; }
    .score-right-sub { font-size: 13px; color: #4a5580; margin-top: 8px; line-height: 1.65; }
    .subj-row { display: grid; grid-template-columns: repeat(3,1fr); }
    .subj-cell { padding: 28px 32px; border-right: 1px solid #e2e6f3; transition: background .2s; }
    .subj-cell:last-child { border-right: none; }
    .subj-cell:hover { background: #eef1f9; }
    .subj-name { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #8892b8; margin-bottom: 12px; }
    .subj-pct { font-family: 'DM Mono', monospace; font-size: 36px; font-weight: 300; color: #2563eb; line-height: 1; margin-bottom: 12px; }
    .subj-pct .sfx { font-size: 14px; color: #8892b8; font-family: 'DM Sans', sans-serif; }
    .subj-bar-bg { height: 3px; background: #c8d0e8; border-radius: 2px; overflow: hidden; }
    .subj-bar-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #1d4ed8, #3b82f6); transform-origin: left; }
    .subj-rank { font-size: 12px; color: #4a5580; margin-top: 8px; font-family: 'DM Mono', monospace; }

    .proof-wrap { border: 1px solid #e2e6f3; border-radius: 18px; overflow: hidden; background: #f7f8fc; }
    .proof-header { padding: 20px 28px; border-bottom: 1px solid #e2e6f3; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .proof-verified-badge { display: inline-flex; align-items: center; gap: 6px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 5px 12px; font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; color: #2563eb; }
    .proof-verified-dot { width: 7px; height: 7px; border-radius: 50%; background: #2563eb; }
    .proof-doc-label { font-family: 'DM Mono', monospace; font-size: 12px; color: #8892b8; }
    .proof-iframe-wrap { position: relative; width: 100%; height: 520px; background: #eef1f9; }
    .proof-iframe { width: 100%; height: 100%; border: none; }
    .proof-overlay-corner { position: absolute; bottom: 16px; right: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 14px; font-family: 'DM Mono', monospace; font-size: 11px; color: #2563eb; pointer-events: none; }

    .lottie-row { display: flex; align-items: center; gap: 36px; padding: 36px 40px; background: #f7f8fc; border: 1px solid #e2e6f3; border-radius: 18px; }
    .lottie-text { flex: 1; }
    .lottie-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #0f1733; margin-bottom: 10px; line-height: 1.4; }
    .lottie-body { font-size: 15px; color: #4a5580; line-height: 1.82; }

    .founder-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .founder-card { background: #f7f8fc; border: 1px solid #e2e6f3; border-radius: 16px; padding: 28px; transition: border-color .25s, background .25s, transform .25s, box-shadow .25s; }
    .founder-card:hover { border-color: #bfdbfe; background: #eef1f9; transform: translateY(-4px); box-shadow: 0 8px 24px rgba(37,99,235,0.08); }
    .card-num { font-family: 'DM Mono', monospace; font-size: 12px; color: #2563eb; margin-bottom: 12px; }
    .card-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #0f1733; margin-bottom: 10px; }
    .card-body { font-size: 14px; color: #4a5580; line-height: 1.75; }

    .features-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: #e2e6f3; border: 1px solid #e2e6f3; border-radius: 16px; overflow: hidden; }
    .feature-cell { background: #f7f8fc; padding: 26px 24px; transition: background .2s; }
    .feature-cell:hover { background: #eef1f9; }
    .feature-icon { font-size: 17px; color: #2563eb; margin-bottom: 10px; }
    .feature-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #0f1733; margin-bottom: 7px; }
    .feature-desc { font-size: 13px; color: #4a5580; line-height: 1.65; }

    .contact-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .contact-chip { display: inline-flex; align-items: center; gap: 8px; background: #f7f8fc; border: 1px solid #e2e6f3; border-radius: 10px; padding: 12px 20px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: #0f1733; text-decoration: none; transition: all .2s; cursor: pointer; }
    .contact-chip:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; transform: translateY(-2px); box-shadow: 0 4px 14px rgba(37,99,235,0.1); }
    .contact-note { font-size: 13px; color: #8892b8; margin-top: 14px; }

    .manifesto { background: linear-gradient(135deg, #1e3a8a, #1d4ed8, #2563eb); border-radius: 22px; padding: 64px 56px; position: relative; overflow: hidden; }
    .manifesto::after { content:''; position:absolute; bottom:-60px; left:-60px; width:280px; height:280px; border-radius:50%; background: radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%); pointer-events:none; }
    .manifesto-quote-mark { position: absolute; top: -24px; right: 40px; font-family: 'Cormorant Garamond', serif; font-size: 220px; font-weight: 600; color: rgba(255,255,255,0.06); line-height: 1; user-select: none; pointer-events: none; }
    .manifesto-body { font-family: 'Cormorant Garamond', serif; font-size: clamp(22px, 3.2vw, 34px); font-weight: 500; color: #ffffff; line-height: 1.52; letter-spacing: -0.3px; max-width: 700px; margin-bottom: 28px; position: relative; z-index: 1; }
    .manifesto-body em { font-style: italic; color: #bfdbfe; }
    .manifesto-attr { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(255,255,255,0.55); position: relative; z-index: 1; }

    .cta-section { text-align: center; padding: 88px 40px 100px; }
    .cta-eyebrow { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: #8892b8; margin-bottom: 20px; }
    .cta-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(36px, 5.5vw, 58px); font-weight: 600; color: #0f1733; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px; }
    .cta-title em { font-style: italic; background: linear-gradient(135deg, #1d4ed8, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .cta-sub { font-size: 16px; color: #4a5580; margin-bottom: 36px; line-height: 1.7; }
    .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .cta-note { margin-top: 20px; font-size: 13px; color: #8892b8; font-family: 'DM Mono', monospace; }

    .footer { border-top: 1px solid #e2e6f3; padding: 28px 40px; display: flex; align-items: center; justify-content: space-between; }
    .footer-brand { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800; color: #0f1733; background: none; border: none; cursor: pointer; }
    .footer-brand span { color: #2563eb; }
    .footer-right { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #8892b8; }

    @media (max-width: 768px) {
      .nav { padding: 0 16px; height: 56px; }
      .nav-link { display: none; }
      .nav-cta { font-size: 13px; padding: 7px 14px; }
      .urgency-banner { top: 58px; padding: 8px 16px; gap: 8px; }
      .urgency-text { font-size: 12px; text-align: center; }
      .hero { padding: 148px 20px 72px; min-height: auto; }
      .hero-h1 { font-size: clamp(36px, 10vw, 52px); letter-spacing: -1.5px; }
      .hero-sub { font-size: 16px; }
      .hero-btns { flex-direction: column; align-items: stretch; }
      .btn-accent, .btn-primary, .btn-secondary, .btn-free { text-align: center; justify-content: center; }
      .hero-orb { display: none; }
      .hero-scroll-hint { display: none; }
      .section { padding: 52px 20px; }
      .section-divider { padding: 0 20px; }
      .urgency-block { grid-template-columns: 1fr; gap: 28px; padding: 28px 20px; }
      .stats-row { grid-template-columns: 1fr 1fr; }
      .stat-n { font-size: 24px; }
      .scorecard-header { flex-direction: column; gap: 20px; padding: 24px; }
      .score-main { font-size: 56px; }
      .score-main .dec { font-size: 28px; }
      .score-right-text { font-size: 18px; }
      .subj-row { grid-template-columns: 1fr; }
      .subj-cell { border-right: none; border-bottom: 1px solid #e2e6f3; padding: 20px 24px; }
      .subj-cell:last-child { border-bottom: none; }
      .lottie-row { flex-direction: column !important; text-align: center; padding: 28px 20px; gap: 24px; }
      .lottie-title { font-size: 16px; }
      .lottie-body { font-size: 14px; }
      .founder-grid { grid-template-columns: 1fr; }
      .features-grid { grid-template-columns: 1fr 1fr; }
      .proof-iframe-wrap { height: 300px; }
      .proof-header { padding: 14px 16px; flex-direction: column; }
      .proof-doc-label { display: none; }
      .manifesto { padding: 36px 24px; }
      .manifesto-body { font-size: clamp(18px, 5vw, 24px); }
      .cta-section { padding: 60px 20px 80px; }
      .cta-btns { flex-direction: column; align-items: stretch; }
      .cta-sub { font-size: 15px; }
      .footer { padding: 22px 20px; flex-direction: column; gap: 10px; text-align: center; }
    }
    @media (max-width: 480px) {
      .features-grid { grid-template-columns: 1fr; }
      .stats-row { grid-template-columns: 1fr; }
      .hero-h1 { font-size: clamp(32px, 11vw, 42px); }
      .urgency-banner { flex-direction: column; gap: 6px; }
    }
  `

  return (
    <>
      <style>{CSS}</style>
      <motion.div className="progress-bar" style={{ width: progressWidth }} />

      <motion.nav className="nav"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easing }}>
        <button className="nav-brand" onClick={() => router.push("/")}>
          <div className="nav-logo">J</div>
          <span className="nav-wordmark">JEET<span>.</span></span>
        </button>
        <div className="nav-right">
          <button className="nav-link" onClick={() => router.push("/pricing")}>Pricing</button>
          <button className="nav-link" onClick={() => router.push("/login")}>Sign In</button>
          <button className="nav-cta" onClick={() => router.push("/signup")}>Register Now →</button>
        </div>
      </motion.nav>

      <motion.div className="urgency-banner"
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: easing }}>
        <span className="urgency-text">🚀 JEE is close — 2 weeks of focused mocks can move your percentile by 10+</span>
        <button className="urgency-btn" onClick={() => router.push("/practise")}>Try Free Practice Test →</button>
      </motion.div>

      <section className="hero">
        <HeroCanvas />
        <div className="hero-orb" />
        <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
          background:"radial-gradient(ellipse 75% 55% at 25% 50%, transparent 40%, rgba(255,255,255,0.7) 100%)" }} />

        <div className="hero-content">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" />
              The only affordable test series for your last 2 weeks of JEE
            </div>
          </motion.div>
          <motion.h1 className="hero-h1" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
            Stop guessing.<br /><em>Start scoring.</em>
          </motion.h1>
          <motion.p className="hero-sub" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            Built by a <strong>96.93 %ile scorer</strong> — because the last 2 weeks before JEE decide everything.
            Full mocks. Real analysis. ₹249 for the whole series. <strong>No coaching required.</strong>
          </motion.p>
          <motion.div className="hero-btns" variants={fadeUp} initial="hidden" animate="visible" custom={3}>
            <button className="btn-accent"    onClick={() => router.push("/signup")}>Register Now — ₹249 →</button>
            <button className="btn-primary"   onClick={() => router.push("/pricing")}>View Plans</button>
            <button className="btn-free"      onClick={() => router.push("/practise")}>✦ Free Practice Test</button>
          </motion.div>
        </div>

        <motion.div className="hero-scroll-hint"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}>
          <div className="scroll-line" /> Scroll to explore
        </motion.div>
      </section>

      <div className="page-body">
        <div className="section">
          <Reveal variant={scaleIn}>
            <div className="urgency-block">
              <div>
                <div className="ub-left-label">Why now</div>
                <div className="ub-title">The last <em>2 weeks</em> are the most valuable.</div>
                <div className="ub-body">
                  Students who do <strong>6–10 full mocks in the final fortnight</strong> consistently outperform
                  those who only revise theory. You already know the content. What you need now is exam conditioning —
                  speed, accuracy under pressure, and knowing exactly where you're losing marks.<br /><br />
                  JEET gives you that. <strong>Starting at ₹249.</strong>
                </div>
              </div>
              <div className="ub-right">
                {[
                  { icon:"⚡", title:"Instant weak-area diagnosis",  body:"After every mock, see exactly which topics cost you marks." },
                  { icon:"📊", title:"Percentile tracking",          body:"Know your live percentile vs. all JEET test-takers after each paper." },
                  { icon:"🎯", title:"NTA-calibrated difficulty",    body:"Questions set to the exact same difficulty curve as JEE Main." },
                  { icon:"💸", title:"₹249 for 10 mocks + 5 PYQs",  body:"Less than a single coaching institute test. No compromise on quality." },
                ].map((p, i) => (
                  <motion.div className="ub-point" key={p.title}
                    initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5, ease: easing }} viewport={{ once: true }}>
                    <span className="ub-point-icon">{p.icon}</span>
                    <div>
                      <div className="ub-point-title">{p.title}</div>
                      <div className="ub-point-body">{p.body}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <div className="section-divider"><div className="divider-line" /></div>

        <div className="section" style={{ paddingBottom: 0 }}>
          <Reveal variant={fadeLeft}>
            <div className="lottie-row">
              <PulseBadge><LottiePlayer src={LOTTIE_ROCKET} size={96} /></PulseBadge>
              <div className="lottie-text">
                <div className="lottie-title">2 weeks of focused practice = serious percentile jump</div>
                <div className="lottie-body">Every full mock gives compound returns — sharper instincts, faster recall, and the mental conditioning to stay calm under 3-hour pressure. Don't just study harder. Practice smarter.</div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="section-divider" style={{ paddingTop: 40 }}><div className="divider-line" /></div>

        <div className="section">
          <Reveal>
            <div className="stats-row">
              {stats.map((s, i) => (
                <motion.div key={s.label} className="stat-cell"
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                  <div className="stat-n">{s.n}<span className="sfx">{s.suffix}</span></div>
                  <div className="stat-label">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="section-divider"><div className="divider-line" /></div>

        <div className="section">
          <Reveal>
            <div className="sec-label">Founder Credentials</div>
            <div className="sec-title">JEE Main 2024 <em>Scorecard</em></div>
          </Reveal>
          <Reveal variant={scaleIn} custom={0.1}>
            <div className="scorecard">
              <div className="scorecard-header">
                <div>
                  <div className="score-lbl">Overall Percentile — JEE Main 2024</div>
                  <div className="score-main">96<span className="dec">.93</span><span className="sfx"> %ile</span></div>
                  <div className="score-badge">
                    <LottiePlayer src={LOTTIE_TROPHY} size={22} />
                    Top 3% of all JEE Main candidates
                  </div>
                </div>
                <div>
                  <div className="score-right-text">Better than 96.9%<br />of India's students</div>
                  <div className="score-right-sub">Out of over 1 million<br />JEE Main 2024 candidates</div>
                </div>
              </div>
              <div className="subj-row">
                {subjects.map((s, i) => (
                  <motion.div key={s.name} className="subj-cell"
                    initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: easing }} viewport={{ once: true }}>
                    <div className="subj-name">{s.name}</div>
                    <div className="subj-pct">{s.percentile}<span className="sfx"> %ile</span></div>
                    <div className="subj-bar-bg">
                      <motion.div className="subj-bar-fill"
                        initial={{ scaleX: 0 }} whileInView={{ scaleX: s.percentile / 100 }}
                        transition={{ delay: 0.3 + i * 0.12, duration: 1.2, ease: easing }}
                        viewport={{ once: true }} />
                    </div>
                    <div className="subj-rank">Top {s.rank} nationwide</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <div className="section-divider"><div className="divider-line" /></div>

        <div className="section">
          <Reveal>
            <div className="sec-label">Official Document</div>
            <div className="sec-title">NTA <em>Verified</em> Result</div>
          </Reveal>
          <Reveal variant={scaleIn} custom={0.1}>
            <div className="proof-wrap">
              <div className="proof-header">
                <div className="proof-verified-badge">
                  <span className="proof-verified-dot" />
                  Verified by NTA · Issued 12-02-2024
                </div>
                <div className="proof-doc-label">JOINT ENTRANCE EXAMINATION (MAIN) – 2024 · SESSION 1</div>
              </div>
              <div className="proof-iframe-wrap">
                <iframe className="proof-iframe" src="/jee.pdf" title="NTA JEE Main 2024 Official Scorecard" />
                <div className="proof-overlay-corner">NTA SCORE · 96.9383863</div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="section-divider"><div className="divider-line" /></div>

        <div className="section">
          <Reveal>
            <div className="sec-label">Philosophy</div>
            <div className="sec-title">Why <em>JEET</em> exists</div>
          </Reveal>
          <div className="founder-grid">
            {pillars.map((p, i) => (
              <Reveal key={p.num} variant={fadeUp} custom={i * 0.08}>
                <motion.div className="founder-card" whileHover={{ y: -5 }} transition={{ duration: 0.22 }}>
                  <div className="card-num">{p.num}</div>
                  <div className="card-title">{p.title}</div>
                  <div className="card-body">{p.body}</div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="section-divider"><div className="divider-line" /></div>

        <div className="section">
          <Reveal>
            <div className="sec-label">Platform</div>
            <div className="sec-title">What's <em>inside</em></div>
          </Reveal>
          <Reveal variant={scaleIn}>
            <div className="features-grid">
              {features.map((f, i) => (
                <motion.div key={f.title} className="feature-cell"
                  initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.45, ease: easing }} viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}>
                  <div className="feature-icon">{f.icon}</div>
                  <div className="feature-title">{f.title}</div>
                  <div className="feature-desc">{f.desc}</div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="section-divider"><div className="divider-line" /></div>

        <div className="section">
          <Reveal variant={fadeLeft} custom={0.1}>
            <div className="lottie-row" style={{ flexDirection: "row-reverse" }}>
              <PulseBadge><LottiePlayer src={LOTTIE_TROPHY} size={96} /></PulseBadge>
              <div className="lottie-text">
                <div className="lottie-title">Built by someone who actually cracked it</div>
                <div className="lottie-body">JEET was created by a 96.93 %ile scorer who knows what the last 2 weeks really demand — not theory revision, but relentless mock practice with deep feedback. Every question and every insight is built from real experience.</div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="section-divider"><div className="divider-line" /></div>

        <div className="section">
          <Reveal>
            <div className="sec-label">Get in Touch</div>
            <div className="sec-title">Questions? <em>Reach out.</em></div>
          </Reveal>
          <Reveal custom={0.1}>
            <div className="contact-row">
              <a className="contact-chip" href="mailto:nathan.j.diniz@gmail.com"><span>✉</span> nathan.j.diniz@gmail.com</a>
              <a className="contact-chip" href="https://wa.me/919175045769?text=Hi%20Nathan%2C%20I%20have%20a%20question%20about%20JEET" target="_blank" rel="noopener noreferrer"><span>💬</span> WhatsApp</a>
            </div>
            <div className="contact-note">↳ WhatsApp opens a pre-filled message — your number stays private until you send</div>
          </Reveal>
        </div>

        <div className="section-divider"><div className="divider-line" /></div>

        <div className="section">
          <Reveal variant={scaleIn}>
            <div className="manifesto">
              <div className="manifesto-quote-mark">"</div>
              <div className="manifesto-body">
                The last <em>2 weeks</em> before JEE aren't about learning more —
                they're about executing better. Mock tests don't just prepare you. They <em>transform</em> you.
              </div>
              <div className="manifesto-attr">— Nathan Joseph Diniz · Founder, JEET · JEE Main 2024 · 96.93 %ile</div>
            </div>
          </Reveal>
        </div>

        <div className="cta-section">
          <Reveal>
            <div className="cta-eyebrow">The clock is ticking</div>
            <div className="cta-title">Your last 2 weeks.<br /><em>Make them count.</em></div>
            <div className="cta-sub">Start with a free practice test. Upgrade when you're ready.</div>
            <div className="cta-btns">
              <button className="btn-secondary" onClick={() => router.push("/practise")}>✦ Free Practice Test</button>
              <button className="btn-accent"    onClick={() => router.push("/signup")}>Register Now — ₹249 →</button>
              <button className="btn-primary"   onClick={() => router.push("/pricing")}>View All Plans</button>
            </div>
            <div className="cta-note">Starter · ₹249 · Pro · ₹499 · Elite · ₹749 · No subscription</div>
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