import Link from "next/link";
import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, SectionTitle, Button } from "@/components/ui";
import { BorrowingStatusBadge } from "@/components/status-badge";
import { formatDateTime, daysOverdue } from "@/lib/constants";
import type { Borrowing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OverduePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("borrowings")
    .select(
      "*, profiles(name), borrowing_items(id, quantity, returned_quantity, items(name, item_code))"
    )
    .in("status", ["BORROWED", "PARTIALLY_RETURNED", "PENDING", "APPROVED"])
    .lt("expected_return_date", new Date().toISOString())
    .order("expected_return_date", { ascending: true });

  const overdue = (data ?? []).filter(
    (b) => daysOverdue(b.expected_return_date, b.status) > 0
  ) as Borrowing[];

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Barang Terlambat Dikembalikan"
        action={
          overdue.length > 0 ? (
            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
              {overdue.length} transaksi
            </span>
          ) : undefined
        }
      />

      {overdue.length === 0 ? (
        <Card>
          <EmptyState
            title="Tidak ada barang terlambat"
            description="Semua peminjaman dikembalikan tepat waktu. 👍"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {overdue.map((b) => {
            const days = daysOverdue(b.expected_return_date, b.status);
            return (
              <Card key={b.id} className="border-l-4 border-l-rose-500 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      {b.borrowing_items?.[0]?.items?.name ?? b.transaction_number}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {b.transaction_number} · Peminjam: {b.profiles?.name ?? "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <BorrowingStatusBadge status={b.status} />
                    <p className="mt-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                      TERLAMBAT {days} HARI
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  Pinjam {formatDateTime(b.borrow_date)} · Seharusnya kembali{" "}
                  <b>{formatDateTime(b.expected_return_date)}</b>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.role !== "mechanic" && (
                    <Link
                      href={`/returns/${b.id}`}
                      className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      ↩️ Proses Pengembalian
                    </Link>
                  )}
                  <Link
                    href={`/history`}
                    className="inline-flex items-center rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
