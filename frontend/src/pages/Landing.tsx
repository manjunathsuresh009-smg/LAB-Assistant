import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  BrainCircuit,
  CalendarCheck,
  Check,
  GraduationCap,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { fadeUp, staggerChildren } from "../lib/motion";

const FEATURES = [
  {
    icon: Boxes,
    title: "Unified discovery",
    detail: "Search 16 specialised resources across five departments with live availability, filters and rich specifications.",
  },
  {
    icon: CalendarCheck,
    title: "Intelligent booking",
    detail: "Project-based requests with duration limits, duplicate prevention and server-side overlap validation.",
  },
  {
    icon: BrainCircuit,
    title: "AI project assistant",
    detail: "Describe your build in plain language. Gemini or a deterministic keyword engine recommends the right kit.",
  },
  {
    icon: Scale,
    title: "Conflict resolution",
    detail: "Explainable 35/25/20/20 priority scoring ranks competing requests and proposes feasible alternatives.",
  },
  {
    icon: ShieldCheck,
    title: "Faculty control",
    detail: "Every allocation ends with a human approval. The engine recommends, faculty decide — never auto-booked.",
  },
  {
    icon: Wand2,
    title: "Utilisation insight",
    detail: "Department-wise utilisation, demand hotspots and underused resources calculated from real booking records.",
  },
];

const ROLES = [
  {
    icon: GraduationCap,
    title: "Students",
    points: ["Discover lab equipment", "Submit project requests", "AI equipment advisor"],
  },
  {
    icon: Users,
    title: "Faculty",
    points: ["Review booking requests", "Approve or reject with reasons", "Resolve scheduling conflicts"],
  },
  {
    icon: ShieldCheck,
    title: "Administrators",
    points: ["Manage equipment & departments", "Monitor all bookings", "Platform-wide analytics"],
  },
];

const WEIGHTS = [
  { label: "Deadline urgency", value: "35%" },
  { label: "Equipment compatibility", value: "25%" },
  { label: "Availability feasibility", value: "20%" },
  { label: "Allocation fairness", value: "20%" },
];

