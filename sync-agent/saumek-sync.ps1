#requires -Version 5.1
<#
  SAUMEK Sync Agent - Sinkronisasi Work Order SIMIP (MIPRO/SQL Server) -> Supabase
  --------------------------------------------------------------------------------
  Jalan dari PC di DALAM jaringan Sulfindo (mis. 192.168.20.17, 192.168.50.119).
  Web app (saumek.vercel.app) tetap di Vercel; agent ini hanya menyalin data WO
  dari tabel MIP_WORKORDER ke tabel external_work_orders (Supabase).

  Konfigurasi pertama kali: akun SQL Server (bukan login aplikasi SIMIP).
  Koneksi SQL server & Supabase sudah otomatis dari paket sync-agent.

  Penggunaan:
    sync.bat                         -> sinkronisasi penuh (double-click)
    saumek-sync.ps1 -TestConnection  -> cek koneksi SQL & Supabase saja
    saumek-sync.ps1 -Setup           -> ubah akun SQL / metode login
    saumek-sync.ps1 -DryRun          -> baca+map tanpa menulis ke Supabase
    saumek-sync.ps1 -Limit 10        -> batasi jumlah WO yang dibaca

  CATATAN: hanya berfungsi jika PC terhubung ke jaringan Sulfindo (kantor/VPN)
  sehingga dapat menjangkau server SQL. Di luar jaringan itu akan gagal.
#>
param(
    [switch]$TestConnection,
    [switch]$DryRun,
    [switch]$Setup,
    [int]$Limit = 0
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir 'config.json'
$ChunkSize = 100

function Join-ScriptPath([string]$Base, [string[]]$More) {
    $path = $Base
    foreach ($segment in $More) {
        $path = Join-Path -Path $path -ChildPath $segment
    }
    try {
        return [System.IO.Path]::GetFullPath($path)
    } catch {
        return $path
    }
}

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

function Get-SqlAuthMode($config) {
    if ($config -and $config.sqlAuthMode -and [string]$config.sqlAuthMode -eq 'windows') {
        return 'windows'
    }
    return 'sql'
}

function Format-SqlLoginError([string]$message) {
    if ($message -match 'untrusted domain') {
        return @(
            $message
            ''
            'Windows auth [2] gagal: PC ini tidak di domain yang dipercaya SQL Server Sulfindo.'
            ''
            'Solusi: jalankan sync.bat -Setup, pilih [1] User/password SQL, lalu isi akun SQL Server'
            '(mis. saumek_sync dari IT, atau akun SQL yang IT berikan).'
            'Login aplikasi SIMIP (hebron.s) tetap tidak bisa dipakai untuk opsi [1].'
        ) -join "`n"
    }
    if ($message -notmatch 'Login failed') { return $message }
    return @(
        $message
        ''
        'Login SQL gagal. Kemungkinan penyebab:'
        '  - User/password SQL salah'
        '  - Anda memakai login aplikasi SIMIP/Maximo (mis. hebron.s) - itu BUKAN akun database SQL'
        ''
        'Solusi:'
        '  - Jalankan sync.bat -Setup, pilih [1], gunakan akun SQL (mis. saumek_sync)'
        '  - Jika belum punya, minta ke IT akun SQL read-only untuk database SAUSIMIP'
        '  - Opsi [2] Windows hanya untuk PC domain Sulfindo yang dipercaya SQL Server'
    ) -join "`n"
}

function Format-SqlConnectionError([string]$message, $config) {
    if ($message -notmatch 'timeout|time out|Unable to connect|network-related|actively refused|No such host|Name or service') {
        return $message
    }
    $server = $config.sqlServer
    $port = $config.sqlPort
    $auth = (Get-SqlAuthMode $config)
    return @(
        $message
        ''
        'Koneksi ke SQL Server GAGAL (timeout/jaringan) - ini BUKAN masalah Administrator Windows.'
        "Target: $server`:$port / database $($config.sqlDatabase)"
        ''
        'Kemungkinan penyebab:'
        '  - PC tidak di jaringan Sulfindo (kantor) atau VPN belum aktif'
        '  - Firewall memblok port 1433 ke server SQL'
        '  - Server SQL tidak aktif atau IP berubah'
        ''
        'Cek cepat di PowerShell:'
        "  Test-NetConnection $server -Port $port"
        '  (TcpTestSucceeded harus True)'
        ''
        if ($auth -eq 'windows') {
            'Catatan Windows auth [2]: hanya berfungsi jika PC domain Sulfindo DAN bisa menjangkau server SQL.'
            'Jika Test-NetConnection gagal, opsi [1] user/password juga tidak akan berhasil.'
        }
        'Sync-agent harus dijalankan dari PC yang sama-sama bisa buka aplikasi SIMIP/MIPRO.'
    ) -join "`n"
}

function Test-SqlServerReachable($config) {
    $server = [string]$config.sqlServer
    $port = [int]$config.sqlPort
    if (-not $server) { return $false }
    try {
        if (Get-Command Test-NetConnection -ErrorAction SilentlyContinue) {
            $tnc = Test-NetConnection -ComputerName $server -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
            return [bool]$tnc.TcpTestSucceeded
        }
        $client = New-Object System.Net.Sockets.TcpClient
        $ar = $client.BeginConnect($server, $port, $null, $null)
        $ok = $ar.AsyncWaitHandle.WaitOne(5000, $false)
        if ($ok -and $client.Connected) {
            $client.Close()
            return $true
        }
        $client.Close()
        return $false
    } catch {
        return $false
    }
}

# Default organisasi - tidak perlu diisi manual setiap setup
$SaumekBuiltInDefaults = [ordered]@{
    sqlServer    = '192.168.20.10'
    sqlDatabase  = 'SAUSIMIP'
    sqlPort      = 1433
    sqlUser      = $null
    supabaseUrl  = 'https://hxnazcquiheufptvbkmr.supabase.co'
    sourceSystem = 'SAUSIMIP'
}

function Read-DotEnvFile([string]$path) {
    $vars = @{}
    if (-not $path) { return $vars }
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return $vars }
    try {
        foreach ($line in Get-Content -LiteralPath $path -Encoding UTF8 -ErrorAction Stop) {
            $t = $line.Trim()
            if (-not $t -or $t.StartsWith('#')) { continue }
            $eq = $t.IndexOf('=')
            if ($eq -lt 1) { continue }
            $key = $t.Substring(0, $eq).Trim()
            $val = $t.Substring($eq + 1).Trim()
            if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
                $val = $val.Substring(1, $val.Length - 2)
            }
            $vars[$key] = $val
        }
    } catch {
        Write-Warn "Tidak bisa baca $path : $($_.Exception.Message)"
    }
    return $vars
}

