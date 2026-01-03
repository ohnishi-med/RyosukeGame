Add-Type -AssemblyName System.Drawing

$sourceFile = "ryoppy_sheet.png"
$rows = 2
$cols = 5
$targetColor = [System.Drawing.Color]::FromArgb(255, 255, 255) # White

if (Test-Path $sourceFile) {
    Write-Host "Processing $sourceFile..."
    $fullPath = (Resolve-Path $sourceFile).Path
    $img = [System.Drawing.Bitmap]::FromFile($fullPath)
    
    $w = $img.Width / $cols
    $h = $img.Height / $rows
    
    $count = 0
    
    for ($y = 0; $y -lt $rows; $y++) {
        for ($x = 0; $x -lt $cols; $x++) {
            $rect = New-Object System.Drawing.Rectangle ($x * $w, $y * $h, $w, $h)
            $cropped = $img.Clone($rect, $img.PixelFormat)
            
            # Make transparent (Simple color keying)
            # For better results we usually use a fussiness factor, but let's try strict white first
            # Since the generator usually makes clean white backgrounds.
            $cropped.MakeTransparent($targetColor)
            
            # Save
            $filename = "ryoppy_$count.png"
            $cropped.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
            Write-Host "Saved $filename"
            
            $cropped.Dispose()
            $count++
        }
    }
    
    $img.Dispose()
    Write-Host "Done slicing."
}
else {
    Write-Error "Source file not found!"
}
