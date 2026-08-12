"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, EmptyState, Input, SectionTitle, Select, Spinner } from "@/components/ui";
import { BorrowingStatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/constants";
import type { Borrowing } from "@/lib/types";

export function HistoryList() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("borrowings")
        .select(
          "*, profiles(name), jobs(id, job_number, title), borrowing_items(id, item_id, quantity, returned_quantity, items(name, item_code))"
        )
        .order("created_at", { ascending: false })
        .limit(200);
      setBorrowings((data ?? []) as Borrowing[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return borrowings.filter((b) => {
      if (status && b.status !== status) return false;
      if (!q) return true;
      return (
        b.transaction_number.toLowerCase().includes(q) ||
        (b.profiles?.name ?? "").toLowerCase().includes(q) ||
        (b.jobs?.job_number ?? "").toLowerCase().includes(q) ||
        (b.jobs?.title ?? "").toLowerCase().includes(q) ||
        b.borrowing_items?.some(
          (l) =>
            (l.items?.name ?? "").toLowerCase().includes(q) ||
            (l.items?.item_code ?? "").toLowerCase().includes(q)
        )
      );
    });
  }, [borrowings, search, status]);

  return (
    <div className="space-y-4">
      <SectionTitle title="Riwayat Transaksi" />

      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <Input
          placeholder="Cari nomor transaksi, peminjam, atau barang..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          {[
            "BORROWED",
            "PARTIALLY_RETURNED",
            "RETURNED",
            "OVERDUE",
            "PENDING",
            "APPROVED",
            "CANCELLED",
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {loading && <Spinner />}

      <div className="space-y-3">
        {filtered.map((b) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-zinc-900">
                  {b.transaction_number}
                </p>
                <p className="text-xs text-zinc-500">
                  {b.profiles?.name ?? "-"} · {formatDateTime(b.borrow_date)}
                  {b.jobs ? (
                    <>
                      {" · "}
                      <Link
                        href={`/jobs/${b.jobs.id}`}
                        className="text-[var(--color-primary)] hover:underline"
                      >
                        {b.jobs.job_number}
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
              <BorrowingStatusBadge status={b.status} />
            </div>
            <div className="mt-3 space-y-1">
              {b.borrowing_items?.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between text-sm"
                >
                  <Link
                    href={`/inventory/${line.item_id}`}
                    className="text-zinc-700 transition-colors duration-150 ease-out hover:text-[var(--color-primary)]"
                  >
                    {line.items?.name ?? "-"}
                    <span className="text-xs text-zinc-400">
                      {" "}
                      ({line.items?.item_code})
                    </span>
                  </Link>
                  <span className="text-xs text-zinc-500">
                    {line.quantity}x · kembali {line.returned_quantity}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
        {!loading && filtered.length === 0 && (
          <Card>
            <EmptyState title="Tidak ada transaksi" />
          </Card>
        )}
      </div>
    </div>
  );
}
