# WO INTEGRATION REQUIREMENT

## Integrasi Work Order MIPRO / SAUSIMIP ke Mechanical Operations Management System

**Versi:** 1.0\
**Status:** Draft / Technical Review\
**Source System:** MIPRO / SAUSIMIP\
**Target System:** Mechanical Operations Management System\
**Source Database:** Microsoft SQL Server\
**Target Database:** Supabase PostgreSQL\
**Deployment Target:** Vercel\
**Integration Direction:** SAUSIMIP → Supabase

------------------------------------------------------------------------

# 1. LATAR BELAKANG

Sistem Mechanical Operations Management akan digunakan untuk mengelola:

-   People / Employee
-   Skill & Competency
-   Certificate
-   Development
-   Violation
-   Inventory / Tool
-   Borrowing & Return
-   Job Planning
-   Manpower
-   Work Permit
-   Job Checklist
-   Job Execution
-   Daily Job Report

Karena aplikasi lama MIPRO/SAUSIMIP telah memiliki data Work Order,
aplikasi baru sebaiknya tidak membuat sumber data WO yang terpisah.

Work Order dari SAUSIMIP dijadikan **external source / source of truth**
untuk data WO, kemudian data yang diperlukan disinkronkan ke Supabase.

------------------------------------------------------------------------

# 2. SOURCE SYSTEM

Berdasarkan file konfigurasi `mipro.ini`, aplikasi menggunakan:

``` text
Namespace   : System.Data.SqlClient
DataSource  : 192.168.20.10
Database    : SAUSIMIP
Timeout     : 64000
CommandTimeout: 64000
```

Konfigurasi tersebut menunjukkan koneksi aplikasi ke SQL Server pada:

``` text
192.168.20.10
```

dengan database:

``` text
SAUSIMIP
```

File konfigurasi tidak mencantumkan username/password database secara
eksplisit.

------------------------------------------------------------------------

# 3. INDIKASI MODUL WO PADA APLIKASI MIPRO

Analisis terhadap executable `mipro.exe` menunjukkan adanya komponen
yang berkaitan dengan Work Order dan WO Tracking, antara lain:

``` text
miprowo.pbd
miprowo_status.pbd
miprowo_dw.pbd

w_wotracking.win
w_wotracking_jplan_list.win
w_wotracking_plans_dtl.udo

w_wotracking_actuals.udo
w_wotracking_actuals_dtl.udo
w_wotracking_actuals_lab.udo
w_wotracking_actuals_mat.udo
w_wotracking_actuals_tool.udo

w_woreq.win
w_wo_list.win
w_generate_wo.win
w_approve_wo.win
w_wo_cancel.win
```

Nama komponen tersebut menunjukkan bahwa sistem lama setidaknya memiliki
konsep:

-   Work Order
-   WO Request
-   WO List
-   Generate WO
-   Approve WO
-   Cancel WO
-   WO Tracking
-   Job Plan
-   Actual Labor
-   Actual Material
-   Actual Tool

**Catatan:** nama modul di atas merupakan hasil observasi terhadap
executable dan belum dapat dianggap sebagai nama tabel database SQL
Server.

------------------------------------------------------------------------

# 4. TUJUAN INTEGRASI

Tujuan integrasi:

1.  Mengambil data WO dari SAUSIMIP.
2.  Menyimpan salinan data WO yang diperlukan di Supabase.
3.  Menghindari input ulang nomor WO oleh user.
4.  Mengurangi kesalahan input nomor WO.
5.  Menghubungkan WO dengan Job Monitoring.
6.  Menghubungkan WO dengan manpower.
7.  Menghubungkan WO dengan inventory/tool.
8.  Menghubungkan WO dengan permit.
9.  Menghubungkan WO dengan checklist.
10. Menghubungkan WO dengan progress dan daily report.

------------------------------------------------------------------------

# 5. ARSITEKTUR INTEGRASI

Arsitektur yang direkomendasikan:

``` text
                 MIPRO
                   |
                   v
          SQL SERVER / SAUSIMIP
             192.168.20.10
                   |
                   |
            Internal Network
                   |
                   v
          +-------------------+
          | WO SYNC SERVICE   |
          | / Integration     |
          +---------+---------+
                    |
                    | HTTPS/API
                    v
             +-------------+
             |  SUPABASE   |
             | PostgreSQL  |
             +------+------+
                    |
                    v
             NEXT.JS / VERCEL
                    |
          +---------+----------+
          |                    |
       Supervisor           Mechanic
```

