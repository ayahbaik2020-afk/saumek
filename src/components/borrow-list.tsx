"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, EmptyState, Select, SectionTitle, Spinner } from "@/components/ui";
import { BorrowingStatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/constants";
import type { Borrowing } from "@/lib/types";

export function BorrowList() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("borrowings")
        .select(
          "*, profiles(name), borrowing_items(id, quantity, item_id, items(name))"
        )
        .order("created_at", { ascending: false })
        .limit(100);
      setBorrowings((data ?? []) as Borrowing[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      status
        ? borrowings.filter((b) => b.status === status)
        : borrowings,
    [borrowings, status]
  );

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Peminjaman"
        action={
          <Button href="/borrow/new" className="px-3 py-2 text-xs">
            + Buat Peminjaman
          </Button>
        }
      />

      <Select
        className="max-w-xs"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
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

      {loading && <Spinner />}

      <div className="space-y-3">
        {filtered.map((b) => (
          <Link key={b.id} href={`/returns/${b.id}`}>
            <Card className="p-4 hover:border-blue-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    {b.transaction_number}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Peminjam: <b>{b.profiles?.name ?? "-"}</b>
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
                    <span className="text-zinc-700">{line.items?.name ?? "-"}</span>
                    <span className="text-zinc-500">
                      {line.quantity}x
                      {line.returned_quantity > 0 &&
                        ` (kembali ${line.returned_quantity})`}
                    </span>
                  </div>
                ))}
              </div>
              {b.purpose && (
                <p className="mt-2 rounded bg-zinc-50 px-2 py-1.5 text-xs text-zinc-600">
                  {b.purpose}
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-400">
                {formatDateTime(b.borrow_date)} · kembali{" "}
                {formatDateTime(b.expected_return_date)}
              </p>
            </Card>
          </Link>
        ))}
        {!loading && filtered.length === 0 && (
          <Card>
            <EmptyState
              title="Belum ada peminjaman"
              description="Buat transaksi peminjaman baru untuk mulai."
              action={<Button href="/borrow/new">+ Buat Peminjaman</Button>}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
