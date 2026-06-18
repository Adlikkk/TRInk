param(
  [ValidateSet("basic", "trading")]
  [string]$Edition = "trading",
  [ValidateSet("internal", "beta")]
  [string]$Channel = "beta"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$editionConfig = Get-Content (Join-Path $repoRoot "config\edition-config.json") | ConvertFrom-Json
$editionMetadata = $editionConfig.editions.$Edition
if (-not $editionMetadata) {
  throw "Edition metadata '$Edition' is missing from config\edition-config.json."
}

$version = [string]$editionMetadata.version
$releaseRoot = Join-Path $repoRoot "release"
$installerDirectory = Join-Path $repoRoot "src-tauri\target\debug\bundle\nsis"
$editionLabel = [string]$editionMetadata.productName
$expectedInstallerName = "{0}_{1}_x64-setup.exe" -f $editionMetadata.installerBaseName, $version
$releaseFolderName = [string]$editionMetadata.releaseFolder
$releaseFolder = Join-Path $releaseRoot $releaseFolderName

function Find-Installer([string]$directory, [string]$expectedName) {
  if (-not (Test-Path -LiteralPath $directory)) {
    return $null
  }

  return Get-ChildItem -LiteralPath $directory -File |
    Where-Object { $_.Name -eq $expectedName } |
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
for ($attempt = 1; $attempt -le 12; $attempt++) {
  $installer = Find-Installer -directory $installerDirectory -expectedName $expectedInstallerName
  if ($installer) {
    break
  }

  if ($attempt -lt 12) {
    Start-Sleep -Milliseconds 750
  }
}

if (-not $installer) {
  $availableInstallers = if (Test-Path -LiteralPath $installerDirectory) {
    (Get-ChildItem -LiteralPath $installerDirectory -File | Select-Object -ExpandProperty Name) -join ", "
  } else {
    "<missing installer directory>"
  }
  throw "Expected installer '$expectedInstallerName' was not found in '$installerDirectory'. Available files: $availableInstallers"
}

if (Test-Path -LiteralPath $releaseFolder) {
  Remove-Item -LiteralPath $releaseFolder -Recurse -Force
}

New-Item -ItemType Directory -Path $releaseFolder -Force | Out-Null

$commonFiles = @(
  @{ Source = $installer.FullName; Destination = $installer.Name }
  @{ Source = (Join-Path $repoRoot "LICENSE.md"); Destination = "LICENSE.md" }
  @{ Source = (Join-Path $repoRoot "PRIVACY.md"); Destination = "PRIVACY.md" }
  @{ Source = (Join-Path $repoRoot "EULA.md"); Destination = "EULA.md" }
  @{ Source = (Join-Path $repoRoot "public\logo-bg.svg"); Destination = "logo-bg.svg" }
  @{ Source = (Join-Path $repoRoot "docs\EDITIONS.md"); Destination = "EDITIONS.md" }
  @{ Source = (Join-Path $repoRoot "docs\VERSIONING.md"); Destination = "VERSIONING.md" }
)

$editionFiles =
  if ($Edition -eq "basic") {
    @(
      @{ Source = (Join-Path $repoRoot "README_BASIC.md"); Destination = "README_BASIC.md" }
      @{ Source = (Join-Path $repoRoot "RELEASE_NOTES_BASIC.md"); Destination = "RELEASE_NOTES_BASIC.md" }
      @{ Source = (Join-Path $repoRoot "TESTING_BASIC.md"); Destination = "TESTING_BASIC.md" }
    )
  } else {
    @(
      @{ Source = (Join-Path $repoRoot "README.md"); Destination = "README.md" }
      @{ Source = (Join-Path $repoRoot "RC_CHECKLIST.md"); Destination = "RC_CHECKLIST.md" }
      @{ Source = (Join-Path $repoRoot "RELEASE_NOTES.md"); Destination = "RELEASE_NOTES.md" }
      @{ Source = (Join-Path $repoRoot "TESTING.md"); Destination = "TESTING.md" }
      @{ Source = (Join-Path $repoRoot "docs\COMPATIBILITY.md"); Destination = "COMPATIBILITY.md" }
      @{ Source = (Join-Path $repoRoot "docs\SIGNING.md"); Destination = "SIGNING.md" }
      @{ Source = (Join-Path $repoRoot "docs\UPDATER.md"); Destination = "UPDATER.md" }
    )
  }

$channelFiles =
  if ($Edition -eq "trading" -and $Channel -eq "beta") {
    @(
      @{ Source = (Join-Path $repoRoot "BETA_README.md"); Destination = "BETA_README.md" }
      @{ Source = (Join-Path $repoRoot "tools-handoff"); Destination = "tools-handoff"; IsDirectory = $true }
    )
  } else {
    @()
  }

$filesToCopy = @($commonFiles + $editionFiles + $channelFiles)
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
  "# $editionLabel $Channel release checksums"
  "# Version: $version"
  "# Algorithm: SHA256"
  ""
  $hashLines
) | Set-Content -LiteralPath $checksumsPath

Write-Output "Created $Edition $Channel release package:"
Write-Output $releaseFolder