------------------------------------------------------------------------

# 6. PRINSIP SOURCE OF TRUTH

Untuk data WO:

``` text
SAUSIMIP = SOURCE OF TRUTH
```

Sedangkan:

``` text
SUPABASE = INTEGRATED COPY / OPERATIONAL DATA
```

Artinya aplikasi baru tidak boleh mengubah data master WO di SAUSIMIP
tanpa mekanisme integrasi dua arah yang secara khusus disetujui.

Tahap awal menggunakan:

``` text
SAUSIMIP → Supabase
```

------------------------------------------------------------------------

# 7. DATA WO YANG DIREKOMENDASIKAN

Jangan hanya mengambil nomor WO.

Minimal data yang perlu dipetakan:

``` text
WO Number
WO Description
Job Title
Plant
Area
Location
Equipment
WO Type
Priority
Status
Requested Date
Planned Start
Planned Finish
Actual Start
Actual Finish
PIC
Department
```

Jika tersedia di source system:

``` text
Problem
Failure
Long Description
Job Plan
Labor
Material
Tool
Crew
Supervisor
```

**Catatan:** keberadaan field-field tersebut di database belum
diverifikasi. Nama-nama tersebut perlu dikonfirmasi melalui schema
database SAUSIMIP.

------------------------------------------------------------------------

# 8. EXTERNAL WORK ORDER

Buat tabel khusus untuk menyimpan data WO dari sistem eksternal.

Recommended:

``` text
external_work_orders
```

Contoh field:

``` text
id
source_system
external_wo_id
wo_number
title
description
plant
area
location
equipment
wo_type
priority
external_status
requested_at
planned_start
planned_finish
actual_start
actual_finish
external_updated_at
synced_at
raw_data
created_at
updated_at
```

------------------------------------------------------------------------

# 9. INTERNAL JOB

Data WO eksternal kemudian dapat digunakan untuk membuat Job internal.

Relasi:

``` text
external_work_orders
          |
          v
        jobs
```

Contoh:

``` text
External WO
WO-2026-001245
      |
      v
Internal Job
JOB-2026-00087
```

Dengan demikian:

**WO = pekerjaan dari sistem sumber**

**Job = aktivitas operasional/monitoring di sistem baru**

------------------------------------------------------------------------

# 10. WO IMPORT FLOW

User membuka:

``` text
Job Monitoring
```

Kemudian:

``` text
[ IMPORT WO ]
```

Sistem menampilkan WO yang tersedia dari Supabase.

User dapat mencari:

``` text
WO Number
Plant
Area
Equipment
Status
Date
```

Kemudian:

``` text
Select WO
   ↓
Preview
   ↓
Import / Create Job
```

------------------------------------------------------------------------

# 11. CONTOH USER FLOW

``` text
Supervisor Login
       ↓
Job Monitoring
       ↓
Import WO
       ↓
Search WO
       ↓
WO-2026-001245
       ↓
Preview WO
       ↓
Create Job
       ↓
Assign Manpower
       ↓
Assign Tools
       ↓
Permit
       ↓
Checklist
       ↓
Ready
       ↓
Start Job
```

------------------------------------------------------------------------

# 12. JOB MONITORING SETELAH IMPORT

Contoh:

``` text
WO Number:
WO-2026-001245

Plant:
Plant A

Equipment:
P-101

Job Title:
Repair Mechanical Seal

Priority:
High

Status:
Approved
```

Kemudian sistem baru dapat menambahkan:

``` text
Manpower
Tools
Permit
Checklist
Progress
Photos
Daily Report
Issues
```

------------------------------------------------------------------------

# 13. MANPOWER INTEGRATION

WO/Job dapat memiliki manpower.

``` text
JOB
 |
 +-- PIC
 +-- Supervisor
 +-- Manpower
```

Employee diambil dari master People.

Contoh:

``` text
WO-2026-001245

PIC:
Andre Pratama

Manpower:
M. Jamil - Welder
Yudit - Fitter
Sofwatillah - Scaffolder
```

------------------------------------------------------------------------

# 14. QUALIFICATION CHECK

Jika Job mempunyai requirement:

``` text
Welder SMAW 6G
Rigger
TKBT
```

sistem melakukan pengecekan:

``` text
Employee
   |
   +-- Skill
   |
   +-- Certificate
```

