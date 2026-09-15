<#
.SYNOPSIS
  Publishes the API and deploys it to MonsterASP.NET with Web Deploy.

.DESCRIPTION
  Secrets never touch the repository. They are read from
  %USERPROFILE%\.beytak\deploy.json, written into appsettings.Production.json
  inside a temporary publish folder only, and sent to the server from there.

    First deployment:   .\deploy\deploy-api.ps1 -Seed
    Every later one:    .\deploy\deploy-api.ps1

  -Seed starts the site once with Seed:Reset on, which DELETES every listing,
  booking and user on the server and loads seed-data.json with its photos, and
  then redeploys the settings with it off. Leaving it on would wipe the
  database on every app restart, and a free host restarts often.

  A normal deploy never deletes photos uploaded on the live site
  (DoNotDeleteRule): the server keeps any file this PC does not have.
  -Seed is the exception. It makes the server an exact copy of the publish
  folder, clearing anything else — a host's pre-installed example app on the
  first deploy, and photos that would otherwise be left behind by listings the
  reseed has just deleted.
#>
param([switch]$Seed)

$ErrorActionPreference = 'Stop'

$secretsPath = Join-Path $HOME '.beytak\deploy.json'
if (-not (Test-Path $secretsPath)) { throw "Missing $secretsPath. Fill in the template first." }
$s = Get-Content $secretsPath -Raw | ConvertFrom-Json

foreach ($k in 'siteId', 'siteUrl', 'webDeployPassword', 'connectionString', 'frontendUrl') {
    if ([string]::IsNullOrWhiteSpace($s.$k)) { throw "deploy.json: '$k' is empty." }
}
if ($Seed -and [string]::IsNullOrWhiteSpace($s.adminPassword)) {
    throw "deploy.json: 'adminPassword' is required with -Seed."
}

# Made once and kept in deploy.json. A fresh key on every deploy would sign
# every user out each time.
if ([string]::IsNullOrWhiteSpace($s.jwtKey)) {
    $bytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $s | Add-Member -NotePropertyName jwtKey -NotePropertyValue ([Convert]::ToBase64String($bytes)) -Force
    [IO.File]::WriteAllText($secretsPath, ($s | ConvertTo-Json), (New-Object Text.UTF8Encoding $false))
    Write-Host 'Generated a JWT signing key and saved it in deploy.json.'
}

# Shared SQL Server hosts rarely present a certificate the client trusts, and
# Microsoft.Data.SqlClient encrypts by default, so the connection would fail.
$conn = $s.connectionString.Trim()
if ($conn -notmatch 'TrustServerCertificate') { $conn = $conn.TrimEnd(';') + ';TrustServerCertificate=True' }

$webDeployUrl = $s.webDeployUrl
if ([string]::IsNullOrWhiteSpace($webDeployUrl)) {
    $webDeployUrl = "https://$($s.siteId).siteasp.net:8172/msdeploy.axd?site=$($s.siteId)"
}
$siteUrl = $s.siteUrl.TrimEnd('/')

$msdeploy = 'C:\Program Files\IIS\Microsoft Web Deploy V3\msdeploy.exe'
if (-not (Test-Path $msdeploy)) { throw 'Microsoft Web Deploy is not installed: winget install Microsoft.WebDeploy' }

# ── publish ──────────────────────────────────────────────────────────
$repo = Split-Path $PSScriptRoot -Parent
$api = Join-Path $repo 'RentalMarketplaceBackend\RentalMarketplaceBackend.API'
$out = Join-Path $env:TEMP 'beytak-publish'

if (Test-Path $out) { Remove-Item $out -Recurse -Force }
dotnet publish $api -c Release -o $out --nologo
if ($LASTEXITCODE -ne 0) { throw 'dotnet publish failed.' }

# Never loaded in Production, and it carries the development key.
Remove-Item (Join-Path $out 'appsettings.Development.json') -ErrorAction SilentlyContinue

function Write-Settings([bool]$reset) {
    $settings = [ordered]@{
        ConnectionStrings = @{ DefaultConnection = $conn }
        Jwt               = @{ Key = $s.jwtKey }
        Cors              = @{ AllowedOrigins = @($s.frontendUrl.TrimEnd('/')) }
        Seed              = [ordered]@{ Reset = $reset }
    }
    if ($reset) { $settings.Seed.AdminPassword = $s.adminPassword }

    [IO.File]::WriteAllText((Join-Path $out 'appsettings.Production.json'),
        ($settings | ConvertTo-Json -Depth 5), (New-Object Text.UTF8Encoding $false))
}

# ── deploy ───────────────────────────────────────────────────────────
function Sync-Site([bool]$mirror) {
    # AppOffline stops the app for the copy, so IIS lets go of the DLLs being
    # replaced. DoNotDeleteRule keeps files that exist only on the server;
    # without it the server becomes an exact copy of $out.
    $dest = "contentPath=$($s.siteId),computerName=$webDeployUrl,userName=$($s.siteId)," +
            "password=$($s.webDeployPassword),authtype=Basic,includeAcls=False"
    $rules = @('-enableRule:AppOffline')
    if (-not $mirror) { $rules += '-enableRule:DoNotDeleteRule' }

    & $msdeploy -verb:sync "-source:contentPath=$out" "-dest:$dest" -allowUntrusted `
        -disableLink:AppPoolExtension -disableLink:ContentExtension -disableLink:CertificateExtension `
        @rules
    if ($LASTEXITCODE -ne 0) { throw 'Web Deploy failed. Check siteId and webDeployPassword in deploy.json.' }
}

function Wait-Healthy([int]$tries) {
    for ($i = 0; $i -lt $tries; $i++) {
        try {
            $r = Invoke-WebRequest "$siteUrl/health" -UseBasicParsing -TimeoutSec 60
            if ($r.StatusCode -eq 200) { return $true }
        } catch { }
        Start-Sleep -Seconds 5
    }
    return $false
}

Write-Settings $Seed.IsPresent
Sync-Site $Seed.IsPresent

if ($Seed) {
    # Seeding runs before the app starts answering, so the first 200 from
    # /health means it has finished.
    Write-Host 'Starting the site and loading the seed data (this takes a minute)...'
    $seeded = Wait-Healthy 60

    # Off again whatever happened. A restart with Reset still on wipes the data.
    Write-Settings $false
    Sync-Site $false

    if (-not $seeded) { throw "The site did not come up. Seed:Reset has been switched off again. Check the logs in the MonsterASP control panel." }
}

if (Wait-Healthy 30) { Write-Host "Deployed: $siteUrl" -ForegroundColor Green }
else { throw "Deployed, but $siteUrl/health is not answering. Check the logs in the MonsterASP control panel." }
