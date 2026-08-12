"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Input,
  Select,
  Card,
  EmptyState,
  Button,
  SectionTitle,
} from "@/components/ui";
import { ItemStatusBadge } from "@/components/status-badge";
import type { Category, Item, Location } from "@/lib/types";

export function InventoryBrowser({
  items,
  categories,
  locations,
  canManage,
}: {
  items: Item[];
  categories: Category[];
  locations: Location[];
  canManage: boolean;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => {
      if (
        q &&
        ![item.name, item.item_code, item.brand, item.serial_number]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      )
        return false;
      if (category && item.category_id !== category) return false;
      if (status && item.status !== status) return false;
      if (location && item.location_id !== location) return false;
      return true;
    });
  }, [items, search, category, status, location]);

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Daftar Barang"
        action={
          canManage ? (
            <Button href="/inventory/new" className="px-3 py-2 text-xs">
              + Tambah Barang
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Cari kode, nama, merk, serial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:col-span-2"
        />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          {["AVAILABLE", "BORROWED", "MAINTENANCE", "DAMAGED", "LOST", "INACTIVE"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">Semua Lokasi</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="hidden md:block">
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Barang</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Kondisi</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((item) => (
                <tr key={item.id} className="transition-colors duration-150 ease-out hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/inventory/${item.id}`} className="font-medium text-zinc-900 transition-colors duration-150 ease-out hover:text-[var(--color-primary)]">
                      {item.name}
                    </Link>
                    <p className="text-xs text-zinc-500">{item.item_code}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {item.categories?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {item.locations?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{item.condition}</td>
                  <td className="px-4 py-3">
                    <ItemStatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.map((item) => (
          <Link key={item.id} href={`/inventory/${item.id}`}>
            <Card interactive className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{item.name}</p>
                  <p className="text-xs text-zinc-500">{item.item_code}</p>
                </div>
                <ItemStatusBadge status={item.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                <span>📍 {item.locations?.name ?? "-"}</span>
                <span>
                  Stok: <b>{item.quantity}</b> {item.unit}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <EmptyState
            title="Barang tidak ditemukan"
            description="Coba ubah kata kunci atau filter pencarian."
            action={canManage ? <Button href="/inventory/new">+ Tambah Barang</Button> : undefined}
          />
        </Card>
      )}
    </div>
  );
}
