import { requireAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { Card, SectionTitle, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/constants";
import type { AuditLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: logs = [] } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const logsData = logs as AuditLog[];

  return (
    <div className="space-y-4">
      <SectionTitle title="Audit Trail" />

      <div className="hidden md:block">
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Modul</th>
                <th className="px-4 py-3">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logsData.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50">
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{log.user_name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{log.module}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {log.record_id ? log.record_id.slice(0, 8) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="space-y-3 md:hidden">
        {logsData.map((log) => (
          <Card key={log.id} className="p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {log.action}
              </span>
              <span className="text-xs text-zinc-400">
                {formatDateTime(log.created_at)}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-700">
              {log.user_name ?? "-"} · {log.module}
            </p>
            {log.new_value ? (
              <pre className="mt-2 overflow-x-auto rounded bg-zinc-50 p-2 text-xs text-zinc-500">
                {JSON.stringify(log.new_value, null, 2)}
              </pre>
            ) : null}
          </Card>
        ))}
      </div>

      {logsData.length === 0 && (
        <Card>
          <EmptyState
            title="Belum ada aktivitas tercatat"
            description="Aktivitas penting akan tercatat di sini."
          />
        </Card>
      )}
    </div>
  );
}
