"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, CardHeader, SectionTitle, Spinner, StatCard } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/constants";
import type { Borrowing, Item, Job, ReturnRecord } from "@/lib/types";

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

type ToolUsageBorrowing = Borrowing & {
  jobs?: {
    id: string;
    job_number: string;
    title: string;
    area: string | null;
    external_work_orders?: { wo_number: string; external_status: string | null } | null;
  } | null;
};

type JobReportRow = Job & {
  pic?: { name: string } | null;
  supervisor?: { name: string } | null;
  external_work_orders?: { wo_number: string; external_status: string | null } | null;
  work_orders?: { wo_number: string } | null;
  job_manpower?: { is_pic: boolean; employees?: { name: string } | null }[];
};

export function ReportPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [borrowings, setBorrowings] = useState<ToolUsageBorrowing[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [jobs, setJobs] = useState<JobReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [i, b, r, j] = await Promise.all([
        supabase.from("items").select("*, categories(name), locations(name)"),
        supabase
          .from("borrowings")
          .select(
            "*, profiles(name), jobs(id, job_number, title, area, external_work_orders(wo_number, external_status)), borrowing_items(quantity, returned_quantity, items(name, item_code))"
          )
          .order("borrow_date", { ascending: false }),
        supabase
          .from("returns")
          .select("*, borrowings(transaction_number), return_items(quantity, condition, items(name, item_code))"),
        supabase
          .from("jobs")
          .select(
            "*, pic:employees!jobs_pic_id_fkey(name), supervisor:employees!jobs_supervisor_id_fkey(name), work_orders(wo_number), external_work_orders(wo_number, external_status), job_manpower(is_pic, employees(name))"
          )
          .order("planned_start", { ascending: false }),
      ]);
      setItems((i.data ?? []) as Item[]);
      setBorrowings((b.data ?? []) as ToolUsageBorrowing[]);
      setReturns((r.data ?? []) as ReturnRecord[]);
      setJobs((j.data ?? []) as unknown as JobReportRow[]);
      setLoading(false);
    })();
  }, []);

  function exportInventoryXlsx() {
    const rows = items.map((item) => ({
      Kode: item.item_code,
      Nama: item.name,
      Kategori: item.categories?.name ?? "",
      Merk: item.brand ?? "",
      Model: item.model ?? "",
      Serial: item.serial_number ?? "",
      Stok: item.quantity,
      Satuan: item.unit,
      Lokasi: item.locations?.name ?? "",
      Kondisi: item.condition,
      Status: item.status,
      Keterangan: item.description ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `inventory_${stamp()}.xlsx`);
  }

  function toolUsageRows() {
    const rows: Record<string, unknown>[] = [];
    for (const b of borrowings) {
      for (const line of b.borrowing_items ?? []) {
        rows.push({
          "No Transaksi": b.transaction_number,
          Peminjam: b.profiles?.name ?? "",
          "Kode Barang": line.items?.item_code ?? "",
          Barang: line.items?.name ?? "",
          Qty: line.quantity,
          "Qty Kembali": line.returned_quantity ?? 0,
          "No Job": b.jobs?.job_number ?? "",
          "Judul Job": b.jobs?.title ?? "",
          Area: b.jobs?.area ?? "",
          "WO SIMIP": b.jobs?.external_work_orders?.wo_number ?? "",
          "Status SIMIP": b.jobs?.external_work_orders?.external_status ?? "",
          Keperluan: b.purpose ?? "",
          "Lokasi Penggunaan": b.location_of_use ?? "",
          "Tanggal Pinjam": formatDateTime(b.borrow_date),
          "Estimasi Kembali": formatDateTime(b.expected_return_date),
          Status: b.status,
        });
      }
    }
    return rows;
  }

  function exportToolUsageXlsx() {
    const rows = toolUsageRows();
    if (rows.length === 0) {
      alert("Tidak ada data peminjaman.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tool Usage");
    XLSX.writeFile(wb, `tool_usage_${stamp()}.xlsx`);
  }

  function exportBorrowingXlsx() {
    const rows = toolUsageRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Peminjaman");
    XLSX.writeFile(wb, `peminjaman_${stamp()}.xlsx`);
  }

  function exportReturnXlsx() {
    const rows: Record<string, unknown>[] = [];
    for (const r of returns) {
      for (const line of r.return_items ?? []) {
        rows.push({
          "No Pengembalian": r.return_number,
          "No Peminjaman": r.borrowings?.transaction_number ?? "",
          Barang: line.items?.name ?? "",
          "Kode Barang": line.items?.item_code ?? "",
          Qty: line.quantity,
          Kondisi: line.condition,
          Tanggal: formatDateTime(r.return_date),
        });
      }
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pengembalian");
    XLSX.writeFile(wb, `pengembalian_${stamp()}.xlsx`);
  }

  function exportJobsXlsx() {
    const rows = jobs.map((j) => {
      const pics = (j.job_manpower ?? [])
        .filter((m) => m.is_pic)
        .map((m) => m.employees?.name)
        .filter(Boolean) as string[];
      const picLabel =
        pics.length > 0 ? pics.join(", ") : j.pic?.name ?? "";
      return {
        "No Job": j.job_number,
        Judul: j.title,
        Status: j.status,
        Progress: j.progress,
        Prioritas: j.priority,
        Plant: j.plant ?? "",
        Area: j.area ?? "",
        Lokasi: j.location ?? "",
        PIC: picLabel,
        Supervisor: j.supervisor?.name ?? "",
        "WO Internal": j.work_orders?.wo_number ?? "",
        "WO SIMIP": j.external_work_orders?.wo_number ?? "",
        "Status SIMIP": j.external_work_orders?.external_status ?? "",
        "Mulai Rencana": formatDate(j.planned_start),
        "Selesai Rencana": formatDate(j.planned_finish),
        "Mulai Aktual": formatDateTime(j.actual_start),
        "Selesai Aktual": formatDateTime(j.actual_finish),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jobs");
    XLSX.writeFile(wb, `jobs_${stamp()}.xlsx`);
  }

  if (loading) return <Spinner />;

  const borrowed = items.filter((i) => i.status === "BORROWED").length;
  const available = items.filter((i) => i.status === "AVAILABLE").length;
  const maintenance = items.filter((i) => i.status === "MAINTENANCE").length;
  const linkedBorrows = borrowings.filter((b) => b.job_id).length;
  const activeJobs = jobs.filter(
    (j) => j.status !== "COMPLETED" && j.status !== "CANCELLED"
  ).length;
  const simipJobs = jobs.filter((j) => j.external_wo_id).length;

  return (
    <div className="space-y-4">
      <SectionTitle title="Laporan & Export" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Job aktif" value={activeJobs} />
        <StatCard label="Job dari SIMIP" value={simipJobs} />
        <StatCard label="Pinjam terkait job" value={linkedBorrows} />
        <StatCard label="Barang dipinjam" value={borrowed} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Laporan Tool Usage"
            subtitle="Siapa meminjam tool untuk job / WO SIMIP mana"
          />
          <div className="flex flex-wrap gap-2 p-4">
            <Button className="px-3 py-2 text-xs" onClick={exportToolUsageXlsx}>
              Export Excel
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2 text-xs"
              onClick={() => downloadCSV(`tool_usage_${stamp()}.csv`, toolUsageRows())}
            >
              Export CSV
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Laporan Job / Schedule"
            subtitle={`${jobs.length} job · ${activeJobs} aktif · ${simipJobs} dari SIMIP`}
          />
          <div className="flex flex-wrap gap-2 p-4">
            <Button className="px-3 py-2 text-xs" onClick={exportJobsXlsx}>
              Export Excel
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2 text-xs"
              onClick={() =>
                downloadCSV(
                  `jobs_${stamp()}.csv`,
                  jobs.map((j) => ({
                    job: j.job_number,
                    judul: j.title,
                    status: j.status,
                    progress: j.progress,
                    area: j.area ?? "",
                    simip: j.external_work_orders?.wo_number ?? "",
                    pic: j.pic?.name ?? "",
                    mulai: j.planned_start ?? "",
                    selesai: j.planned_finish ?? "",
                  }))
                )
              }
            >
              Export CSV
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Laporan Inventory"
            subtitle={`${items.length} barang · ${available} available · ${borrowed} dipinjam · ${maintenance} maintenance`}
          />
          <div className="flex flex-wrap gap-2 p-4">
            <Button className="px-3 py-2 text-xs" onClick={exportInventoryXlsx}>
              Export Excel
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2 text-xs"
              onClick={() =>
                downloadCSV(
                  `inventory_${stamp()}.csv`,
                  items.map((i) => ({
                    kode: i.item_code,
                    nama: i.name,
                    kategori: i.categories?.name ?? "",
                    stok: i.quantity,
                    lokasi: i.locations?.name ?? "",
                    status: i.status,
                  }))
                )
              }
            >
              Export CSV
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Laporan Peminjaman" subtitle={`${borrowings.length} transaksi (termasuk kolom job/SIMIP)`} />
          <div className="flex flex-wrap gap-2 p-4">
            <Button className="px-3 py-2 text-xs" onClick={exportBorrowingXlsx}>
              Export Excel
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2 text-xs"
              onClick={() => downloadCSV(`peminjaman_${stamp()}.csv`, toolUsageRows())}
            >
              Export CSV
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Laporan Pengembalian" subtitle={`${returns.length} transaksi pengembalian`} />
          <div className="flex flex-wrap gap-2 p-4">
            <Button className="px-3 py-2 text-xs" onClick={exportReturnXlsx}>
              Export Excel
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2 text-xs"
              onClick={() =>
                downloadCSV(
                  `pengembalian_${stamp()}.csv`,
                  returns.map((r) => ({
                    nomor: r.return_number,
                    peminjaman: r.borrowings?.transaction_number ?? "",
                    tanggal: r.return_date,
                  }))
                )
              }
            >
              Export CSV
            </Button>
          </div>
        </Card>
      </div>

      <p className="text-xs text-zinc-500">
        Tool usage menghubungkan peminjam → barang → job → WO SIMIP. Untuk PDF, gunakan print browser (Ctrl+P).
      </p>
    </div>
  );
}
