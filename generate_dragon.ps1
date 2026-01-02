Add-Type -AssemblyName System.Drawing

$colors = @(
    [System.Drawing.Color]::FromArgb(220, 50, 50),    # 0: Red
    [System.Drawing.Color]::FromArgb(240, 240, 240),  # 1: White
    [System.Drawing.Color]::FromArgb(50, 200, 50),    # 2: Green
    [System.Drawing.Color]::FromArgb(255, 215, 0),    # 3: Yellow (Gold)
    [System.Drawing.Color]::FromArgb(255, 105, 180),  # 4: Pink
    [System.Drawing.Color]::FromArgb(147, 112, 219),  # 5: Purple
    [System.Drawing.Color]::FromArgb(255, 140, 0),    # 6: Orange
    [System.Drawing.Color]::FromArgb(0, 191, 255),    # 7: Light Blue
    [System.Drawing.Color]::FromArgb(50, 50, 50),     # 8: Black
    [System.Drawing.Color]::FromArgb(169, 169, 169)   # 9: Grey (Silver)
)

$size = 256
$currentDir = Get-Location

for ($i = 0; $i -lt 10; $i++) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    $baseColor = $colors[$i]
    $darkColor = [System.Drawing.ControlPaint]::Dark($baseColor)
    $lightColor = [System.Drawing.ControlPaint]::Light($baseColor)
    
    $brush = New-Object System.Drawing.SolidBrush($baseColor)
    $bellyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 255, 255, 220)) # Cream color belly
    if ($i -eq 1) { $bellyBrush.Color = [System.Drawing.Color]::FromArgb(200, 255, 200, 200) } # Pinkish for white dragon
    
    $borderColor = if ($i -eq 8) { [System.Drawing.Color]::White } else { [System.Drawing.Color]::Black }
    $pen = New-Object System.Drawing.Pen($borderColor, 5)

    # --- 1. Tail (Behind body) ---
    $tailPoints = @(
        New-Object System.Drawing.Point(60, 180),
        New-Object System.Drawing.Point(30, 180),
        New-Object System.Drawing.Point(10, 140),
        New-Object System.Drawing.Point(40, 150)
    )
    $g.FillClosedCurve($brush, $tailPoints)
    $g.DrawClosedCurve($pen, $tailPoints)
    # Tail triangular tip
    $tipPoints = @(
        New-Object System.Drawing.Point(10, 140),
        New-Object System.Drawing.Point(0, 120),
        New-Object System.Drawing.Point(25, 125)
    )
    $g.FillPolygon($brush, $tipPoints)
    $g.DrawPolygon($pen, $tipPoints)

    # --- 2. Wings (Behind body) ---
    $wingBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, $darkColor.R, $darkColor.G, $darkColor.B))
    # Left Wing
    $wingL = @(
        New-Object System.Drawing.Point(80, 100),
        New-Object System.Drawing.Point(20, 60),
        New-Object System.Drawing.Point(40, 110),
        New-Object System.Drawing.Point(70, 130)
    )
    $g.FillPolygon($wingBrush, $wingL)
    $g.DrawPolygon($pen, $wingL)

    # Right Wing
    $wingR = @(
        New-Object System.Drawing.Point(176, 100),
        New-Object System.Drawing.Point(236, 60),
        New-Object System.Drawing.Point(216, 110),
        New-Object System.Drawing.Point(186, 130)
    )
    $g.FillPolygon($wingBrush, $wingR)
    $g.DrawPolygon($pen, $wingR)

    # --- 3. Body (Pear Shape) ---
    $bodyRect = New-Object System.Drawing.Rectangle(70, 90, 116, 130)
    $g.FillEllipse($brush, $bodyRect)
    $g.DrawEllipse($pen, $bodyRect)
    
    # Belly Patch
    $bellyRect = New-Object System.Drawing.Rectangle(90, 120, 76, 90)
    $g.FillEllipse($bellyBrush, $bellyRect)

    # --- 4. Head ---
    $headRect = New-Object System.Drawing.Rectangle(60, 30, 136, 110)
    $g.FillEllipse($brush, $headRect)
    $g.DrawEllipse($pen, $headRect)

    # --- 5. Snout ---
    $snoutRect = New-Object System.Drawing.Rectangle(100, 90, 56, 40)
    $g.FillEllipse($lightColor, $snoutRect)
    $g.DrawEllipse($pen, $snoutRect)
    # Nostrils
    $g.FillEllipse([System.Drawing.Brushes]::Black, 115, 105, 6, 8)
    $g.FillEllipse([System.Drawing.Brushes]::Black, 135, 105, 6, 8)

    # --- 6. Horns ---
    $hornBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Khaki)
    # Left Horn
    $h1 = @(New-Object System.Drawing.Point(85, 40), New-Object System.Drawing.Point(70, 10), New-Object System.Drawing.Point(100, 35))
    $g.FillPolygon($hornBrush, $h1)
    $g.DrawPolygon($pen, $h1)
    # Right Horn
    $h2 = @(New-Object System.Drawing.Point(156, 40), New-Object System.Drawing.Point(186, 10), New-Object System.Drawing.Point(171, 35))
    $g.FillPolygon($hornBrush, $h2)
    $g.DrawPolygon($pen, $h2)

    # --- 7. Eyes ---
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    
    # Left Eye
    $g.FillEllipse($whiteBrush, 75, 60, 30, 40)
    $g.DrawEllipse($pen, 75, 60, 30, 40)
    $g.FillEllipse($blackBrush, 85, 70, 10, 15)
    
    # Right Eye
    $g.FillEllipse($whiteBrush, 151, 60, 30, 40)
    $g.DrawEllipse($pen, 151, 60, 30, 40)
    $g.FillEllipse($blackBrush, 161, 70, 10, 15)

    # --- 8. Spikes on back (Optional) ---
    
    $filename = "$currentDir\ryoppy_$i.png"
    $bmp.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created Dragon $i"
}
