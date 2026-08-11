"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button, Card } from "@/components/ui";
import { companyName } from "@/lib/constants";

export function QrCard({
  code,
  name,
  showPrint = true,
  size = 160,
}: {
  code: string;
  name: string;
  showPrint?: boolean;
  size?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    QRCode.toDataURL(code, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setSrc)
      .catch(() => {});
  }, [code, size]);

  function handlePrint() {
    const win = window.open("", "_blank", "width=420,height=420");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>QR ${code}</title>
      <style>
        body{font-family:Arial,sans-serif;text-align:center;padding:24px}
        .company{font-size:12px;font-weight:bold;letter-spacing:1px;color:#333}
        .code{font-size:16px;font-weight:bold;margin-top:8px}
        .name{font-size:12px;color:#555;margin-top:2px}
        img{width:200px;height:200px;margin-top:12px}
      </style></head><body>
      <div class="company">${companyName()}</div>
      <div class="code">${code}</div>
      <div class="name">${name}</div>
      <img src="${src}" />
      <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
    </body></html>`);
    win.document.close();
  }

  return (
    <Card className="p-4 text-center">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          {companyName()}
        </p>
        <p className="mt-1 text-sm font-semibold text-zinc-900">{code}</p>
        <p className="text-xs text-zinc-500">{name}</p>
      </div>
      <div className="mt-3 flex justify-center">
        <canvas ref={canvasRef} className="hidden" />
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`QR ${code}`} width={size} height={size} className="rounded-lg border border-zinc-200" />
        ) : (
          <div
            className="rounded-lg border border-zinc-200 bg-zinc-100"
            style={{ width: size, height: size }}
          />
        )}
      </div>
      {showPrint && (
        <Button
          type="button"
          variant="secondary"
          className="mt-3 w-full px-3 py-2 text-xs"
          onClick={handlePrint}
          disabled={!src}
        >
          🖨️ Print Label
        </Button>
      )}
    </Card>
  );
}
