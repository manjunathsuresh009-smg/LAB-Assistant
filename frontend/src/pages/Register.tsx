import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import type { Department } from "../lib/types";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", departmentId: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<{ departments: Department[] }>("/departments")
      .then((data) => setDepartments(data.departments))
      .catch(() => setDepartments([]));
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  const update = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        departmentId: form.departmentId || undefined,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="absolute inset-0 bg-grid-fade opacity-[0.2] [background-size:52px_52px]" />
      <div className="absolute -top-20 left-1/2 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-gold/[0.07] blur-3xl" />
      <div className="relative w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-panel/80 p-7 shadow-premium backdrop-blur">
          <h1 className="font-display text-3xl text-cream">Create your student account</h1>
          <p className="mt-2 text-sm text-muted">
            Join the campus resource network and request access to specialised labs.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Input
              label="Full name"
              required
              value={form.name}
              onChange={update("name")}
              placeholder="Asha Verma"
              autoComplete="name"
            />
            <Input
              label="Email address"
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              placeholder="you@campus.edu"
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update("password")}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              hint="Use at least 8 characters. Passwords are hashed with bcrypt."
            />
            <Select
              label="Department"
              value={form.departmentId}
              onChange={update("departmentId")}
              hint="Used to tailor equipment recommendations."
            >
              <option value="">Select a department (optional)</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.code} — {department.name}
                </option>
              ))}
            </Select>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-danger/25 bg-danger/[0.07] px-3 py-2 text-xs text-danger"
              >
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Create account <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-gold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          Public sign-up creates student accounts only. Faculty and admin roles are provisioned internally.
        </p>
      </div>
    </div>
  );
}
