Add-Type -AssemblyName System.Drawing

$colors = @(
    [System.Drawing.Color]::FromArgb(220, 50, 50),    # 0: Red
    [System.Drawing.Color]::White,                    # 1: White
    [System.Drawing.Color]::FromArgb(60, 200, 60),    # 2: Green
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

function Create-Point ($x, $y) {
    return New-Object System.Drawing.Point -ArgumentList $x, $y
}

for ($i = 0; $i -lt 10; $i++) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    $baseColor = $colors[$i]
    $darkColor = [System.Drawing.ControlPaint]::Dark($baseColor)
    
    $brush = New-Object System.Drawing.SolidBrush($baseColor)
    $bellyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 250, 220))
    $borderColor = if ($i -eq 8) { [System.Drawing.Color]::White } else { [System.Drawing.Color]::Black }
    $pen = New-Object System.Drawing.Pen($borderColor, 5)

    # --- 1. Wings (Spiky & Cool) ---
    $wingBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, $darkColor.R, $darkColor.G, $darkColor.B))
    
    # Left Wing
    $wingL = @(
        (Create-Point 90 110),
        (Create-Point 20 60),
        (Create-Point 50 100),
        (Create-Point 30 130),
        (Create-Point 80 140)
    )
    $g.FillPolygon($wingBrush, [System.Drawing.Point[]]$wingL)
    $g.DrawPolygon($pen, [System.Drawing.Point[]]$wingL)

    # Right Wing
    $wingR = @(
        (Create-Point 166 110),
        (Create-Point 236 60),
        (Create-Point 206 100),
        (Create-Point 226 130),
        (Create-Point 176 140)
    )
    $g.FillPolygon($wingBrush, [System.Drawing.Point[]]$wingR)
    $g.DrawPolygon($pen, [System.Drawing.Point[]]$wingR)

    # --- 2. Heavy Tail (Curved) ---
    $tailPoly = @(
        (Create-Point 60 200),
        (Create-Point 20 180),
        (Create-Point 10 130),
        (Create-Point 40 160),
        (Create-Point 80 180)
    )
    $g.FillClosedCurve($brush, [System.Drawing.Point[]]$tailPoly)
    $g.DrawClosedCurve($pen, [System.Drawing.Point[]]$tailPoly)

    # --- 3. Body (Stout/Strong) ---
    $bodyRect = New-Object System.Drawing.Rectangle(70, 100, 116, 120)
    $g.FillEllipse($brush, $bodyRect)
    $g.DrawEllipse($pen, $bodyRect)
    
    # Belly Scales (Stripes)
    $bellyRect = New-Object System.Drawing.Rectangle(90, 120, 76, 90)
    $g.FillEllipse($bellyBrush, $bellyRect)
    # Horizontal lines on belly
    $g.DrawLine($pen, 100, 140, 156, 140)
    $g.DrawLine($pen, 95, 160, 161, 160)
    $g.DrawLine($pen, 100, 180, 156, 180)

    # --- 4. Head (Diamond/Reptile Shape) ---
    # Create a polygon for the head instead of a circle
    $headPoints = @(
        (Create-Point 128 30),  # Top
        (Create-Point 180 60),  # Right Ear/Cheek
        (Create-Point 170 110), # Right Jaw
        (Create-Point 128 130), # Chin
        (Create-Point 86 110),  # Left Jaw
        (Create-Point 76 60)    # Left Ear/Cheek
    )
    $g.FillPolygon($brush, [System.Drawing.Point[]]$headPoints)
    $g.DrawPolygon($pen, [System.Drawing.Point[]]$headPoints)

    # --- 5. Horns (Sharp) ---
    $hornBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::WhiteSmoke)
    
    # Left Horn
    $h1 = @(
        (Create-Point 90 45),
        (Create-Point 70 10),
        (Create-Point 105 45)
    )
    $g.FillPolygon($hornBrush, [System.Drawing.Point[]]$h1)
    $g.DrawPolygon($pen, [System.Drawing.Point[]]$h1)
    
    # Right Horn
    $h2 = @(
        (Create-Point 151 45),
        (Create-Point 186 10),
        (Create-Point 166 45)
    )
    $g.FillPolygon($hornBrush, [System.Drawing.Point[]]$h2)
    $g.DrawPolygon($pen, [System.Drawing.Point[]]$h2)

    # --- 6. Eyes (Vertical Pupils = Reptile) ---
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    $eyeColor = [System.Drawing.Color]::Yellow
    $eyeBrush = New-Object System.Drawing.SolidBrush($eyeColor)

    # Left Eye
    $g.FillEllipse($whiteBrush, 85, 70, 35, 30)
    $g.DrawEllipse($pen, 85, 70, 35, 30)
    # Iris
    $g.FillEllipse($eyeBrush, 95, 70, 15, 30)
    # Pupil (Vertical Slit)
    $g.FillRectangle($blackBrush, 100, 72, 5, 26)
    
    # Right Eye
    $g.FillEllipse($whiteBrush, 136, 70, 35, 30)
    $g.DrawEllipse($pen, 136, 70, 35, 30)
    # Iris
    $g.FillEllipse($eyeBrush, 146, 70, 15, 30)
    # Pupil (Vertical Slit)
    $g.FillRectangle($blackBrush, 151, 72, 5, 26)

    # --- 7. Nostrils (Simple Slits) ---
    $g.DrawLine($pen, 115, 110, 120, 115)
    $g.DrawLine($pen, 141, 110, 136, 115)

    $filename = "$currentDir\ryoppy_$i.png"
    $bmp.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created Dragon-v2 $i"
}
