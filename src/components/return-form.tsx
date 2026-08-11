"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Card,
  ErrorMessage,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { BorrowingStatusBadge } from "@/components/status-badge";
import { processReturn, type BorrowState } from "@/lib/borrow-actions";
import { formatDateTime } from "@/lib/constants";
import type { Borrowing } from "@/lib/types";

export function ReturnForm({ borrowingId }: { borrowingId: string }) {
  const router = useRouter();
  const [borrowing, setBorrowing] = useState<Borrowing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("borrowings")
        .select(
          "*, profiles(name), borrowing_items(id, quantity, returned_quantity, status, item_id, items(name, item_code, unit))"
        )
        .eq("id", borrowingId)
        .maybeSingle();
      setBorrowing((data ?? null) as Borrowing | null);
      setLoading(false);
    })();
  }, [borrowingId]);

  if (loading) return <Spinner />;

  if (!borrowing) {
    return (
      <Card className="p-6 text-center text-sm text-zinc-500">
        Transaksi tidak ditemukan.
      </Card>
    );
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    formData.set("borrowing_id", borrowingId);
    const res: BorrowState = await processReturn({}, formData);
    setSubmitting(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push("/history");
  }

  const lines = borrowing.borrowing_items ?? [];

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-zinc-900">
            Pengembalian · {borrowing.transaction_number}
          </h1>
          <p className="text-sm text-zinc-500">
            Peminjam: {borrowing.profiles?.name ?? "-"} · Pinjam{" "}
            {formatDateTime(borrowing.borrow_date)}
          </p>
        </div>
        <BorrowingStatusBadge status={borrowing.status} />
      </div>

      <Card className="divide-y divide-zinc-100">
        {lines.map((line) => {
          const outstanding =
            Number(line.quantity) - Number(line.returned_quantity);
          if (outstanding <= 0) return null;
          return (
            <div key={line.id} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-900">
                  {line.items?.name}
                </p>
                <p className="text-xs text-zinc-500">
                  Dipinjam {line.quantity} · Sisa {outstanding}
                </p>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.5fr_2fr]">
                <Input
                  name={`ret-qty-${line.id}`}
                  label="Jumlah Kembali"
                  type="number"
                  min={1}
                  max={outstanding}
                  defaultValue={outstanding}
                  required
                />
                <Select
                  name={`ret-cond-${line.id}`}
                  label="Kondisi"
                  defaultValue="GOOD"
                >
                  <option value="GOOD">Baik</option>
                  <option value="LIGHT_DAMAGE">Rusak Ringan</option>
                  <option value="HEAVY_DAMAGE">Rusak Berat</option>
                  <option value="MAINTENANCE">Perlu Maintenance</option>
                </Select>
                <Input
                  name={`ret-notes-${line.id}`}
                  label="Catatan"
                  placeholder="opsional"
                />
              </div>
            </div>
          );
        })}
        {lines.length > 0 &&
          lines.every((l) => Number(l.quantity) - Number(l.returned_quantity) <= 0) && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              Semua barang sudah dikembalikan.
            </p>
          )}
      </Card>

      <Card className="space-y-3 p-4">
        <Textarea name="notes" label="Catatan Pengembalian" rows={2} />
      </Card>

      <ErrorMessage message={error} />

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Konfirmasi Pengembalian"}
        </Button>
        <Button href="/returns" variant="secondary">
          Batal
        </Button>
      </div>
    </form>
  );
}
