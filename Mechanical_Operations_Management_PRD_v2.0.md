# CLIENT REQUIREMENT & PRODUCT REQUIREMENTS DOCUMENT (PRD)

# SISTEM INVENTORY, PEOPLE & JOB MONITORING

## Team Mechanical / Maintenance

**Dokumen:** Client Requirement + PRD + PRD Addendum\
**Versi:** 2.0\
**Status:** Draft / Review\
**Platform:** Web Application\
**Deployment:** Vercel\
**Database & Backend:** Supabase\
**Target Device:** Smartphone, Tablet, Laptop, Desktop\
**Target User:** Admin/Gudang, Team Mekanik,
Supervisor/Foreman/Management

------------------------------------------------------------------------

# DAFTAR ISI

1.  Client Requirement
2.  Product Overview
3.  Problem Statement
4.  Product Goals
5.  Scope
6.  User Roles
7.  Information Architecture
8.  Employee / People Profile
9.  Competency & Skill Management
10. Certificate Management
11. Employee Development
12. Violation / Disciplinary Management
13. Inventory Management
14. QR Code Management
15. Peminjaman & Pengembalian
16. Stock Opname
17. Maintenance
18. Job Planning & Monitoring
19. Work Order
20. Manpower Planning
21. Job Qualification Check
22. Tool & Inventory Integration
23. Work Permit
24. Job Checklist
25. Job Execution
26. Daily Job Report
27. Calendar / Monthly Planning
28. Dashboard
29. Notification
30. Reports
31. Audit Trail
32. Universal QR Identity
33. Database Requirements
34. Supabase Requirements
35. Vercel Requirements
36. Security Requirements
37. Business Rules
38. Functional Requirements
39. User Flow
40. MVP
41. Phase 2
42. Phase 3
43. Acceptance Criteria
44. Success Metrics
45. Definition of Done
46. Change Request Process
47. Future Architecture
48. Approval

------------------------------------------------------------------------

# 1. CLIENT REQUIREMENT

## 1.1 Latar Belakang

Diperlukan sistem terintegrasi untuk mendukung aktivitas Team
Mechanical/Maintenance, mulai dari pengelolaan personel, kompetensi,
sertifikat, pengembangan diri, pelanggaran, inventory/tool, peminjaman
barang, sampai perencanaan dan monitoring pekerjaan.

Sistem harus dapat digunakan melalui smartphone sehingga aktivitas
lapangan dapat dilakukan secara cepat dengan QR Code.

Dokumen personel yang menjadi salah satu sumber requirement memuat
kolom:

-   Barcode
-   Foto
-   Nama
-   NIK
-   Keahlian/Jabatan
-   Pendidikan
-   Grade
-   Tahun Masuk
-   Sertifikat
-   Prospek Untuk Pengembangan Diri
-   Pelanggaran APD
-   Pelanggaran Safety/Disiplin Lapangan

Struktur tersebut menjadi dasar modul People/Employee Profile.

## 1.2 Kebutuhan Utama Client

### A. QR Code Personel

Setiap anggota Team Mechanical memiliki QR Code personal yang dapat
dipindai menggunakan smartphone untuk melihat data personel yang
diizinkan.

Data yang ditampilkan:

-   Foto
-   Nama
-   NIK
-   Keahlian/Jabatan
-   Pendidikan
-   Grade
-   Tahun Masuk
-   Sertifikat
-   Prospek Pengembangan Diri
-   Pelanggaran APD
-   Pelanggaran Safety/Disiplin Lapangan

### B. QR Code Inventory

Setiap barang/tool memiliki QR Code unik untuk:

-   Identifikasi barang
-   Melihat detail barang
-   Melakukan peminjaman
-   Melakukan pengembalian
-   Melihat status
-   Melihat histori

### C. Job Monitoring

Sistem harus mendukung:

-   Input job hari ini
-   Job planning beberapa hari/minggu ke depan
-   Perencanaan sampai sekitar satu bulan ke depan
-   Nomor WO
-   Plant
-   Area/location
-   Judul pekerjaan
-   Deskripsi pekerjaan
-   Anggota/manpower
-   Tool yang digunakan
-   Permit/izin kerja
-   Checklist pekerjaan
-   Progress
-   Dokumentasi foto
-   Kendala
-   Status pekerjaan

### D. Integrasi

Modul Job harus terhubung dengan:

-   Employee/People
-   Competency
-   Certificate
-   Inventory/Tool
-   Permit
-   Job execution
-   Reporting

------------------------------------------------------------------------

# 2. PRODUCT OVERVIEW

Produk merupakan web application untuk mengelola aktivitas Team
Mechanical/Maintenance secara terintegrasi.

Konsep utama:

