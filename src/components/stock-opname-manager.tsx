"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  SectionTitle,
  Select,
  Spinner,
} from "@/components/ui";
import {
  createStockOpname,
  addStockOpnameItem,
  completeStockOpname,
  type MaintState,
} from "@/lib/maintenance-actions";
import { formatDateTime } from "@/lib/constants";

interface Opname {
  id: string;
  opname_number: string;
  status: "IN_PROGRESS" | "COMPLETED";
  checked_by: string;
  checked_at: string;
  notes: string | null;
  stock_opname_items?: {
    id: string;
    item_id: string;
    system_quantity: number;
    physical_quantity: number;
    difference: number;
    items?: { name: string; item_code: string } | null;
  }[];
}

export function StockOpnameManager() {
  const router = useRouter();
  const [opnames, setOpnames] = useState<Opname[]>([]);
  const [items, setItems] = useState<{ id: string; name: string; item_code: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [itemId, setItemId] = useState("");
  const [physicalQty, setPhysicalQty] = useState("1");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [o, i] = await Promise.all([
        supabase
          .from("stock_opnames")
          .select("*, stock_opname_items(*, items(name, item_code))")
          .order("checked_at", { ascending: false }),
        supabase.from("items").select("id, name, item_code, quantity").eq("is_active", true).order("name"),
      ]);
      setOpnames((o.data ?? []) as Opname[]);
      setItems((i.data ?? []) as { id: string; name: string; item_code: string; quantity: number }[]);
      setLoading(false);
    })();
  }, []);

  async function handleStart() {
    setBusy(true);
    const res: MaintState = await createStockOpname({}, new FormData());
    setBusy(false);
    if (res?.error) {
      alert(res.error);
      return;
    }
    if (res?.id) setActiveId(res.id);
    router.refresh();
  }

  async function handleAdd() {
    if (!activeId || !itemId || !physicalQty) return;
    setBusy(true);
    const res = await addStockOpnameItem(activeId, itemId, Number(physicalQty));
    setBusy(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    setItemId("");
    setPhysicalQty("1");
    router.refresh();
  }

  async function handleComplete(id: string) {
    const res = await completeStockOpname(id);
    if (res.error) alert(res.error);
    setActiveId(null);
    router.refresh();
  }

  const active = opnames.find((o) => o.id === activeId) ?? opnames.find((o) => o.status === "IN_PROGRESS");

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Stock Opname"
        action={
          <Button className="px-3 py-2 text-xs" onClick={handleStart} disabled={busy || Boolean(active)}>
            + Mulai Opname Baru
          </Button>
        }
      />

      {active && (
        <Card className="p-4">
          <CardHeader
            title={`Opname Aktif · ${active.opname_number}`}
            subtitle={`Dicek oleh Admin · ${formatDateTime(active.checked_at)}`}
          />
          <div className="mt-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <Select value={itemId} onChange={(e) => setItemId(e.target.value)}>
                <option value="">- Pilih Barang -</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.item_code}) · sistem {item.quantity}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                min={0}
                placeholder="Stok fisik"
                value={physicalQty}
                onChange={(e) => setPhysicalQty(e.target.value)}
              />
              <Button onClick={handleAdd} disabled={busy || !itemId}>
                Tambah
              </Button>
            </div>

            <div className="divide-y divide-zinc-100">
              {active.stock_opname_items?.length ? (
                active.stock_opname_items.map((line) => (
                  <div key={line.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-zinc-900">{line.items?.name}</p>
                      <p className="text-xs text-zinc-500">{line.items?.item_code}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500">
                        Sistem {line.system_quantity} → Fisik {line.physical_quantity}
                      </span>
                      <Badge
                        className={
                          line.difference === 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }
                      >
                        {line.difference > 0 ? `+${line.difference}` : line.difference}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-zinc-500">
                  Belum ada barang dicek.
                </p>
              )}
            </div>

            <Button variant="secondary" onClick={() => handleComplete(active.id)} disabled={busy}>
              Selesaikan Opname
            </Button>
          </div>
        </Card>
      )}

      {loading && <Spinner />}

      <div className="space-y-3">
        {opnames.map((o) => (
          <Card key={o.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">{o.opname_number}</p>
              <p className="text-xs text-zinc-500">
                {formatDateTime(o.checked_at)} · {o.stock_opname_items?.length ?? 0} item
              </p>
            </div>
            <Badge
              className={
                o.status === "COMPLETED"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }
            >
              {o.status}
            </Badge>
          </Card>
        ))}
        {!loading && opnames.length === 0 && (
          <Card>
            <EmptyState title="Belum ada stock opname" />
          </Card>
        )}
      </div>
    </div>
  );
}