export default function Landing() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade opacity-[0.18] [background-size:56px_56px]" />
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[30rem] w-[30rem] rounded-full bg-gold/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 h-[26rem] w-[26rem] rounded-full bg-electric/[0.07] blur-3xl" />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 text-xs font-medium text-muted md:flex" aria-label="Marketing navigation">
          <a href="#features" className="transition hover:text-cream">Platform</a>
          <a href="#conflict" className="transition hover:text-cream">Conflict engine</a>
          <a href="#roles" className="transition hover:text-cream">Roles</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
          <motion.div initial="hidden" animate="show" variants={staggerChildren}>
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                <Sparkles className="h-3 w-3" /> GenAI Campus Infrastructure
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="mt-6 font-display text-5xl leading-[1.02] tracking-tight text-cream text-balance sm:text-6xl"
            >
              Share every lab.
              <br />
              <span className="gold-text">Waste nothing.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 max-w-xl text-base leading-relaxed text-muted">
              CampusLab AI is the intelligent resource-sharing platform for campus laboratories. Discover
              specialised equipment, request project-based access and resolve contested slots with an
              explainable allocation engine.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button size="lg">
                  Enter the platform <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="secondary">
                  Create student account
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-muted">
              {["Role-based access control", "Server-validated bookings", "Explainable scheduling"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success" /> {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <Card className="relative overflow-hidden border-white/[0.09] bg-panel/90 p-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold">
                    <Scale className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-cream">Conflict resolution</p>
                    <p className="text-[10px] text-muted">GPU Workstation · 1 unit · illustrative</p>
                  </div>
                </div>
                <span className="rounded-full border border-warn/25 bg-warn/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-warn">
                  Contended
                </span>
              </div>

              {[
                { name: "Smart Agriculture", student: "Asha V.", score: 92, deadline: "Tomorrow", tone: "gold" as const },
                { name: "Home Automation", student: "Ravi K.", score: 74, deadline: "5 days", tone: "blue" as const },
              ].map((row, index) => (
                <div key={row.name} className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-cream">{row.name}</p>
                      <p className="text-[10px] text-muted">{row.student} · due {row.deadline}</p>
                    </div>
                    <span className="font-display text-xl text-goldsoft">{row.score}<span className="text-xs text-muted">/100</span></span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.score}%` }}
                      transition={{ duration: reducedMotion ? 0 : 1, delay: 0.5 + index * 0.2 }}
                      className={index === 0 ? "h-full bg-gold-sheen" : "h-full bg-electric/60"}
                    />
                  </div>
                </div>
              ))}

              <div className="mt-4 rounded-xl border border-gold/20 bg-gold/[0.05] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">Recommendation</p>
                <p className="mt-1 text-xs leading-relaxed text-cream/85">
                  Asha receives the earlier slot. The decision is driven by deadline urgency, with faculty
                  sign-off required before booking.
                </p>
              </div>
            </Card>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="absolute -bottom-8 -left-6 hidden w-56 rounded-xl border border-white/10 bg-panel2/95 p-3.5 shadow-premium backdrop-blur sm:block"
            >
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-electric">
                <BrainCircuit className="h-3.5 w-3.5" /> AI assistant
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-cream/80">
                “Smart agriculture monitor” → Soil Moisture Sensor, Arduino Uno, IoT Kit.
              </p>
            </motion.div>
          </motion.div>
        </section>

        <section id="features" className="border-t border-white/[0.06] py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerChildren}
            >
              <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">
                The platform
              </motion.p>
              <motion.h2 variants={fadeUp} className="mt-3 max-w-2xl font-display text-4xl text-cream">
                Built for the way campuses actually share equipment.
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                A complete workflow from discovery to approval — persistent data, validation and analytics,
                not a static prototype.
              </motion.p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={staggerChildren}
              className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {FEATURES.map((feature) => (
                <motion.div key={feature.title} variants={fadeUp}>
                  <Card hover className="h-full p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.07] text-gold">
                      <feature.icon className="h-5 w-5" strokeWidth={1.6} />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-cream">{feature.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{feature.detail}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="conflict" className="border-t border-white/[0.06] py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerChildren}>
              <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">
                Most important module
              </motion.p>
              <motion.h2 variants={fadeUp} className="mt-3 font-display text-4xl text-cream">
                Fair decisions, fully explained.
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-4 text-sm leading-relaxed text-muted">
                When multiple students need the same equipment at once, the engine computes a normalised
                priority score for each request, recommends a booking order and finds alternative slots or
                compatible equipment. Every recommendation cites its reasoning, and faculty make the final call.
              </motion.p>
              <motion.ul variants={fadeUp} className="mt-6 space-y-2.5 text-sm text-cream/80">
                {[
                  "Detects transitive overlapping request clusters",
                  "Never auto double-books a physical resource",
                  "Surfaces alternative slots and compatible equipment",
                  "Fairness factor prevents repeat monopolisation",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {item}
                  </li>
                ))}
              </motion.ul>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="grid grid-cols-2 gap-3"
            >
              {WEIGHTS.map((weight) => (
                <motion.div key={weight.label} variants={fadeUp}>
                  <Card className="p-5">
                    <p className="font-display text-3xl gold-text">{weight.value}</p>
                    <p className="mt-1.5 text-[11px] font-medium text-muted">{weight.label}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="roles" className="border-t border-white/[0.06] py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 className="font-display text-4xl text-cream">One platform, three perspectives.</h2>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {ROLES.map((role) => (
                <Card key={role.title} hover className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-electric">
                    <role.icon className="h-5 w-5" strokeWidth={1.6} />
                  </div>
                  <h3 className="mt-4 font-display text-xl text-cream">{role.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {role.points.map((point) => (
                      <li key={point} className="flex items-center gap-2 text-xs text-muted">
                        <Check className="h-3.5 w-3.5 text-gold/70" /> {point}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <Card className="relative overflow-hidden border-gold/20 bg-gradient-to-br from-gold/[0.08] via-panel to-panel p-10 text-center">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              <h2 className="font-display text-4xl text-cream">Ready to open the lab?</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
                Sign in with a demo account and explore the full workflow — discovery, booking, AI
                recommendations, conflict resolution and faculty approval.
              </p>
              <div className="mt-7 flex justify-center gap-3">
                <Link to="/login">
                  <Button size="lg">Open the workspace <ArrowRight className="h-4 w-4" /></Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="secondary">Register</Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] py-7">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 text-[11px] text-muted sm:flex-row sm:px-8">
          <Logo compact />
          <p>CampusLab AI · Intelligent Laboratory Resource Sharing</p>
          <p className="text-muted/60">Built for the 3-hour AI hackathon</p>
        </div>
      </footer>
    </div>
  );
}
