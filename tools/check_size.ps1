Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('ryoppy_sheet.png')
Write-Host "Width: $($img.Width) Height: $($img.Height)"
$img.Dispose()
