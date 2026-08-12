"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, EmptyState, Input, SectionTitle, Spinner } from "@/components/ui";
import { QrCard } from "@/components/qr-card";
import { companyName } from "@/lib/constants";
import type { Item } from "@/lib/types";

export function QrManager({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [loading, setLoading] = useState(initial.length === 0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("items")
        .select("*, categories(name)")
        .eq("is_active", true)
        .order("item_code");
      if (data) setItems(data as Item[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) =>
      [i.name, i.item_code, i.brand].filter(Boolean).some((v) =>
        String(v).toLowerCase().includes(q)
      )
    );
  }, [items, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedItems = items.filter((i) => selected.has(i.id));

  return (
    <div className="space-y-4">
      <SectionTitle title="Generate & Print QR Code" />

      <Input
        placeholder="Cari barang..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => toggle(item.id)}
            className={`rounded-xl border p-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] active:scale-[0.98] ${
              selected.has(item.id)
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                : "border-zinc-200 bg-white hover:border-[var(--color-primary)]"
            }`}
          >
            <p className="text-xs font-semibold text-zinc-900">{item.name}</p>
            <p className="text-xs text-zinc-500">{item.item_code}</p>
            {selected.has(item.id) && (
              <p className="mt-1 text-xs font-medium text-[var(--color-primary)]">✓ Dipilih</p>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <Card>
          <EmptyState title="Barang tidak ditemukan" />
        </Card>
      )}
      {loading && <Spinner />}

      {selectedItems.length > 0 && (
        <div>
          <SectionTitle
            title={`QR Terpilih (${selectedItems.length})`}
            action={
              <Button href="/scan" variant="secondary" className="px-3 py-2 text-xs">
                Scan untuk uji
              </Button>
            }
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {selectedItems.map((item) => (
              <QrCard key={item.id} code={item.item_code} name={item.name} size={140} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
