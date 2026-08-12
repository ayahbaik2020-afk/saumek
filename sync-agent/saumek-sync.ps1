#requires -Version 5.1
<#
  SAUMEK Sync Agent - Sinkronisasi Work Order SIMIP (MIPRO/SQL Server) -> Supabase
  --------------------------------------------------------------------------------
  Jalan dari PC di DALAM jaringan Sulfindo (mis. 192.168.20.17, 192.168.50.119).
  Web app (saumek.vercel.app) tetap di Vercel; agent ini hanya menyalin data WO
  dari tabel MIP_WORKORDER ke tabel external_work_orders (Supabase).

  Penggunaan:
    sync.bat                         -> sinkronisasi penuh (double-click)
    saumek-sync.ps1 -TestConnection  -> cek koneksi SQL & Supabase saja
    saumek-sync.ps1 -DryRun          -> baca+map tanpa menulis ke Supabase
    saumek-sync.ps1 -Limit 10        -> batasi jumlah WO yang dibaca

  Konfigurasi pertama kali diminta lewat prompt dan disimpan di config.json
  (di folder yang sama). Password SQL dienkripsi (DPAPI user saat ini).

  CATATAN: hanya berfungsi jika PC terhubung ke jaringan Sulfindo (kantor/VPN)
  sehingga dapat menjangkau server SQL. Di luar jaringan itu akan gagal.
