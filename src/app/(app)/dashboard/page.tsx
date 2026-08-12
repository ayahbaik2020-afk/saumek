import Link from "next/link";
import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, StatCard, SectionTitle, Button } from "@/components/ui";
import { ItemStatusBadge, BorrowingStatusBadge, JobStatusBadge } from "@/components/status-badge";
import { formatDateTime, daysOverdue, todayISO } from "@/lib/constants";
import SyncStatusCard from "@/components/sync-status";
import type { BorrowingStatus, JobStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type BorrowingRow = {
  id: string;
  transaction_number: string;
  status: BorrowingStatus;
  borrow_date: string;
  expected_return_date: string | null;
  borrower_id: string;
  profiles: { name: string } | null;
  borrowing_items: {
    id: string;
    item_id: string;
    quantity: number;
    items: { name: string } | null;
  }[];
};

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: itemsRaw }, { data: borrowingsRaw }, { data: returnsTodayRaw }, { data: jobsRaw }, { data: employeesRaw }] =
    await Promise.all([
      supabase.from("items").select("id, status"),
      supabase
        .from("borrowings")
        .select(
          "id, transaction_number, status, borrow_date, expected_return_date, borrower_id, profiles(name), borrowing_items(id, item_id, quantity, items(name))"
        )
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("returns")
        .select("id")
        .gte("return_date", todayISO() + "T00:00:00")
        .lte("return_date", todayISO() + "T23:59:59"),
      supabase.from("jobs").select("id, job_number, title, status, progress, planned_start"),
      supabase.from("employees").select("id, employment_status"),
    ]);

  const items = (itemsRaw ?? []) as { id: string; status: string }[];
  const borrowings = (borrowingsRaw ?? []) as unknown as BorrowingRow[];
  const returnsToday = (returnsTodayRaw ?? []) as { id: string }[];
  const jobs = (jobsRaw ?? []) as unknown as { id: string; job_number: string; title: string; status: JobStatus; progress: number; planned_start: string | null }[];
  const employees = (employeesRaw ?? []) as { id: string; employment_status: string }[];

  const count = (s: string) => items.filter((i) => i.status === s).length;

  const activeBorrowings = borrowings.filter((b) =>
    ["BORROWED", "PARTIALLY_RETURNED", "PENDING", "APPROVED"].includes(b.status)
  );

  const overdue = borrowings.filter(
    (b) => daysOverdue(b.expected_return_date, b.status) > 0
  );

  const borrowedToday = borrowings.filter((b) =>
    new Date(b.borrow_date).toDateString() === new Date().toDateString()
  ).length;

  // Top borrowed items
  const itemCountMap = new Map<string, { name: string; count: number }>();
  for (const b of borrowings) {
    for (const line of b.borrowing_items ?? []) {
      const key = line.item_id;
      const name = line.items?.name ?? "Barang";
      const prev = itemCountMap.get(key);
      if (prev) prev.count += Number(line.quantity);
      else itemCountMap.set(key, { name, count: Number(line.quantity) });
    }
  }
  const topItems = [...itemCountMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  const isAdmin = profile.role === "admin";

  const jobCount = (s: string) => jobs.filter((j) => j.status === s).length;
  const activeEmployeesCount = employees.filter((e) => e.employment_status !== "INACTIVE").length;
  const activeJobs = jobs.filter((j) => ["PLANNED", "READY", "IN_PROGRESS", "PENDING"].includes(j.status));
  const showJobs = ["admin", "supervisor", "foreman", "management"].includes(profile.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500">
          Selamat datang, {profile.name.split(" ")[0]} 👋
        </p>
      </div>

      {["admin", "supervisor", "foreman"].includes(profile.role) && (
        <SyncStatusCard />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Barang" value={items.length} />
        <StatCard label="Available" value={count("AVAILABLE")} color="text-emerald-600" />
        <StatCard label="Dipinjam" value={count("BORROWED")} color="text-amber-600" />
        <StatCard label="Maintenance" value={count("MAINTENANCE")} color="text-blue-600" />
        <StatCard label="Rusak" value={count("DAMAGED")} color="text-rose-600" />
        <StatCard label="Hilang" value={count("LOST")} color="text-zinc-600" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="px-4 py-3">
          <p className="text-xs font-medium text-zinc-500">Peminjaman Hari Ini</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-primary)]">{borrowedToday}</p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs font-medium text-zinc-500">Pengembalian Hari Ini</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{returnsToday.length}</p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs font-medium text-zinc-500">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{overdue.length}</p>
        </Card>
      </div>

      {(isAdmin || profile.role === "supervisor") && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <SectionTitle
              title="Overdue"
              action={
                <Link href="/overdue" className="text-xs font-medium text-[var(--color-primary)] hover:underline">
                  Lihat semua
                </Link>
              }
            />
            {overdue.length === 0 ? (
              <Card>
                <p className="px-4 py-6 text-center text-sm text-zinc-500">
                  Tidak ada barang terlambat dikembalikan. 👍
                </p>
              </Card>
            ) : (
              <Card className="divide-y divide-zinc-100">
                {overdue.slice(0, 5).map((b) => (
                  <div key={b.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-zinc-900">
                        {b.borrowing_items?.[0]?.items?.name ?? b.transaction_number}
                      </p>
                      <BorrowingStatusBadge status={b.status === "OVERDUE" ? "OVERDUE" : "BORROWED"} />
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {b.profiles?.name ?? "-"} · {formatDateTime(b.expected_return_date)}
                    </p>
                  </div>
                ))}
              </Card>
            )}
          </div>

          <div>
            <SectionTitle title="Barang Paling Sering Dipinjam" />
            {topItems.length === 0 ? (
              <Card>
                <p className="px-4 py-6 text-center text-sm text-zinc-500">Belum ada data.</p>
              </Card>
            ) : (
              <Card className="divide-y divide-zinc-100">
                {topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-bold text-[var(--color-primary)]">
                        {i + 1}
                      </span>
                      <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                    </div>
                    <p className="text-sm text-zinc-500">{item.count}x</p>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </div>
      )}

      {showJobs && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Job" value={jobs.length} />
          <StatCard label="Direncanakan" value={jobCount("PLANNED")} color="text-blue-600" />
          <StatCard label="Siap" value={jobCount("READY")} color="text-emerald-600" />
          <StatCard label="Berjalan" value={jobCount("IN_PROGRESS")} color="text-amber-600" />
          <StatCard label="Selesai" value={jobCount("COMPLETED")} color="text-emerald-600" />
          <StatCard label="Personel Aktif" value={activeEmployeesCount} color="text-[var(--color-primary)]" />
        </div>
      )}

      {showJobs && (
        <div>
          <SectionTitle
            title="Pekerjaan Aktif"
            action={
              <Link href="/jobs" className="text-xs font-medium text-[var(--color-primary)] hover:underline">
                Lihat semua
              </Link>
            }
          />
          <Card className="divide-y divide-zinc-100">
            {activeJobs.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">Belum ada pekerjaan aktif.</p>
            ) : (
              activeJobs.slice(0, 5).map((j) => (
                <Link
                  key={j.id}
                  href={`/jobs/${j.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors duration-150 ease-out hover:bg-zinc-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">{j.title}</p>
                    <p className="text-xs text-zinc-500">{j.job_number}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-medium text-zinc-600">{j.progress}%</span>
                    <JobStatusBadge status={j.status} />
                  </div>
                </Link>
              ))
            )}
          </Card>
        </div>
      )}

      <div>
        <SectionTitle
          title="Transaksi Terbaru"
          action={
            <Link href="/history" className="text-xs font-medium text-[var(--color-primary)] hover:underline">
              Lihat semua
            </Link>
          }
        />
        <Card className="divide-y divide-zinc-100">
          {activeBorrowings.slice(0, 5).map((b) => (
            <Link
              key={b.id}
              href="/history"
              className="flex items-center justify-between px-4 py-3 transition-colors duration-150 ease-out hover:bg-zinc-50"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {b.borrowing_items?.[0]?.items?.name ?? b.transaction_number}
                  {(b.borrowing_items?.length ?? 0) > 1 && (
                    <span className="text-zinc-400"> +{b.borrowing_items!.length - 1} lainnya</span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  {b.profiles?.name ?? "-"} · {b.transaction_number} · {formatDateTime(b.borrow_date)}
                </p>
              </div>
              <BorrowingStatusBadge status={b.status} />
            </Link>
          ))}
          {activeBorrowings.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              Belum ada transaksi aktif.
            </p>
          )}
        </Card>
      </div>

      {profile.role === "mechanic" && (
        <div className="grid grid-cols-2 gap-3">
          <Button href="/scan">📷 Scan QR Code</Button>
          <Button href="/my-items" variant="secondary">
            🎒 Barang Saya
          </Button>
        </div>
      )}
    </div>
  );
}
