param(
  [Parameter(Mandatory=$true)][string]$Edition,
  [string]$Folder = "$env:USERPROFILE\OneDrive\PrimeSphere\Instagram\Publicacoes_Diarias",
  [Parameter(Mandatory=$true)][string]$CaptionFile
)
$ErrorActionPreference = "Stop"
if ($Edition -notmatch '^\d{4}-\d{2}-\d{2}$') { throw "Edition must be YYYY-MM-DD" }
$key = Read-Host "PUBLISH_ADMIN_KEY"
$root = "https://primesphereintelligence.com"
for ($i=1; $i -le 8; $i++) {
  $num = "{0:D2}" -f $i
  $file = Join-Path $Folder "PrimeSphere_${Edition}_card_${num}.png"
  if (-not (Test-Path -LiteralPath $file)) { throw "Missing card: $file" }
}
if (-not (Test-Path -LiteralPath $CaptionFile)) { throw "Missing caption file" }
$caption = Get-Content -LiteralPath $CaptionFile -Raw -Encoding UTF8
if ([string]::IsNullOrWhiteSpace($caption) -or $caption.Length -gt 2200) { throw "Caption must be 1-2200 characters" }
for ($i=1; $i -le 8; $i++) {
  $num = "{0:D2}" -f $i
  $file = Join-Path $Folder "PrimeSphere_${Edition}_card_${num}.png"
  $result = Invoke-RestMethod -Uri "$root/api/publisher/media/$Edition/card_$num.png" -Method Post -Headers @{ "X-Publisher-Key" = $key } -ContentType "image/png" -InFile $file
  if (-not $result.uploaded) { throw "Upload failed: $num" }
  Write-Host "Uploaded card $num"
}
$manifest = @{ caption = $caption.Trim(); approved = $true } | ConvertTo-Json -Compress
Invoke-RestMethod -Uri "$root/api/publisher/instagram/edition/$Edition" -Method Post -Headers @{ "X-Publisher-Key" = $key } -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($manifest)) | Out-Null
Invoke-RestMethod -Uri "$root/api/publisher/instagram/edition/$Edition" -Method Get -Headers @{ "X-Publisher-Key" = $key } | Format-List
Write-Host "Edition staged; this script never publishes to Instagram."
