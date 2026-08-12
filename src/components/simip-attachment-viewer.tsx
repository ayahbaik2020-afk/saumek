"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import {
  attachmentKind,
  attachmentKindLabel,
  isImageAttachment,
  isPdfAttachment,
  isSpreadsheetAttachment,
  resolveSimipAttachmentInfo,
  type SimipWoRef,
  type ViewableAttachment,
} from "@/lib/simip-attachments";

function mergeViewables(
  local: ViewableAttachment[],
  remote: ViewableAttachment[]
): ViewableAttachment[] {
  const out: ViewableAttachment[] = [];
  const seen = new Set<string>();
  for (const v of [...remote, ...local]) {
    const key = v.name;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function DownloadCard({
  item,
  hint,
}: {
  item: ViewableAttachment;
  hint: string;
}) {
  const kind = attachmentKindLabel(attachmentKind(item));
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center">
      <p className="text-sm font-medium text-zinc-800">{kind}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      {item.url ? (
        <a
          href={item.url}
          download={item.name}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Unduh {item.name}
        </a>
      ) : null}
    </div>
  );
}

function AttachmentPreview({ item }: { item: ViewableAttachment }) {
  if (item.url && isPdfAttachment(item)) {
    return (
      <iframe
        src={item.url}
        title={item.name}
        className="h-[min(70vh,720px)] w-full rounded-lg border border-zinc-200 bg-zinc-50"
      />
    );
  }
  if (item.url && isImageAttachment(item)) {
    return (
      <div className="flex max-h-[min(70vh,720px)] items-center justify-center overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.name}
          className="max-h-[min(68vh,700px)] max-w-full object-contain"
        />
      </div>
    );
  }
  if (item.url && isSpreadsheetAttachment(item)) {
    return (
      <DownloadCard
        item={item}
        hint="File Excel tidak bisa ditampilkan di browser. Unduh untuk dibuka di Microsoft Excel / LibreOffice."
      />
    );
  }
  if (item.url) {
    return (
      <DownloadCard
        item={item}
        hint="Preview tidak tersedia untuk tipe file ini. Unduh atau buka di tab baru."
      />
    );
  }

  const local = item.localPath ?? "";
  const kind = attachmentKindLabel(attachmentKind(item));
  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">File tidak ditemukan di drive N: ({kind})</p>
      <p className="text-xs leading-relaxed text-amber-800">
        Jalankan <code className="rounded bg-white px-1">npm run dev</code> di PC yang drive{" "}
        <code className="rounded bg-white px-1">N:\workorder\</code> aktif. Path yang diharapkan:
      </p>
      <code className="block break-all rounded bg-white px-2 py-1.5 text-xs text-zinc-800">
        {local}
      </code>
    </div>
  );
}

export function SimipAttachmentViewer({
  wo,
  className,
}: {
  wo: SimipWoRef;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [diskViewables, setDiskViewables] = useState<ViewableAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const info = useMemo(() => resolveSimipAttachmentInfo(wo), [wo]);
  if (!info) return null;

  const { wonum, viewables: localViewables, documentPaths } = info;
  const pathsKey = documentPaths.join("|");
  const viewables = useMemo(
    () => mergeViewables(localViewables, diskViewables),
    [localViewables, diskViewables]
  );
  const current = viewables[idx] ?? viewables[0];
  const fileCount = viewables.length;

  useEffect(() => {
    if (!open || !wonum) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    const pathsParam =
      documentPaths.length > 0
        ? `?paths=${documentPaths.map((p) => encodeURIComponent(p)).join("|")}`
        : "";

    fetch(`/api/simip-attachments/${encodeURIComponent(wonum)}${pathsParam}`)
      .then(async (res) => {
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          hint?: string | null;
          attachments?: Array<{
            name: string;
            url: string;
            localPath?: string;
            contentType: string;
          }>;
        };
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? data.hint ?? "Gagal memuat lampiran dari drive N:");
        }
        if (cancelled) return;
        const fromDisk: ViewableAttachment[] = (data.attachments ?? []).map((a) => ({
          name: a.name,
          url: a.url,
          localPath: a.localPath,
          contentType: a.contentType,
        }));
        setDiskViewables(fromDisk);
        if (fromDisk.length === 0 && data.hint) {
          setLoadError(data.hint);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setLoadError(
            e instanceof Error
              ? e.message
              : "Gagal membaca lampiran. Pastikan npm run dev jalan di PC dengan drive N: aktif."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, wonum, pathsKey]);

  function openViewer() {
    setIdx(0);
    setDiskViewables([]);
    setLoadError(null);
    setOpen(true);
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className={className ?? "px-3 py-1.5 text-xs"}
        onClick={openViewer}
        title={`Lihat lampiran WO ${wonum} dari drive N:`}
      >
        Lihat lampiran ({wonum}
        {fileCount > 1 ? ` · ${fileCount} file` : ""})
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Lampiran WO ${wonum}`}
        >
          <div
            className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  Lampiran WO {wonum}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {current?.name ?? "Dokumen pekerjaan"}
                  {current
                    ? ` · ${attachmentKindLabel(attachmentKind(current))}`
                    : ""}
                  {" · dari drive N: (PC lokal)"}
                </p>
              </div>
              <Button type="button" variant="ghost" className="shrink-0 px-2" onClick={() => setOpen(false)}>
                Tutup
              </Button>
            </div>

            {viewables.length > 1 && (
              <div className="flex gap-1 overflow-x-auto border-b border-zinc-100 px-4 py-2">
                {viewables.map((v, i) => (
                  <button
                    key={`${v.name}-${i}`}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${
                      i === idx
                        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                    title={v.name}
                  >
                    <span className="mr-1 opacity-70">
                      {attachmentKindLabel(attachmentKind(v))}
                    </span>
                    {v.name}
                  </button>
                ))}
              </div>
            )}

            <div className="overflow-auto p-4">
              {loading && viewables.length === 0 ? (
                <p className="text-sm text-zinc-500">Membaca file dari drive N:…</p>
              ) : null}
              {loadError && viewables.length === 0 ? (
                <p className="mb-3 text-xs text-amber-700">{loadError}</p>
              ) : null}
              {current ? (
                <AttachmentPreview item={current} />
              ) : !loading ? (
                <p className="text-sm text-zinc-500">
                  Tidak ada lampiran untuk WO ini di{" "}
                  <code className="rounded bg-zinc-100 px-1">N:\workorder\</code>.
                </p>
              ) : null}
            </div>

            {current?.url && (
              <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2 text-right">
                {isSpreadsheetAttachment(current) || attachmentKind(current) === "other" ? (
                  <a
                    href={`${current.url}?download=1`}
                    className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                  >
                    Unduh file
                  </a>
                ) : (
                  <span />
                )}
                <a
                  href={current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                >
                  Buka di tab baru ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
