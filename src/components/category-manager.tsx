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
  createCategory,
  updateCategory,
  deleteCategory,
  type ActionState,
} from "@/lib/item-actions";
import type { Category } from "@/lib/types";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    editing ? updateCategory : createCategory,
    {}
  );

  const formAction = (formData: FormData) => {
    action(formData);
    if (!state?.error) {
      setEditing(null);
    }
  };

  async function handleDelete(id: string) {
    if (!confirm("Hapus kategori ini?")) return;
    const res = await deleteCategory(id);
    if (res.error) alert(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          {editing ? "Edit Kategori" : "Tambah Kategori"}
        </h3>
        <form action={formAction} className="space-y-3">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <Input
            name="name"
            label="Nama Kategori"
            defaultValue={editing?.name ?? ""}
            placeholder="contoh: Alat Ukur"
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
        {categories.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-zinc-500">
            Belum ada kategori.
          </p>
        )}
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">{c.name}</p>
              {c.description && (
                <p className="text-xs text-zinc-500">{c.description}</p>
              )}
            </div>
            <div className="flex gap-1">
              <IconButton
                onClick={() => {
                  setEditing(c);
                  router.refresh();
                }}
                title="Edit"
              >
                ✏️
              </IconButton>
              <IconButton onClick={() => handleDelete(c.id)} title="Hapus">
                🗑️
              </IconButton>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
