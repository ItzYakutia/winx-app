param(
    [switch]$Setup,
    [switch]$PrepareOnly
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $projectRoot '.local'
$binDirectory = Join-Path $runtime 'bin'
$logDirectory = Join-Path $runtime 'logs'
$stateFile = Join-Path $runtime 'processes.json'
$services = @('auth', 'notification', 'profile', 'match', 'recommendation', 'chat', 'api-gateway')
$utf8 = New-Object System.Text.UTF8Encoding($false)
New-Item -ItemType Directory -Force -Path $binDirectory, $logDirectory | Out-Null
$records = @()
if (Test-Path -LiteralPath $stateFile) {
    $records = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
}

function Assert-ExitCode([string]$Action) {
    if ($LASTEXITCODE -ne 0) { throw "$Action failed (exit code $LASTEXITCODE)." }
}

function Invoke-Infrastructure([string]$Action, [switch]$AsRoot) {
    $linuxScript = (& wsl.exe -d Ubuntu -- wslpath -a (Join-Path $PSScriptRoot 'local-infra.sh') | Out-String).Trim()
    Assert-ExitCode 'Resolve WSL path'
    if ($AsRoot) {
        & wsl.exe -d Ubuntu -u root -- bash $linuxScript $Action
    } else {
        & wsl.exe -d Ubuntu -- bash $linuxScript $Action
    }
    Assert-ExitCode "Infrastructure $Action"
}

if ($Setup) { Invoke-Infrastructure 'setup' -AsRoot }

$env:APP_ENV = 'local'
$env:GOTELEMETRY = 'off'
$env:GOCACHE = Join-Path $runtime 'go-build'
$env:GOMODCACHE = Join-Path $runtime 'go-mod'

foreach ($service in $services) {
    $serviceDirectory = Join-Path $projectRoot $service
    $localConfig = Join-Path $serviceDirectory 'config.dev.local.yaml'
    if (-not (Test-Path -LiteralPath $localConfig)) {
        $config = [System.IO.File]::ReadAllText((Join-Path $serviceDirectory 'config.dev.yaml'))
        $config = $config.Replace('host: postgres-winx', 'host: 127.0.0.1')
        $config = $config.Replace('    port: 5432', '    port: 55432')
        $config = $config.Replace('host: redis-winx', 'host: 127.0.0.1')
        $config = $config.Replace('mongodb://mongo-winx:27017', 'mongodb://127.0.0.1:27017')
        $config = $config.Replace('- kafka-winx:9092', '- 127.0.0.1:9092')
        $config = $config.Replace('host: graylog-winx', 'host: 127.0.0.1')
        $config = $config.Replace('url: 0.0.0.0:', 'url: 127.0.0.1:')
        $config = $config.Replace('environment: development', 'environment: local')
        foreach ($upstream in $services) {
            $config = $config.Replace("http://${upstream}-winx:", 'http://127.0.0.1:')
        }
        if ($service -eq 'api-gateway') {
            $config = $config.Replace('  mode: true', '  mode: false')
        }
        [System.IO.File]::WriteAllText($localConfig, $config, $utf8)
    }
    Push-Location -LiteralPath $serviceDirectory
    try {
        $record = $records | Where-Object { $_.Name -eq $service } | Select-Object -First 1
        if ($record) {
            $running = Get-Process -Id $record.ProcessId -ErrorAction SilentlyContinue
            if ($running -and $running.StartTime.ToUniversalTime().Ticks.ToString() -eq $record.StartedAtTicks -and $running.Path -eq $record.Executable) {
                Write-Host "$service is running; keeping its existing binary. Stop it first to rebuild changed Go code."
                continue
            }
        }
        Write-Host "Building $service..."
        & go build -o (Join-Path $binDirectory "$service.exe") ./cmd/http
        Assert-ExitCode "Build $service"
    } finally { Pop-Location }
}

# Services share one database and goose version table. Apply their SQL together
# in timestamp order, including newer auth migrations after the older profile SQL.
$migrationDirectory = Join-Path $runtime 'migrations'
New-Item -ItemType Directory -Force -Path $migrationDirectory | Out-Null
foreach ($service in $services | Where-Object { $_ -ne 'api-gateway' }) {
    Get-ChildItem -LiteralPath (Join-Path $projectRoot "$service\migrations\migrations") -Filter '*.sql' | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $migrationDirectory $_.Name) -Force
    }
}
Push-Location -LiteralPath (Join-Path $projectRoot 'auth')
try {
    & go build -o (Join-Path $binDirectory 'local-migrate.exe') ../scripts/local-migrate.go
    Assert-ExitCode 'Build local migration tool'
} finally { Pop-Location }