Contoh:

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

Jika certificate expired:

``` text
WARNING
Certificate Expired
```

------------------------------------------------------------------------

# 15. TOOL INTEGRATION

Tool tidak dibuat sebagai master baru.

Tool diambil dari Inventory.

``` text
JOB
 |
 +-- JOB_TOOLS
          |
          v
      INVENTORY
```

Contoh:

``` text
WO-2026-001245

Required Tools:
- Welding Machine
- Grinder
- Multimeter
- Torque Wrench
- Chain Block
```

Sistem mengecek:

``` text
AVAILABLE
RESERVED
BORROWED
MAINTENANCE
```

------------------------------------------------------------------------

# 16. TOOL RESERVATION

Jika Job dijadwalkan beberapa hari ke depan:

``` text
Job
 ↓
Required Tool
 ↓
Check Availability
 ↓
Reserve Tool
```

Tujuannya mencegah konflik antar pekerjaan.

Contoh:

``` text
WO-001
Multimeter MT-001
09:00 - 12:00

WO-002
Multimeter MT-001
10:00 - 13:00
```

Sistem memberikan:

``` text
TOOL CONFLICT
```

------------------------------------------------------------------------

# 17. WORK PERMIT

Job dapat mempunyai:

``` text
Work Permit
Hot Work Permit
Working at Height
Confined Space
Lifting
Electrical
Other
```

Field:

``` text
permit_number
permit_type
issue_date
expiry_date
status
attachment
approved_by
notes
```

Status:

``` text
PENDING
APPROVED
EXPIRED
REJECTED
NOT_REQUIRED
```

------------------------------------------------------------------------

# 18. JOB CHECKLIST

Sebelum Job dimulai:

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

Jika checklist wajib belum terpenuhi:

``` text
Job Status:
NOT READY
```

------------------------------------------------------------------------

# 19. JOB EXECUTION

Flow:

``` text
PLANNED
   ↓
READY
   ↓
START
   ↓
IN_PROGRESS
   ↓
UPDATE PROGRESS
   ↓
COMPLETED
```

Data:

``` text
Start Time
End Time
Actual Manpower
Actual Tools
Progress
Issue
Safety Issue
Photo
Notes
```

------------------------------------------------------------------------

# 20. DAILY JOB REPORT

Setiap Job dapat memiliki Daily Report.

Field:

``` text
job_id
report_date
work_progress
actual_work
manpower
tools
material
problem
safety_issue
before_photo
progress_photo
after_photo
notes
created_by
created_at
```

Progress:

``` text
0%
25%
50%
75%
100%
```

------------------------------------------------------------------------

# 21. WO SYNC SERVICE

Disarankan membuat service terpisah.

Nama contoh:

``` text
WO Sync Service
```

Tugas:

1.  Connect ke SQL Server.
2.  Query WO yang diperlukan.
3.  Membaca perubahan.
4.  Transform data.
5.  Upsert ke Supabase.
6.  Menyimpan log.
7.  Menangani error.

------------------------------------------------------------------------

# 22. SYNC FREQUENCY

Pilihan:

``` text
15 menit
30 menit
60 menit
Manual
```

Rekomendasi awal:

``` text
30 menit
```

dan menyediakan:

``` text
[ SYNC NOW ]
```

untuk kebutuhan mendesak.

------------------------------------------------------------------------

# 23. SYNC STRATEGY

Gunakan incremental sync jika memungkinkan.

Contoh:

``` text
WHERE last_updated > last_sync_time
```

Jika database sumber mempunyai field:

``` text
updated_at
last_modified
modified_date
```

maka field tersebut dapat digunakan.

Jika tidak tersedia, perlu ditentukan strategi berdasarkan struktur
tabel sumber.

------------------------------------------------------------------------

# 24. UPSERT STRATEGY

Jangan membuat duplikasi WO.

Gunakan unique key:

``` text
source_system + external_wo_id
```

atau:

``` text
source_system + wo_number
```

Contoh:

``` text
SAUSIMIP | WO-2026-001245
```

Jika sudah ada:

``` text
UPDATE
```

Jika belum:

``` text
INSERT
```

------------------------------------------------------------------------

# 25. SYNC LOG

Buat tabel:

``` text
wo_sync_logs
```

Field:

``` text
id
started_at
finished_at
status
total_read
total_inserted
total_updated
total_skipped
total_failed
error_message
created_at
```

Contoh:

