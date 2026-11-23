import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/25 bg-gold/[0.06]">
        <Compass className="h-6 w-6 text-gold" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">404 · Off the map</p>
      <h1 className="mt-3 font-display text-4xl text-cream">This lab does not exist.</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        The page you were looking for has moved or never existed. Return to your workspace to continue.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
        <Link to="/equipment">
          <Button variant="secondary">Browse equipment</Button>
        </Link>
      </div>
    </div>
  );
}
