# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## SISTEM INVENTORY & PEMINJAMAN BARANG
### Team Mekanik

**Versi:** 1.0  
**Status:** Draft  
**Platform:** Web Application  
**Deployment:** Vercel  
**Database & Backend Services:** Supabase  
**Target Device:** Smartphone, Tablet, Laptop, Desktop  
**Target User:** Admin/Gudang, Team Mekanik, Supervisor

---

# 1. PRODUCT OVERVIEW

## 1.1 Nama Produk

**Sistem Inventory & Peminjaman Barang**

Sistem berbasis web untuk mengelola inventory barang, identifikasi barang menggunakan QR Code, peminjaman, pengembalian, monitoring kondisi barang, serta histori penggunaan barang.

Sistem dirancang dengan pendekatan **mobile-first**, karena aktivitas utama Team Mekanik dilakukan menggunakan smartphone.

---

# 2. PROBLEM STATEMENT

Proses inventory dan peminjaman barang yang dilakukan secara manual berpotensi menimbulkan beberapa masalah:

- Kesulitan mengetahui posisi barang.
- Tidak diketahui siapa yang sedang memegang barang.
- Pencatatan peminjaman membutuhkan waktu.
- Risiko kesalahan pencatatan kode/nama barang.
- Sulit mengetahui barang yang terlambat dikembalikan.
- Histori penggunaan barang tidak terdokumentasi dengan baik.
- Kesulitan melakukan pengecekan stok secara berkala.
- Sulit melakukan monitoring kondisi barang.
- Data inventory dapat tersebar di beberapa file/spreadsheet.

Sistem ini dibuat untuk menjadikan seluruh proses tersebut terpusat dalam satu aplikasi.

---

# 3. PRODUCT GOALS

## Primary Goals

1. Mempermudah identifikasi barang menggunakan QR Code.
2. Mempercepat proses peminjaman barang.
3. Mempermudah proses pengembalian.
4. Mengetahui status barang secara akurat.
5. Mengetahui siapa yang sedang memegang barang.
6. Menyediakan histori penggunaan barang.
7. Mempermudah monitoring inventory oleh Admin dan Supervisor.

## Secondary Goals

1. Mengurangi penggunaan pencatatan manual.
2. Mengurangi human error.
3. Mempermudah stock opname.
4. Menyediakan laporan inventory.
5. Menyediakan dasar pengembangan sistem asset management di masa depan.

---

# 4. NON-GOALS

Fitur berikut tidak menjadi prioritas MVP:

- Purchasing/procurement.
- Purchase Order.
- Supplier management.
- Accounting.
- Financial reporting.
- Payroll.
- Maintenance management kompleks.
- Integrasi ERP.
- Integrasi WhatsApp otomatis.

Fitur tersebut dapat dipertimbangkan pada fase pengembangan berikutnya.

---

# 5. USER ROLES

## 5.1 Admin

Admin memiliki akses penuh terhadap sistem.

Hak akses:

- Dashboard
- Master Barang
- Kategori
- Lokasi
- User
- Generate QR Code
- Print QR Code
- Peminjaman
- Pengembalian
- Stock Opname
- Maintenance
- Laporan
- Audit Trail
- System Settings

---

## 5.2 Mechanic

Team Mekanik menggunakan sistem terutama melalui smartphone.

Hak akses:

- Login
- Dashboard pribadi
- Scan QR Code
- Melihat detail barang
- Peminjaman
- Pengembalian
- Melihat barang yang sedang dipinjam
- Histori peminjaman
- Update kondisi saat pengembalian

---

## 5.3 Supervisor

Supervisor digunakan untuk monitoring.

Hak akses:

- Dashboard
- Monitoring inventory
- Monitoring peminjaman
- Monitoring overdue
- Histori
- Laporan
- Approval peminjaman tertentu

---

# 6. INFORMATION ARCHITECTURE

Struktur menu utama:

```text
Dashboard
│
├── Inventory
│   ├── Daftar Barang
│   ├── Tambah Barang
│   ├── Kategori
│   ├── Lokasi
│   └── Stock Opname
│
├── QR Code
│   ├── Generate QR
│   ├── Print QR
│   └── QR History
│
├── Transaksi
│   ├── Peminjaman
│   ├── Pengembalian
│   └── Overdue
│
├── Maintenance
│   └── Barang Maintenance
│
├── Laporan
│   ├── Inventory
│   ├── Peminjaman
│   ├── Pengembalian
│   └── Stock Opname
│
├── User Management
│
└── Audit Trail
```

