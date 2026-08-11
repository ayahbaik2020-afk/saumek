# CLIENT REQUIREMENT
## SISTEM INVENTORY & PEMINJAMAN BARANG
### Team Mekanik

**Platform:** Web Application  
**Frontend/Deployment:** Vercel  
**Database:** Supabase  
**Access Device:** Desktop / Laptop / Smartphone  
**Target User:** Team Mekanik, Admin/Gudang, Supervisor

---

## 1. Latar Belakang

Diperlukan sebuah sistem inventory yang dapat membantu Team Mekanik dalam melakukan pendataan barang, pemberian identitas barang melalui QR Code, proses peminjaman dan pengembalian barang, serta pemantauan ketersediaan barang secara terpusat.

Sistem dirancang berbasis web sehingga dapat diakses melalui komputer maupun smartphone tanpa perlu melakukan instalasi aplikasi khusus.

Penggunaan QR Code diharapkan dapat mempercepat proses identifikasi barang dan mengurangi kesalahan input data secara manual.

---

# 2. Tujuan Sistem

Sistem diharapkan dapat:

1. Mempermudah pendataan dan pengelolaan inventory barang.
2. Memberikan identitas unik untuk setiap barang melalui QR Code.
3. Mempercepat proses peminjaman barang menggunakan smartphone.
4. Mempermudah proses pengembalian barang.
5. Mengetahui posisi/status barang secara realtime.
6. Mengetahui siapa yang sedang meminjam suatu barang.
7. Menyediakan histori peminjaman dan pengembalian.
8. Mengurangi pencatatan manual menggunakan kertas atau spreadsheet.
9. Menyediakan informasi stok dan kondisi barang.
10. Menyediakan laporan inventory yang dapat digunakan oleh pihak terkait.

---

# 3. User / Pengguna Sistem

### 3.1 Team Mekanik

Team Mekanik dapat:

- Melihat daftar barang.
- Melakukan scan QR Code barang.
- Mengajukan/mencatat peminjaman barang.
- Melihat barang yang sedang dipinjam.
- Melakukan proses pengembalian barang.
- Melihat histori peminjaman pribadi.
- Melihat informasi detail barang.

### 3.2 Admin / Gudang

Admin memiliki akses untuk:

- Mengelola master data barang.
- Membuat dan mencetak QR Code.
- Menambahkan barang baru.
- Mengubah data barang.
- Mengatur stok.
- Melihat seluruh transaksi peminjaman.
- Memproses pengembalian.
- Melihat barang yang belum dikembalikan.
- Melihat histori transaksi.
- Membuat laporan.

### 3.3 Supervisor / Manager

Supervisor dapat:

- Melihat dashboard inventory.
- Melihat jumlah barang tersedia.
- Melihat barang sedang dipinjam.
- Melihat barang terlambat dikembalikan.
- Melihat histori transaksi.
- Melihat laporan inventory.
- Melakukan monitoring aktivitas Team Mekanik.

---

# 4. Requirement Utama

## CR-001 – Master Data Barang

Sistem harus menyediakan fitur untuk mengelola data barang.

Informasi minimal barang:

- Kode Barang
- Nama Barang
- Kategori
- Merk
- Type/Model
- Serial Number, jika ada
- Satuan
- Jumlah/Stok
- Lokasi Penyimpanan
- Kondisi Barang
- Status Barang
- Foto Barang
- Keterangan

Contoh kondisi:

- Baik
- Rusak Ringan
- Rusak Berat
- Maintenance
- Hilang

Contoh status:

- Available
- Dipinjam
- Maintenance
- Hilang
- Tidak Aktif

---

# 5. CR-002 – Pembuatan QR Code Barang

Team Mekanik/Admin dapat membuat QR Code untuk setiap barang.

Setiap barang memiliki QR Code unik yang terhubung dengan data barang di dalam sistem.

QR Code minimal dapat menyimpan/mengarah ke:

**ID / kode unik barang**

Saat QR Code dipindai, sistem menampilkan:

- Nama Barang
- Kode Barang
- Foto Barang
- Kategori
- Merk/Type
- Kondisi
- Status
- Lokasi
- Ketersediaan

### Fitur tambahan:

