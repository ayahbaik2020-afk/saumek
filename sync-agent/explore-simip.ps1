param()
$ErrorActionPreference = 'Stop'
$config = Get-Content (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'config.json') -Raw | ConvertFrom-Json

function Get-SqlPassword($config) {
    $secure = ConvertTo-SecureString $config.sqlPasswordEnc
    return [System.Net.NetworkCredential]::new('', $secure).Password
}

function Invoke-Sql($config, $sql) {
    $pw = Get-SqlPassword $config
    $csb = "Server=$($config.sqlServer),$($config.sqlPort);Database=$($config.sqlDatabase);User Id=$($config.sqlUser);Password=$pw;Encrypt=False;TrustServerCertificate=True;Connection Timeout=15;"
    $conn = New-Object System.Data.SqlClient.SqlConnection($csb)
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandTimeout = 120
    $cmd.CommandText = $sql
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
    $dt = New-Object System.Data.DataTable
    [void]$adapter.Fill($dt)
    $conn.Close()
    return , $dt
}

$out = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'eksplorasi.txt'
$sb = New-Object System.Text.StringBuilder

function Note($msg) { [void]$sb.AppendLine($msg) }

try {
    Note "=== DEPT FARIED/S1754 & kandidat ==="
    foreach ($row in (Invoke-Sql $config "SELECT EMP_ID, EMP_NAME, EMP_DEPT FROM MIP_EMPLOYEE_MASTER WHERE EMP_ID IN ('S1754','S1405','L0101')").Rows) {
        Note "EMP_ID=$($row.EMP_ID) | EMP_NAME=$($row.EMP_NAME) | EMP_DEPT=$($row.EMP_DEPT)"
    }

    Note ""
    Note "=== SECTION (WOPM1) pd WO mekanik per SUPERVISOR ==="
    foreach ($row in (Invoke-Sql $config "SELECT SUPERVISOR, WOPM1 AS section, COUNT(*) AS jml FROM MIP_WORKORDER WHERE WOPM1 LIKE 'M%' AND SUPERVISOR IN ('HEBRON','FARIED') GROUP BY SUPERVISOR, WOPM1 ORDER BY SUPERVISOR, jml DESC").Rows) {
        Note "SUP=$($row.SUPERVISOR) | section=$($row.section) | jml=$($row.jml)"
    }

    Note ""
    Note "=== LEADCRAFT utk SUPERVISOR HEBRON/FARIED (top) ==="
    foreach ($row in (Invoke-Sql $config "SELECT SUPERVISOR, LEADCRAFT, COUNT(*) AS jml FROM MIP_WORKORDER WHERE WOPM1 LIKE 'M%' AND SUPERVISOR IN ('HEBRON','FARIED') AND LEADCRAFT IN ('HEBRON','FARIED') GROUP BY SUPERVISOR, LEADCRAFT ORDER BY jml DESC").Rows) {
        Note "SUP=$($row.SUPERVISOR) | lead=$($row.LEADCRAFT) | jml=$($row.jml)"
    }

    Note ""
    Note "=== REPORTEDBY berisi login user (HEBRON.S / FARID*) ==="
    foreach ($row in (Invoke-Sql $config "SELECT REPORTEDBY, WOPM1 AS section, COUNT(*) AS jml FROM MIP_WORKORDER WHERE WOPM1 LIKE 'M%' AND (REPORTEDBY LIKE 'HEBRON%' OR REPORTEDBY LIKE 'FAR%') GROUP BY REPORTEDBY, WOPM1 ORDER BY jml DESC").Rows) {
        Note "reportedby=$($row.REPORTEDBY) | section=$($row.section) | jml=$($row.jml)"
    }

    Note ""
    Note "=== Kolom MIP_MAXUSERAUTH ==="
    $cols = (Invoke-Sql $config "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='MIP_MAXUSERAUTH' ORDER BY ORDINAL_POSITION").Rows
    Note (($cols | ForEach-Object { "$($_.COLUMN_NAME):$($_.DATA_TYPE)" }) -join ', ')

    Note ""
    Note "=== Isi MIP_MAXUSERAUTH (50 baris) ==="
    foreach ($row in (Invoke-Sql $config "SELECT TOP 50 * FROM MIP_MAXUSERAUTH").Rows) {
        $vals = @(); foreach ($c in $row.Table.Columns) { $vals += "$($c.ColumnName)=$($row[$c.ColumnName])" }
        Note ($vals -join ' | ')
    }

    Note ""
    Note "=== Tabel dokumen / lampiran WO (MIP_DOCINFO, dll) ==="
    foreach ($row in (Invoke-Sql $config "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%DOC%' ORDER BY TABLE_NAME").Rows) {
        Note "TABLE=$($row.TABLE_NAME)"
    }

    Note ""
    Note "=== Kolom MIP_DOCINFO (jika ada) ==="
    $docCols = (Invoke-Sql $config "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='MIP_DOCINFO' ORDER BY ORDINAL_POSITION").Rows
    if ($docCols.Count -gt 0) {
        Note (($docCols | ForEach-Object { "$($_.COLUMN_NAME):$($_.DATA_TYPE)" }) -join ', ')
        Note ""
        Note "=== Sample MIP_DOCINFO WORKORDER (10 baris) ==="
        foreach ($row in (Invoke-Sql $config "SELECT TOP 10 RECORDKEY, URLORNAME, APP, DOCNAME FROM MIP_DOCINFO WHERE APP IN ('WORKORDER','PM','WOTRACK') AND URLORNAME IS NOT NULL ORDER BY RECORDKEY DESC").Rows) {
            Note "WO=$($row.RECORDKEY) | $($row.URLORNAME)"
        }
    } else {
        Note "(MIP_DOCINFO tidak ditemukan)"
    }

    Note ""
    Note "=== MIP_LABORAUTH isi ==="
    foreach ($row in (Invoke-Sql $config "SELECT TOP 30 * FROM MIP_LABORAUTH").Rows) {
        $vals = @(); foreach ($c in $row.Table.Columns) { $vals += "$($c.ColumnName)=$($row[$c.ColumnName])" }
        Note ($vals -join ' | ')
    }
} catch {
    Note "ERROR: $($_.Exception.Message)"
}

Set-Content -LiteralPath $out -Value $sb.ToString() -Encoding UTF8
Write-Host "Tersimpan: $out"
Get-Content -LiteralPath $out -Raw