``` text
PEOPLE
  |
  +-- Skill
  +-- Certificate
  +-- Development
  +-- Violation
  |
  v
JOB / WORK ORDER
  |
  +-- Manpower
  +-- Tools
  +-- Plant / Area
  +-- Permit
  +-- Checklist
  +-- Progress
  |
  v
INVENTORY
  |
  +-- QR Code
  +-- Borrowing
  +-- Return
  +-- Maintenance
```

------------------------------------------------------------------------

# 3. PROBLEM STATEMENT

Proses manual berpotensi menyebabkan:

-   Sulit mengetahui data personel secara cepat.
-   Data skill dan sertifikasi tidak terstruktur.
-   Sulit mengetahui masa berlaku sertifikat.
-   Riwayat pelanggaran tidak terdokumentasi secara baik.
-   Sulit merencanakan manpower.
-   Sulit mengetahui pekerjaan hari ini dan pekerjaan yang akan datang.
-   Tool yang dibutuhkan pekerjaan tidak mudah dimonitor.
-   Peminjaman tool sulit ditelusuri.
-   Dokumen izin kerja dapat tercecer.
-   Progress pekerjaan sulit dipantau.
-   Histori pekerjaan tidak terpusat.

------------------------------------------------------------------------

# 4. PRODUCT GOALS

## Primary Goals

1.  Membuat database personel terpusat.
2.  Membuat QR Code untuk personel dan asset/tool.
3.  Mempercepat identifikasi personel.
4.  Mempercepat identifikasi inventory.
5.  Mengelola skill dan sertifikat.
6.  Mengelola pengembangan personel.
7.  Mencatat pelanggaran APD dan safety/disiplin.
8.  Mengelola inventory dan tool.
9.  Mengelola peminjaman dan pengembalian.
10. Mengelola job/work order.
11. Mengelola manpower planning.
12. Menghubungkan job dengan tool inventory.
13. Menghubungkan job dengan kompetensi personel.
14. Mengelola permit dan checklist.
15. Menyediakan monitoring pekerjaan harian sampai rencana beberapa
    minggu/bulan.
16. Menyediakan histori dan laporan.

------------------------------------------------------------------------

# 5. SCOPE

## 5.1 In Scope

-   Authentication
-   User management
-   Employee profile
-   Employee QR
-   Skill/competency
-   Certificate
-   Development plan
-   Violation
-   Inventory
-   Asset/tool QR
-   Borrowing
-   Return
-   Stock opname
-   Maintenance
-   Work Order
-   Job planning
-   Manpower
-   Qualification checking
-   Tool assignment
-   Work permit
-   Job checklist
-   Job execution
-   Daily job report
-   Dashboard
-   Calendar planning
-   Reports
-   Audit trail

## 5.2 Non-Goals MVP

-   Accounting
-   Payroll
-   Purchasing
-   Procurement
-   Supplier management
-   Full ERP
-   Financial reporting

------------------------------------------------------------------------

# 6. USER ROLES

## 6.1 Admin

Full system management.

## 6.2 Mechanic

Fokus pada:

-   Scan QR
-   Peminjaman
-   Pengembalian
-   Melihat job
-   Update pekerjaan
-   Melihat profil sendiri
-   Histori

## 6.3 Foreman / Leader

-   Manpower planning
-   Job monitoring
-   Assignment
-   Tool planning
-   Progress
-   Daily report

## 6.4 Supervisor

-   Monitoring
-   Approval
-   Job planning
-   Employee monitoring
-   Inventory monitoring
-   Report

## 6.5 Management

Read-only monitoring dan dashboard tingkat manajemen.

------------------------------------------------------------------------

# 7. INFORMATION ARCHITECTURE

``` text
Dashboard

People
├── Employee
├── Skill / Competency
├── Certificate
├── Development
└── Violation

Inventory
├── Items
├── Categories
├── Locations
├── QR Code
├── Borrowing
├── Return
├── Stock Opname
└── Maintenance

Job / Work Order
├── Job List
├── Calendar
├── Create Job
├── Manpower
├── Tools
├── Permit
├── Checklist
├── Progress
├── Daily Report
└── Job History

Reports
├── People
├── Certificate
├── Inventory
├── Borrowing
├── Job
├── Manpower
└── Safety

Administration
├── Users
├── Roles
├── Settings
└── Audit Trail
```

------------------------------------------------------------------------

# 8. EMPLOYEE / PEOPLE PROFILE

## 8.1 Employee Data

Field minimal:

-   Employee ID
-   NIK
-   Name
-   Photo
-   Position
-   Department/Team
-   Education
-   Grade
-   Join Date
-   Employment Status
-   QR Code
-   Contact, jika diperlukan
-   Notes

## 8.2 QR Personel

Format identifier:

``` text
EMP-{UNIQUE-ID}
```

Contoh:

``` text
EMP-S1504
```

Scan menghasilkan halaman profil.

## 8.3 Profile View

``` text
[PHOTO]

Andre Pratama
NIK: S1504
Position: Foreman
Grade: 4
Education: D3
Join Date: 02/12/2019

[SKILL]
[CERTIFICATE]
[DEVELOPMENT]
[VIOLATION]
[JOB HISTORY]
```

