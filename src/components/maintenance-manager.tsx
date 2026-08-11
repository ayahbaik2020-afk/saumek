"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorMessage,
  Input,
  SectionTitle,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import {
  createMaintenance,
  completeMaintenance,
  type MaintState,
} from "@/lib/maintenance-actions";
import { formatDateTime } from "@/lib/constants";
import type { Item, MaintenanceRecord } from "@/lib/types";

export function MaintenanceManager() {
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [m, i] = await Promise.all([
        supabase.from("maintenance").select("*, items(name, item_code)").order("start_date", { ascending: false }),
        supabase.from("items").select("*, categories(name)").in("status", ["MAINTENANCE", "BORROWED", "AVAILABLE", "DAMAGED"]).eq("is_active", true).order("name"),
      ]);
      setRecords((m.data ?? []) as MaintenanceRecord[]);
      setItems((i.data ?? []) as Item[]);
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    const res: MaintState = await createMaintenance({}, formData);
    setSubmitting(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function handleComplete(id: string, status: "AVAILABLE" | "DAMAGED") {
    const res = await completeMaintenance(id, status);
    if (res.error) alert(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Maintenance Barang"
        action={
          <Button
            className="px-3 py-2 text-xs"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Tutup" : "+ Buat Maintenance"}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Buat Maintenance</h3>
          <form action={handleSubmit} className="space-y-3">
            <Select name="item_id" label="Barang" required>
              <option value="">- Pilih Barang -</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.item_code}) · {item.status}
                </option>
              ))}
            </Select>
            <Input name="problem" label="Masalah *" required placeholder="contoh: Probe multimeter rusak" />
            <Textarea name="description" label="Deskripsi" rows={2} />
            <div className="grid gap-3 sm:grid-cols-3">
              <Input name="technician" label="Teknisi" />
              <Input name="cost" label="Biaya" type="number" />
              <Input name="expected_finish" label="Estimasi Selesai" type="date" />
            </div>
            <ErrorMessage message={error} />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Mulai Maintenance"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && <Spinner />}

      <div className="space-y-3">
        {records.map((m) => (
          <Card key={m.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-zinc-900">
                  {m.items?.name ?? "Barang"}
                  <span className="ml-1 text-xs font-normal text-zinc-400">
                    ({m.items?.item_code})
                  </span>
                </p>
                <p className="text-xs text-zinc-500">{m.maintenance_number ?? "-"}</p>
              </div>
              <Badge
                className={
                  m.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-700"
                    : m.status === "CANCELLED"
                      ? "bg-zinc-100 text-zinc-500"
                      : "bg-amber-100 text-amber-700"
                }
              >
                {m.status}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-zinc-700">{m.problem}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Mulai {formatDateTime(m.start_date)} · Teknisi: {m.technician ?? "-"} · Biaya:{" "}
              {m.cost ? `Rp ${Number(m.cost).toLocaleString("id-ID")}` : "-"}
            </p>
            {m.status === "ONGOING" && (
              <div className="mt-3 flex gap-2">
                <Button
                  className="px-3 py-1.5 text-xs"
                  onClick={() => handleComplete(m.id, "AVAILABLE")}
                >
                  ✅ Selesai → Available
                </Button>
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => handleComplete(m.id, "DAMAGED")}
                >
                  ❌ Selesai → Rusak
                </Button>
              </div>
            )}
          </Card>
        ))}
        {!loading && records.length === 0 && (
          <Card>
            <EmptyState title="Belum ada maintenance" />
          </Card>
        )}
      </div>
    </div>
  );
}
