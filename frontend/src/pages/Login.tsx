import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { Card } from "../components/ui/Card";
import { ApiError } from "../lib/api";

const DEMO_ACCOUNTS = [
  { role: "Student", email: "student.asha@campuslab.ai", password: "Student@123" },
  { role: "Faculty", email: "faculty.ece@campuslab.ai", password: "Faculty@123" },
  { role: "Admin", email: "admin@campuslab.ai", password: "Admin@123" },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={from ?? "/dashboard"} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from ?? "/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden border-r border-white/[0.06] bg-surface/40 lg:block">
        <div className="absolute inset-0 bg-grid-fade opacity-[0.25] [background-size:46px_46px]" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-electric/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Logo />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg"
          >
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              <Sparkles className="h-3 w-3" /> GenAI Lab Infrastructure
            </p>
            <h1 className="font-display text-5xl leading-[1.05] text-cream">
              The campus lab,
              <br />
              <span className="gold-text">orchestrated.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
              Discover specialised equipment across departments, request project-based access and let
              the intelligent scheduler resolve contested slots fairly.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-cream/80">
              {[
                "Live availability across every department",
                "Explainable priority scoring for every conflict",
                "Faculty-approved allocations, never auto-booked",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          <p className="text-[11px] text-muted/70">
            JWT sessions · hashed passwords · server-side role verification
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-display text-3xl text-cream">Welcome back</h2>
            <p className="mt-2 text-sm text-muted">Sign in to your CampusLab workspace.</p>
          </motion.div>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@campus.edu"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
            {error && (
              <p role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.07] px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Enter workspace <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted">
            New to CampusLab?{" "}
            <Link to="/register" className="font-semibold text-gold hover:underline">
              Create a student account
            </Link>
          </p>

          <Card className="mt-8 p-4">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              <KeyRound className="h-3.5 w-3.5 text-gold" /> Demo accounts
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                    setError("");
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left transition hover:border-gold/30 hover:bg-gold/[0.05]"
                >
                  <span>
                    <span className="block text-xs font-semibold text-cream">{account.role}</span>
                    <span className="block text-[10px] text-muted">{account.email}</span>
                  </span>
                  <span className="text-[10px] font-medium text-gold">Use</span>
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted/70">
              <Mail className="h-3 w-3" /> Click an account to fill the form instantly.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