------------------------------------------------------------------------

# 9. COMPETENCY & SKILL MANAGEMENT

Keahlian tidak disimpan hanya sebagai satu field text.

Skill menjadi data terstruktur.

Contoh:

-   SMAW
-   GTAW
-   Fitter
-   Welder
-   Scaffolder
-   Rigger
-   Driver Forklift
-   Tool Keeper
-   Non Metal
-   Weight Lifting Arrangement

## 9.1 Employee Skill

``` text
Employee
  |
  +-- Skill
  +-- Level
  +-- Qualification Status
  +-- Date Verified
  +-- Notes
```

## 9.2 Skill Level

Dapat menggunakan:

-   Beginner
-   Intermediate
-   Advanced
-   Expert

atau sistem level internal perusahaan.

------------------------------------------------------------------------

# 10. CERTIFICATE MANAGEMENT

Certificate disimpan sebagai record terpisah.

Field:

-   Employee
-   Certificate Name
-   Certificate Number
-   Issuer
-   Issue Date
-   Expiry Date
-   Certificate Type
-   File
-   Status
-   Notes

## 10.1 Certificate Status

``` text
VALID
EXPIRING_SOON
EXPIRED
```

## 10.2 Certificate Reminder

Contoh:

``` text
Certified Welder SMAW 6G
Expired: 20/10/2026

STATUS:
VALID
```

Jika mendekati expiry:

``` text
WARNING:
Certificate expires in 30 days
```

Jika lewat:

``` text
EXPIRED
```

------------------------------------------------------------------------

# 11. EMPLOYEE DEVELOPMENT

Field:

-   Employee
-   Development Goal
-   Target Skill
-   Required Training
-   Target Certificate
-   Target Date
-   Status
-   Notes

Status:

``` text
PLANNED
IN_PROGRESS
COMPLETED
CANCELLED
```

Contoh:

``` text
Target:
Upgrade Welder 6G

Training:
Advanced Welding

Target:
2026

Status:
Planned
```

------------------------------------------------------------------------

# 12. VIOLATION / DISCIPLINARY MANAGEMENT

## 12.1 Kategori

-   APD
-   Safety
-   Disiplin Lapangan
-   Procedure
-   Attendance
-   Other

## 12.2 Record

Field:

-   Employee
-   Date
-   Category
-   Violation
-   Description
-   Severity
-   Action
-   PIC
-   Attachment
-   Status
-   Notes

## 12.3 Severity

``` text
MINOR
MAJOR
CRITICAL
```

## 12.4 Pemisahan Pelanggaran

Sistem tetap membedakan:

``` text
Pelanggaran APD

Pelanggaran Safety / Disiplin Lapangan
```

------------------------------------------------------------------------

# 13. INVENTORY MANAGEMENT

## 13.1 Master Item

Field:

-   Item ID
-   Item Code
-   Item Name
-   Category
-   Brand
-   Model
-   Serial Number
-   Unit
-   Quantity
-   Location
-   Condition
-   Status
-   Photo
-   Description

## 13.2 Status

``` text
AVAILABLE
BORROWED
MAINTENANCE
DAMAGED
LOST
INACTIVE
```

------------------------------------------------------------------------

# 14. QR CODE MANAGEMENT

QR Code inventory menggunakan identifier unik.

Contoh:

``` text
AST-000001
AST-000002
AST-000003
```

QR Code tidak menyimpan seluruh data barang.

QR hanya menyimpan identifier.

Flow:

``` text
QR
 |
 v
Asset ID
 |
 v
Database
 |
 v
Item Detail
```

Keuntungan:

Data dapat berubah tanpa mencetak ulang QR.

------------------------------------------------------------------------

# 15. BORROWING & RETURN

## 15.1 Borrowing Flow

``` text
Login
 ↓
Scan QR
 ↓
Detail Item
 ↓
Check Availability
 ↓
Borrow
 ↓
Purpose
 ↓
Expected Return
 ↓
Confirm
 ↓
Transaction Created
```

Status:

``` text
AVAILABLE -> BORROWED
```

## 15.2 Transaction Number

Format:

``` text
BRW-YYYYMMDD-XXXX
```

## 15.3 Multi-Item Borrowing

Satu transaksi dapat memiliki banyak item.

## 15.4 Return

``` text
Scan QR
 ↓
Active Transaction
 ↓
Condition Check
 ↓
Returned Quantity
 ↓
Confirm
```

------------------------------------------------------------------------

# 16. STOCK OPNAME

Stock opname menggunakan QR scanning.

Data:

-   Stock Opname ID
-   Item
-   System Quantity
-   Physical Quantity
-   Difference
-   Condition
-   Checked By
-   Checked At
-   Notes

Formula:

``` text
Difference = Physical Quantity - System Quantity
```