function Import-SaumekEnvVars {
    $merged = @{}
    $envPath = Join-ScriptPath $ScriptDir '.env.local'
    foreach ($kv in (Read-DotEnvFile $envPath).GetEnumerator()) {
        if ($kv.Value) { $merged[$kv.Key] = $kv.Value }
    }
    return $merged
}

function Get-ConfigTemplate {
    $base = [ordered]@{}
    foreach ($kv in $SaumekBuiltInDefaults.GetEnumerator()) {
        $base[$kv.Key] = $kv.Value
    }

    $templatePath = Join-Path $ScriptDir 'config.template.json'
    if (Test-Path -LiteralPath $templatePath) {
        $tpl = Get-Content -LiteralPath $templatePath -Raw | ConvertFrom-Json
        foreach ($prop in $tpl.PSObject.Properties) {
            if ($null -ne $prop.Value -and "$($prop.Value)" -ne '') {
                $base[$prop.Name] = $prop.Value
            }
        }
    }

    $envFile = Import-SaumekEnvVars
    if ($envFile['SIMIP_SERVER']) { $base.sqlServer = $envFile['SIMIP_SERVER'] }
    if ($envFile['SIMIP_DATABASE']) { $base.sqlDatabase = $envFile['SIMIP_DATABASE'] }
    if ($envFile['SIMIP_PORT']) { $base.sqlPort = [int]$envFile['SIMIP_PORT'] }
    if ($envFile['NEXT_PUBLIC_SUPABASE_URL']) { $base.supabaseUrl = $envFile['NEXT_PUBLIC_SUPABASE_URL'].TrimEnd('/') }
    if ($envFile['SUPABASE_SERVICE_ROLE_KEY']) { $base.supabaseKey = $envFile['SUPABASE_SERVICE_ROLE_KEY'] }

    return $base
}

function Save-Config($config) {
    $config | ConvertTo-Json | Set-Content -LiteralPath $ConfigPath -Encoding UTF8
    Write-Ok "Konfigurasi disimpan: $ConfigPath"
    Write-Warn 'Jangan bagikan config.json - berisi kredensial SQL Server.'
}

