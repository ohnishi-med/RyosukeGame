Add-Type -AssemblyName System.Drawing

$sourceFile = "ryoppy_sheet.png"
$rows = 2
$cols = 5

$currentDir = Get-Location
$fullPath = "$currentDir\$sourceFile"

if (Test-Path $fullPath) {
    Write-Host "Processing $fullPath..."
    
    # Load image safely
    $stream = [System.IO.File]::OpenRead($fullPath)
    $img = [System.Drawing.Bitmap]::FromStream($stream)
    
    $cellW = [int]($img.Width / $cols)
    $cellH = [int]($img.Height / $rows)
    
    # Get background color from top-left pixel
    $bgColor = $img.GetPixel(0, 0)
    Write-Host "Detected Background Color: $bgColor"
    
    $count = 0
    
    for ($y = 0; $y -lt $rows; $y++) {
        for ($x = 0; $x -lt $cols; $x++) {
            
            # Destination Rectangle (Source)
            $rect = New-Object System.Drawing.Rectangle([int]($x * $cellW), [int]($y * $cellH), $cellW, $cellH)
            
            # Clone the slice
            $cropped = $img.Clone($rect, $img.PixelFormat)
            
            # Make Transparent
            $cropped.MakeTransparent($bgColor)
            
            # Save
            $filename = "$currentDir\ryoppy_$count.png"
            $cropped.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
            
            Write-Host "Saved $filename"
            
            $cropped.Dispose()
            $count++
        }
    }
    
    $stream.Close()
    $img.Dispose()
    Write-Host "All 10 characters extracted and transparency applied."
}
else {
    Write-Error "File $sourceFile not found!"
}
