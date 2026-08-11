"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui";

interface QrScannerProps {
  onResult: (decodedText: string) => void;
  paused?: boolean;
}

export function QrScanner({ onResult, paused }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!document.getElementById("qr-reader")) return;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text) => {
            if (!cancelled && !paused) {
              onResult(text.trim());
            }
          },
          () => {}
        );
      } catch (e) {
        if (!cancelled) {
          setError(
            "Tidak dapat mengakses kamera. Pastikan izin kamera diberikan atau gunakan input manual."
          );
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner && scanner.isScanning) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paused && scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
  }, [paused]);

  if (error) {
    return (
      <div className="rounded-lg bg-rose-50 px-4 py-6 text-center">
        <p className="text-sm text-rose-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        id="qr-reader"
        className="overflow-hidden rounded-xl border border-zinc-200"
      />
      {!scanning && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            setScanning(true);
            window.location.reload();
          }}
        >
          Mulai Scan Lagi
        </Button>
      )}
    </div>
  );
}
