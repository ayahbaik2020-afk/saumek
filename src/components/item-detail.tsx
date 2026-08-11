"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  Input,
  Select,
  Badge,
} from "@/components/ui";
import { ItemStatusBadge } from "@/components/status-badge";
import { QrCard } from "@/components/qr-card";
import { changeItemStatus, toggleItemActive } from "@/lib/item-actions";
import { formatDateTime, ITEM_CONDITION } from "@/lib/constants";
import type { AuditLog, Item, MaintenanceRecord, Role } from "@/lib/types";

interface HistoryLine {
  id: string;
  action: string;
  detail: string;
  who: string | null;
  when: string;
}

export function ItemDetail({
  item,
  role,
  history,
  maintenance,
  audit,
}: {
  item: Item;
  role: Role;
  history: HistoryLine[];
  maintenance: MaintenanceRecord[];
  audit: AuditLog[];
}) {
  const router = useRouter();
  const isAdmin = role === "admin";
  const canTransact = role === "admin" || role === "mechanic";
  const [status, setStatus] = useState(item.status);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleStatus() {
    setBusy(true);
    const res = await changeItemStatus(item.id, status, reason);
    setBusy(false);
    if (res?.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  async function handleToggle() {
    setBusy(true);
    const res = await toggleItemActive(item.id);
    setBusy(false);
    if (res?.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  const borrowable = item.status === "AVAILABLE";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start">
        {item.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photo_url}
            alt={item.name}
            className="h-24 w-24 rounded-xl border border-zinc-200 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-blue-50 text-4xl">
            📦
          </div>
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-zinc-900">{item.name}</h1>
            <ItemStatusBadge status={item.status} />
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">{item.item_code}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-zinc-400">Kategori</dt>
              <dd className="font-medium text-zinc-800">{item.categories?.name ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-400">Merk / Model</dt>
              <dd className="font-medium text-zinc-800">
                {item.brand ?? "-"}
                {item.model ? ` / ${item.model}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-400">Serial</dt>
              <dd className="font-medium text-zinc-800">{item.serial_number ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-400">Stok</dt>
              <dd className="font-medium text-zinc-800">
                {item.quantity} {item.unit}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-400">Lokasi</dt>
              <dd className="font-medium text-zinc-800">{item.locations?.name ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-400">Kondisi</dt>
              <dd className="font-medium text-zinc-800">
                {ITEM_CONDITION[item.condition] ?? item.condition}
              </dd>
            </div>
          </dl>
          {item.description && (
            <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canTransact && borrowable && (
          <Button href={`/borrow/new?item=${encodeURIComponent(item.item_code)}`}>
            🔄 Pinjam Barang
          </Button>
        )}
        {canTransact && !borrowable && item.status === "BORROWED" && (
          <Button href={`/returns?item=${encodeURIComponent(item.item_code)}`}>
            ↩️ Proses Pengembalian
          </Button>
        )}
        {canTransact && (
          <Button href={`/scan?code=${encodeURIComponent(item.item_code)}`} variant="secondary">
            📷 Scan
          </Button>
        )}
        {isAdmin && (
          <Button href={`/inventory/${item.id}/edit`} variant="secondary">
            ✏️ Edit
          </Button>
        )}
        {isAdmin && (
          <Button variant={item.is_active ? "danger" : "primary"} onClick={handleToggle} disabled={busy}>
            {item.is_active ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        )}
      </div>

      {/* QR */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">QR Code</h2>
        <div className="max-w-[220px]">
          <QrCard code={item.item_code} name={item.name} />
        </div>
      </div>

      {/* Admin: status change */}
      {isAdmin && (
        <Card>
          <CardHeader title="Ubah Status" />
          <div className="space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
              <Select value={status} onChange={(e) => setStatus(e.target.value as Item["status"])}>
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="DAMAGED">Rusak</option>
                <option value="LOST">Hilang</option>
                <option value="INACTIVE">Tidak Aktif</option>
              </Select>
              <Input
                placeholder="Alasan perubahan (opsional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button onClick={handleStatus} disabled={busy} variant="secondary">
              Simpan Perubahan Status
            </Button>
          </div>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader title="Riwayat Barang" />
        <div className="divide-y divide-zinc-100">
          {history.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              Belum ada riwayat untuk barang ini.
            </p>
          )}
          {history.map((h) => (
            <div key={h.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">{h.action}</p>
                <span className="text-xs text-zinc-400">{h.when}</span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">{h.detail}</p>
              {h.who && <p className="mt-0.5 text-xs text-zinc-400">oleh {h.who}</p>}
            </div>
          ))}
        </div>
      </Card>

      {/* Maintenance */}
      {maintenance.length > 0 && (
        <Card>
          <CardHeader title="Riwayat Maintenance" />
          <div className="divide-y divide-zinc-100">
            {maintenance.map((m) => (
              <div key={m.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-900">
                    {m.maintenance_number ?? "Maintenance"}
                  </p>
                  <Badge
                    className={
                      m.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }
                  >
                    {m.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{m.problem}</p>
                <p className="text-xs text-zinc-400">{formatDateTime(m.start_date)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Audit (admin) */}
      {isAdmin && audit.length > 0 && (
        <Card>
          <CardHeader title="Perubahan Data" />
          <div className="divide-y divide-zinc-100">
            {audit.slice(0, 10).map((a) => (
              <div key={a.id} className="px-4 py-3">
                <p className="text-sm font-medium text-zinc-900">{a.action}</p>
                <p className="text-xs text-zinc-500">
                  {a.user_name ?? "-"} · {formatDateTime(a.created_at)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
