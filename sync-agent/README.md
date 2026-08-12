# SAUMEK Sync Agent (PowerShell)

Sinkronisasi **Work Order SIMIP (MIPRO/SQL Server)** ke **Supabase**
(`external_work_orders`) untuk aplikasi https://saumek.vercel.app

Agent ini **dijalankan manual** dari PC mana pun yang berada **di dalam
jaringan Sulfindo** (mis. `192.168.20.17`, `192.168.50.119`, dll.) — tidak
perlu Node.js, cukup Windows (PowerShell 5.1 bawaan).

> App web tetap berjalan di Vercel. Agent ini hanya **menyalin** data WO dari
> SQL Server ke Supabase, sehingga halaman app selalu mendapat data terbaru.

---

## Cara pakai

1. **Download** `saumek-sync.ps1` dari dashboard app (tombol "Unduh
   saumek-sync.ps1") — atau ambil folder `sync-agent` ini (zip).
2. Simpan di PC yang terhubung ke jaringan Sulfindo (kantor/VPN).
3. Jalankan — double-click `sync.bat` jika folder lengkap, atau langsung:
   `powershell -NoProfile -ExecutionPolicy Bypass -File saumek-sync.ps1`
4. Pertama kali akan diminta konfigurasi (disimpan di `config.json` di folder
   yang sama):
   - Server SQL SIMIP (default `192.168.20.10`), database `SAUSIMIP`, port `1433`
   - **User & Password SIMIP** (untuk akses read SQL Server)
   - **Supabase URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **Supabase Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`)
5. Setelah itu proses sinkronisasi berjalan otomatis:
   - Membaca WO mekanikal (`WOPM1` = MS/MR/MC; status `CAN`/`CLOSE` dilewati)
   - Status Maximo dipetakan ke status aplikasi:
     `PREAP/APPREQ/WAPPR -> OPEN`, `APPR/WSCH/WMATL/PRWMATL/WPCOND -> PLANNED`,
     `INPRG -> IN_PROGRESS`, `WCOMP/COMP -> COMPLETED`
   - Prioritas dipetakan: `1-2 -> URGENT`, `3-4 -> HIGH`, `5-6 -> NORMAL`,
     `7-9 -> LOW`
   - Upsert ke tabel `external_work_orders` + catat log di `wo_sync_logs`

## Opsi script

```
sync.bat -TestConnection   # cek koneksi SQL & Supabase saja
sync.bat -DryRun           # baca + map tanpa menulis ke Supabase
sync.bat -Limit 10         # batasi jumlah WO yang dibaca
```

## Syarat penting

- PC harus berada **di dalam jaringan Sulfindo** (bisa menjangkau
  `192.168.20.10`). Di luar jaringan (mis. dari rumah tanpa VPN) sync **tidak
  akan berhasil** — itu memang perilaku yang diharapkan.
- Konfigurasi disimpan lokal (`config.json`). Password SQL dienkripsi DPAPI
  (hanya user yang membuatnya yang bisa membacanya di PC tersebut).
  **Jangan bagikan `config.json`.**

## Verifikasi

Setelah sync, buka dashboard https://saumek.vercel.app -> kartu
"Sinkronisasi Work Order SIMIP" -> status terakhir (SUCCESS / PARTIAL / FAILED
+ jumlah WO) diambil dari `wo_sync_logs`.