Untuk Mechanic, menu dibuat lebih sederhana:

```text
Dashboard
│
├── Scan Barang
├── Barang Saya
├── Peminjaman
└── Riwayat
```

---

# 7. CORE USER JOURNEYS

# 7.1 Registrasi Barang

```text
Admin Login
      ↓
Inventory
      ↓
Tambah Barang
      ↓
Input Data
      ↓
Simpan
      ↓
Generate QR Code
      ↓
Print Label
      ↓
Tempel QR Code pada Barang
```

### Expected Result

Barang memiliki ID unik dan QR Code yang dapat digunakan untuk identifikasi.

---

# 7.2 Peminjaman Barang

```text
Mechanic Login
      ↓
Scan QR Code
      ↓
Sistem membaca QR
      ↓
Tampilkan Detail Barang
      ↓
Cek Status
      ↓
Available?
   ↙       ↘
 Ya        Tidak
 ↓           ↓
Peminjaman   Tampilkan Status
 ↓
Isi Keperluan
 ↓
Tanggal Kembali
 ↓
Konfirmasi
 ↓
Transaksi dibuat
 ↓
Status = BORROWED
```

---

# 7.3 Pengembalian Barang

```text
Mechanic
   ↓
Scan QR
   ↓
Cari transaksi aktif
   ↓
Tampilkan transaksi
   ↓
Cek kondisi barang
   ↓
Konfirmasi
   ↓
Return Transaction
   ↓
Update status
```

Jika kondisi baik:

```text
BORROWED → AVAILABLE
```

Jika rusak:

```text
BORROWED → DAMAGED / MAINTENANCE
```

---

# 7.4 Barang Overdue

Sistem melakukan pengecekan:

```text
Current Date > Expected Return Date
```

Jika benar:

```text
Status Transaction = OVERDUE
```

Barang tetap berstatus:

```text
BORROWED
```

tetapi transaksi ditandai sebagai:

```text
OVERDUE
```

---

# 8. FUNCTIONAL REQUIREMENTS

## FR-001 Authentication

Sistem harus menyediakan login user.

Input:

- Username/Employee ID
- Password

Sistem harus memvalidasi:

- User aktif.
- Password benar.
- Role user.

User yang tidak memiliki akses tidak dapat membuka halaman yang dibatasi.

---

# 9. FR-002 User Management

Admin dapat:

- Tambah user.
- Edit user.
- Nonaktifkan user.
- Reset password.
- Mengatur role.
- Mengatur team/department.

Data:

```text
User ID
Employee ID
Name
Username
Department
Role
Status
Created At
Updated At
```

---

# 10. FR-003 Master Barang

Admin dapat:

- Tambah barang.
- Edit barang.
- Nonaktifkan barang.
- Melihat detail.
- Upload foto.
- Mengatur lokasi.
- Mengatur kondisi.
- Mengatur stok.

Field:

```text
Item ID
Item Code
Item Name
Category
Brand
Model
Serial Number
Unit
Quantity
Location
Condition
Status
Photo
Description
Created At
Updated At
```

---

# 11. FR-004 QR Code

Setiap barang harus memiliki QR Code unik.

QR Code tidak menyimpan seluruh informasi barang.

QR Code cukup mengidentifikasi:

```text
ITEM-ID
```

atau identifier unik lainnya.

Saat scan:

```text
QR Code
   ↓
Item ID
   ↓
Database
   ↓
Item Detail
```

Hal ini memungkinkan informasi barang diubah tanpa harus mencetak QR Code baru.

---

# 12. FR-005 QR Code Generator

Admin dapat:

- Generate satu QR Code.
- Generate banyak QR Code.
- Preview.
- Print.
- Download.

Label minimal:

```text
[NAMA PERUSAHAAN]

ITEM CODE
ITEM NAME

[ QR CODE ]
```

---

# 13. FR-006 QR Scanner

Scanner harus dapat bekerja melalui kamera smartphone.

Setelah QR berhasil dibaca:

```text
Item Name
Item Code
Category
Brand
Condition
Status
Location
```

Tombol berdasarkan status.

### Available

```text
[ PINJAM BARANG ]
```

