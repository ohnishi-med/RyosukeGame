Add-Type -AssemblyName System.Drawing

function Slice-Grid ($inputFile, $startId, $count) {
    if (-not (Test-Path $inputFile)) { return }
    
    $fullPath = (Resolve-Path $inputFile).Path
    $img = [System.Drawing.Bitmap]::FromFile($fullPath)
    $targetColor = [System.Drawing.Color]::FromArgb(135, 206, 235) # SkyBlue
    
    $w = [int]($img.Width / 2)
    $h = [int]($img.Height / 2)
    
    $current = 0
    for ($y = 0; $y -lt 2; $y++) {
        for ($x = 0; $x -lt 2; $x++) {
            if ($current -ge $count) { break }
            
            $rect = New-Object System.Drawing.Rectangle([int]($x * $w), [int]($y * $h), $w, $h)
            $cropped = $img.Clone($rect, $img.PixelFormat)
            $cropped.MakeTransparent($targetColor)
            
            $finalId = $startId + $current
            $filename = "ryoppy_$finalId.png"
            $cropped.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
            
            $cropped.Dispose()
            $current++
        }
    }
    $img.Dispose()
}

Slice-Grid "grid_a.png" 0 4
Slice-Grid "grid_b.png" 4 4
Slice-Grid "grid_c.png" 8 2
Write-Host "Done!"