#>
param(
    [switch]$TestConnection,
    [switch]$DryRun,
    [int]$Limit = 0
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir 'config.json'
$ChunkSize = 100

$StatusMap = @{
    'APPREQ'  = 'OPEN'
    'PREAP'   = 'OPEN'
    'PREAP1'  = 'OPEN'
    'PREAP2'  = 'OPEN'
    'WAPPR'   = 'OPEN'
    'APPR'    = 'PLANNED'
    'WSCH'    = 'PLANNED'
    'WMATL'   = 'PLANNED'
    'PRWMATL' = 'PLANNED'
    'WPCOND'  = 'PLANNED'
    'INPRG'   = 'IN_PROGRESS'
    'WCOMP'   = 'COMPLETED'
    'COMP'    = 'COMPLETED'
    'CAN'     = 'CANCELLED'
    'CLOSE'   = 'COMPLETED'
}

$PriorityMap = @{
    '1' = 'URGENT'; '2' = 'URGENT'
    '3' = 'HIGH';   '4' = 'HIGH'
    '5' = 'NORMAL'; '6' = 'NORMAL'
    '7' = 'LOW';    '8' = 'LOW'; '9' = 'LOW'
}

function Write-Step([string]$msg) { Write-Host $msg -ForegroundColor Cyan }
function Write-Ok([string]$msg)   { Write-Host $msg -ForegroundColor Green }
function Write-Err([string]$msg)  { Write-Host $msg -ForegroundColor Red }
function Write-Warn([string]$msg) { Write-Host $msg -ForegroundColor Yellow }

function Read-Config {
    if (Test-Path -LiteralPath $ConfigPath) {
        return Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
    }
    Write-Step '=== KONFIGURASI AWAL SAUMEK SYNC AGENT ==='
    $server   = Read-Host 'Server SQL SIMIP [192.168.20.10]'
    if (-not $server) { $server = '192.168.20.10' }
    $db       = Read-Host 'Database SIMIP [SAUSIMIP]'
    if (-not $db) { $db = 'SAUSIMIP' }
    $portTxt  = Read-Host 'Port SQL [1433]'
    if (-not $portTxt) { $portTxt = '1433' }
    $user     = Read-Host 'User SIMIP (mis. hebron.s)'
    $secure   = Read-Host 'Password SIMIP' -AsSecureString
    if ($secure.Length -eq 0) { throw 'Password SIMIP wajib diisi.' }
    $url      = Read-Host 'Supabase URL (NEXT_PUBLIC_SUPABASE_URL)'
    $key      = Read-Host 'Supabase Service Role Key'
    if (-not $url -or -not $key) { throw 'Supabase URL dan Service Role Key wajib diisi.' }

    $encPw = $secure | ConvertFrom-SecureString
    $config = [ordered]@{
        sqlServer     = $server
        sqlDatabase   = $db
        sqlPort       = [int]$portTxt
        sqlUser       = $user
        sqlPasswordEnc = $encPw
        supabaseUrl   = $url.TrimEnd('/')
        supabaseKey   = $key
        sourceSystem  = 'SAUSIMIP'
    }
    $config | ConvertTo-Json | Set-Content -LiteralPath $ConfigPath -Encoding UTF8
    Write-Ok "Konfigurasi disimpan di: $ConfigPath"
    Write-Warn 'Jangan bagikan config.json - berisi akses SQL & Supabase.'
    return $config
}

function Get-SqlPassword($config) {
    $secure = ConvertTo-SecureString $config.sqlPasswordEnc
    return [System.Net.NetworkCredential]::new('', $secure).Password
}

function Get-Value($row, [string]$col) {
    if ([string]::IsNullOrEmpty($col) -or $col -eq 'TBD') { return $null }
    $v = $row[$col]
    if ($null -eq $v -or $v -is [System.DBNull]) { return $null }
    if ($v -is [System.DateTime]) {
        return ([System.DateTime]::SpecifyKind($v, [System.DateTimeKind]::Utc)).ToString('o')
    }
    return $v
}

function Connect-Sql($config, $password) {
    $csb = "Server=$($config.sqlServer),$($config.sqlPort);Database=$($config.sqlDatabase);User Id=$($config.sqlUser);Password=$password;Encrypt=False;TrustServerCertificate=True;Connection Timeout=15;"
    $conn = New-Object System.Data.SqlClient.SqlConnection($csb)
    $conn.Open()
    return $conn
}

function Get-WorkOrders($config, $password, $limit) {
    $conn = $null
    try {
        $conn = Connect-Sql $config $password
        $cmd = $conn.CreateCommand()
        $cmd.CommandTimeout = 180
        $where = "WOPM1 LIKE 'M%' AND STATUS NOT IN ('CAN','CLOSE')"
        $sql = "SELECT * FROM [MIP_WORKORDER] WHERE $where"
        if ($limit -gt 0) { $sql = "SELECT TOP $limit * FROM [MIP_WORKORDER] WHERE $where" }
        $cmd.CommandText = $sql
        $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
        $dt = New-Object System.Data.DataTable
        [void]$adapter.Fill($dt)
        return , $dt
    }
    finally {
        if ($conn) { $conn.Close() }
    }
}

function New-SupabaseHeaders($config) {
    return @{
        'apikey'        = $config.supabaseKey
        'Authorization' = 'Bearer ' + $config.supabaseKey
        'Content-Type'  = 'application/json'
    }
}

function New-SyncLog($config) {
    $headers = New-SupabaseHeaders $config
    $headers['Prefer'] = 'return=representation'
    $body = @{ status = 'RUNNING'; started_at = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json
    $res = Invoke-RestMethod -Method Post -Uri "$($config.supabaseUrl)/rest/v1/wo_sync_logs" -Headers $headers -Body $body
    return $res[0].id
}

function Update-SyncLog($config, $id, $payload) {
    $headers = New-SupabaseHeaders $config
    $headers['Prefer'] = 'return=minimal'
    $uri = "$($config.supabaseUrl)/rest/v1/wo_sync_logs?id=eq.$id"
    Invoke-RestMethod -Method Patch -Uri $uri -Headers $headers -Body ($payload | ConvertTo-Json) | Out-Null
}

function ConvertTo-WoItem($dt, $row, $config) {
    $raw = [ordered]@{}
    foreach ($c in $dt.Columns) {
        $cv = $row[$c.ColumnName]
        if ($cv -is [System.DBNull]) { $raw[$c.ColumnName] = $null }
        elseif ($cv -is [System.DateTime]) { $raw[$c.ColumnName] = ([System.DateTime]::SpecifyKind($cv, [System.DateTimeKind]::Utc)).ToString('o') }
        else { $raw[$c.ColumnName] = $cv }
    }

    $woNum = [string](Get-Value $row 'WONUM')
    if (-not $woNum) { throw 'Baris tanpa WONUM' }

    $rawStatus = [string](Get-Value $row 'STATUS')
    $mappedStatus = $StatusMap[$rawStatus]
    if (-not $mappedStatus) { $mappedStatus = $rawStatus }

    $rawPriority = Get-Value $row 'WOPRIORITY'
    $mappedPriority = $PriorityMap["$rawPriority"]
    if (-not $mappedPriority) { $mappedPriority = $rawPriority }

    $item = [ordered]@{
        source_system      = $config.sourceSystem
        external_wo_id     = $woNum
        wo_number          = $woNum
        title              = Get-Value $row 'DESCRIPTION'
        description        = Get-Value $row 'DESCRIPTION'
        area               = Get-Value $row 'WOPM1'
        location           = Get-Value $row 'LOCATION'
        equipment          = Get-Value $row 'EQNUM'
        wo_type            = Get-Value $row 'WORKTYPE'
        priority           = $mappedPriority
        external_status    = $mappedStatus
        requested_at       = Get-Value $row 'REPORTDATE'
        planned_start      = Get-Value $row 'TARGSTARTDATE'
        planned_finish     = Get-Value $row 'TARGCOMPDATE'
        actual_start       = Get-Value $row 'ACTSTART'
        actual_finish      = Get-Value $row 'ACTFINISH'
        external_updated_at = Get-Value $row 'CHANGEDATE'
        synced_at          = (Get-Date).ToUniversalTime().ToString('o')
        raw_data           = $raw
    }
    return $item
}

function Test-Supabase($config) {
    $headers = New-SupabaseHeaders $config
    try {
        Invoke-RestMethod -Method Head -Uri "$($config.supabaseUrl)/rest/v1/" -Headers $headers -TimeoutSec 15 | Out-Null
        return $true
    } catch {
        return $false
    }
}

# ============================ MAIN ============================

$config = Read-Config
$password = Get-SqlPassword $config
$logId = $null
$stats = @{ read = 0; inserted = 0; updated = 0; failed = 0 }

try {
    if ($TestConnection) {
        Write-Step 'Cek koneksi SQL...'
        try {
            $conn = Connect-Sql $config $password
            $conn.Close()
            Write-Ok "SQL OK: $($config.sqlServer),$($config.sqlPort)/$($config.sqlDatabase)"
        } catch {
            Write-Err "SQL GAGAL: $($_.Exception.Message)"
            Write-Warn 'Pastikan PC di dalam jaringan Sulfindo (kantor/VPN) dan server SQL aktif.'
        }
        Write-Step 'Cek koneksi Supabase...'
        if (Test-Supabase $config) { Write-Ok "Supabase OK: $($config.supabaseUrl)" }
        else { Write-Err 'Supabase GAGAL: cek URL / Service Role Key.' }
        return
    }

    Write-Step 'Baca WO dari SIMIP...'
    $dt = Get-WorkOrders $config $password $Limit
    $stats.read = $dt.Rows.Count
    Write-Ok "WO dibaca: $($stats.read)"

    $items = New-Object System.Collections.Generic.List[object]
    foreach ($row in $dt.Rows) {
        try {
            $items.Add((ConvertTo-WoItem $dt $row $config))
        } catch {
            $stats.failed++
        }
    }

    if ($DryRun) {
        Write-Warn '[DRY-RUN] Tidak menulis ke Supabase.'
        $samples = @()
        foreach ($s in ($items | Select-Object -First 5)) {
            $samples += "  $($s.wo_number) | $($s.external_status) | $($s.priority) | $($s.area)"
        }
        Write-Host ($samples -join "`n")
        Write-Ok "Selesai [DRY-RUN] read=$($stats.read) mapped=$($items.Count) fail=$($stats.failed)"
        return
    }

    $logId = New-SyncLog $config
    Write-Step 'Upsert ke Supabase...'

    $inserted = 0
    $updated = 0
    for ($i = 0; $i -lt $items.Count; $i += $ChunkSize) {
        $chunk = @($items[$i..([Math]::Min($i + $ChunkSize - 1, $items.Count - 1))])

        try {
            $headers = New-SupabaseHeaders $config
            $headers['Prefer'] = 'resolution=merge-duplicates,return=minimal'

            $nums = $chunk | ForEach-Object { '"' + $_.wo_number + '"' }
            $lookupUri = "$($config.supabaseUrl)/rest/v1/external_work_orders?select=wo_number&source_system=eq.$($config.sourceSystem)&wo_number=in.($($nums -join ','))"
            $existing = Invoke-RestMethod -Method Get -Uri $lookupUri -Headers $headers
            $existingSet = @{}
            foreach ($e in $existing) { $existingSet[[string]$e.wo_number] = $true }

            $body = $chunk | ConvertTo-Json -Depth 8
            $upsertUri = "$($config.supabaseUrl)/rest/v1/external_work_orders?on_conflict=source_system,wo_number"
            Invoke-RestMethod -Method Post -Uri $upsertUri -Headers $headers -Body $body | Out-Null

            foreach ($c in $chunk) {
                if ($existingSet.ContainsKey([string]$c.wo_number)) { $updated++ } else { $inserted++ }
            }
        } catch {
            $stats.failed += $chunk.Count
            Write-Err "Chunk gagal ($($chunk[0].wo_number)..): $($_.Exception.Message)"
        }
        Write-Host "  progress: $([Math]::Min($i + $ChunkSize, $items.Count))/$($items.Count)"
    }

    $stats.inserted = $inserted
    $stats.updated = $updated
    $finalStatus = if ($stats.failed -gt 0 -and $inserted + $updated -gt 0) { 'PARTIAL' } elseif ($stats.failed -gt 0) { 'FAILED' } else { 'SUCCESS' }

    Update-SyncLog $config $logId @{
        status          = $finalStatus
        finished_at     = (Get-Date).ToUniversalTime().ToString('o')
        total_read      = $stats.read
        total_inserted  = $stats.inserted
        total_updated   = $stats.updated
        total_failed    = $stats.failed
    }

    Write-Ok "Selesai [$finalStatus] read=$($stats.read) insert=$($stats.inserted) update=$($stats.updated) fail=$($stats.failed)"
} catch {
    $msg = $_.Exception.Message
    if ($logId) {
        try {
            Update-SyncLog $config $logId @{
                status        = 'FAILED'
                finished_at   = (Get-Date).ToUniversalTime().ToString('o')
                total_read    = $stats.read
                total_failed  = $stats.failed
                error_message = $msg
            }
        } catch { Write-Err "Gagal menulis log: $($_.Exception.Message)" }
    }
    Write-Err "ERROR: $msg"
    if ($msg -match 'network|timeout|time out|Unable to connect|Name or service|No such host') {
        Write-Warn 'Kemungkinan PC berada DI LUAR jaringan Sulfindo, atau server SQL 192.168.20.10 tidak aktif.'
        Write-Warn 'Sync hanya berfungsi dari dalam jaringan Sulfindo (kantor/VPN).'
    }
    exit 1
}
