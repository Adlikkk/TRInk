param(
  [ValidateSet("internal", "beta")]
  [string]$Channel = "internal"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$packageJson = Get-Content (Join-Path $repoRoot "package.json") | ConvertFrom-Json
$version = [string]$packageJson.version
$releaseRoot = Join-Path $repoRoot "release"
$installerDirectory = Join-Path $repoRoot "src-tauri\target\debug\bundle\nsis"
$preferredInstallerName = "TradeReality Ink_{0}_x64-setup.exe" -f $version

$releaseFolderName =
  if ($Channel -eq "beta") {
    "TRInk-$version-beta"
  } else {
    "TRInk-$version-internal"
  }

$releaseFolder = Join-Path $releaseRoot $releaseFolderName

function Find-Installer([string]$directory, [string]$versionValue, [string]$preferredName) {
  if (-not (Test-Path -LiteralPath $directory)) {
    return $null
  }

  return Get-ChildItem -LiteralPath $directory -File |
    Where-Object {
      $_.Name -eq $preferredName -or $_.Name -like ("TradeReality Ink_{0}_*-setup.exe" -f $versionValue)
    } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

function Require-Files([array]$files) {
  $missing = @()
  foreach ($file in $files) {
    if (-not (Test-Path -LiteralPath $file.Source)) {
      $missing += $file.Source
    }
  }

  if ($missing.Count -gt 0) {
    throw "Release packaging is missing required files:`n- $($missing -join "`n- ")"
  }
}

function Copy-ReleaseEntry([hashtable]$entry, [string]$releaseFolderPath) {
  $destinationPath = Join-Path $releaseFolderPath $entry.Destination
  if ($entry.ContainsKey("IsDirectory") -and $entry.IsDirectory) {
    Copy-Item -LiteralPath $entry.Source -Destination $destinationPath -Recurse -Force
    return
  }

  Copy-Item -LiteralPath $entry.Source -Destination $destinationPath -Force
}

$installer = $null
$retryCount = 12
$retryDelayMs = 750

for ($attempt = 1; $attempt -le $retryCount; $attempt++) {
  $installer = Find-Installer -directory $installerDirectory -versionValue $version -preferredName $preferredInstallerName
  if ($installer) {
    break
  }

  if ($attempt -lt $retryCount) {
    Start-Sleep -Milliseconds $retryDelayMs
  }
}

if (-not $installer) {
  throw "Installer not found in '$installerDirectory' for version '$version' after waiting $([Math]::Round(($retryCount * $retryDelayMs) / 1000, 1))s. Run 'pnpm tauri build --debug' and confirm the NSIS bundle completed successfully."
}

$installerName = $installer.Name
$installerSource = $installer.FullName

if (Test-Path -LiteralPath $releaseFolder) {
  Remove-Item -LiteralPath $releaseFolder -Recurse -Force
}

New-Item -ItemType Directory -Path $releaseFolder -Force | Out-Null

$commonFiles = @(
  @{ Source = $installerSource; Destination = $installerName }
  @{ Source = (Join-Path $repoRoot "README.md"); Destination = "README.md" }
  @{ Source = (Join-Path $repoRoot "PRIVACY.md"); Destination = "PRIVACY.md" }
  @{ Source = (Join-Path $repoRoot "EULA.md"); Destination = "EULA.md" }
  @{ Source = (Join-Path $repoRoot "RELEASE_NOTES.md"); Destination = "RELEASE_NOTES.md" }
  @{ Source = (Join-Path $repoRoot "TESTING.md"); Destination = "TESTING.md" }
  @{ Source = (Join-Path $repoRoot "docs\COMPATIBILITY.md"); Destination = "COMPATIBILITY.md" }
  @{ Source = (Join-Path $repoRoot "public\logo.svg"); Destination = "logo.svg" }
)

$channelFiles =
  if ($Channel -eq "beta") {
    @(
      @{ Source = (Join-Path $repoRoot "BETA_README.md"); Destination = "BETA_README.md" }
      @{ Source = (Join-Path $repoRoot "RC_CHECKLIST.md"); Destination = "RC_CHECKLIST.md" }
      @{ Source = (Join-Path $repoRoot "docs\SIGNING.md"); Destination = "SIGNING.md" }
      @{ Source = (Join-Path $repoRoot "tools-handoff"); Destination = "tools-handoff"; IsDirectory = $true }
    )
  } else {
    @(
      @{ Source = (Join-Path $repoRoot "ROADMAP.md"); Destination = "ROADMAP.md" }
    )
  }

$filesToCopy = @($commonFiles + $channelFiles)
Require-Files $filesToCopy

foreach ($file in $filesToCopy) {
  Copy-ReleaseEntry -entry $file -releaseFolderPath $releaseFolder
}

$checksumsPath = Join-Path $releaseFolder "CHECKSUMS.txt"
$hashLines = Get-ChildItem -LiteralPath $releaseFolder -File -Recurse |
  Where-Object { $_.Name -ne "CHECKSUMS.txt" } |
  Sort-Object FullName |
  ForEach-Object {
    $hash = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256
    $relativePath = $_.FullName.Substring($releaseFolder.Length + 1).Replace("\", "/")
    "{0}  {1}" -f $hash.Hash.ToLowerInvariant(), $relativePath
  }

@(
  "# TRInk $Channel release checksums"
  "# Version: $version"
  "# Algorithm: SHA256"
  ""
  $hashLines
) | Set-Content -LiteralPath $checksumsPath

Write-Output "Created $Channel release package:"
Write-Output $releaseFolder
