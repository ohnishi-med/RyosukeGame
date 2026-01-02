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
    [System.Drawing.Color]::FromArgb(40, 40, 40),     # 8: Black
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
    $borderColor = if ($i -eq 8) { [System.Drawing.Color]::White } else { [System.Drawing.Color]::Black }
    
    # --- 1. Draw Legs (Wavy Octo-legs) ---
    for ($j = 0; $j -lt 8; $j++) {
        $angleDeg = ($j * 25 - 15) + 45
        $rad = $angleDeg * [Math]::PI / 180.0
        
        $cx = 128
        $cy = 130
        
        # Calculate coordinates explicitly
        $x1 = $cx + [int]([Math]::Cos($rad) * 40)
        $y1 = $cy + [int]([Math]::Sin($rad) * 40)
        
        $x2 = $cx + [int]([Math]::Cos($rad) * 70 + 20)
        $y2 = $cy + [int]([Math]::Sin($rad) * 70)
        
        $x3 = $cx + [int]([Math]::Cos($rad) * 90 - 10)
        $y3 = $cy + [int]([Math]::Sin($rad) * 90 + 10)
        
        $p1 = New-Object System.Drawing.Point($x1, $y1)
        $p2 = New-Object System.Drawing.Point($x2, $y2)
        $p3 = New-Object System.Drawing.Point($x3, $y3)
        $points = @($p1, $p2, $p3)
        
        $legPen = New-Object System.Drawing.Pen($baseColor, 25)
        $legPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $legPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        
        $legBorderPen = New-Object System.Drawing.Pen($borderColor, 31)
        $legBorderPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $legBorderPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        
        $g.DrawCurve($legBorderPen, $points)
        $g.DrawCurve($legPen, $points)
    }

    $pen = New-Object System.Drawing.Pen($borderColor, 6)

    # --- 2. Draw Round Octopus Head ---
    $headRect = New-Object System.Drawing.Rectangle(48, 20, 160, 150)
    $g.FillEllipse($brush, $headRect)
    $g.DrawEllipse($pen, $headRect)

    # --- 3. Big Friendly Eyes ---
    $eyeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    
    # Left Eye
    $g.FillEllipse($whiteBrush, 75, 70, 45, 45)
    $g.DrawEllipse($pen, 75, 70, 45, 45)
    $g.FillEllipse($eyeBrush, 90, 80, 20, 20)
    
    # Right Eye
    $g.FillEllipse($whiteBrush, 135, 70, 45, 45)
    $g.DrawEllipse($pen, 135, 70, 45, 45)
    $g.FillEllipse($eyeBrush, 145, 80, 20, 20)
    
    # --- 4. Octopus Mouth (Funnel) ---
    $g.DrawArc($pen, 115, 120, 26, 15, 0, 180)
    
    # --- 5. Spots ---
    $spotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(50, 255, 255, 255))
    $g.FillEllipse($spotBrush, 60, 40, 20, 15)
    $g.FillEllipse($spotBrush, 170, 50, 15, 15)
    $g.FillEllipse($spotBrush, 100, 30, 25, 20)

    $filename = "$currentDir\ryoppy_$i.png"
    $bmp.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created Octopus-v2 $i"
}