$frontendDirectory = Join-Path $projectRoot 'frontend'
$angularCli = Join-Path $frontendDirectory 'node_modules\@angular\cli\bin\ng.js'
if (-not (Test-Path -LiteralPath $angularCli)) {
    Push-Location -LiteralPath $frontendDirectory
    try {
        & npm.cmd install --offline=false --no-audit --no-fund --cache (Join-Path $env:TEMP 'winx-npm-cache')
        Assert-ExitCode 'Install frontend dependencies'
    } finally { Pop-Location }
}
if ($PrepareOnly) {
    Write-Host 'Local configuration, Go binaries and frontend dependencies are ready.'
    return
}

Invoke-Infrastructure 'start'
Write-Host 'Applying all database migrations in timestamp order...'
& (Join-Path $binDirectory 'local-migrate.exe') -dir $migrationDirectory
Assert-ExitCode 'Apply local migrations'

function Start-LocalProcess([string]$Name, [string]$Executable, [string[]]$ProcessArguments, [string]$Directory, [int]$Port) {
    $existing = $script:records | Where-Object { $_.Name -eq $Name } | Select-Object -First 1
    if ($existing) {
        $running = Get-Process -Id $existing.ProcessId -ErrorAction SilentlyContinue
        if ($running -and $running.StartTime.ToUniversalTime().Ticks.ToString() -eq $existing.StartedAtTicks -and $running.Path -eq $existing.Executable) {
            Write-Host "$Name is already running (PID $($existing.ProcessId))."
            return
        }
    }
    $listener = New-Object System.Net.Sockets.TcpClient
    try {
        $pending = $listener.ConnectAsync('127.0.0.1', $Port)
        try { $null = $pending.Wait(200) } catch {}
        if ($listener.Connected) { throw "Port $Port is already in use. Stop its process before starting $Name." }
    } finally { $listener.Dispose() }

    $parameters = @{
        FilePath = $Executable
        WorkingDirectory = $Directory
        WindowStyle = 'Hidden'
        PassThru = $true
        RedirectStandardOutput = (Join-Path $logDirectory "$Name.out.log")
        RedirectStandardError = (Join-Path $logDirectory "$Name.err.log")
    }
    if ($ProcessArguments.Count -gt 0) { $parameters.ArgumentList = $ProcessArguments }
    $process = Start-Process @parameters
    $script:records = @($script:records | Where-Object { $_.Name -ne $Name }) + @([pscustomobject]@{
        Name = $Name
        ProcessId = $process.Id
        StartedAtTicks = $process.StartTime.ToUniversalTime().Ticks.ToString()
        Executable = $Executable
    })
    [System.IO.File]::WriteAllText($stateFile, (ConvertTo-Json -InputObject @($script:records)), $utf8)
    Write-Host "Started $Name (PID $($process.Id), port $Port)."
}

for ($index = 0; $index -lt $services.Count; $index++) {
    $service = $services[$index]
    $port = if ($service -eq 'api-gateway') { 3000 } else { 3001 + $index }
    Start-LocalProcess -Name $service -Executable (Join-Path $binDirectory "$service.exe") -ProcessArguments @() -Directory (Join-Path $projectRoot $service) -Port $port
}
$env:NG_CLI_ANALYTICS = 'false'
Start-LocalProcess -Name 'frontend' -Executable (Get-Command node.exe).Source -ProcessArguments @(('"' + $angularCli + '"'), 'serve', '--proxy-config', 'proxy.conf.json', '--host', '127.0.0.1', '--port', '4200') -Directory $frontendDirectory -Port 4200

foreach ($port in @(3000, 3001, 3002, 3003, 3004, 3005, 3006, 4200)) {
    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        $client = New-Object System.Net.Sockets.TcpClient
        try {
            $pending = $client.ConnectAsync('127.0.0.1', $port)
            try { $null = $pending.Wait(200) } catch {}
            if ($client.Connected) { $ready = $true; break }
        } finally { $client.Dispose() }
        Start-Sleep -Milliseconds 500
    }
    if (-not $ready) { throw "Port $port is not ready. Check logs in $logDirectory." }
}
Write-Host 'Winx is ready: http://localhost:4200 (API: http://localhost:3000/swagger).'
Write-Host "Logs: $logDirectory"