function Resolve-SupabaseCredentials($tpl, $existing) {
    $url = $null
    $key = $null

    if ($existing -and $existing.supabaseUrl) { $url = [string]$existing.supabaseUrl }
    if ($existing -and $existing.supabaseKey) { $key = [string]$existing.supabaseKey }
    if (-not $url -and $tpl.supabaseUrl) { $url = [string]$tpl.supabaseUrl }
    if (-not $key -and $tpl.supabaseKey) { $key = [string]$tpl.supabaseKey }

    $url = $url.TrimEnd('/')
    if (-not $url -or -not $key) {
        throw @(
            'Koneksi Supabase tidak ditemukan di paket sync-agent.'
            'Unduh ulang dari dashboard SAUMEK (tombol "Unduh sync-agent") - zip sudah berisi koneksi otomatis.'
            'Jangan hanya copy saumek-sync.ps1 tanpa config.template.json.'
        ) -join ' '
    }

    return @{ url = $url; key = $key }
}

function Initialize-Config([switch]$Force) {
    if ((Test-Path -LiteralPath $ConfigPath) -and -not $Force) {
        return Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
    }

    $tpl = Get-ConfigTemplate

    $existing = $null
    if (Test-Path -LiteralPath $ConfigPath) {
        $existing = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
    }

    $supabase = Resolve-SupabaseCredentials $tpl $existing

    Write-Step '=== SETUP SAUMEK SYNC AGENT ==='
    Write-Host 'Akun SQL Server untuk koneksi ke database SAUSIMIP (disimpan di config.json):' -ForegroundColor DarkGray
    Write-Host ''
    Write-Warn 'PENTING: login aplikasi SIMIP/Maximo (mis. hebron.s) TIDAK sama dengan akun database SQL.'
    Write-Host 'Contoh akun SQL: saumek_sync (minta ke IT jika belum punya akun SQL read-only).' -ForegroundColor DarkGray
    Write-Host ''

    $sqlAuthMode = 'sql'
    if ($existing -and $existing.sqlAuthMode) {
        $sqlAuthMode = [string]$existing.sqlAuthMode
    }
    Write-Host 'Metode login SQL Server:' -ForegroundColor DarkGray
    Write-Host '  [1] User/password SQL (default, mis. saumek_sync)' -ForegroundColor DarkGray
    Write-Host '  [2] Windows Integrated Security (akun domain PC ini)' -ForegroundColor DarkGray
    $authChoice = Read-Host 'Pilih [1/2]'
    if ($authChoice -eq '2') { $sqlAuthMode = 'windows' } else { $sqlAuthMode = 'sql' }

    $sqlUser = $null
    $secure = $null
    if ($sqlAuthMode -eq 'sql') {
        if ($existing) { $sqlUser = $existing.sqlUser }
        if (-not $sqlUser) { $sqlUser = $tpl.sqlUser }
        if (-not $sqlUser) {
            $sqlUser = Read-Host 'User SQL Server (mis. saumek_sync)'
        }
        if (-not $sqlUser) { throw 'User SQL Server wajib diisi.' }

        if ($existing -and $existing.sqlPasswordEnc) {
            $reuse = Read-Host 'Pakai password SQL yang tersimpan? [Y/n]'
            if ($reuse -eq '' -or $reuse -eq 'Y' -or $reuse -eq 'y') {
                $secure = ConvertTo-SecureString $existing.sqlPasswordEnc
            }
        }
        if (-not $secure) {
            $secure = Read-Host 'Password SQL Server' -AsSecureString
            if ($secure.Length -eq 0) { throw 'Password SQL Server wajib diisi.' }
        }
    }

    $config = [ordered]@{
        sqlServer      = $tpl.sqlServer
        sqlDatabase    = $tpl.sqlDatabase
        sqlPort        = [int]$tpl.sqlPort
        sqlAuthMode    = $sqlAuthMode
        sqlUser        = $sqlUser
        sqlPasswordEnc = if ($secure) { ($secure | ConvertFrom-SecureString) } else { $null }
        supabaseUrl    = $supabase.url
        supabaseKey    = $supabase.key
        sourceSystem   = $tpl.sourceSystem
    }
    Save-Config $config
    return [pscustomobject]$config
}

function Read-Config {
    if ($Setup) {
        return Initialize-Config -Force
    }

    if (Test-Path -LiteralPath $ConfigPath) {
        return Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
    }

    return Initialize-Config
}