- Generate QR Code otomatis.
- Print QR Code.
- Print beberapa QR Code sekaligus.
- Template label QR Code.
- QR Code dapat dicetak dalam ukuran label/stiker.
- QR Code tidak boleh memiliki ID yang sama dengan barang lain.

---

# 6. CR-003 – Scan QR Code Menggunakan Smartphone

Team Mekanik dapat menggunakan smartphone untuk melakukan scan QR Code.

Flow:

**Buka Sistem → Scan QR Code → Barang ditemukan → Detail barang ditampilkan**

Setelah scan berhasil, sistem menampilkan informasi barang.

Jika barang tersedia, user dapat melanjutkan ke proses peminjaman.

Jika barang sedang dipinjam, sistem menampilkan:

> Barang sedang dipinjam oleh [Nama User]

Jika barang berstatus Maintenance/Rusak/Hilang, sistem menampilkan status tersebut dan peminjaman tidak dapat dilakukan.

---

# 7. CR-004 – Peminjaman Barang

Team Mekanik dapat melakukan peminjaman barang melalui smartphone.

### Flow:

**Login → Scan QR Code → Detail Barang → Peminjaman → Konfirmasi → Transaksi tersimpan**

Data peminjaman minimal:

- Nomor transaksi
- Tanggal peminjaman
- Jam peminjaman
- Nama peminjam
- ID/Employee ID
- Departemen/Team
- Kode Barang
- Nama Barang
- Jumlah
- Keperluan
- Lokasi penggunaan
- Estimasi tanggal kembali
- Catatan

Setelah transaksi berhasil, status barang otomatis berubah menjadi:

**AVAILABLE → BORROWED / DIPINJAM**

---

# 8. CR-005 – Peminjaman Banyak Barang

Sistem sebaiknya mendukung peminjaman beberapa barang dalam satu transaksi.

Contoh:

**Peminjaman #20260811-001**

| Barang | Qty |
|---|---:|
| Kunci Inggris | 1 |
| Tang Kombinasi | 2 |
| Multimeter | 1 |
| Obeng Set | 1 |

Dengan demikian Team Mekanik tidak perlu membuat transaksi terpisah untuk setiap barang.

---

# 9. CR-006 – Pengembalian Barang

Sistem harus menyediakan proses pengembalian barang.

Pengembalian dapat dilakukan dengan:

**Scan QR Code → Sistem menemukan transaksi → Konfirmasi Pengembalian**

User/Admin dapat mengisi:

- Tanggal kembali
- Kondisi barang
- Jumlah kembali
- Catatan
- Foto kondisi barang, jika diperlukan

Setelah pengembalian:

**DIPINJAM → AVAILABLE**

Jika barang rusak:

**DIPINJAM → MAINTENANCE / RUSAK**

---

# 10. CR-007 – Partial Return

Sistem sebaiknya mendukung pengembalian sebagian.

Contoh:

User meminjam:

> 5 buah barang

Kemudian mengembalikan:

> 3 buah

Maka sistem mencatat:

**Dipinjam: 5**  
**Dikembalikan: 3**  
**Masih dipinjam: 2**

Fitur ini penting apabila inventory memiliki barang dengan jumlah lebih dari satu.

---

# 11. CR-008 – Status Barang

Setiap barang harus memiliki status yang jelas.

Status minimal:

- **Available** – tersedia
- **Borrowed** – sedang dipinjam
- **Maintenance** – sedang diperbaiki
- **Damaged** – rusak
- **Lost** – hilang
- **Inactive** – tidak digunakan

Status barang harus diperbarui berdasarkan transaksi.

---

# 12. CR-009 – Histori Barang

Sistem dapat menampilkan histori setiap barang.

Contoh:

**Multimeter FLUKE**

| Tanggal | Aktivitas | User | Status |
|---|---|---|---|
| 01/08/2026 | Peminjaman | Andi | Dipinjam |
| 03/08/2026 | Pengembalian | Andi | Available |
| 05/08/2026 | Peminjaman | Budi | Dipinjam |
| 07/08/2026 | Pengembalian | Budi | Available |

Dengan demikian Admin dapat mengetahui riwayat penggunaan sebuah barang.

---

# 13. CR-010 – Dashboard Inventory

Dashboard menyediakan informasi ringkas.

Minimal menampilkan:

### Inventory