``` text
12 Aug 2026 07:30

Status:
SUCCESS

Read:
120

Inserted:
12

Updated:
4

Skipped:
104

Failed:
0
```

------------------------------------------------------------------------

# 26. SYNC ERROR

Buat tabel:

``` text
wo_sync_errors
```

Field:

``` text
id
sync_log_id
external_wo_id
wo_number
error_type
error_message
raw_data
created_at
```

Tujuan:

-   Debugging
-   Retry
-   Audit
-   Monitoring

------------------------------------------------------------------------

# 27. RAW DATA

Untuk tahap awal, disarankan menyimpan data source dalam bentuk raw JSON
jika memungkinkan.

Field:

``` text
raw_data JSONB
```

Manfaat:

-   Membantu debugging mapping.
-   Memudahkan pemeriksaan field source.
-   Tidak kehilangan data source yang belum dimapping.

Tetap harus memperhatikan keamanan dan data sensitif.

------------------------------------------------------------------------

# 28. DATA MAPPING

Mapping final belum boleh ditentukan sebelum schema SAUSIMIP diperiksa.

Dokumen mapping harus berbentuk:

  ----------------------------------------------------------------------------------------------
  SAUSIMIP    Source      Supabase Table         Target Field    Transformation     Notes
  Table       Field                                                                 
  ----------- ----------- ---------------------- --------------- ------------------ ------------
  TBD         TBD         external_work_orders   wo_number       Direct             Perlu
                                                                                    verifikasi

  TBD         TBD         external_work_orders   title           Direct/Transform   Perlu
                                                                                    verifikasi

  TBD         TBD         external_work_orders   plant           Direct             Perlu
                                                                                    verifikasi

  TBD         TBD         external_work_orders   status          Mapping            Perlu
                                                                                    verifikasi

  TBD         TBD         external_work_orders   planned_start   Date conversion    Perlu
                                                                                    verifikasi
  ----------------------------------------------------------------------------------------------

**Jangan mengisi nama tabel/field SQL Server berdasarkan tebakan.**

------------------------------------------------------------------------

# 29. NETWORK REQUIREMENT

Karena source SQL Server berada pada private IP:

``` text
192.168.20.10
```

Vercel tidak boleh diasumsikan dapat mengakses alamat private tersebut
secara langsung.

Recommended:

``` text
SQL Server
192.168.20.10
      |
      v
Internal Sync Agent
      |
      | HTTPS outbound
      v
Supabase
```

Dengan demikian Sync Agent berada pada jaringan yang dapat mengakses SQL
Server.

------------------------------------------------------------------------

# 30. SECURITY

Credential SQL Server tidak boleh:

-   Ditulis di frontend.
-   Dikirim ke browser.
-   Disimpan di source code.
-   Disimpan di repository Git.

Credential hanya berada di:

``` text
Internal Sync Service
```

dengan environment variable / secure secret storage.

------------------------------------------------------------------------

# 31. SUPABASE SECURITY

Supabase menggunakan:

-   Authentication
-   Row Level Security
-   Storage policies
-   API security

User aplikasi hanya dapat melihat data sesuai role.

------------------------------------------------------------------------

# 32. VERCEL SECURITY

Environment variables:

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Service role:

``` env
SUPABASE_SERVICE_ROLE_KEY=
```

Service role key hanya boleh digunakan server-side.

SQL Server credential tidak perlu berada di Vercel jika Sync Agent
berdiri sendiri.

------------------------------------------------------------------------

# 33. RECOMMENDED TABLES

``` text
external_work_orders
wo_sync_logs
wo_sync_errors

jobs
job_manpower
job_requirements
job_tools
job_permits
job_checklists
job_progress
job_daily_reports
```

------------------------------------------------------------------------

# 34. RELATIONSHIP

``` text
SAUSIMIP
    |
    v
external_work_orders
    |
    v
jobs
    |
    +-- job_manpower
    |       |
    |       v
    |    employees
    |
    +-- job_requirements
    |       |
    |       +-- skills
    |       +-- certificates
    |
    +-- job_tools
    |       |
    |       v
    |    inventory
    |
    +-- job_permits
    |
    +-- job_checklists
    |
    +-- job_progress
    |
    +-- job_daily_reports
```

------------------------------------------------------------------------

# 35. WO STATUS MAPPING

Status SAUSIMIP belum boleh diasumsikan sama dengan status aplikasi
baru.

