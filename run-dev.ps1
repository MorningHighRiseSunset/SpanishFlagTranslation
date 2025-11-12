<#
Prompt for a Google API key (secure input), set it for this PowerShell session, run `netlify dev`, and then clear the env var when Netlify exits.
This file is safe to keep in the repo because it does NOT store keys.
Usage: .\run-dev.ps1
#>

$secureKey = Read-Host -AsSecureString "Paste your Google API key (input will be hidden)"
if (-not $secureKey) {
    Write-Host "No key entered. Exiting." -ForegroundColor Yellow
    exit 1
}
# convert SecureString to plain string in memory
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try {
    $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

# set env var for this session
$env:GOOGLE_API_KEY = $plainKey
Write-Host "GOOGLE_API_KEY set for this session. Starting Netlify Dev..." -ForegroundColor Green

try {
    netlify dev
} finally {
    # remove env var from session when netlify dev exits
    Remove-Item Env:\GOOGLE_API_KEY -ErrorAction SilentlyContinue
    Write-Host "GOOGLE_API_KEY cleared from session." -ForegroundColor Green
}
