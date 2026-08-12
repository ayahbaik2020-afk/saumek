# SAUMEK Sync Agent (PowerShell)

Sinkronisasi **Work Order SIMIP (MIPRO/SQL Server)** ke **Supabase**
(`external_work_orders`) untuk aplikasi https://saumek.vercel.app

Agent ini **dijalankan manual** dari PC mana pun yang berada **di dalam
jaringan Sulfindo** (mis. `192.168.20.17`, `192.168.50.119`, dll.) - tidak
perlu Node.js, cukup Windows (PowerShell 5.1 bawaan).

> App web tetap berjalan di Vercel. Agent ini hanya **menyalin** data WO dari
> SQL Server ke Supabase, sehingga halaman app selalu mendapat data terbaru.

---

## Akun SQL vs login aplikasi SIMIP

Sync-agent membutuhkan **akun database SQL Server** (bukan user/password yang
dipakai login ke aplikasi SIMIP/Maximo di browser).

| Yang dipakai di sync-agent | Contoh | Catatan |
|----------------------------|--------|---------|
| Akun SQL Server | `saumek_sync` | Akun database read-only - minta ke IT |
| Login aplikasi SIMIP | `hebron.s` | **Tidak** bisa dipakai untuk koneksi SQL |

Jika setup memakai `hebron.s`, error umum: `Login failed for user 'hebron.s'`.
Jalankan `sync.bat -Setup` lagi dengan akun SQL yang benar.

---

## Cara pakai

1. **Download** paket sync-agent dari dashboard app (tombol "Unduh sync-agent")
   - berisi `saumek-sync.ps1`, `sync.bat`, dan `config.template.json`.
   Atau ambil folder `sync-agent` ini dari repo.
2. Simpan di PC yang terhubung ke jaringan Sulfindo (kantor/VPN).
3. Jalankan - double-click `sync.bat` jika folder lengkap, atau langsung:
   `powershell -NoProfile -ExecutionPolicy Bypass -File saumek-sync.ps1`
4. Pertama kali diminta **metode login SQL** dan kredensial (disimpan di
   `config.json`, sekali saja):

   - **[1] User/password SQL** (default) - contoh user: `saumek_sync`
   - **[2] Windows Integrated Security** - pakai akun domain Windows PC ini
     (jika SQL Server mengizinkan login Windows)

   Server SQL, database, port, dan koneksi Supabase **sudah otomatis** di paket zip
   dari dashboard - tidak perlu diisi manual.

   Untuk ubah akun atau metode login: `sync.bat -Setup`
5. Setelah itu proses sinkronisasi berjalan otomatis:
   - Membaca WO mekanikal (`WOPM1` = MS/MR/MC; status `CAN`/`CLOSE` dilewati)
   - Status Maximo dipetakan ke status aplikasi:
     `PREAP/APPREQ/WAPPR -> OPEN`, `APPR/WSCH/WMATL/PRWMATL/WPCOND -> PLANNED`,
     `INPRG -> IN_PROGRESS`, `WCOMP/COMP -> COMPLETED`
   - Prioritas dipetakan: `1-2 -> URGENT`, `3-4 -> HIGH`, `5-6 -> NORMAL`,
     `7-9 -> LOW`
   - Upsert ke tabel `external_work_orders` + catat log di `wo_sync_logs`
   - Menyimpan **path lampiran** (`_attachment_paths`) dari MIP_DOCINFO / `N:\workorder\`
     (file **tidak** di-upload ke Supabase)

## Lampiran WO (drive N:)

- Sync-agent hanya menyimpan path file ke `raw_data._attachment_paths`.
- Aplikasi SAUMEK (`npm run dev` di localhost) membaca file langsung dari
  `N:\workorder\` via API `/api/simip-attachments/{wonum}/...`.
- **Syarat:** server Next.js harus jalan di PC yang drive **N:** aktif.
- Di Vercel/cloud, drive N: tidak bisa diakses - lampiran hanya untuk dev lokal.

## Opsi script

```
sync.bat -TestConnection   # cek koneksi SQL & Supabase saja
sync.bat -DryRun           # baca + map tanpa menulis ke Supabase
sync.bat -Limit 10         # batasi jumlah WO yang dibaca
sync.bat -Setup            # ubah akun SQL / metode login
```

## Troubleshooting login SQL

Error `Login failed for user '...'`:

1. Pastikan user adalah **akun SQL Server**, bukan login aplikasi SIMIP.
2. Jalankan `sync.bat -Setup` dengan akun seperti `saumek_sync`.
3. Jika belum punya, minta ke IT akun SQL read-only untuk database `SAUSIMIP`.
4. Alternatif: pilih opsi **[2] Windows** di setup jika PC domain punya akses SQL.

## Syarat penting

- PC harus berada **di dalam jaringan Sulfindo** (bisa menjangkau
  `192.168.20.10`). Di luar jaringan (mis. dari rumah tanpa VPN) sync **tidak
  akan berhasil** - itu memang perilaku yang diharapkan.
- Konfigurasi disimpan lokal (`config.json`). Password SQL dienkripsi DPAPI
  (hanya user yang membuatnya yang bisa membacanya di PC tersebut).
  **Jangan bagikan `config.json`.**

## Verifikasi

Setelah sync, buka dashboard https://saumek.vercel.app -> kartu
"Sinkronisasi Work Order SIMIP" -> status terakhir (SUCCESS / PARTIAL / FAILED
+ jumlah WO) diambil dari `wo_sync_logs`.
