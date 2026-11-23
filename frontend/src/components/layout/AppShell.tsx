import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Boxes,
  CalendarClock,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { cn, ROLE_LABELS } from "../../lib/format";
import type { Role } from "../../lib/types";
import { Logo } from "../Logo";
import { Badge } from "../ui/Badge";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Equipment", href: "/equipment", icon: Boxes },
  { label: "My Bookings", href: "/bookings", icon: CalendarClock },
  { label: "AI Assistant", href: "/assistant", icon: Sparkles },
  { label: "Approvals", href: "/faculty", icon: ClipboardCheck, roles: ["FACULTY", "ADMIN"] },
  { label: "Conflict Resolver", href: "/conflicts", icon: Scale, roles: ["FACULTY", "ADMIN"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["FACULTY", "ADMIN"] },
  { label: "Manage Equipment", href: "/admin/equipment", icon: Wrench, roles: ["ADMIN"] },
  { label: "Users", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const location = useLocation();
  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Primary navigation">
      {items.map((item) => {
        const active = isActive(location.pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn("nav-link", active && "nav-link-active")}
          >
            <Icon
              className={cn("h-4.5 w-4.5 shrink-0", active ? "text-gold" : "text-muted")}
              strokeWidth={1.7}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo to="/dashboard" />
      </div>
      <div className="mx-5 h-px bg-white/[0.06]" />
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted/70">
          Workspace
        </p>
        <NavLinks role={role} onNavigate={onNavigate} />
        <div className="mt-5 rounded-xl border border-gold/15 bg-gold/[0.04] p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold/80">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure access
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
            Server-verified role: <span className="text-cream">{ROLE_LABELS[role]}</span>. Every action is
            authorised on the API.
          </p>
        </div>
      </div>
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-semibold text-cream">
            {user?.name?.slice(0, 1).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-cream">{user?.name}</p>
            <p className="truncate text-[10px] text-muted">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            aria-label="Sign out"
            className="rounded-lg p-2 text-muted transition hover:bg-white/5 hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.06] bg-surface/70 backdrop-blur-xl lg:block">
        <SidebarContent role={user.role} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-[60] w-72 border-r border-white/10 bg-surface lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              aria-label="Mobile navigation"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="absolute right-3 top-4 rounded-lg p-2 text-muted hover:bg-white/5 hover:text-cream"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent role={user.role} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink/70 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                className="rounded-lg border border-white/10 p-2 text-muted transition hover:text-cream lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="hidden sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                  Intelligent Laboratory Resource Sharing
                </p>
                <p className="text-sm font-semibold text-cream">
                  {user.department ? `${user.department.code} · ${user.department.name}` : "Campus-wide workspace"}
                </p>
              </div>
              <div className="sm:hidden">
                <Logo to="/dashboard" compact />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Badge tone={user.role === "ADMIN" ? "gold" : user.role === "FACULTY" ? "blue" : "neutral"}>
                {ROLE_LABELS[user.role]}
              </Badge>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-cream transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
                aria-label="Sign out of CampusLab AI"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[11px] font-semibold text-cream"
                title={user.name}
              >
                {user.name.slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