------------------------------------------------------------------------

# 17. MAINTENANCE

Maintenance item:

-   Item
-   Problem
-   Start Date
-   Technician
-   Expected Finish
-   Actual Finish
-   Status
-   Notes
-   Photo
-   Attachment

Status:

``` text
OPEN
IN_PROGRESS
COMPLETED
CANCELLED
```

------------------------------------------------------------------------

# 18. JOB PLANNING & MONITORING

Modul Job menjadi tambahan utama setelah sistem Inventory berjalan.

## 18.1 Job

Field:

-   Job ID
-   WO Number
-   Job Title
-   Description
-   Plant
-   Area
-   Location
-   Priority
-   PIC
-   Supervisor
-   Planned Start
-   Planned Finish
-   Actual Start
-   Actual Finish
-   Status

## 18.2 Status

``` text
PLANNED
READY
IN_PROGRESS
PENDING
COMPLETED
CANCELLED
```

------------------------------------------------------------------------

# 19. WORK ORDER

Setiap pekerjaan dapat memiliki nomor WO.

Contoh:

``` text
WO-2026-00125
```

Informasi:

``` text
WO Number
Job Title
Plant
Area
Requester
Priority
Planned Date
Deadline
Description
```

------------------------------------------------------------------------

# 20. MANPOWER PLANNING

Setiap job memiliki anggota yang ditugaskan.

Contoh:

``` text
WO-2026-00125

PIC:
Andre Pratama

Manpower:
M. Jamil - Welder
Yudit - Fitter
Sofwatillah - Scaffolder
```

Relasi:

``` text
JOB
 |
 +-- PIC
 +-- Manpower
```

------------------------------------------------------------------------

# 21. JOB QUALIFICATION CHECK

Sistem dapat melakukan pemeriksaan kompetensi sebelum manpower
ditugaskan.

Contoh requirement:

``` text
Job membutuhkan:
- Welder SMAW 6G
- Rigger
- TKBT
```

Sistem mengecek employee:

``` text
Andre
✓ Welder
✓ Rigger
✓ TKBT

Budi
✓ Welder
✗ Rigger
✗ TKBT
```

Jika sertifikat expired:

``` text
WARNING:
Certificate expired
```

Fitur ini menjadi penghubung:

``` text
Employee
  ↓
Skill
  ↓
Certificate
  ↓
Job Requirement
```

------------------------------------------------------------------------

# 22. TOOL & INVENTORY INTEGRATION

Tool yang digunakan pada Job diambil dari inventory yang sama.

Tidak membuat master tool kedua.

Relasi:

``` text
JOB
 ↓
JOB TOOLS
 ↓
INVENTORY
```

Contoh:

``` text
WO-00125

Tools:
- Welding Machine
- Grinder
- Multimeter
- Torque Wrench
- Chain Block
```

Sistem mengecek availability.

------------------------------------------------------------------------

# 23. TOOL RESERVATION

Jika tool diperlukan untuk Job di masa depan:

``` text
Job
 ↓
Required Tool
 ↓
Check Availability
 ↓
Reserve
```

Status dapat menjadi:

``` text
AVAILABLE
RESERVED
BORROWED
MAINTENANCE
```

Ini penting untuk mencegah benturan penggunaan tool antar job.

------------------------------------------------------------------------

# 24. WORK PERMIT

Job dapat memiliki permit.

Jenis:

-   Work Permit
-   Hot Work
-   Working at Height
-   Confined Space
-   Lifting
-   Electrical
-   Other

Field:

-   Permit Number
-   Permit Type
-   Issue Date
-   Expiry Date
-   Status
-   Attachment
-   Approved By
-   Notes

Status:

``` text
PENDING
APPROVED
EXPIRED
REJECTED
NOT_REQUIRED
```

------------------------------------------------------------------------

# 25. JOB CHECKLIST

Sebelum job dimulai:

``` text
[ ] WO tersedia
[ ] Manpower tersedia
[ ] Tool tersedia
[ ] Permit tersedia
[ ] JSA tersedia
[ ] APD tersedia
[ ] Toolbox Meeting
[ ] Area siap
[ ] Material tersedia
```

Job dapat berubah menjadi READY apabila checklist wajib terpenuhi.

------------------------------------------------------------------------

# 26. JOB EXECUTION

Flow:

``` text
PLANNED
 ↓
READY
 ↓
START JOB
 ↓
IN_PROGRESS
 ↓
UPDATE PROGRESS
 ↓
COMPLETE
```

Data execution:

-   Start Time
-   End Time
-   Actual Manpower
-   Actual Tools
-   Progress
-   Issue
-   Safety Issue
-   Photo
-   Notes

------------------------------------------------------------------------

# 27. DAILY JOB REPORT

Setiap Job dapat memiliki Daily Report.

Field:

-   Job
-   Date
-   Work Progress
-   Actual Work
-   Manpower
-   Tools
-   Material
-   Problem
-   Safety Issue
-   Before Photo
-   Progress Photo
-   After Photo
-   Notes

Progress dapat berupa:

``` text
0%
25%
50%
75%
100%
```

atau angka custom 0-100%.

------------------------------------------------------------------------

# 28. JOB CALENDAR / MONTHLY PLANNING

Sistem menyediakan:

-   Today
-   7 Days
-   14 Days
-   30 Days
-   Monthly Calendar

Contoh:

``` text
MON       TUE       WED       THU       FRI
------------------------------------------------
WO-001    WO-002    WO-003
          WO-004
WO-005              WO-006
```

Supervisor dapat mengetahui pekerjaan yang:

-   Sudah direncanakan
-   Sedang berjalan
-   Akan datang
-   Terlambat
-   Selesai

------------------------------------------------------------------------

# 29. JOB DASHBOARD

## Today

``` text
TOTAL JOB       12
COMPLETED        5
IN PROGRESS      4
PENDING          2
PROBLEM          1
```

## Manpower

``` text
TOTAL MANPOWER
18
```

## Tools

``` text
REQUIRED TOOLS
34

AVAILABLE
25

RESERVED
7

CONFLICT
2
```

## Permit

``` text
VALID       10
PENDING      2
EXPIRED      1
```

------------------------------------------------------------------------

# 30. NOTIFICATION

MVP:

-   In-app notification

Future:

-   Email
-   WhatsApp
-   Push Notification

Trigger:

-   Certificate expiry
-   Overdue borrowing
-   Job reminder
-   Permit expiry
-   Tool conflict
-   Job assignment
-   Approval request

------------------------------------------------------------------------

# 31. REPORTS

## People Report

-   Employee
-   Skill
-   Certificate
-   Grade
-   Development
-   Violation

## Certificate Report

-   Valid
-   Expiring
-   Expired

## Inventory Report

-   Available
-   Borrowed
-   Maintenance
-   Damaged
-   Lost

## Borrowing Report

-   User
-   Item
-   Date
-   Return
-   Overdue

## Job Report

-   WO
-   Job
-   Plant
-   Manpower
-   Tools
-   Progress
-   Status

## Safety Report

-   APD violation
-   Safety violation
-   Disciplinary

Export:

-   Excel
-   CSV
-   PDF

------------------------------------------------------------------------

# 32. AUDIT TRAIL

Audit record:

-   User
-   Action
-   Module
-   Record ID
-   Old Value
-   New Value
-   Timestamp
-   Session/IP information where appropriate

Contoh:

``` text
11/08/2026 14:25
Andi
BORROW ITEM
Multimeter
BRW-20260811-0001
```

------------------------------------------------------------------------

# 33. UNIVERSAL QR IDENTITY

Sistem menggunakan beberapa jenis QR.

## 33.1 Employee QR

``` text
EMP-S1504
```

Untuk:

-   Employee Profile
-   Skill
-   Certificate
-   Development
-   Violation
-   Job History

## 33.2 Asset QR

``` text
AST-000123
```

Untuk:

-   Inventory
-   Status
-   Borrowing
-   Return
-   Maintenance
-   History

## 33.3 Job QR

``` text
JOB-2026-00125
```

Untuk:

-   WO
-   Job detail
-   Manpower
-   Tools
-   Permit
-   Checklist
-   Progress
-   Daily Report

------------------------------------------------------------------------

# 34. DATABASE REQUIREMENTS

Supabase PostgreSQL.

Recommended tables:

``` text
profiles
roles
departments

employees
employee_skills
skills
employee_certificates
certificate_types
employee_developments
employee_violations

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

work_orders
jobs
job_manpower
job_requirements
job_tools
job_permits
job_checklists
job_progress
job_daily_reports

notifications
audit_logs
```

------------------------------------------------------------------------

# 35. ITEM VS ITEM UNIT

Untuk barang yang dapat dilacak per unit:

``` text
Item
  |
  +-- Item Unit
```

Contoh:

``` text
Item:
Multimeter

Units:
MT-001
MT-002
MT-003
MT-004
```

Setiap unit dapat memiliki QR Code sendiri.

Ini direkomendasikan untuk:

-   Tool
-   Equipment
-   Machine
-   Asset
-   Barang berserial number

------------------------------------------------------------------------

# 36. SUPABASE REQUIREMENTS

Supabase digunakan untuk:

-   PostgreSQL
-   Authentication
-   Storage
-   Row Level Security
-   Realtime bila diperlukan

Storage untuk:

-   Foto personel
-   Foto barang
-   Sertifikat
-   Permit
-   Foto pekerjaan
-   Foto pelanggaran
-   Dokumentasi maintenance

RLS harus diterapkan sesuai role.

------------------------------------------------------------------------

# 37. VERCEL REQUIREMENTS

Deployment menggunakan Vercel.

