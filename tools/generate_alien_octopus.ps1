Add-Type -AssemblyName System.Drawing

$colors = @(
    [System.Drawing.Color]::FromArgb(255, 60, 60),    # 0: Red
    [System.Drawing.Color]::White,                    # 1: White
    [System.Drawing.Color]::FromArgb(60, 255, 60),    # 2: Green
    [System.Drawing.Color]::Yellow,                   # 3: Yellow
    [System.Drawing.Color]::FromArgb(255, 182, 193),  # 4: Pink
    [System.Drawing.Color]::FromArgb(147, 112, 219),  # 5: Purple
    [System.Drawing.Color]::Orange,                   # 6: Orange
    [System.Drawing.Color]::Cyan,                     # 7: Light Blue
    [System.Drawing.Color]::FromArgb(40, 40, 40),     # 8: Black (lighter to see contour)
    [System.Drawing.Color]::Gray                      # 9: Grey
)

$size = 256
$currentDir = Get-Location

for ($i = 0; $i -lt 10; $i++) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    $baseColor = $colors[$i]
    $brush = New-Object System.Drawing.SolidBrush($baseColor)
    # Border color: White for Black char, Black for others
    $borderColor = if ($i -eq 8) { [System.Drawing.Color]::White } else { [System.Drawing.Color]::Black }
    $pen = New-Object System.Drawing.Pen($borderColor, 6)
    
    # --- 1. Draw Tentacles (Wavy bottom) ---
    for ($j = 0; $j -lt 6; $j++) {
        $lx = 40 + $j * 30
        $ly = 180 + [Math]::Sin($j) * 10
        $legRect = New-Object System.Drawing.Rectangle([int]$lx, [int]$ly, 35, 35)
        $g.FillEllipse($brush, $legRect)
        $g.DrawEllipse($pen, $legRect)
    }

    # --- 2. Draw Alien Head (Pear/Dome Shape) ---
    $headRect = New-Object System.Drawing.Rectangle(50, 40, 156, 160)
    $g.FillEllipse($brush, $headRect)
    $g.DrawEllipse($pen, $headRect)

    # --- 3. Draw Antennae ---
    $antPen = New-Object System.Drawing.Pen($baseColor, 8)
    $antBorder = New-Object System.Drawing.Pen($borderColor, 8)
    
    # Left Antenna
    $g.DrawLine($antBorder, 80, 50, 60, 20)
    $g.DrawLine($antPen, 80, 50, 60, 20)
    $g.FillEllipse($brush, 50, 10, 20, 20)
    $g.DrawEllipse($pen, 50, 10, 20, 20)

    # Right Antenna
    $g.DrawLine($antBorder, 176, 50, 196, 20)
    $g.DrawLine($antPen, 176, 50, 196, 20)
    $g.FillEllipse($brush, 186, 10, 20, 20)
    $g.DrawEllipse($pen, 186, 10, 20, 20)

    # --- 4. Draw Alien Eyes (Slanted) ---
    $eyeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    if ($i -eq 8) { $eyeBrush.Color = [System.Drawing.Color]::Cyan } # Glowing eyes for black alien
    
    # Save state
    $state = $g.Save()
    
    # Left Eye
    $g.TranslateTransform(90, 110)
    $g.RotateTransform(-25)
    $g.FillEllipse($eyeBrush, -25, -35, 50, 70)
    # Eye Highlight
    $g.FillEllipse([System.Drawing.Brushes]::White, -10, -20, 15, 15)
    $g.Restore($state)
    
    $state = $g.Save()
    # Right Eye
    $g.TranslateTransform(166, 110)
    $g.RotateTransform(25)
    $g.FillEllipse($eyeBrush, -25, -35, 50, 70)
    # Eye Highlight
    $g.FillEllipse([System.Drawing.Brushes]::White, -10, -20, 15, 15)
    $g.Restore($state)
    
    # --- 5. Small Mouth (Optional) ---
    $g.DrawArc($pen, 118, 170, 20, 10, 0, 180)

    $filename = "$currentDir\ryoppy_$i.png"
    $bmp.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created Alien-Octopus $i"
}
