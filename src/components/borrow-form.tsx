"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Card,
  ErrorMessage,
  Input,
  SectionTitle,
  Select,
  Textarea,
} from "@/components/ui";
import { createBorrowing, type BorrowState } from "@/lib/borrow-actions";
import type { Item } from "@/lib/types";

interface CartLine {
  item: Item;
  quantity: number;
}

export function BorrowForm({ initialItemCode }: { initialItemCode?: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("items")
        .select("*, categories(name)")
        .eq("is_active", true)
        .in("status", ["AVAILABLE"])
        .order("name");
      const list = (data ?? []) as Item[];
      setItems(list);
      if (initialItemCode) {
        const pre = list.find((i) => i.item_code === initialItemCode);
        if (pre) {
          setCart([{ item: pre, quantity: 1 }]);
        }
      }
      setLoading(false);
    })();
  }, [initialItemCode]);

  function addToCart(item: Item) {
    if (cart.some((c) => c.item.id === item.id)) return;
    setCart([...cart, { item, quantity: 1 }]);
  }

  function removeFromCart(id: string) {
    setCart(cart.filter((c) => c.item.id !== id));
  }

  function setQty(id: string, quantity: number) {
    setCart(cart.map((c) => (c.item.id === id ? { ...c, quantity } : c)));
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.item_code.toLowerCase().includes(q);
  });

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    for (const line of cart) {
      formData.set(`line-item-${line.item.id}`, line.item.id);
      formData.set(`line-qty-${line.item.id}`, String(line.quantity));
    }
    const res: BorrowState = await createBorrowing({}, formData);
    setSubmitting(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    if (res?.id) {
      router.push(`/history?success=${res.id}`);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <SectionTitle title="Buat Peminjaman" />

      {/* Step 1: pick items */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          1. Pilih Barang
        </h3>
        <Input
          placeholder="Cari barang tersedia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {filtered.map((item) => {
            const inCart = cart.some((c) => c.item.id === item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={inCart}
                onClick={() => addToCart(item)}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                  inCart
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-white hover:border-blue-300"
                }`}
              >
                <p className="font-semibold text-zinc-900">{item.name}</p>
                <p className="text-zinc-500">
                  {item.item_code} · Stok {item.quantity} {item.unit}
                </p>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && !loading && (
          <p className="py-4 text-center text-sm text-zinc-500">
            Tidak ada barang tersedia.
          </p>
        )}
      </Card>

      {/* Step 2: cart */}
      {cart.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            2. Detail Barang Dipinjam ({cart.length})
          </h3>
          <div className="space-y-3">
            {cart.map((line) => (
              <div
                key={line.item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {line.item.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {line.item.item_code} · Stok {line.item.quantity}{" "}
                    {line.item.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={line.item.quantity}
                    value={line.quantity}
                    onChange={(e) => setQty(line.item.id, Number(e.target.value))}
                    className="w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeFromCart(line.item.id)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Step 3: details */}
      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">3. Data Peminjaman</h3>
        <Textarea
          name="purpose"
          label="Keperluan Peminjaman *"
          placeholder="contoh: Perbaikan mesin produksi line 2"
          rows={2}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="location_of_use"
            label="Lokasi Penggunaan"
            placeholder="contoh: Workshop / Pabrik"
          />
          <Input
            name="expected_return_date"
            label="Estimasi Tanggal Kembali"
            type="date"
          />
        </div>
        <Textarea
          name="notes"
          label="Catatan"
          rows={2}
          placeholder="Catatan tambahan (opsional)"
        />
      </Card>

      <ErrorMessage message={error} />

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting || cart.length === 0}>
          {submitting ? "Menyimpan..." : "Konfirmasi Peminjaman"}
        </Button>
        <Button href="/borrow" variant="secondary">
          Batal
        </Button>
      </div>
    </form>
  );
}