Environment variables minimal:

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Jika server-side membutuhkan service role:

``` env
SUPABASE_SERVICE_ROLE_KEY=
```

Service role key tidak boleh exposed ke browser.

------------------------------------------------------------------------

# 38. RECOMMENDED TECH STACK

Frontend:

-   Next.js
-   TypeScript
-   Tailwind CSS

Backend:

-   Supabase

Database:

-   PostgreSQL

Authentication:

-   Supabase Auth

Storage:

-   Supabase Storage

Deployment:

-   Vercel

QR:

-   Browser Camera API / QR Scanner Library

Reporting:

-   XLSX / CSV
-   PDF

------------------------------------------------------------------------

# 39. SECURITY REQUIREMENTS

Minimum:

-   Authentication
-   Authorization
-   RLS
-   Input validation
-   Server-side validation
-   Secure session
-   Audit trail
-   File access control
-   Service role protection

Data sensitif seperti NIK harus dibatasi berdasarkan authorization.

QR personel juga harus memiliki aturan akses yang jelas. Tidak semua
data personal harus terbuka untuk publik hanya karena QR dapat dipindai.

------------------------------------------------------------------------

# 40. BUSINESS RULES

## Employee

1.  Employee ID harus unik.
2.  Employee nonaktif tidak dapat ditugaskan ke Job baru.
3.  Employee dapat memiliki banyak skill.
4.  Employee dapat memiliki banyak certificate.
5.  Certificate memiliki masa berlaku.

## Inventory

1.  Item Code unik.
2.  QR identifier unik.
3.  Item yang borrowed tidak dapat dipinjam lagi.
4.  Item maintenance tidak dapat dipinjam.
5.  Item inactive tidak dapat digunakan.

## Borrowing

1.  User harus aktif.
2.  Quantity tidak boleh melebihi availability.
3.  Return tidak boleh melebihi outstanding quantity.
4.  Transaksi yang telah selesai tidak boleh diubah tanpa audit.

## Job

1.  Job memiliki WO.
2.  Job dapat memiliki banyak manpower.
3.  Job dapat memiliki banyak tools.
4.  Job dapat memiliki permit.
5.  Job dapat memiliki checklist.
6.  Job dapat memiliki daily report.
7.  Job dapat memiliki requirement skill/certificate.

## Qualification

1.  Sistem dapat memberi warning jika skill tidak sesuai.
2.  Sistem dapat memberi warning jika certificate expired.
3.  Approval dapat diwajibkan untuk pekerjaan tertentu.

------------------------------------------------------------------------

# 41. FUNCTIONAL REQUIREMENTS

## FR-001 Authentication

Login dengan username/employee ID dan password.

## FR-002 Employee Management

CRUD employee dan profile.

## FR-003 Employee QR

Generate, print, scan.

## FR-004 Skill

CRUD skill dan assignment ke employee.

## FR-005 Certificate

CRUD certificate, upload file, expiry tracking.

## FR-006 Development

CRUD development plan.

## FR-007 Violation

CRUD violation dan attachment.

## FR-008 Inventory

CRUD item, category, location.

## FR-009 Asset QR

Generate, print, scan.

## FR-010 Borrowing

Borrow dan multi-item borrowing.

## FR-011 Return

Return dan partial return.

## FR-012 Stock Opname

Scan dan compare physical/system quantity.

## FR-013 Maintenance

Maintenance tracking.

## FR-014 Work Order

Create/manage WO.

## FR-015 Job

Create/manage Job.

## FR-016 Job Calendar

Today, 7, 14, 30 days, monthly.

## FR-017 Manpower

Assign manpower.

## FR-018 Qualification

Check skill/certificate.

## FR-019 Tool Planning

Select/reserve inventory tool.

## FR-020 Permit

Upload/manage permit.

## FR-021 Checklist

Pre-job checklist.

## FR-022 Execution

Start, progress, complete.

## FR-023 Daily Report

Daily progress/report.

## FR-024 Dashboard

Monitoring.

## FR-025 Report

Export report.

## FR-026 Audit

Track changes.

------------------------------------------------------------------------

# 42. USER FLOW

## 42.1 Scan Employee

``` text
Open Scanner
 ↓
Scan Employee QR
 ↓
Employee Found
 ↓
Profile
 ↓
Skill / Certificate / Development / Violation / Job History
```

## 42.2 Borrow Tool

``` text
Open Scanner
 ↓
Scan Asset QR
 ↓
Item Detail
 ↓
Available?
 ↓
Borrow
 ↓
Purpose
 ↓
Expected Return
 ↓
Confirm
```

## 42.3 Create Job

``` text
Create Job
 ↓
WO
 ↓
Plant / Area
 ↓
Job Title
 ↓
Schedule
 ↓
Manpower
 ↓
Skill Requirement
 ↓
Tools
 ↓
Permit
 ↓
Checklist
 ↓
Save
```

## 42.4 Execute Job

