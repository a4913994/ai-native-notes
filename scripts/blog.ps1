param([Parameter(ValueFromRemainingArguments=$true)][string[]]$BunArgs = @('run','dev'))
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$rinBun = Join-Path $env:LOCALAPPDATA 'rin-tools\bun-1.3.13\bun-windows-x64\bun.exe'
if (Test-Path -LiteralPath $rinBun) {
    $env:PATH = "$(Split-Path $rinBun);$env:PATH"
} else {
    $rinBun = (Get-Command bun -ErrorAction Stop).Source
}
& $rinBun @BunArgs
exit $LASTEXITCODE