function Get-SqlPassword($config) {
    if ((Get-SqlAuthMode $config) -eq 'windows') { return $null }
    if (-not $config.sqlPasswordEnc) {
        throw 'Password SQL tidak ada di config. Jalankan sync.bat -Setup.'
    }
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
    $base = "Server=$($config.sqlServer),$($config.sqlPort);Database=$($config.sqlDatabase);Encrypt=False;TrustServerCertificate=True;Connection Timeout=30;"
    if ((Get-SqlAuthMode $config) -eq 'windows') {
        $csb = $base + 'Integrated Security=True;'
    } else {
        $csb = $base + "User Id=$($config.sqlUser);Password=$password;"
    }
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

# Lampiran WO (foto/dokumen) - path di drive N: dari registry dokumen SIMIP (MIP_DOCINFO).
function Get-WoAttachmentMap($config, $password, [string[]]$woNumbers) {
    $result = @{}
    if ($woNumbers.Count -eq 0) { return $result }

    $conn = $null
    try {
        $conn = Connect-Sql $config $password
        $cmd = $conn.CreateCommand()
        $cmd.CommandTimeout = 120

        $cmd.CommandText = @"
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME IN ('MIP_DOCINFO','DOCINFO','MIP_DOCUMENT')
"@
        $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
        $tables = New-Object System.Data.DataTable
        [void]$adapter.Fill($tables)
        if ($tables.Rows.Count -eq 0) { return $result }

        $table = [string]$tables.Rows[0].TABLE_NAME
        $inList = ($woNumbers | ForEach-Object { "'$([string]$_ -replace "'","''")'" }) -join ','

        # MIPRO: RECORDKEY = WONUM, URLORNAME = path file di N:
        $queries = @(
            "SELECT RECORDKEY, URLORNAME FROM [$table] WHERE RECORDKEY IN ($inList) AND URLORNAME IS NOT NULL AND LTRIM(RTRIM(URLORNAME)) <> ''",
            "SELECT OWNERID AS RECORDKEY, URLORNAME FROM [$table] WHERE OWNERID IN ($inList) AND URLORNAME IS NOT NULL AND LTRIM(RTRIM(URLORNAME)) <> ''"
        )

        foreach ($sql in $queries) {
            try {
                $cmd.CommandText = $sql
                $dt = New-Object System.Data.DataTable
                [void](New-Object System.Data.SqlClient.SqlDataAdapter($cmd)).Fill($dt)
                foreach ($row in $dt.Rows) {
                    $key = [string]$row.RECORDKEY
                    $path = [string]$row.URLORNAME
                    if (-not $key -or -not $path) { continue }
                    if (-not $result.ContainsKey($key)) {
                        $result[$key] = New-Object System.Collections.Generic.List[string]
                    }
                    if (-not $result[$key].Contains($path)) {
                        $result[$key].Add($path)
                    }
                }
                if ($result.Count -gt 0) { break }
            } catch { continue }
        }
    }
    catch {
        Write-Warn "Lampiran WO: $(Format-SqlLoginError $_.Exception.Message)"
    }
    finally {
        if ($conn) { $conn.Close() }
    }
    return $result
}

$SimipAttachmentRoot = 'N:\workorder\'
$SimipAttachmentExtensions = @('.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.xlsx', '.xls', '.doc', '.docx')

function Get-WoAttachmentPathsFromFolder([string]$woNumber) {
    $paths = New-Object System.Collections.Generic.List[string]
    if (-not $woNumber) { return @() }

    $root = $SimipAttachmentRoot
    $patterns = @(
        "${root}${woNumber}_WR.pdf",
        "${root}${woNumber}_WR.jpg",
        "${root}${woNumber}_WR.jpeg",
        "${root}${woNumber}.pdf",
        "${root}${woNumber}.jpg",
        "${root}${woNumber}.jpeg",
        "${root}${woNumber}.xlsx",
        "${root}${woNumber}.xls"
    )
    foreach ($p in $patterns) {
        if ((Test-Path -LiteralPath $p) -and -not $paths.Contains($p)) {
            $paths.Add($p)
        }
    }

    if (Test-Path -LiteralPath $root) {
        Get-ChildItem -LiteralPath $root -File -ErrorAction SilentlyContinue |
            Where-Object {
                $_.Name -like "${woNumber}*" -and
                $SimipAttachmentExtensions -contains $_.Extension.ToLower()
            } |
            ForEach-Object {
                if (-not $paths.Contains($_.FullName)) {
                    $paths.Add($_.FullName)
                }
            }
    }

    return @($paths)
}

function Resolve-WoAttachmentPaths($map, [string]$wo) {
    $paths = New-Object System.Collections.Generic.List[string]

    if ($map.ContainsKey($wo)) {
        foreach ($p in $map[$wo]) {
            $norm = Normalize-AttachmentPath $p
            if ($norm -and -not $paths.Contains($norm)) { $paths.Add($norm) }
        }
    }

    foreach ($p in (Get-WoAttachmentPathsFromFolder $wo)) {
        if (-not $paths.Contains($p)) { $paths.Add($p) }
    }

    return @($paths)
}

function Normalize-AttachmentPath([string]$path) {
    if (-not $path) { return $null }
    $p = [string]$path.Trim()
    if (-not $p) { return $null }
    if ($p -match '^[A-Za-z]:') { return $p }
    if ($p.StartsWith('\\')) { return $p }
    $rel = $p -replace '^[/\\]+', ''
    return "$SimipAttachmentRoot$rel"
}

function Add-AttachmentPaths($config, $password, $items) {
    $nums = @($items | ForEach-Object { [string]$_.wo_number } | Where-Object { $_ } | Select-Object -Unique)
    if ($nums.Count -eq 0) { return }

    $map = Get-WoAttachmentMap $config $password $nums
    $pathCount = 0

    foreach ($item in $items) {
        $wo = [string]$item.wo_number
        if (-not $wo) { continue }
        $paths = Resolve-WoAttachmentPaths $map $wo
        if ($item.raw_data -is [System.Collections.IDictionary]) {
            if ($paths.Count -gt 0) {
                $item.raw_data['_attachment_paths'] = $paths
                $pathCount += $paths.Count
            }
        }
    }
    if ($pathCount -gt 0) {
        Write-Ok "Path lampiran WO disimpan: $pathCount path (dibaca dari drive N: saat buka di app lokal)"
    } else {
        Write-Warn 'Tidak ada path lampiran ditemukan. Cek drive N:\workorder\ di PC sync.'
    }
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
        Write-Step "Cek jaringan ke SQL ($($config.sqlServer):$($config.sqlPort))..."
        if (Test-SqlServerReachable $config) {
            Write-Ok "Port SQL dapat dijangkau (TcpTestSucceeded)"
        } else {
            Write-Err "Port SQL TIDAK dapat dijangkau dari PC ini."
            Write-Warn (Format-SqlConnectionError 'Connection timeout' $config)
        }
        Write-Step 'Cek koneksi SQL...'
        try {
            $conn = Connect-Sql $config $password
            $conn.Close()
            Write-Ok "SQL OK: $($config.sqlServer),$($config.sqlPort)/$($config.sqlDatabase) (auth: $(Get-SqlAuthMode $config))"
        } catch {
            $raw = $_.Exception.Message
            if ($raw -match 'Login failed') {
                Write-Err (Format-SqlLoginError $raw)
            } else {
                Write-Err (Format-SqlConnectionError $raw $config)
            }
        }
        Write-Step 'Cek koneksi Supabase...'
        if (Test-Supabase $config) { Write-Ok "Supabase OK: $($config.supabaseUrl)" }
        else { Write-Err 'Supabase GAGAL: cek URL / Service Role Key.' }
        return
    }

    Write-Step "Cek jaringan ke SQL ($($config.sqlServer):$($config.sqlPort))..."
    if (-not (Test-SqlServerReachable $config)) {
        throw (Format-SqlConnectionError 'Connection timeout - port SQL tidak dapat dijangkau' $config)
    }
    Write-Ok 'Port SQL dapat dijangkau'

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

    Write-Step 'Ambil path lampiran WO (drive N:\workorder\)...'
    try {
        Add-AttachmentPaths $config $password $items
        Write-Ok 'Path lampiran disimpan di raw_data (dibaca langsung dari drive N: di app lokal).'
    } catch {
        Write-Warn "Lampiran WO dilewati: $($_.Exception.Message)"
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
    if ($msg -match 'Login failed') {
        Write-Err (Format-SqlLoginError $msg)
    } elseif ($msg -match 'timeout|time out|Unable to connect|network-related|actively refused|No such host|Name or service|tidak dapat dijangkau') {
        Write-Err (Format-SqlConnectionError $msg $config)
    } else {
        Write-Err "ERROR: $msg"
    }
    exit 1
}
