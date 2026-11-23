import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Boxes, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { fadeUp, staggerChildren } from "../lib/motion";
import type { Department, Equipment as EquipmentType } from "../lib/types";
import { EquipmentCard } from "../components/EquipmentCard";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, PageHeader } from "../components/ui/Feedback";

interface Filters {
  q: string;
  department: string;
  category: string;
  available: string;
  sort: string;
}

const INITIAL_FILTERS: Filters = { q: "", department: "", category: "", available: "", sort: "name" };

export default function Equipment() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ departments: Department[]; categories: string[] }>("/equipment/meta")
      .then((data) => {
        setDepartments(data.departments);
        setCategories(data.categories);
      })
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.q.trim()) params.set("q", filters.q.trim());
      if (filters.department) params.set("department", filters.department);
      if (filters.category) params.set("category", filters.category);
      if (filters.available) params.set("available", filters.available);
      if (filters.sort) params.set("sort", filters.sort);
      const data = await api.get<{ equipment: EquipmentType[] }>(
        `/equipment${params.toString() ? `?${params.toString()}` : ""}`
      );
      setEquipment(data.equipment);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load equipment.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), filters.q ? 260 : 0);
    return () => window.clearTimeout(timeout);
  }, [load, filters.q]);

  const activeFilters = useMemo(
    () => [filters.department, filters.category, filters.available && "Available only"].filter(Boolean).length,
    [filters]
  );

  const update = (key: keyof Filters) => (event: { target: { value: string } }) =>
    setFilters((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Resource marketplace"
        title="Equipment discovery"
        description="Search specialised development kits, instrumentation and workstations across every department."
        actions={
          <Badge tone="gold">
            <Boxes className="h-3 w-3" /> {equipment.length} resources
          </Badge>
        }
      />

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            <SlidersHorizontal className="h-3.5 w-3.5 text-gold" /> Filters
          </p>
          {(activeFilters > 0 || filters.q) && (
            <Button variant="ghost" size="sm" onClick={() => setFilters(INITIAL_FILTERS)}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_0.9fr_0.9fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="field pl-9"
              placeholder="Search equipment, tags, location…"
              value={filters.q}
              onChange={update("q")}
              aria-label="Search equipment"
            />
          </div>
          <select className="field" value={filters.department} onChange={update("department")} aria-label="Filter by department">
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.code} — {department.name}
              </option>
            ))}
          </select>
          <select className="field" value={filters.category} onChange={update("category")} aria-label="Filter by category">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select className="field" value={filters.available} onChange={update("available")} aria-label="Filter by availability">
            <option value="">Any status</option>
            <option value="true">Available</option>
          </select>
          <select className="field" value={filters.sort} onChange={update("sort")} aria-label="Sort equipment">
            <option value="name">Name A–Z</option>
            <option value="newest">Newest</option>
            <option value="category">Category</option>
            <option value="department">Department</option>
          </select>
        </div>
      </Card>

      {error && (
        <Card className="border-danger/25 bg-danger/[0.05] p-4 text-sm text-danger">
          {error}
          <button type="button" className="ml-3 font-semibold underline" onClick={() => void load()}>
            Retry
          </button>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[330px] animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]"
            />
          ))}
        </div>
      ) : equipment.length ? (
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerChildren}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {equipment.map((item) => (
            <EquipmentCard key={item.id} equipment={item} />
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={Boxes}
          title="No equipment matches those filters"
          description="Try a broader search or reset the filters to see the full catalogue."
          action={
            <Button variant="secondary" onClick={() => setFilters(INITIAL_FILTERS)}>
              Clear filters
            </Button>
          }
        />
      )}

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="text-center text-[11px] text-muted/70">
        {equipment.length} resource{equipment.length === 1 ? "" : "s"} shown · availability calculated from approved bookings
      </motion.div>
    </div>
  );
}
