param([string]$Release = (Get-Date -Format 'yyyyMMdd-HHmmss'))
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $projectRoot '.local'
$staging = Join-Path $runtime "server/$Release"
$bin = Join-Path $staging 'bin'
New-Item -ItemType Directory -Force -Path $bin | Out-Null
$env:GOTELEMETRY = 'off'
$env:GOMAXPROCS = '2'
$env:GOCACHE = Join-Path $runtime 'go-build'
$env:GOMODCACHE = Join-Path $runtime 'go-mod'
$services = @('auth', 'notification', 'profile', 'match', 'recommendation', 'chat', 'api-gateway')
function Check-Exit([string]$Action) {
    if ($LASTEXITCODE -ne 0) { throw "$Action failed (exit $LASTEXITCODE)." }
}
Push-Location -LiteralPath (Join-Path $projectRoot 'frontend')
try {
    & npm.cmd run test:session
    Check-Exit 'Session tests'
    & npm.cmd run test:swipes
    Check-Exit 'Swipe tests'
    & npm.cmd run build
    Check-Exit 'Frontend build'
} finally { Pop-Location }
foreach ($service in $services) {
    Push-Location -LiteralPath (Join-Path $projectRoot $service)
    try {
        Write-Host "Checking $service..."
        & go test -p 2 -short ./...
        Check-Exit "$service unit tests"
    } finally { Pop-Location }
}
$originalGoos = $env:GOOS
$originalGoarch = $env:GOARCH
$originalCgo = $env:CGO_ENABLED
try {
    $env:GOOS = 'linux'
    $env:GOARCH = 'amd64'
    $env:CGO_ENABLED = '0'
    foreach ($service in $services) {
        Push-Location -LiteralPath (Join-Path $projectRoot $service)
        try {
            Write-Host "Building Linux binary: $service..."
            & go build -p 2 -trimpath -ldflags '-s -w' -o (Join-Path $bin $service) ./cmd/http
            Check-Exit "$service Linux build"
        } finally { Pop-Location }
    }
    Push-Location -LiteralPath (Join-Path $projectRoot 'auth')
    try {
        & go build -p 2 -trimpath -ldflags '-s -w' -o (Join-Path $bin 'migrate') ../scripts/server-migrate.go
        Check-Exit 'Migration binary'
    } finally { Pop-Location }
} finally {
    $env:GOOS = $originalGoos
    $env:GOARCH = $originalGoarch
    $env:CGO_ENABLED = $originalCgo
}
& python (Join-Path $projectRoot 'deploy/server/prepare.py') --output $staging
Check-Exit 'Prepare server configuration'
$archive = Join-Path $runtime "winx-server-$Release.tar.gz"
& tar.exe -czf $archive -C $staging .
Check-Exit 'Create deployment archive'
Write-Host "Release: $Release"
Write-Host "Archive: $archive"
Get-FileHash -LiteralPath $archive -Algorithm SHA256
