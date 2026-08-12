"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Card,
  ErrorMessage,
  Input,
  SectionTitle,
  Select,
  Textarea,
} from "@/components/ui";
import { createBorrowing, type BorrowState } from "@/lib/borrow-actions";
import type { Item, Job } from "@/lib/types";

interface CartLine {
  item: Item;
  quantity: number;
}

type JobOption = Pick<Job, "id" | "job_number" | "title" | "area" | "location" | "status">;

export function BorrowForm({
  initialItemCode,
  initialJobId,
}: {
  initialItemCode?: string;
  initialJobId?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [jobId, setJobId] = useState(initialJobId ?? "");
  const [purpose, setPurpose] = useState("");
  const [locationOfUse, setLocationOfUse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [itemsRes, jobsRes] = await Promise.all([
        supabase
          .from("items")
          .select("*, categories(name)")
          .eq("is_active", true)
          .in("status", ["AVAILABLE"])
          .order("name"),
        supabase
          .from("jobs")
          .select("id, job_number, title, area, location, status")
          .not("status", "in", "(COMPLETED,CANCELLED)")
          .order("planned_start", { ascending: true }),
      ]);
      const list = (itemsRes.data ?? []) as Item[];
      setItems(list);
      setJobs((jobsRes.data ?? []) as JobOption[]);
      if (initialItemCode) {
        const pre = list.find((i) => i.item_code === initialItemCode);
        if (pre) {
          setCart([{ item: pre, quantity: 1 }]);
        }
      }
      setLoading(false);
    })();
  }, [initialItemCode]);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === jobId) ?? null,
    [jobs, jobId]
  );

  useEffect(() => {
    if (!selectedJob) return;
    setPurpose((prev) =>
      prev.trim() ? prev : `Pekerjaan ${selectedJob.job_number}: ${selectedJob.title}`
    );
    setLocationOfUse((prev) =>
      prev.trim()
        ? prev
        : [selectedJob.area, selectedJob.location].filter(Boolean).join(" / ")
    );
  }, [selectedJob]);

  function addToCart(item: Item) {
    if (cart.some((c) => c.item.id === item.id)) return;
    setCart([...cart, { item, quantity: 1 }]);
  }

  function removeFromCart(id: string) {
    setCart(cart.filter((c) => c.item.id !== id));
  }

  function setQty(id: string, quantity: number) {
    setCart(cart.map((c) => (c.item.id === id ? { ...c, quantity } : c)));
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.item_code.toLowerCase().includes(q);
  });

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    for (const line of cart) {
      formData.set(`line-item-${line.item.id}`, line.item.id);
      formData.set(`line-qty-${line.item.id}`, String(line.quantity));
    }
    if (jobId) formData.set("job_id", jobId);
    formData.set("purpose", purpose);
    formData.set("location_of_use", locationOfUse);
    const res: BorrowState = await createBorrowing({}, formData);
    setSubmitting(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    if (res?.id) {
      if (jobId) router.push(`/jobs/${jobId}`);
      else router.push(`/history?success=${res.id}`);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <SectionTitle title="Buat Peminjaman" />

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Pekerjaan (opsional)</h3>
        <Select
          name="job_id"
          label="Untuk Job"
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
        >
          <option value="">- Tidak terkait job -</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.job_number} · {j.title}
              {j.area ? ` (${j.area})` : ""}
            </option>
          ))}
        </Select>
        <p className="text-xs text-zinc-500">
          Jika dipilih, tool tercatat untuk job ini (siapa meminjam untuk pekerjaan apa).
        </p>
      </Card>

      {/* Step 1: pick items */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          1. Pilih Barang
        </h3>
        <Input
          placeholder="Cari barang tersedia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {filtered.map((item) => {
            const inCart = cart.some((c) => c.item.id === item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={inCart}
                onClick={() => addToCart(item)}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                  inCart
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-white hover:border-blue-300"
                }`}
              >
                <p className="font-semibold text-zinc-900">{item.name}</p>
                <p className="text-zinc-500">
                  {item.item_code} · Stok {item.quantity} {item.unit}
                </p>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && !loading && (
          <p className="py-4 text-center text-sm text-zinc-500">
            Tidak ada barang tersedia.
          </p>
        )}
      </Card>

      {/* Step 2: cart */}
      {cart.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            2. Detail Barang Dipinjam ({cart.length})
          </h3>
          <div className="space-y-3">
            {cart.map((line) => (
              <div
                key={line.item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {line.item.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {line.item.item_code} · Stok {line.item.quantity}{" "}
                    {line.item.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={line.item.quantity}
                    value={line.quantity}
                    onChange={(e) => setQty(line.item.id, Number(e.target.value))}
                    className="w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeFromCart(line.item.id)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Step 3: details */}
      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">3. Data Peminjaman</h3>
        <Textarea
          name="purpose"
          label="Keperluan Peminjaman *"
          placeholder="contoh: Perbaikan mesin produksi line 2"
          rows={2}
          required
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="location_of_use"
            label="Lokasi Penggunaan"
            placeholder="contoh: Workshop / Pabrik"
            value={locationOfUse}
            onChange={(e) => setLocationOfUse(e.target.value)}
          />
          <Input
            name="expected_return_date"
            label="Estimasi Tanggal Kembali"
            type="date"
          />
        </div>
        <Textarea
          name="notes"
          label="Catatan"
          rows={2}
          placeholder="Catatan tambahan (opsional)"
        />
      </Card>

      <ErrorMessage message={error} />

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting || cart.length === 0}>
          {submitting ? "Menyimpan..." : "Konfirmasi Peminjaman"}
        </Button>
        <Button href={jobId ? `/jobs/${jobId}` : "/borrow"} variant="secondary">
          Batal
        </Button>
      </div>
    </form>
  );
}
