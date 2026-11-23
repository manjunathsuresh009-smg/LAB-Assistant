import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  GraduationCap,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { formatDate, ROLE_LABELS } from "../lib/format";
import type { AdminDepartment, Role, User } from "../lib/types";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, Textarea } from "../components/ui/Field";
import { EmptyState, PageHeader, Spinner } from "../components/ui/Feedback";
import { Modal } from "../components/ui/Modal";
import { StatCard } from "../components/ui/StatCard";
import { useToast } from "../components/ui/Toast";

const ROLE_FILTERS: Array<{ value: Role | "ALL"; label: string }> = [
  { value: "ALL", label: "All users" },
  { value: "STUDENT", label: "Students" },
  { value: "FACULTY", label: "Faculty" },
  { value: "ADMIN", label: "Admins" },
];

const EMPTY_DEPARTMENT = { name: "", code: "", description: "" };

export default function AdminUsers() {
  const { push } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_DEPARTMENT);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [userData, departmentData] = await Promise.all([
        api.get<{ users: User[] }>("/admin/users"),
        api.get<{ departments: AdminDepartment[] }>("/admin/departments"),
      ]);
      setUsers(userData.users);
      setDepartments(departmentData.departments);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load administration data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const createDepartment = async (event?: FormEvent) => {
    event?.preventDefault();
    setFormError("");
    setCreating(true);
    try {
      await api.post("/admin/departments", {
        name: form.name,
        code: form.code,
        description: form.description || undefined,
      });
      push("Department created.", "success");
      setModalOpen(false);
      setForm(EMPTY_DEPARTMENT);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to create department.");
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter((user) => roleFilter === "ALL" || user.role === roleFilter);
  const counts = {
    students: users.filter((user) => user.role === "STUDENT").length,
    faculty: users.filter((user) => user.role === "FACULTY").length,
    admins: users.filter((user) => user.role === "ADMIN").length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Users & departments"
        description="Inspect platform accounts, manage departments and keep role assignments auditable."
        actions={
          <>
            <Link to="/admin/equipment">
              <Button variant="secondary" size="sm">
                Manage equipment
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add department
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Students" value={counts.students} icon={GraduationCap} hint="Active learners" />
        <StatCard label="Faculty" value={counts.faculty} icon={ShieldCheck} accent="blue" hint="Approvers" />
        <StatCard label="Admins" value={counts.admins} icon={Users} accent="blue" hint="Platform operators" />
        <StatCard
          label="Departments"
          value={departments.length}
          icon={Building2}
          accent="green"
          hint="Resource owners"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
            <h3 className="text-sm font-semibold text-cream">Platform users</h3>
            <div className="flex flex-wrap gap-1">
              {ROLE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setRoleFilter(filter.value)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                    roleFilter === filter.value
                      ? "bg-gold/15 text-gold"
                      : "text-muted hover:bg-white/[0.04] hover:text-cream"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <Spinner label="Loading users" />
          ) : filtered.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-white/[0.012]">
                    <th className="table-head px-4 py-2.5">User</th>
                    <th className="table-head px-4 py-2.5">Role</th>
                    <th className="table-head px-4 py-2.5">Department</th>
                    <th className="table-head px-4 py-2.5">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id} className="border-b border-white/[0.035] last:border-0 hover:bg-white/[0.015]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-semibold text-cream">
                            {user.name.slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-cream">{user.name}</p>
                            <p className="text-[10px] text-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={user.role === "ADMIN" ? "gold" : user.role === "FACULTY" ? "blue" : "neutral"}
                        >
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted">
                        {user.department ? `${user.department.code} · ${user.department.name}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted">
                        {user.createdAt ? formatDate(user.createdAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Users} title="No users in this view" className="border-0" />
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-cream">Departments</h3>
            <Badge tone="neutral">{departments.length}</Badge>
          </div>
          <div className="space-y-2">
            {departments.map((department) => (
              <div
                key={department.id}
                className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-2.5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-cream">{department.name}</p>
                  <Badge tone="gold">{department.code}</Badge>
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  {department.equipmentCount} equipment · {department.userCount} member(s)
                </p>
              </div>
            ))}
          </div>
          {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add a department"
        description="Departments own equipment and users."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={creating} onClick={() => void createDepartment()}>
              Create department
            </Button>
          </>
        }
      >
        <form onSubmit={createDepartment} className="space-y-3">
          <Input label="Department name" required value={form.name} onChange={update("name")} placeholder="Civil Engineering" />
          <Input
            label="Short code"
            required
            value={form.code}
            onChange={update("code")}
            placeholder="CIVIL"
            maxLength={10}
            hint="Used as the badge throughout the platform."
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={update("description")}
            className="min-h-[70px]"
            placeholder="Structural and materials laboratories."
          />
          {formError && (
            <p role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 text-xs text-danger">
              {formError}
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