- Total Barang
- Barang Available
- Barang Dipinjam
- Barang Maintenance
- Barang Rusak
- Barang Hilang

### Peminjaman

- Peminjaman Hari Ini
- Barang Belum Dikembalikan
- Peminjaman Terlambat
- Total Peminjaman Bulan Ini

### Monitoring

- Top Barang yang Sering Dipinjam
- User yang Sedang Meminjam
- Barang yang Lama Belum Kembali

---

# 14. CR-011 – Monitoring Barang Terlambat

Jika tanggal pengembalian sudah melewati batas, sistem memberikan status:

**OVERDUE / TERLAMBAT**

Contoh:

> Multimeter – dipinjam oleh Andi  
> Seharusnya kembali: 10 Agustus 2026  
> Status: TERLAMBAT 1 Hari

Dashboard Admin menampilkan daftar barang tersebut.

---

# 15. CR-012 – Notifikasi

Sistem dapat memberikan notifikasi terkait:

- Peminjaman berhasil.
- Pengembalian berhasil.
- Barang terlambat dikembalikan.
- Barang rusak saat dikembalikan.
- Stok minimum.
- Barang hilang.

Untuk tahap awal, notifikasi dapat ditampilkan melalui sistem.

Pengembangan berikutnya dapat mempertimbangkan WhatsApp/Email notification.

---

# 16. CR-013 – Search & Filter

Sistem menyediakan pencarian dan filter.

Pencarian berdasarkan:

- Kode Barang
- Nama Barang
- QR Code
- Serial Number
- Merk
- Nama Peminjam

Filter berdasarkan:

- Kategori
- Status
- Kondisi
- Lokasi
- Tanggal
- User/Peminjam

---

# 17. CR-014 – Manajemen User

Admin dapat mengelola user.

Data minimal:

- Nama
- Employee ID
- Username
- Password
- Team/Department
- Role
- Status User

Role minimal:

### Admin

Full access.

### Mechanic

Peminjaman, pengembalian, scan QR Code, dan melihat data yang diperlukan.

### Supervisor

Monitoring dan laporan.

---

# 18. CR-015 – Hak Akses

Sistem menggunakan Role Based Access Control.

Contoh:

| Fitur | Admin | Mechanic | Supervisor |
|---|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ |
| Lihat Barang | ✓ | ✓ | ✓ |
| Tambah Barang | ✓ | - | - |
| Edit Barang | ✓ | - | - |
| Generate QR | ✓ | ✓* | - |
| Peminjaman | ✓ | ✓ | - |
| Pengembalian | ✓ | ✓ | - |
| Histori | ✓ | ✓ | ✓ |
| Laporan | ✓ | - | ✓ |
| User Management | ✓ | - | - |

`*` Dapat disesuaikan dengan kebijakan perusahaan.

---

# 19. CR-016 – Foto Barang

Sistem sebaiknya menyediakan foto barang.

Foto dapat digunakan untuk:

- Identifikasi barang.
- Memastikan barang yang dipinjam sesuai.
- Dokumentasi kondisi barang.
- Dokumentasi barang rusak.

Foto dapat diambil langsung menggunakan kamera smartphone.

---

# 20. CR-017 – Laporan

Sistem menyediakan laporan:

### Laporan Inventory

- Semua barang
- Barang tersedia
- Barang dipinjam
- Barang maintenance
- Barang rusak
- Barang hilang

### Laporan Peminjaman

- Semua transaksi
- Peminjaman per user
- Peminjaman per periode
- Peminjaman per barang
- Barang belum kembali
- Barang overdue

### Export

Laporan dapat diekspor ke:

- Excel
- CSV
- PDF

---

# 21. CR-018 – Audit Trail

Sistem mencatat aktivitas penting user.

Contoh:

> 11/08/2026 14:25  
> Andi melakukan peminjaman  
> Barang: Multimeter FLUKE  
> Transaksi: INV-20260811-001

Aktivitas yang dicatat:

- Login
- Tambah barang
- Edit barang
- Hapus/nonaktifkan barang
- Generate QR Code
- Peminjaman
- Pengembalian
- Perubahan status
- Perubahan data user

Audit trail tidak boleh mudah dihapus oleh user biasa.

---

# 22. CR-019 – Stock Opname

