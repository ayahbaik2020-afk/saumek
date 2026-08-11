"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  ErrorMessage,
  IconButton,
  Input,
} from "@/components/ui";
import {
  createSkill,
  updateSkill,
  deleteSkill,
  type PeopleState,
} from "@/lib/people-actions";
import type { Skill } from "@/lib/types";

export function SkillManager({ skills, canManage }: { skills: Skill[]; canManage: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Skill | null>(null);
  const [state, action, pending] = useActionState<PeopleState, FormData>(
    editing ? updateSkill : createSkill,
    {}
  );

  async function handleDelete(id: string) {
    if (!confirm("Hapus skill ini?")) return;
    const res = await deleteSkill(id);
    if (res.error) alert(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            {editing ? "Edit Skill" : "Tambah Skill"}
          </h3>
          <form action={action} className="grid gap-3 sm:grid-cols-2">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Input name="name" label="Nama Skill *" defaultValue={editing?.name ?? ""} required />
            <Input name="category" label="Kategori" defaultValue={editing?.category ?? ""} placeholder="contoh: Welding, Piping, Mechanical" />
            <div className="flex items-start gap-2 sm:col-span-2">
              <div className="flex-1">
                <ErrorMessage message={state?.error} />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : editing ? "Simpan" : "Tambah"}
              </Button>
              {editing && (
                <Button type="button" variant="secondary" onClick={() => { setEditing(null); router.refresh(); }}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      <Card className="divide-y divide-zinc-100">
        {skills.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-zinc-500">Belum ada skill.</p>
        )}
        {skills.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">{s.name}</p>
              {s.category && <p className="text-xs text-zinc-500">{s.category}</p>}
            </div>
            {canManage && (
              <div className="flex gap-1">
                <IconButton onClick={() => { setEditing(s); router.refresh(); }} title="Edit">✏️</IconButton>
                <IconButton onClick={() => handleDelete(s.id)} title="Hapus">🗑️</IconButton>
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
