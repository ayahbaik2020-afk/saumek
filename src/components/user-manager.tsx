"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  IconButton,
  Input,
  SectionTitle,
  Select,
  Spinner,
} from "@/components/ui";
import {
  createUser,
  updateUser,
  toggleUserActive,
  resetUserPassword,
  type UserState,
} from "@/lib/user-actions";
import type { Department, Profile } from "@/lib/types";

export function UserManager({
  currentUserId,
  departments,
}: {
  currentUserId: string;
  departments: Department[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [passwordFor, setPasswordFor] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [state, action, pending] = useActionState<UserState, FormData>(
    editing ? updateUser : createUser,
    {}
  );

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, departments(name)")
        .order("name");
      setUsers((data ?? []) as Profile[]);
      setLoading(false);
    })();
  }, []);

  async function handleToggle(id: string) {
    const res = await toggleUserActive(id);
    if (res.error) alert(res.error);
    router.refresh();
  }

  async function handleReset(id: string) {
    if (!newPassword) return;
    const res = await resetUserPassword(id, newPassword);
    if (res.error) {
      alert(res.error);
    } else {
      setPasswordFor(null);
      setNewPassword("");
      alert("Password berhasil direset.");
    }
  }

  const roleBadge = (role: string) =>
    role === "admin" ? "bg-blue-100 text-blue-700" :
    role === "supervisor" ? "bg-violet-100 text-violet-700" :
    "bg-emerald-100 text-emerald-700";

  return (
    <div className="space-y-4">
      <SectionTitle
        title="User Management"
        action={
          <Button
            className="px-3 py-2 text-xs"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            + Tambah User
          </Button>
        }
      />

      {(showForm || editing) && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            {editing ? "Edit User" : "Tambah User"}
          </h3>
          <form
            action={action}
            className="space-y-3"
            onSubmit={() => {
              if (!state?.error) {
                setShowForm(false);
                setEditing(null);
              }
            }}
          >
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="name" label="Nama Lengkap" defaultValue={editing?.name} required />
              <Input name="username" label="Username" defaultValue={editing?.username ?? ""} required />
              <Input name="employee_id" label="Employee ID" defaultValue={editing?.employee_id ?? ""} />
              <Input name="email" label="Email" defaultValue={editing?.email ?? ""} hint="Opsional — default: username@saumek.local" />
              <Select name="department_id" label="Department" defaultValue={editing?.department_id ?? ""}>
                <option value="">- Pilih -</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Select name="role" label="Role" defaultValue={editing?.role ?? "mechanic"}>
                <option value="admin">Admin</option>
                <option value="mechanic">Mechanic</option>
                <option value="supervisor">Supervisor</option>
              </Select>
            </div>
            {!editing && (
              <Input
                name="password"
                label="Password Awal"
                type="password"
                required
                hint="Minimal 6 karakter"
              />
            )}
            <ErrorMessage message={state?.error} />
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && <Spinner />}

      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-1 text-xs text-zinc-400">(Anda)</span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {u.employee_id ?? "-"} · @{u.username ?? "-"} · {u.departments?.name ?? "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={roleBadge(u.role)}>{u.role}</Badge>
              <Badge
                className={
                  u.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-200 text-zinc-600"
                }
              >
                {u.status}
              </Badge>
            </div>
            <div className="flex gap-1">
              <IconButton
                title="Edit"
                onClick={() => {
                  setEditing(u);
                  setShowForm(false);
                }}
              >
                ✏️
              </IconButton>
              <IconButton
                title={u.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                onClick={() => handleToggle(u.id)}
              >
                {u.status === "active" ? "⛔" : "✅"}
              </IconButton>
              <IconButton title="Reset Password" onClick={() => setPasswordFor(u)}>
                🔑
              </IconButton>
            </div>
          </Card>
        ))}
        {!loading && users.length === 0 && (
          <Card>
            <EmptyState title="Belum ada user" />
          </Card>
        )}
      </div>

      {passwordFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5">
            <h3 className="text-sm font-semibold text-zinc-900">
              Reset Password — {passwordFor.name}
            </h3>
            <div className="mt-3 space-y-3">
              <Input
                type="password"
                label="Password Baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={() => handleReset(passwordFor.id)} disabled={!newPassword}>
                  Simpan
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPasswordFor(null);
                    setNewPassword("");
                  }}
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
