"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, EmptyState, SectionTitle, Spinner } from "@/components/ui";
import { BorrowingStatusBadge } from "@/components/status-badge";
import { formatDateTime, daysOverdue } from "@/lib/constants";
import type { Borrowing } from "@/lib/types";

export function MyItems({ userId }: { userId: string }) {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("borrowings")
        .select(
          "*, profiles(name), borrowing_items(id, quantity, returned_quantity, status, items(name, item_code))"
        )
        .eq("borrower_id", userId)
        .in("status", ["BORROWED", "PARTIALLY_RETURNED", "PENDING", "APPROVED"])
        .order("created_at", { ascending: false });
      setBorrowings((data ?? []) as Borrowing[]);
      setLoading(false);
    })();
  }, [userId]);

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Barang Saya"
        action={
          <Button href="/scan" className="px-3 py-2 text-xs">
            📷 Scan QR
          </Button>
        }
      />

      {loading && <Spinner />}

      <div className="space-y-3">
        {borrowings.map((b) => {
          const overdue = daysOverdue(b.expected_return_date, b.status);
          return (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    {b.transaction_number}
                  </p>
                  <p className="text-xs text-zinc-500">{b.purpose}</p>
                </div>
                <BorrowingStatusBadge status={b.status} />
              </div>
              <div className="mt-3 space-y-1">
                {b.borrowing_items?.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-zinc-700">
                      {line.items?.name}{" "}
                      <span className="text-xs text-zinc-400">
                        ({line.items?.item_code})
                      </span>
                    </span>
                    <span className="text-zinc-500">
                      {line.quantity}x · sisa{" "}
                      {Number(line.quantity) - Number(line.returned_quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                <span>
                  Pinjam {formatDateTime(b.borrow_date)} · Estimasi kembali{" "}
                  {formatDateTime(b.expected_return_date)}
                </span>
                {overdue > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-700">
                    Terlambat {overdue} hari
                  </span>
                )}
              </div>
              <div className="mt-3">
                <Button href={`/returns/${b.id}`} variant="secondary" className="w-full px-3 py-2 text-xs sm:w-auto">
                  ↩️ Kembalikan Barang
                </Button>
              </div>
            </Card>
          );
        })}
        {!loading && borrowings.length === 0 && (
          <Card>
            <EmptyState
              title="Tidak ada barang dipinjam"
              description="Scan QR Code untuk meminjam barang."
              action={<Button href="/scan">📷 Scan QR</Button>}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
