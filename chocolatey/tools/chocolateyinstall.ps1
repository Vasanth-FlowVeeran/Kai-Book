$ErrorActionPreference = 'Stop'

$packageArgs = @{
  packageName    = 'kaibook'
  fileType       = 'exe'                          # NSIS installer
  url64bit       = 'https://github.com/Vasanth-FlowVeeran/Kai-Book/releases/download/v1.0.0/KaiBook_1.0.0_x64-setup.exe'
  checksum64     = 'REPLACE_WITH_SHA256'
  checksumType64 = 'sha256'
  silentArgs     = '/S'                            # NSIS silent flag
  validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs
