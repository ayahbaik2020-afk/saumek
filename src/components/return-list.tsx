"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, EmptyState, SectionTitle, Spinner } from "@/components/ui";
import { BorrowingStatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/constants";
import type { Borrowing } from "@/lib/types";

export function ReturnList({ itemCode }: { itemCode?: string }) {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      let query = supabase
        .from("borrowings")
        .select(
          "*, profiles(name), borrowing_items(id, quantity, returned_quantity, status, item_id, items(name, item_code))"
        )
        .in("status", ["BORROWED", "PARTIALLY_RETURNED", "PENDING", "APPROVED"])
        .order("created_at", { ascending: false });

      if (itemCode) {
        query = query.eq("borrowing_items.items.item_code", itemCode);
      }

      const { data } = await query.limit(100);
      setBorrowings((data ?? []) as Borrowing[]);
      setLoading(false);
    })();
  }, [itemCode]);

  const filtered = useMemo(() => {
    if (!itemCode) return borrowings;
    return borrowings.filter((b) =>
      b.borrowing_items?.some((line) => line.items?.item_code === itemCode)
    );
  }, [borrowings, itemCode]);

  return (
    <div className="space-y-4">
      <SectionTitle
        title={itemCode ? `Pengembalian · ${itemCode}` : "Pengembalian"}
      />

      {itemCode && filtered.length > 0 && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Menampilkan transaksi aktif untuk barang dengan kode {itemCode}.
        </p>
      )}

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
                    <span className="text-zinc-700">
                      {line.items?.name ?? "-"}{" "}
                      <span className="text-xs text-zinc-400">
                        ({line.items?.item_code})
                      </span>
                    </span>
                    <span className="text-zinc-500">
                      sisa {Number(line.quantity) - Number(line.returned_quantity)}x
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Pinjam {formatDateTime(b.borrow_date)} · estimasi kembali{" "}
                {formatDateTime(b.expected_return_date)}
              </p>
              <span className="mt-2 inline-block rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                ↩️ Proses Pengembalian
              </span>
            </Card>
          </Link>
        ))}
        {!loading && filtered.length === 0 && (
          <Card>
            <EmptyState
              title="Tidak ada transaksi aktif"
              description="Tidak ada peminjaman yang perlu dikembalikan."
              action={<Button href="/scan">📷 Scan QR</Button>}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
