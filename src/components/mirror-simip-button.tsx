"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { mirrorJobsFromSimip } from "@/lib/job-actions";

export function MirrorSimipButton({
  variant = "secondary",
  className,
}: {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMessage(null);
    const res = await mirrorJobsFromSimip();
    setBusy(false);
    if (res.error) {
      setMessage(res.error);
      return;
    }
    setMessage(
      `Dicek ${res.checked ?? 0} job · diupdate ${res.updated ?? 0} · dilewati ${res.skipped ?? 0}`
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={busy}
        onClick={run}
      >
        {busy ? "Menyamakan..." : "Samakan status job ← SIMIP"}
      </Button>
      {message && <p className="max-w-xs text-right text-xs text-zinc-500">{message}</p>}
    </div>
  );
}
