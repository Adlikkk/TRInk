$ErrorActionPreference = "Stop"

& (Join-Path $PSScriptRoot "package-release.ps1") -Channel "beta"
