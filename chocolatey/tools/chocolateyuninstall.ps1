$ErrorActionPreference = 'Stop'

$packageArgs = @{
  packageName    = 'kaibook'
  softwareName   = 'KaiBook*'
  fileType       = 'exe'
  silentArgs     = '/S'
  validExitCodes = @(0)
}

[array]$key = Get-UninstallRegistryKey -SoftwareName $packageArgs['softwareName']

if ($key.Count -eq 1) {
  $key | ForEach-Object {
    $packageArgs['file'] = "$($_.UninstallString)"
    Uninstall-ChocolateyPackage @packageArgs
  }
} elseif ($key.Count -eq 0) {
  Write-Warning "KaiBook has already been uninstalled by other means."
} elseif ($key.Count -gt 1) {
  Write-Warning "$($key.Count) matches found! Manual intervention may be needed."
  $key | ForEach-Object { Write-Warning "- $($_.DisplayName) $($_.DisplayVersion) - $($_.UninstallString)" }
}
