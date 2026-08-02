param(
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$serverScript = Join-Path $projectRoot "scripts\run-local-server.ps1"
$localUrl = "http://localhost:3001/"
$localPort = 3001

function Test-LocalPort {
  $client = [System.Net.Sockets.TcpClient]::new()

  try {
    $connectTask = $client.ConnectAsync("127.0.0.1", $localPort)
    if (-not $connectTask.Wait(300)) {
      return $false
    }

    return $client.Connected
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

if (-not (Test-LocalPort)) {
  if (-not (Test-Path -LiteralPath $serverScript)) {
    throw "The local server launcher could not find the project files."
  }

  $serverArguments = "-NoProfile -ExecutionPolicy Bypass -NoExit -File `"$serverScript`""

  Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList $serverArguments `
    -WorkingDirectory $projectRoot `
    -WindowStyle Minimized | Out-Null

  $isReady = $false
  # The first launch can be slow on synced drives, so allow up to about 3 minutes.
  for ($attempt = 0; $attempt -lt 240; $attempt += 1) {
    if (Test-LocalPort) {
      $isReady = $true
      break
    }

    Start-Sleep -Milliseconds 500
  }

  if (-not $isReady) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show(
      "The local server did not start. Open the minimized PowerShell window to view the error.",
      "Shop Cost Calculator",
      "OK",
      "Error"
    ) | Out-Null
    exit 1
  }
}

if (-not $NoOpen) {
  Start-Process $localUrl
}