Sistem sebaiknya menyediakan fitur **Stock Opname**.

Admin dapat melakukan pengecekan fisik barang menggunakan QR Code.

Flow:

**Stock Opname → Scan QR → Barang ditemukan → Cek kondisi → Konfirmasi**

Sistem kemudian membandingkan:

**Data Sistem vs Kondisi Aktual**

Contoh:

> Sistem: 10 unit  
> Fisik: 9 unit  
> Selisih: -1

Hal ini akan sangat berguna untuk pengelolaan inventory dalam jangka panjang.

---

# 23. CR-020 – Keamanan Sistem

Sistem harus memiliki:

- Login authentication.
- Role-based authorization.
- Password terenkripsi/hashed.
- Session management.
- Validasi input.
- Proteksi akses halaman berdasarkan role.
- Database access menggunakan mekanisme keamanan Supabase.
- Audit log.
- Backup database sesuai kemampuan environment.

---

# 24. CR-021 – Platform & Infrastruktur

Sistem menggunakan arsitektur:

**User Smartphone/PC**  
↓  
**Web Application**  
↓  
**Vercel**  
↓  
**Supabase**  
↓  
**Database**

### Vercel

Digunakan sebagai platform deployment dan hosting aplikasi web.

### Supabase

Digunakan untuk:

- Database
- Authentication, jika digunakan
- Storage untuk foto barang
- API/backend services
- Realtime functionality, jika diperlukan

---

# 25. CR-022 – Responsive Web Application

Aplikasi harus responsive dan dapat digunakan pada:

- Smartphone Android
- Smartphone iPhone
- Tablet
- Laptop
- Desktop

Prioritas tampilan untuk Team Mekanik adalah:

**Smartphone**

Karena proses utama seperti scan QR Code dan peminjaman dilakukan di lapangan/workshop.

---

# 26. CR-023 – QR Code Mobile Experience

Halaman scan harus dibuat sederhana.

Contoh tampilan:

**SCAN BARANG**

[ Kamera / QR Scanner ]

Setelah berhasil:

**MULTIMETER FLUKE**

Status: 🟢 AVAILABLE

[ PINJAM BARANG ]

atau

**MULTIMETER FLUKE**

Status: 🔴 SEDANG DIPINJAM

Peminjam: Andi

Estimasi kembali: 12 Agustus 2026

---

# 27. CR-024 – Nomor Transaksi

Setiap transaksi peminjaman memiliki nomor unik.

Contoh:

**BRW-20260811-0001**

Pengembalian mengacu kepada nomor transaksi tersebut.

Nomor transaksi digunakan untuk:

- Pencarian
- Audit
- Laporan
- Tracking transaksi

---

# 28. CR-025 – Persetujuan Peminjaman

Untuk barang tertentu, sistem dapat menyediakan mekanisme approval.

Contoh:

**Barang biasa**
> Scan → Pinjam → Langsung tercatat

**Barang khusus / mahal**
> Scan → Ajukan Peminjaman → Supervisor Approve → Barang dapat dipinjam

Fitur approval dapat dibuat configurable berdasarkan kategori atau jenis barang.

---

# 29. CR-026 – Dashboard Aktivitas Real-Time

Jika diperlukan, dashboard Admin/Supervisor dapat memperlihatkan aktivitas terbaru.

Contoh:

> 🟢 Andi meminjam Multimeter – 14:21  
> 🔵 Budi mengembalikan Tang – 14:18  
> 🟠 Dedi meminjam Bor – 14:12

Fitur realtime dapat menggunakan kemampuan Supabase apabila dibutuhkan.

---

# 30. Alur Utama Sistem

## A. Registrasi Barang

**Admin → Input Barang → Sistem membuat ID Barang → Generate QR Code → Print Label → Tempel pada Barang**

---

## B. Peminjaman

**Mechanic → Login → Scan QR Code → Detail Barang → Pilih Peminjaman → Isi Keperluan → Konfirmasi → Transaksi Tersimpan**

Status:

**AVAILABLE → BORROWED**

---

## C. Pengembalian

**Mechanic → Scan QR Code → Sistem menemukan transaksi → Cek Kondisi → Konfirmasi Pengembalian**

Status:

**BORROWED → AVAILABLE**

atau:

**BORROWED → MAINTENANCE**