### Borrowed

```text
SEDANG DIPINJAM

Peminjam: Andi
Tanggal: 11/08/2026
Kembali: 12/08/2026
```

### Maintenance

```text
BARANG SEDANG MAINTENANCE
```

---

# 14. FR-007 Borrowing Transaction

Form peminjaman:

```text
Transaction Number
Borrower
Item
Quantity
Purpose
Location of Use
Borrow Date
Expected Return Date
Notes
```

Nomor transaksi otomatis.

Format:

```text
BRW-YYYYMMDD-XXXX
```

Contoh:

```text
BRW-20260811-0001
```

---

# 15. FR-008 Multi-Item Borrowing

Satu transaksi dapat berisi banyak item.

Contoh:

```text
BRW-20260811-0001

1. Multimeter      x1
2. Tang            x1
3. Obeng           x2
4. Kunci Inggris   x1
```

Tujuan:

Mechanic cukup membuat satu transaksi untuk satu aktivitas pekerjaan.

---

# 16. FR-009 Borrowing Validation

Sebelum transaksi disimpan, sistem harus melakukan validasi:

### Item

- Barang harus aktif.
- Barang harus tersedia.
- Quantity tidak boleh melebihi stok.

### User

- User harus aktif.
- User harus memiliki role yang sesuai.

### Date

- Expected return tidak boleh lebih awal dari borrow date.

Jika validasi gagal, transaksi tidak boleh disimpan.

---

# 17. FR-010 Return Transaction

Pengembalian dapat dilakukan dengan:

### Method A

Scan QR Code barang.

### Method B

Membuka transaksi aktif.

Sistem menampilkan:

```text
Borrower
Transaction Number
Item
Borrow Date
Expected Return
Quantity
```

User mengisi:

```text
Returned Quantity
Condition
Notes
Photo
```

---

# 18. FR-011 Return Validation

Sistem tidak boleh menerima:

```text
Returned Quantity > Borrowed Quantity
```

Jika sebagian barang dikembalikan:

```text
Borrowed = 5
Returned = 3
Outstanding = 2
```

---

# 19. FR-012 Item Status

Status item:

```text
AVAILABLE
BORROWED
MAINTENANCE
DAMAGED
LOST
INACTIVE
```

Status transaksi:

```text
PENDING
APPROVED
BORROWED
PARTIALLY_RETURNED
RETURNED
OVERDUE
CANCELLED
```

Status item dan status transaksi harus dipisahkan.

---

# 20. FR-013 Item History

Detail barang memiliki tab:

### Information

Data barang.

### Current Status

Status saat ini.

### Borrowing History

Riwayat peminjaman.

### Maintenance History

Riwayat maintenance.

### Audit

Perubahan data.

---

# 21. FR-014 Dashboard

Dashboard Admin:

```text
TOTAL ITEM
AVAILABLE
BORROWED
MAINTENANCE
DAMAGED
LOST
```

Widget tambahan:

```text
Peminjaman Hari Ini
Pengembalian Hari Ini
Overdue
Top Borrowed Items
Recent Activity
```

---

# 22. FR-015 Search & Filter

Search harus mendukung:

```text
Item Code
Item Name
Serial Number
Brand
Transaction Number
Borrower
```

Filter:

```text
Category
Status
Condition
Location
Date
Borrower
```

---

# 23. FR-016 Stock Opname

Stock opname dapat dilakukan menggunakan QR Scanner.

Flow:

```text
Start Stock Opname
       ↓
Scan QR
       ↓
Item Found
       ↓
Compare System Data
       ↓
Physical Check
       ↓
Condition Check
       ↓
Save
```

Sistem menyimpan:

```text
Stock Opname ID
Item
System Quantity
Physical Quantity
Difference
Condition
Checked By
Checked At
Notes
```

---

# 24. FR-017 Maintenance

Admin dapat mengubah status barang menjadi:

```text
MAINTENANCE
```

Data maintenance:

```text
Maintenance ID
Item
Start Date
Problem
Description
Technician
Cost (optional)
Expected Finish
Actual Finish
Status
Notes
```

Setelah selesai:

```text
MAINTENANCE → AVAILABLE
```

atau:

```text
MAINTENANCE → DAMAGED
```

---

# 25. FR-018 Overdue Monitoring

