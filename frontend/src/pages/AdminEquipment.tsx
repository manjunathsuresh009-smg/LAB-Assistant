import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Plus,
  RefreshCw,
  Save,
  Search,
  Wrench,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import type { AdminDepartment, Equipment, EquipmentStatus } from "../lib/types";
import { EquipmentVisual } from "../components/EquipmentVisual";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, Select, Textarea } from "../components/ui/Field";
import { EmptyState, PageHeader, Spinner } from "../components/ui/Feedback";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";

const STATUSES: EquipmentStatus[] = ["AVAILABLE", "MAINTENANCE", "RETIRED"];

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "",
  location: "",
  departmentId: "",
  quantity: "1",
  tags: "",
  specs: "",
};

export default function AdminEquipment() {
  const { push } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState<Record<string, { quantity: number; status: EquipmentStatus }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [equipmentData, departmentData] = await Promise.all([
        api.get<{ equipment: Equipment[] }>("/equipment"),
        api.get<{ departments: AdminDepartment[] }>("/admin/departments"),
      ]);
      setEquipment(equipmentData.equipment);
      setDepartments(departmentData.departments);
      setEdits(
        Object.fromEntries(
          equipmentData.equipment.map((item) => [item.id, { quantity: item.quantity, status: item.status }])
        )
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load equipment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const saveRow = async (item: Equipment) => {
    const edit = edits[item.id];
    if (!edit) return;
    setSavingId(item.id);
    try {
      await api.patch(`/equipment/${item.id}`, { quantity: edit.quantity, status: edit.status });
      push(`${item.name} updated.`, "success");
      await load();
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Unable to update equipment.", "error");
    } finally {
      setSavingId(null);
    }
  };

  const create = async (event?: FormEvent) => {
    event?.preventDefault();
    setFormError("");
    if (!form.departmentId) {
      setFormError("Select a department.");
      return;
    }
    const specs: Record<string, string> = {};
    for (const line of form.specs.split("\n")) {
      const [key, ...rest] = line.split(":");
      if (key?.trim() && rest.length) specs[key.trim()] = rest.join(":").trim();
    }
    setCreating(true);
    try {
      await api.post("/equipment", {
        name: form.name,
        description: form.description,
        category: form.category,
        location: form.location,
        departmentId: form.departmentId,
        quantity: Number(form.quantity),
        status: "AVAILABLE",
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        specs,
      });
      push("Equipment added to the catalogue.", "success");
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to create equipment.");
    } finally {
      setCreating(false);
    }
  };

  const filtered = equipment.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.department.code.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Manage equipment"
        description="Add resources, adjust quantities and control availability across departments."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add equipment
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="field pl-9"
            placeholder="Search by name, category or department…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search equipment"
          />
        </div>
      </Card>

      {error && (
        <Card className="border-danger/25 bg-danger/[0.05] p-4 text-sm text-danger">{error}</Card>
      )}

      {loading ? (
        <Spinner label="Loading equipment catalogue" />
      ) : filtered.length ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.015]">
                  <th className="table-head px-4 py-3">Resource</th>
                  <th className="table-head px-4 py-3">Department</th>
                  <th className="table-head px-4 py-3">Location</th>
                  <th className="table-head px-4 py-3">Quantity</th>
                  <th className="table-head px-4 py-3">Status</th>
                  <th className="table-head px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const edit = edits[item.id] ?? { quantity: item.quantity, status: item.status };
                  const dirty = edit.quantity !== item.quantity || edit.status !== item.status;
                  return (
                    <tr key={item.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <EquipmentVisual category={item.category} name={item.name} compact />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-cream">{item.name}</p>
                            <p className="text-[10px] text-muted">{item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted">
                        <Badge tone="neutral">{item.department.code}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted">{item.location}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          className="field h-9 w-20 px-2 py-1 text-xs"
                          value={edit.quantity}
                          aria-label={`Quantity for ${item.name}`}
                          onChange={(event) =>
                            setEdits((current) => ({
                              ...current,
                              [item.id]: { ...edit, quantity: Number(event.target.value) },
                            }))
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="field h-9 w-32 px-2 py-1 text-xs"
                          value={edit.status}
                          aria-label={`Status for ${item.name}`}
                          onChange={(event) =>
                            setEdits((current) => ({
                              ...current,
                              [item.id]: { ...edit, status: event.target.value as EquipmentStatus },
                            }))
                          }
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant={dirty ? "primary" : "ghost"}
                          disabled={!dirty}
                          loading={savingId === item.id}
                          onClick={() => void saveRow(item)}
                        >
                          <Save className="h-3.5 w-3.5" /> Save
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={Wrench}
          title="No equipment matches"
          description="Adjust your search or add a new resource to the catalogue."
          action={<Button onClick={() => setModalOpen(true)}>Add equipment</Button>}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add equipment"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={creating} onClick={() => void create()}>
              Create resource
            </Button>
          </>
        }
      >
        <form onSubmit={create} className="space-y-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Name" required value={form.name} onChange={update("name")} placeholder="Thermal Camera" />
            <Input label="Category" required value={form.category} onChange={update("category")} placeholder="Sensors" />
            <Input label="Location" required value={form.location} onChange={update("location")} placeholder="ECE Lab A - Rack 5" />
            <Select label="Department" required value={form.departmentId} onChange={update("departmentId")}>
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.code} — {department.name}
                </option>
              ))}
            </Select>
            <Input
              label="Quantity"
              type="number"
              min={1}
              max={100}
              value={form.quantity}
              onChange={update("quantity")}
            />
            <Input label="Tags" value={form.tags} onChange={update("tags")} placeholder="thermal, imaging, sensor" />
          </div>
          <Textarea
            label="Description"
            required
            value={form.description}
            onChange={update("description")}
            className="min-h-[80px]"
            placeholder="What the equipment is used for…"
          />
          <Textarea
            label="Specifications"
            value={form.specs}
            onChange={update("specs")}
            className="min-h-[80px]"
            placeholder={"Resolution: 640x480\nInterface: USB-C\nFrame Rate: 30 fps"}
            hint="One specification per line using Key: Value."
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
