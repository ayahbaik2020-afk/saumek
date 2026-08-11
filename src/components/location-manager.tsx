"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  ErrorMessage,
  IconButton,
  Input,
  Textarea,
} from "@/components/ui";
import {
  createLocation,
  updateLocation,
  deleteLocation,
  type ActionState,
} from "@/lib/item-actions";
import type { Location } from "@/lib/types";

export function LocationManager({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Location | null>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    editing ? updateLocation : createLocation,
    {}
  );

  async function handleDelete(id: string) {
    if (!confirm("Hapus lokasi ini?")) return;
    const res = await deleteLocation(id);
    if (res.error) alert(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          {editing ? "Edit Lokasi" : "Tambah Lokasi"}
        </h3>
        <form
          action={(formData) => {
            action(formData);
            if (!state?.error) setEditing(null);
          }}
          className="space-y-3"
        >
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <Input
            name="name"
            label="Nama Lokasi"
            defaultValue={editing?.name ?? ""}
            placeholder="contoh: Workshop A"
            required
          />
          <Textarea
            name="description"
            label="Keterangan"
            rows={2}
            defaultValue={editing?.description ?? ""}
          />
          <ErrorMessage message={state?.error} />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : editing ? "Simpan" : "Tambah"}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  router.refresh();
                }}
              >
                Batal
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="divide-y divide-zinc-100">
        {locations.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-zinc-500">
            Belum ada lokasi.
          </p>
        )}
        {locations.map((l) => (
          <div key={l.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">{l.name}</p>
              {l.description && (
                <p className="text-xs text-zinc-500">{l.description}</p>
              )}
            </div>
            <div className="flex gap-1">
              <IconButton
                onClick={() => {
                  setEditing(l);
                  router.refresh();
                }}
                title="Edit"
              >
                ✏️
              </IconButton>
              <IconButton onClick={() => handleDelete(l.id)} title="Hapus">
                🗑️
              </IconButton>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