Sistem harus otomatis mendeteksi transaksi overdue.

Dashboard menampilkan:

```text
Borrower
Item
Transaction
Borrow Date
Expected Return
Days Overdue
```

Contoh:

```text
Andi
Multimeter
BRW-20260811-0001
Expected: 10 Aug
Overdue: 1 Day
```

---

# 26. FR-019 Notification

MVP:

- In-app notification.

Future:

- Email.
- WhatsApp.
- Push Notification.

Notifikasi minimal:

- Peminjaman berhasil.
- Pengembalian berhasil.
- Overdue.
- Approval.
- Maintenance selesai.

---

# 27. FR-020 Reports

Laporan:

### Inventory Report

- Semua barang.
- Available.
- Borrowed.
- Maintenance.
- Damaged.
- Lost.

### Borrowing Report

- Periode.
- User.
- Item.
- Status.

### Return Report

- Periode.
- User.
- Item.
- Condition.

### Stock Opname Report

- System stock.
- Physical stock.
- Difference.

Format export:

```text
Excel
CSV
PDF
```

---

# 28. FR-021 Audit Trail

Sistem mencatat:

```text
User
Action
Module
Record
Old Value
New Value
IP/Session Information
Timestamp
```

Contoh:

```text
11/08/2026 14:25
Andi
BORROW ITEM
Multimeter
BRW-20260811-0001
```

---

# 29. DATABASE REQUIREMENT

Database menggunakan **Supabase PostgreSQL**.

Struktur awal yang direkomendasikan:

```text
profiles
roles
departments
categories
locations
items
item_units
item_status_history
borrowings
borrowing_items
returns
return_items
maintenance
stock_opnames
stock_opname_items
notifications
audit_logs
```

---

# 30. DATABASE RELATIONSHIP

Konsep hubungan:

```text
profiles
   │
   ├──────── borrowings
   │              │
   │              └── borrowing_items
   │                         │
   │                         └── items
   │
   └──────── audit_logs


items
 │
 ├── categories
 ├── locations
 ├── borrowing_items
 ├── maintenance
 ├── stock_opname_items
 └── item_status_history
```

---

# 31. ITEM vs ITEM UNIT

Untuk inventory sederhana:

```text
1 Item = 1 record
Quantity = jumlah
```

Namun untuk barang yang memiliki serial number, sebaiknya menggunakan:

```text
Item
  ↓
Item Unit
```

Contoh:

```text
Item:
Multimeter

Units:
MT-001
MT-002
MT-003
MT-004
```

Setiap unit dapat memiliki QR Code sendiri.

Ini sangat direkomendasikan untuk barang yang benar-benar perlu dilacak per unit.

---

# 32. SUPABASE REQUIREMENTS

Supabase digunakan untuk:

- PostgreSQL Database.
- Authentication.
- Storage.
- Row Level Security.
- Realtime, jika diperlukan.

### Storage

Digunakan untuk:

- Foto barang.
- Foto kondisi pengembalian.
- Foto maintenance.

### Row Level Security

RLS wajib dipertimbangkan untuk memastikan:

- Mechanic hanya dapat mengakses data yang diperbolehkan.
- Supervisor dapat melihat data monitoring.
- Admin memiliki akses management.

---

# 33. VERCEL REQUIREMENTS

Aplikasi di-deploy ke Vercel.

Environment variables minimal:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Jika diperlukan server-side access:

```text
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` tidak boleh dikirim ke browser/client-side.

---

# 34. MOBILE-FIRST REQUIREMENT

Karena Team Mekanik menggunakan smartphone, halaman utama harus memprioritaskan:

```text
SCAN QR
```

Contoh bottom navigation:

```text
┌──────────────────────────┐
│       INVENTORY          │
│                          │
│      [ SCAN QR ]         │
│                          │
│ Barang Saya              │
│ Peminjaman Aktif         │
│                          │
├──────────────────────────┤
│ Home | Scan | History    │
└──────────────────────────┘
```

Scan QR harus dapat dilakukan dengan jumlah langkah seminimal mungkin.

Target:

**Login → Scan → Detail → Pinjam**

---

# 35. UX REQUIREMENTS

Sistem harus:

- Simple.
- Cepat.
- Mobile friendly.
- Minim input manual.
- Mengutamakan QR scanning.
- Menampilkan status barang dengan jelas.
- Menggunakan confirmation sebelum transaksi final.
- Menampilkan error yang mudah dipahami.