``` text
READY
 ↓
START
 ↓
IN PROGRESS
 ↓
Daily Update
 ↓
Progress
 ↓
Photo
 ↓
Complete
```

------------------------------------------------------------------------

# 43. MOBILE-FIRST UX

Prioritas Team Mechanical:

``` text
HOME
 |
 +-- SCAN QR
 +-- MY JOB
 +-- MY TOOLS
 +-- MY HISTORY
```

Scan QR menjadi fungsi utama.

Target flow:

``` text
Login
 ↓
Scan
 ↓
Context
 ↓
Action
```

Semaksimal mungkin mengurangi input manual.

------------------------------------------------------------------------

# 44. ACCEPTANCE CRITERIA

## Employee QR

-   [ ] QR dapat dibuat.
-   [ ] QR unik.
-   [ ] QR dapat dipindai.
-   [ ] Profil benar.
-   [ ] Foto tampil.
-   [ ] Skill tampil.
-   [ ] Certificate tampil.
-   [ ] Development tampil.
-   [ ] Violation tampil sesuai permission.

## Certificate

-   [ ] File dapat diupload.
-   [ ] Expiry date tersimpan.
-   [ ] Status otomatis.
-   [ ] Expiring warning.
-   [ ] Expired warning.

## Inventory

-   [ ] Item dapat dibuat.
-   [ ] QR dapat dibuat.
-   [ ] Scan bekerja.
-   [ ] Borrow bekerja.
-   [ ] Return bekerja.
-   [ ] History tersimpan.

## Job

-   [ ] WO dapat dibuat.
-   [ ] Job dapat dibuat.
-   [ ] Calendar bekerja.
-   [ ] Manpower dapat ditugaskan.
-   [ ] Qualification dapat dicek.
-   [ ] Tool dapat dipilih dari inventory.
-   [ ] Permit dapat diupload.
-   [ ] Checklist tersedia.
-   [ ] Progress dapat diupdate.
-   [ ] Daily report dapat dibuat.
-   [ ] Job dapat diselesaikan.

------------------------------------------------------------------------

# 45. MVP

## Phase 1

### Authentication

-   Login
-   Role

### People

-   Employee
-   Employee QR
-   Skill
-   Certificate
-   Development
-   Violation

### Inventory

-   Item
-   QR
-   Borrow
-   Return
-   History

### Job

-   WO
-   Job
-   Calendar
-   Manpower
-   Tool
-   Basic checklist
-   Basic progress

### Dashboard

-   People
-   Inventory
-   Job

------------------------------------------------------------------------

# 46. PHASE 2

-   Stock Opname
-   Maintenance
-   Advanced qualification
-   Certificate reminder
-   Permit management
-   Advanced checklist
-   Daily Job Report
-   Photo documentation
-   Advanced reports
-   Audit trail
-   Tool reservation

------------------------------------------------------------------------

# 47. PHASE 3

-   WhatsApp notification
-   Push notification
-   PWA
-   Offline support
-   Multi-location
-   Advanced analytics
-   Asset lifecycle
-   Advanced manpower planning
-   Predictive maintenance
-   Management dashboard

------------------------------------------------------------------------

# 48. SUCCESS METRICS

## People

-   Seluruh anggota memiliki profile.
-   Seluruh anggota memiliki QR.
-   Skill terdokumentasi.
-   Certificate terdokumentasi.
-   Certificate expired dapat diketahui.

## Inventory

-   Barang teridentifikasi.
-   Peminjaman tercatat.
-   Pengembalian tercatat.
-   Posisi tool dapat diketahui.

## Job

-   WO tercatat.
-   Job planning tersedia.
-   Manpower dapat dimonitor.
-   Tool dapat dimonitor.
-   Permit dapat dimonitor.
-   Progress dapat dimonitor.

------------------------------------------------------------------------

# 49. DEFINITION OF DONE

Feature dianggap selesai apabila:

-   Requirement terpenuhi.
-   UI responsive.
-   Mobile test berhasil.
-   Desktop test berhasil.
-   Validation berjalan.
-   Authorization berjalan.
-   RLS diuji.
-   Error handling tersedia.
-   Audit tersedia untuk transaksi penting.
-   Acceptance criteria terpenuhi.
-   Tidak ada critical bug.

------------------------------------------------------------------------

# 50. CHANGE REQUEST / CR

Jika sistem Inventory v1.0 telah selesai dan user meminta:

-   Employee QR
-   Employee profile
-   Certificate
-   Development
-   Violation
-   Job Monitoring
-   WO
-   Manpower
-   Tool integration
-   Permit
-   Job planning

maka perubahan tersebut dicatat sebagai:

``` text
CR-001
Employee & People Management

CR-002
Competency & Certificate

CR-003
Development & Violation

CR-004
Job Planning & Monitoring

CR-005
Job–Inventory Integration
```