Buat mapping:

``` text
SAUSIMIP STATUS
      |
      v
STATUS MAPPING
      |
      v
APPLICATION STATUS
```

Contoh konsep:

``` text
SAUSIMIP:
APPROVED

Application:
READY
```

Namun mapping final harus ditentukan setelah nilai status sebenarnya
dari database ditemukan.

------------------------------------------------------------------------

# 36. CONFLICT HANDLING

Jika WO berubah di SAUSIMIP:

``` text
SAUSIMIP
WO-001
Status = Approved
```

kemudian berubah:

``` text
Status = Cancelled
```

Sync harus mendeteksi perubahan.

Jika Job di aplikasi baru sudah berjalan, jangan langsung menghapus Job.

Sistem harus memberikan warning:

``` text
WARNING

External WO status changed to CANCELLED.

Current Job:
IN_PROGRESS
```

Supervisor menentukan tindakan.

------------------------------------------------------------------------

# 37. DELETION POLICY

WO dari source system sebaiknya tidak dihapus permanen dari Supabase.

Gunakan:

``` text
is_active
external_status
deleted_at
```

atau mekanisme soft delete.

Tujuannya menjaga histori.

------------------------------------------------------------------------

# 38. AUDIT

Semua perubahan sinkronisasi dicatat.

Contoh:

``` text
WO-2026-001245

07:30
Imported

09:15
Status updated:
APPROVED → IN_PROGRESS

17:00
Status updated:
IN_PROGRESS → COMPLETED
```

------------------------------------------------------------------------

# 39. DASHBOARD WO

Dashboard:

``` text
TOTAL WO
NEW WO
PLANNED
READY
IN PROGRESS
PENDING
COMPLETED
CANCELLED
OVERDUE
```

Filter:

``` text
Plant
Area
Priority
Status
PIC
Date
```

------------------------------------------------------------------------

# 40. CALENDAR WO

Calendar menampilkan:

``` text
Today
7 Days
14 Days
30 Days
Month
```

Contoh:

``` text
MON
WO-001
WO-002

TUE
WO-003

WED
WO-004
WO-005
```

------------------------------------------------------------------------

# 41. SEARCH WO

Search:

``` text
WO Number
Description
Plant
Area
Equipment
PIC
Status
```

------------------------------------------------------------------------

# 42. RECOMMENDED USER EXPERIENCE

Supervisor:

``` text
Job Monitoring
     |
     +-- WO List
     |
     +-- Calendar
     |
     +-- Import WO
     |
     +-- Sync Status
```

Sync status:

``` text
Last Sync:
12 Aug 2026 07:30

Source:
SAUSIMIP

Status:
CONNECTED

[SYNC NOW]
```

------------------------------------------------------------------------

# 43. ACCEPTANCE CRITERIA

## Connection

-   [ ] Sync Service dapat mengakses SQL Server.
-   [ ] Connection credential tidak exposed.
-   [ ] Connection error tercatat.

## Sync

-   [ ] WO dapat dibaca.
-   [ ] WO baru masuk ke Supabase.
-   [ ] WO lama tidak diduplikasi.
-   [ ] WO yang berubah dapat di-update.
-   [ ] Sync log tersimpan.
-   [ ] Sync error tersimpan.

## Application

-   [ ] User dapat mencari WO.
-   [ ] User dapat melihat detail WO.
-   [ ] User dapat membuat Job dari WO.
-   [ ] Manpower dapat ditambahkan.
-   [ ] Tool dapat ditambahkan.
-   [ ] Permit dapat ditambahkan.
-   [ ] Checklist dapat dibuat.
-   [ ] Progress dapat diupdate.
-   [ ] Daily Report dapat dibuat.

------------------------------------------------------------------------

# 44. MVP INTEGRATION

Tahap pertama:

``` text
SQL Server
   ↓
Sync Service
   ↓
Supabase
   ↓
WO List
   ↓
WO Detail
   ↓
Create Job
```

Field minimum:

``` text
WO Number
Title
Description
Plant
Area
Status
Priority
Planned Start
Planned Finish
```

------------------------------------------------------------------------

# 45. PHASE 2

Tambahkan:

-   Equipment
-   Job Plan
-   Labor
-   Material
-   Tool
-   Crew
-   Supervisor
-   Actual data
-   Advanced status
-   Incremental sync
-   Retry
-   Conflict detection

------------------------------------------------------------------------