Contoh:

Jangan:

> Error 409 Conflict.

Lebih baik:

> Barang ini sedang dipinjam oleh Budi dan belum dikembalikan.

---

# 36. PERFORMANCE REQUIREMENTS

Target:

- Dashboard dapat terbuka dengan cepat.
- Scan QR menghasilkan detail barang dalam waktu singkat.
- Transaksi tidak boleh dibuat dua kali karena double-click.
- Sistem harus menangani koneksi internet yang tidak stabil dengan graceful error.
- Loading state harus ditampilkan saat proses database berlangsung.

---

# 37. SECURITY REQUIREMENTS

Minimum:

- Authentication.
- Authorization.
- RLS Supabase.
- Password hashing melalui authentication provider.
- Input validation.
- Server-side validation untuk transaksi penting.
- Tidak menyimpan service-role key di frontend.
- Audit trail.
- Secure session handling.

---

# 38. BUSINESS RULES

### BR-001

Barang yang berstatus:

```text
BORROWED
MAINTENANCE
DAMAGED
LOST
INACTIVE
```

tidak dapat dipinjam.

### BR-002

Quantity peminjaman tidak boleh melebihi quantity tersedia.

### BR-003

Barang harus memiliki ID unik.

### BR-004

QR Code harus mengarah ke barang yang valid.

### BR-005

Barang yang dikembalikan harus memiliki transaksi peminjaman aktif.

### BR-006

Returned quantity tidak boleh lebih besar dari outstanding quantity.

### BR-007

User inactive tidak dapat melakukan transaksi.

### BR-008

Transaksi yang sudah RETURNED tidak dapat diedit sembarangan.

Perubahan harus melalui mekanisme koreksi/audit.

### BR-009

Penghapusan barang sebaiknya menggunakan:

**Soft Delete / Inactive**

bukan hard delete.

Tujuannya agar histori transaksi tidak hilang.

---

# 39. ACCEPTANCE CRITERIA

## QR Code

- [ ] Admin dapat membuat QR Code.
- [ ] QR Code unik.
- [ ] QR dapat dipindai smartphone.
- [ ] Scan menampilkan barang yang benar.
- [ ] QR dapat dicetak.

## Inventory

- [ ] Admin dapat menambah barang.
- [ ] Admin dapat mengedit barang.
- [ ] Admin dapat menonaktifkan barang.
- [ ] Barang memiliki status.
- [ ] Barang memiliki kategori dan lokasi.

## Borrowing

- [ ] Mechanic dapat scan.
- [ ] Mechanic dapat melakukan peminjaman.
- [ ] Sistem membuat nomor transaksi.
- [ ] Sistem mencatat user.
- [ ] Sistem mengubah status barang.
- [ ] Sistem menyimpan histori.

## Return

- [ ] Mechanic dapat scan barang.
- [ ] Sistem menemukan transaksi aktif.
- [ ] User dapat mengembalikan barang.
- [ ] Sistem mencatat kondisi.
- [ ] Status barang berubah.
- [ ] Partial return dapat diproses.

## Monitoring

- [ ] Admin melihat barang dipinjam.
- [ ] Admin mengetahui peminjam.
- [ ] Sistem mendeteksi overdue.
- [ ] Supervisor dapat melihat dashboard.

---

# 40. MVP SCOPE

## WAJIB

### Authentication
- Login
- Role

### Inventory
- CRUD Barang
- Kategori
- Lokasi
- Status

### QR
- Generate
- Print
- Scan

### Transaction
- Borrow
- Return
- Multi-item
- Partial return

### Monitoring
- Dashboard
- Search
- Filter
- History
- Overdue

### User
- User management
- Role management

### Security
- Authentication
- Authorization
- RLS
- Audit log dasar

---

# 41. PHASE 2

- Stock Opname
- Maintenance
- Photo Documentation
- Excel Import
- Excel Export
- PDF Report
- Advanced Dashboard
- Notification
- Approval

---

# 42. PHASE 3

- WhatsApp Notification
- PWA
- Offline Support
- Multi-location
- Advanced Asset Tracking
- Maintenance Scheduling
- Asset Lifecycle
- Advanced Analytics

---

# 43. SUCCESS METRICS

Setelah implementasi, keberhasilan sistem dapat diukur dari:

### Operational

- Waktu peminjaman lebih cepat.
- Penggunaan pencatatan manual berkurang.
- Kesalahan pencatatan berkurang.

### Inventory

- Seluruh barang memiliki identitas.
- Persentase barang dengan QR Code meningkat.
- Data stok lebih akurat.

### Tracking

- Setiap barang yang dipinjam memiliki peminjam.
- Barang overdue dapat diketahui.
- Histori barang dapat ditelusuri.

### User Adoption

Target:

> Team Mekanik menggunakan sistem sebagai media utama untuk proses peminjaman dan pengembalian barang.

---

# 44. FUTURE ARCHITECTURE

Konsep arsitektur:

```text
                 ┌───────────────┐
                 │ Smartphone    │
                 │ Mechanic      │
                 └───────┬───────┘
                         │
                     QR Scanner
                         │
                         ▼
                 ┌───────────────┐
                 │    Vercel     │
                 │ Web Application│
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │   Supabase    │
                 │               │
                 │ PostgreSQL    │
                 │ Auth          │
                 │ Storage       │
                 │ RLS           │
                 │ Realtime      │
                 └───────────────┘
```

---

# 45. RECOMMENDED TECH STACK

Untuk implementasi:

**Frontend**
- Next.js
- TypeScript
- Tailwind CSS

**Backend**
- Supabase

**Database**
- PostgreSQL

**Authentication**
- Supabase Auth

**Storage**
- Supabase Storage

**Deployment**
- Vercel

**QR**
- Browser Camera API / QR Scanner Library

**Reporting**
- XLSX/CSV generation
- PDF generation

---

# 46. DEVELOPMENT PRIORITY

Urutan development yang direkomendasikan:

```text
1. Database & Authentication
        ↓
2. User & Role
        ↓
3. Master Barang
        ↓
4. QR Code Generator
        ↓
5. QR Scanner
        ↓
6. Borrowing
        ↓
7. Return
        ↓
8. Dashboard
        ↓
9. History
        ↓
10. Overdue
        ↓
11. Reports
        ↓
12. Audit Trail
        ↓
13. Stock Opname
        ↓
14. Maintenance
        ↓
15. Notification
```

---

# 47. DEFINITION OF DONE

Sebuah fitur dianggap selesai apabila:

- Requirement sudah diimplementasikan.
- UI responsive.
- Validasi berjalan.
- Error handling tersedia.
- Role permission sudah diuji.
- Data tersimpan dengan benar.
- Tidak merusak transaksi sebelumnya.
- Mobile testing berhasil.
- Desktop testing berhasil.
- Tidak ada critical error.
- Acceptance criteria terpenuhi.

---

# 48. FINAL MVP USER FLOW

### ADMIN

```text
LOGIN
 ↓
DASHBOARD
 ↓
TAMBAH BARANG
 ↓
GENERATE QR
 ↓
PRINT QR
 ↓
TEMPEL QR PADA BARANG
```

### MECHANIC

```text
LOGIN
 ↓
SCAN QR
 ↓
LIHAT BARANG
 ↓
PINJAM
 ↓
ISI KEPERLUAN
 ↓
KONFIRMASI
 ↓
BARANG DIPINJAM
```

### RETURN

```text
SCAN QR
 ↓
TRANSAKSI AKTIF
 ↓
KONDISI BARANG
 ↓
KONFIRMASI
 ↓
BARANG KEMBALI AVAILABLE
```

### ADMIN / SUPERVISOR

```text
DASHBOARD
 ↓
MONITORING
 ↓
BARANG DIPINJAM
 ↓
SIAPA PEMINJAM
 ↓
OVERDUE
 ↓
REPORT
```

---

# 49. APPROVAL

**Product:** Sistem Inventory & Peminjaman Barang

**PRD Version:** 1.0

**Prepared By:** ______________________

**Reviewed By:** ______________________

**Client:** ___________________________

**Date:** _____________________________

**Status:**

☐ Draft  
☐ Review  
☐ Approved  
☐ Revision Required

---

# 50. NOTE

PRD ini menjadi dasar pengembangan aplikasi.

Perubahan terhadap requirement setelah PRD disetujui harus dicatat sebagai:

**Change Request (CR)**

agar perubahan scope, estimasi waktu, dan effort development dapat dikontrol.