Jangan langsung mengubah requirement awal tanpa dokumentasi.

Setiap CR harus menjelaskan:

-   Request
-   Reason
-   Scope
-   Impact
-   Database impact
-   UI impact
-   Security impact
-   Estimated effort
-   Priority
-   Acceptance criteria
-   Approval

------------------------------------------------------------------------

# 51. ARCHITECTURE

``` text
                    USERS
                      |
          +-----------+-----------+
          |           |           |
       Admin      Mechanic    Supervisor
          |           |           |
          +-----------+-----------+
                      |
                 VERCEL
                      |
              NEXT.JS APPLICATION
                      |
                 SUPABASE
       +--------------+--------------+
       |              |              |
   PostgreSQL       Auth          Storage
       |                             |
       |                       Photos / Files
       |
       +-- People
       +-- Skills
       +-- Certificate
       +-- Development
       +-- Violation
       +-- Inventory
       +-- Borrowing
       +-- Return
       +-- Job
       +-- Manpower
       +-- Tools
       +-- Permit
       +-- Reports
```

------------------------------------------------------------------------

# 52. CORE DATA RELATIONSHIP

``` text
EMPLOYEE
 |
 +-- EMPLOYEE_SKILLS -- SKILLS
 |
 +-- EMPLOYEE_CERTIFICATES
 |
 +-- EMPLOYEE_DEVELOPMENTS
 |
 +-- EMPLOYEE_VIOLATIONS
 |
 +-- JOB_MANPOWER -- JOB
                         |
                         +-- JOB_TOOLS -- INVENTORY
                         |
                         +-- JOB_PERMITS
                         |
                         +-- JOB_CHECKLIST
                         |
                         +-- JOB_PROGRESS
                         |
                         +-- JOB_DAILY_REPORT

INVENTORY
 |
 +-- BORROWING_ITEMS -- BORROWING -- EMPLOYEE
 |
 +-- MAINTENANCE
 |
 +-- STOCK_OPNAME_ITEMS
```

------------------------------------------------------------------------

# 53. RECOMMENDED IMPLEMENTATION ORDER

``` text
1. Database foundation
        ↓
2. Authentication & roles
        ↓
3. Employee
        ↓
4. Employee QR
        ↓
5. Skill
        ↓
6. Certificate
        ↓
7. Development
        ↓
8. Violation
        ↓
9. Inventory
        ↓
10. Asset QR
        ↓
11. Borrowing
        ↓
12. Return
        ↓
13. Work Order
        ↓
14. Job
        ↓
15. Manpower
        ↓
16. Qualification
        ↓
17. Job Tools
        ↓
18. Permit
        ↓
19. Checklist
        ↓
20. Job Execution
        ↓
21. Daily Report
        ↓
22. Calendar
        ↓
23. Dashboard
        ↓
24. Reports
        ↓
25. Audit
```

------------------------------------------------------------------------

# 54. IMPORTANT DESIGN PRINCIPLE

Sistem tidak boleh membuat data yang sama di banyak tempat.

Contoh:

Tool **Multimeter MT-001** hanya memiliki satu master inventory.

Jika digunakan pada Job:

``` text
JOB
 ↓
JOB_TOOL
 ↓
ITEM_UNIT MT-001
```

Jika dipinjam:

``` text
BORROWING
 ↓
ITEM_UNIT MT-001
```

Dengan demikian status dan histori tetap konsisten.

Hal yang sama berlaku untuk employee:

``` text
EMPLOYEE
 ↓
JOB_MANPOWER
```

Bukan membuat data personel baru di setiap Job.

------------------------------------------------------------------------

# 55. RECOMMENDED FINAL PRODUCT

Jika seluruh modul di atas dikembangkan, produk sudah tidak tepat
disebut hanya:

> "Inventory System"

Nama/konsep produk yang lebih sesuai:

# MECHANICAL OPERATIONS MANAGEMENT SYSTEM

Dengan modul:

``` text
PEOPLE MANAGEMENT
+
COMPETENCY MANAGEMENT
+
CERTIFICATE MANAGEMENT
+
DEVELOPMENT MANAGEMENT
+
SAFETY / DISCIPLINARY
+
INVENTORY MANAGEMENT
+
TOOL MANAGEMENT
+
WORK ORDER MANAGEMENT
+
JOB PLANNING
+
MANPOWER PLANNING
+
JOB MONITORING
+
WORK PERMIT
+
REPORTING
```

------------------------------------------------------------------------

# 56. FINAL APPROVAL

**Project:** Mechanical Operations Management System

**Document Version:** 2.0

**Prepared By:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Reviewed By:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Client:**
\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Date:**
\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Status:**

-   [ ] Draft
-   [ ] Review
-   [ ] Approved
-   [ ] Revision Required

## Client Notes

``` text

____________________________________________________

____________________________________________________

____________________________________________________
```

## Approval

Client:

Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Signature: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Project Team:

Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Signature: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
