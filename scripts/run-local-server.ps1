$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

try {
  $Host.UI.RawUI.WindowTitle = "Shop Cost Calculator - Local Server (close to stop)"
} catch {
  # Some PowerShell hosts do not expose a writable console title.
}

& node.exe (Join-Path $projectRoot "scripts\fix-vinext-windows-assets.mjs")
if ($LASTEXITCODE -ne 0) {
  throw "Failed to apply the Windows static asset compatibility fix."
}

& npm.cmd run start -- --port 3001
