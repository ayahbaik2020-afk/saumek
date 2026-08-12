"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { QrScanner } from "@/components/qr-scanner";
import { Button, Card, ErrorMessage, Input, Spinner } from "@/components/ui";
import { ItemStatusBadge } from "@/components/status-badge";
import { formatDateTime, ITEM_CONDITION } from "@/lib/constants";
import type { Item } from "@/lib/types";

interface ScanResult {
  item: Item;
  currentBorrowing?: {
    id: string;
    transaction_number: string;
    profiles?: { name: string } | null;
    expected_return_date: string | null;
  } | null;
}

export function ScanClient({ initialCode }: { initialCode?: string }) {
  const router = useRouter();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState(initialCode ?? "");
  const [scanned, setScanned] = useState(false);

  async function lookup(code: string) {
    if (!code) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setScanned(true);

    const supabase = createClient();

    // Universal QR: EMP- / JOB- / AST- prefixes route to their modules
    if (code.startsWith("EMP-")) {
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .or(`employee_id.eq.${code},qr_code.eq.${code}`)
        .maybeSingle();
      setLoading(false);
      if (emp) {
        router.push(`/people/${emp.id}`);
      } else {
        setError(`Personel dengan kode "${code}" tidak ditemukan.`);
      }
      return;
    }

    if (code.startsWith("JOB-")) {
      const { data: job } = await supabase
        .from("jobs")
        .select("id")
        .eq("job_number", code)
        .maybeSingle();
      setLoading(false);
      if (job) {
        router.push(`/jobs/${job.id}`);
      } else {
        setError(`Job dengan nomor "${code}" tidak ditemukan.`);
      }
      return;
    }

    if (code.startsWith("AST-")) {
      const { data: unit } = await supabase
        .from("item_units")
        .select("item_id")
        .or(`unit_code.eq.${code},qr_code.eq.${code}`)
        .maybeSingle();
      setLoading(false);
      if (unit) {
        router.push(`/inventory/${unit.item_id}`);
      } else {
        setError(`Asset dengan kode "${code}" tidak ditemukan.`);
      }
      return;
    }

    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("*, categories(name), locations(name)")
      .eq("item_code", code)
      .maybeSingle();

    if (itemError || !item) {
      setError(`Barang dengan kode "${code}" tidak ditemukan.`);
      setLoading(false);
      return;
    }

    let currentBorrowing = null;
    if (item.status === "BORROWED") {
      const { data: active } = await supabase
        .from("borrowings")
        .select("id, transaction_number, expected_return_date, profiles(name)")
        .in("status", ["BORROWED", "PARTIALLY_RETURNED", "PENDING", "APPROVED"])
        .eq("borrowing_items.item_id", item.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (active?.[0])
        currentBorrowing = active[0] as unknown as ScanResult["currentBorrowing"];
    }

    setResult({ item: item as Item, currentBorrowing });
    setLoading(false);
  }

  useEffect(() => {
    if (initialCode) lookup(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const item = result?.item;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-lg font-bold text-zinc-900">Scan Barang</h1>
        <p className="text-sm text-zinc-500">
          Arahkan kamera ke QR Code barang untuk memulai.
        </p>
      </div>

      {!scanned && (
        <>
          <QrScanner
            onResult={(code) => lookup(code)}
            paused={Boolean(loading) || Boolean(result)}
          />
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              lookup(manualCode.trim());
            }}
          >
            <Input
              placeholder="Atau ketik kode barang manual..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <Button type="submit" variant="secondary" className="shrink-0">
              Cari
            </Button>
          </form>
        </>
      )}

      {loading && <Spinner />}
      <ErrorMessage message={error} />

      {item && (
        <Card className="overflow-hidden">
          {item.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.photo_url}
              alt={item.name}
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="flex h-32 items-center justify-center bg-[var(--color-primary-soft)] text-5xl">
              📦
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-zinc-900">{item.name}</h2>
              <ItemStatusBadge status={item.status} />
            </div>
            <p className="text-sm text-zinc-500">{item.item_code}</p>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-zinc-400">Kategori</dt>
                <dd className="font-medium text-zinc-800">
                  {item.categories?.name ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">Kondisi</dt>
                <dd className="font-medium text-zinc-800">
                  {ITEM_CONDITION[item.condition] ?? item.condition}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">Lokasi</dt>
                <dd className="font-medium text-zinc-800">
                  {item.locations?.name ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">Stok</dt>
                <dd className="font-medium text-zinc-800">
                  {item.quantity} {item.unit}
                </dd>
              </div>
            </dl>

            <div className="mt-5 space-y-2">
              {item.status === "AVAILABLE" && (
                <Button
                  className="w-full py-3 text-base"
                  href={`/borrow/new?item=${encodeURIComponent(item.item_code)}`}
                >
                  🔄 PINJAM BARANG
                </Button>
              )}

              {item.status === "BORROWED" && (
                <div className="space-y-3 rounded-lg bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Barang sedang dipinjam oleh{" "}
                    {result.currentBorrowing?.profiles?.name ?? "-"}
                  </p>
                  {result.currentBorrowing && (
                    <p className="text-xs text-amber-700">
                      Transaksi: {result.currentBorrowing.transaction_number} ·
                      Estimasi kembali:{" "}
                      {formatDateTime(result.currentBorrowing.expected_return_date)}
                    </p>
                  )}
                  <Button
                    className="w-full"
                    href={`/returns?item=${encodeURIComponent(item.item_code)}`}
                  >
                    ↩️ Proses Pengembalian
                  </Button>
                </div>
              )}

              {["MAINTENANCE", "DAMAGED", "LOST", "INACTIVE"].includes(
                item.status
              ) && (
                <div className="rounded-lg bg-zinc-100 p-4 text-center">
                  <p className="text-sm font-semibold text-zinc-700">
                    Barang tidak dapat dipinjam
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Status saat ini: {item.status}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-600 transition-colors duration-150 ease-out hover:bg-zinc-50"
              onClick={() => {
                setResult(null);
                setError(null);
                setScanned(false);
                setManualCode("");
              }}
            >
              📷 Scan Barang Lain
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
