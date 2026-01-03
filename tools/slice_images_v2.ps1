Add-Type -AssemblyName System.Drawing

$sourceFile = "ryoppy_sheet.png"
$rows = 2
$cols = 5
$targetColor = [System.Drawing.Color]::FromArgb(255, 255, 255) # White

$currentDir = Get-Location
Write-Host "Current dir: $currentDir"

if (Test-Path $sourceFile) {
    Write-Host "Processing $sourceFile..."
    $fullPath = (Resolve-Path $sourceFile).Path
    
    # Load image safely
    $stream = [System.IO.File]::OpenRead($fullPath)
    $img = [System.Drawing.Image]::FromStream($stream)
    
    $w = [int]($img.Width / $cols)
    $h = [int]($img.Height / $rows)
    
    Write-Host "Image Size: $($img.Width)x$($img.Height). Cell Size: ${w}x${h}"
    
    $count = 0
    
    for ($y = 0; $y -lt $rows; $y++) {
        for ($x = 0; $x -lt $cols; $x++) {
            # Create new bitmap for the cell
            $target = New-Object System.Drawing.Bitmap($w, $h)
            $g = [System.Drawing.Graphics]::FromImage($target)
            
            # Destination and Source rectangles
            $destRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
            $srcRect = New-Object System.Drawing.Rectangle([int]($x * $w), [int]($y * $h), $w, $h)
            
            # Draw specific part
            $g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
            
            # Make transparent
            $target.MakeTransparent($targetColor)
            
            # Save
            $filename = "$currentDir\ryoppy_$count.png"
            $target.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
            Write-Host "Saved $filename"
            
            # Cleanup
            $g.Dispose()
            $target.Dispose()
            $count++
        }
    }
    
    $stream.Close()
    $img.Dispose()
    Write-Host "Done slicing."
}
else {
    Write-Error "Source file '$sourceFile' not found in $currentDir"
}