# 46. PHASE 3

Jika diperlukan:

-   Two-way integration
-   Update WO ke SAUSIMIP
-   Actual labor integration
-   Actual material integration
-   Actual tool integration
-   Close WO integration
-   Advanced analytics

Two-way integration hanya dilakukan setelah ada persetujuan dan definisi
business process yang jelas.

------------------------------------------------------------------------

# 47. HAL YANG HARUS DIVERIFIKASI SEBELUM CODING

Sebelum membuat Sync Service, wajib mendapatkan:

1.  SQL Server schema.
2.  Daftar database/table.
3.  Table WO.
4.  Primary key WO.
5.  Nomor WO.
6.  Field status.
7.  Field plant.
8.  Field equipment.
9.  Field description.
10. Field date.
11. Field last modified.
12. Relasi WO dengan job plan.
13. Relasi WO dengan labor.
14. Relasi WO dengan material.
15. Relasi WO dengan tool.
16. Relasi WO dengan crew.
17. Relasi WO dengan supervisor.
18. Aturan akses database.
19. Apakah SQL Server dapat diakses oleh Sync Agent.
20. Apakah integrasi hanya satu arah atau membutuhkan dua arah.

------------------------------------------------------------------------

# 48. DATABASE DISCOVERY PLAN

Jangan langsung menebak tabel berdasarkan nama file executable.

Discovery dilakukan:

``` text
SQL Server
   ↓
Database SAUSIMIP
   ↓
List Tables
   ↓
Cari tabel terkait WO
   ↓
Inspect Columns
   ↓
Inspect Primary Keys
   ↓
Inspect Foreign Keys
   ↓
Sample Data
   ↓
Mapping Document
```

Output:

``` text
WO_INTEGRATION_MAPPING.md
```

------------------------------------------------------------------------

# 49. FINAL ARCHITECTURE

``` text
                         MIPRO
                           |
                           v
                    SAUSIMIP SQL SERVER
                      192.168.20.10
                           |
                           |
                    PRIVATE NETWORK
                           |
                           v
                 +--------------------+
                 | INTERNAL SYNC      |
                 | SERVICE            |
                 +---------+----------+
                           |
                         HTTPS
                           |
                           v
                    +-------------+
                    |  SUPABASE   |
                    +------+------+ 
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
       PEOPLE          INVENTORY           JOB
                                           |
                            +--------------+--------------+
                            |              |              |
                         MANPOWER        TOOLS          PERMIT
                            |              |              |
                            v              v              v
                         EMPLOYEE      INVENTORY       DOCUMENT
```

------------------------------------------------------------------------

# 50. KESIMPULAN

Integrasi WO sebaiknya bukan sekadar:

``` text
"Ambil nomor WO"
```

tetapi:

``` text
SAUSIMIP WO
    ↓
External Work Order
    ↓
Internal Job
    ↓
Manpower
    ↓
Qualification
    ↓
Tools / Inventory
    ↓
Permit
    ↓
Checklist
    ↓
Execution
    ↓
Progress
    ↓
Daily Report
    ↓
Completion
```

Dengan pendekatan tersebut, aplikasi baru menjadi layer operasional
untuk Team Mechanical/Maintenance tanpa menghilangkan SAUSIMIP sebagai
sumber data WO.

------------------------------------------------------------------------

# 51. NEXT STEP

Tahap berikutnya **bukan coding**, melainkan:

``` text
1. Akses schema/database SAUSIMIP
2. Identifikasi tabel WO
3. Identifikasi field WO
4. Identifikasi relasi WO
5. Sample data
6. Buat field mapping
7. Tentukan sync strategy
8. Buat Sync Service
9. Test read-only
10. Test Supabase import
11. Test Job creation
```

Setelah langkah tersebut selesai, baru dibuat:

``` text
WO_INTEGRATION_MAPPING.md
```

yang berisi mapping nyata:

``` text
SQL Server Table
        ↓
SQL Server Field
        ↓
Transformation
        ↓
Supabase Table
        ↓
Supabase Field
```

**Catatan penting:** nama tabel dan field SQL Server belum ditentukan
dalam dokumen ini karena file `mipro.ini` hanya menunjukkan koneksi ke
SQL Server/SAUSIMIP, sedangkan nama komponen WO yang ditemukan pada
`mipro.exe` belum membuktikan nama tabel database. Mapping database
harus diverifikasi langsung dari schema SAUSIMIP.
