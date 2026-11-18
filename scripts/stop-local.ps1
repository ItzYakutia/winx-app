param([switch]$KeepInfrastructure)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$stateFile = Join-Path $projectRoot '.local\processes.json'
if (Test-Path -LiteralPath $stateFile) {
    $records = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    foreach ($record in $records) {
        $process = Get-Process -Id $record.ProcessId -ErrorAction SilentlyContinue
        if ($process -and $process.StartTime.ToUniversalTime().Ticks.ToString() -eq $record.StartedAtTicks -and $process.Path -eq $record.Executable) {
            Stop-Process -Id $process.Id
            Write-Host "Stopped $($record.Name)."
        }
    }
    Remove-Item -LiteralPath $stateFile
}
if (-not $KeepInfrastructure) {
    $linuxScript = (& wsl.exe -d Ubuntu -- wslpath -a (Join-Path $PSScriptRoot 'local-infra.sh') | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Cannot resolve WSL infrastructure script path.' }
    & wsl.exe -d Ubuntu -- bash $linuxScript stop
    if ($LASTEXITCODE -ne 0) { throw 'Stopping infrastructure failed.' }
}
Write-Host 'Winx stopped. Data is preserved.'