---

## D. Monitoring

**Supervisor/Admin → Dashboard → Monitoring Inventory → Monitoring Peminjaman → Laporan**

---

# 31. Fitur yang Disarankan untuk Fase Berikutnya

Beberapa fitur tidak harus masuk **MVP (versi pertama)**, tetapi sebaiknya sudah dipertimbangkan sejak awal:

1. **WhatsApp Notification**
2. **Email Notification**
3. **Approval Workflow**
4. **Stock Opname**
5. **Maintenance Schedule**
6. **Riwayat Maintenance**
7. **Barcode selain QR Code**
8. **Import data barang dari Excel**
9. **Export laporan ke Excel**
10. **Print QR Code secara massal**
11. **Dashboard statistik**
12. **Mobile PWA**, sehingga aplikasi dapat terasa seperti aplikasi mobile.
13. **Offline/poor connection handling** untuk area workshop dengan koneksi internet kurang stabil.
14. **Multi-location inventory**, apabila barang disimpan di beberapa workshop/gudang.
15. **Minimum Stock Alert**, jika inventory menggunakan sistem stok kuantitas.
16. **Asset Tracking**, khusus untuk barang yang memiliki serial number/asset number.

---

# 32. Prioritas Pengembangan

## FASE 1 – MVP

Fitur wajib:

- Login
- User Management
- Master Barang
- Kategori Barang
- Generate QR Code
- Print QR Code
- Scan QR Code
- Peminjaman
- Pengembalian
- Status Barang
- Histori Transaksi
- Dashboard dasar
- Search & Filter

## FASE 2 – Inventory Management

- Stock Opname
- Import Excel
- Export Excel
- Foto Barang
- Audit Trail
- Maintenance
- Overdue Monitoring
- Dashboard statistik

## FASE 3 – Advanced

- Approval
- WhatsApp Notification
- Email Notification
- Realtime Dashboard
- Multi-location
- PWA
- Advanced reporting
- Asset lifecycle management

---

# 33. Acceptance Criteria Utama

Sistem dianggap memenuhi kebutuhan dasar apabila:

1. Admin dapat membuat data barang.
2. Admin dapat membuat QR Code unik untuk barang.
3. QR Code dapat dicetak dan ditempel pada barang.
4. Team Mekanik dapat membuka sistem melalui smartphone.
5. Team Mekanik dapat melakukan scan QR Code.
6. Sistem dapat menampilkan informasi barang setelah scan.
7. Barang yang tersedia dapat dipinjam.
8. Sistem mencatat siapa yang meminjam dan kapan.
9. Status barang berubah menjadi **Dipinjam** setelah transaksi.
10. Barang dapat dikembalikan melalui sistem.
11. Status barang berubah kembali menjadi **Available** setelah pengembalian.
12. Sistem menyimpan histori transaksi.
13. Admin dapat melihat seluruh barang yang sedang dipinjam.
14. Admin dapat mengetahui siapa yang memegang barang tertentu.
15. Sistem dapat menampilkan barang yang terlambat dikembalikan.
16. Sistem dapat menghasilkan laporan inventory dan transaksi.
17. Aplikasi dapat digunakan dengan baik melalui smartphone.
18. Data tersimpan secara terpusat pada database Supabase.
19. Aplikasi dapat diakses melalui deployment Vercel.
20. Hak akses user berjalan sesuai role masing-masing.

---

# 34. Catatan Scope

Dokumen ini merupakan **Client Requirement**, sehingga berfokus pada kebutuhan dan fungsi bisnis.

Detail berikutnya seperti:

- Database Schema
- ERD
- API Specification
- Supabase RLS Policy
- Authentication Flow
- Vercel Environment Variables
- UI/UX Design
- Technical Architecture
- Framework
- Coding Standard

akan dituangkan pada dokumen **System/Technical Specification** setelah Client Requirement disepakati.

---

## 35. Persetujuan Client

**Nama Project:** Sistem Inventory & Peminjaman Barang

**Client:** __________________________

**Project Owner:** ___________________

**Tanggal:** _________________________

**Status:** Draft / Review / Approved

**Catatan Client:**

__________________________________________________

__________________________________________________

**Approval:**

Client: ____________________   Tanggal: __________

Project Team: ______________   Tanggal: __________