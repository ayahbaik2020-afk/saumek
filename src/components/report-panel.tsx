"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, CardHeader, SectionTitle, Spinner } from "@/components/ui";
import { formatDateTime } from "@/lib/constants";
import type { Borrowing, Item, ReturnRecord } from "@/lib/types";

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

export function ReportPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [i, b, r] = await Promise.all([
        supabase.from("items").select("*, categories(name), locations(name)"),
        supabase
          .from("borrowings")
          .select("*, profiles(name), borrowing_items(quantity, items(name, item_code))"),
        supabase
          .from("returns")
          .select("*, borrowings(transaction_number), return_items(quantity, condition, items(name, item_code))"),
      ]);
      setItems((i.data ?? []) as Item[]);
      setBorrowings((b.data ?? []) as Borrowing[]);
      setReturns((r.data ?? []) as ReturnRecord[]);
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
    XLSX.writeFile(wb, `inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportBorrowingXlsx() {
    const rows: Record<string, unknown>[] = [];
    for (const b of borrowings) {
      for (const line of b.borrowing_items ?? []) {
        rows.push({
          "No Transaksi": b.transaction_number,
          Peminjam: b.profiles?.name ?? "",
          Barang: line.items?.name ?? "",
          "Kode Barang": line.items?.item_code ?? "",
          Qty: line.quantity,
          Keperluan: b.purpose ?? "",
          "Lokasi Penggunaan": b.location_of_use ?? "",
          "Tanggal Pinjam": formatDateTime(b.borrow_date),
          "Estimasi Kembali": formatDateTime(b.expected_return_date),
          Status: b.status,
        });
      }
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Peminjaman");
    XLSX.writeFile(wb, `peminjaman_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
    XLSX.writeFile(wb, `pengembalian_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  if (loading) return <Spinner />;

  const borrowed = items.filter((i) => i.status === "BORROWED").length;
  const available = items.filter((i) => i.status === "AVAILABLE").length;
  const maintenance = items.filter((i) => i.status === "MAINTENANCE").length;

  return (
    <div className="space-y-4">
      <SectionTitle title="Laporan & Export" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Laporan Inventory" subtitle={`${items.length} barang · ${available} available · ${borrowed} dipinjam · ${maintenance} maintenance`} />
          <div className="flex flex-wrap gap-2 p-4">
            <Button className="px-3 py-2 text-xs" onClick={exportInventoryXlsx}>
              📊 Export Excel
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2 text-xs"
              onClick={() =>
                downloadCSV(
                  `inventory_${new Date().toISOString().slice(0, 10)}.csv`,
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
              📄 Export CSV
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Laporan Peminjaman" subtitle={`${borrowings.length} transaksi peminjaman`} />
          <div className="flex flex-wrap gap-2 p-4">
            <Button className="px-3 py-2 text-xs" onClick={exportBorrowingXlsx}>
              📊 Export Excel
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2 text-xs"
              onClick={() =>
                downloadCSV(
                  `peminjaman_${new Date().toISOString().slice(0, 10)}.csv`,
                  borrowings.map((b) => ({
                    nomor: b.transaction_number,
                    peminjam: b.profiles?.name ?? "",
                    keperluan: b.purpose ?? "",
                    tanggal: b.borrow_date,
                    kembali: b.expected_return_date ?? "",
                    status: b.status,
                  }))
                )
              }
            >
              📄 Export CSV
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Laporan Pengembalian" subtitle={`${returns.length} transaksi pengembalian`} />
          <div className="flex flex-wrap gap-2 p-4">
            <Button className="px-3 py-2 text-xs" onClick={exportReturnXlsx}>
              📊 Export Excel
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-2 text-xs"
              onClick={() =>
                downloadCSV(
                  `pengembalian_${new Date().toISOString().slice(0, 10)}.csv`,
                  returns.map((r) => ({
                    nomor: r.return_number,
                    peminjaman: r.borrowings?.transaction_number ?? "",
                    tanggal: r.return_date,
                  }))
                )
              }
            >
              📄 Export CSV
            </Button>
          </div>
        </Card>
      </div>

      <p className="text-xs text-zinc-500">
        Untuk laporan PDF, gunakan print browser (Ctrl+P) pada halaman terkait.
      </p>
    </div>
  );
}
