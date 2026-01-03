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
    
    # 3D Gradient Brush for Head
    $rect = New-Object System.Drawing.Rectangle(48, 20, 160, 150)
    $gradientBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::White, $baseColor, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $blend = New-Object System.Drawing.Drawing2D.Blend
    $blend.Positions = @(0.0, 0.2, 1.0)
    $blend.Factors = @(0.0, 0.1, 1.0) # Highlight at top
    $gradientBrush.Blend = $blend
    
    $solidBrush = New-Object System.Drawing.SolidBrush($baseColor)
    $borderColor = if ($i -eq 8) { [System.Drawing.Color]::White } else { [System.Drawing.Color]::Black }
    $pen = New-Object System.Drawing.Pen($borderColor, 5)

    # --- 1. Draw Legs (Curly & 3D-ish) ---
    for ($j = 0; $j -lt 8; $j++) {
        $angleDeg = ($j * 28 - 20) + 40
        $rad = $angleDeg * [Math]::PI / 180.0
        
        $cx = 128
        $cy = 135
        
        # Bezier Control Points for organic curve
        $p1 = New-Object System.Drawing.Point($cx, $cy)
        $p2x = $cx + [int]([Math]::Cos($rad) * 60)
        $p2y = $cy + [int]([Math]::Sin($rad) * 60)
        $p2 = New-Object System.Drawing.Point($p2x, $p2y)
        
        # Curl the tip
        $radCurl = ($angleDeg + 30) * [Math]::PI / 180.0
        $p3x = $p2x + [int]([Math]::Cos($radCurl) * 40)
        $p3y = $p2y + [int]([Math]::Sin($radCurl) * 40)
        $p3 = New-Object System.Drawing.Point($p3x, $p3y)
        
        $p4x = $p3x + [int]([Math]::Cos($radCurl + 0.5) * 20)
        $p4y = $p3y + [int]([Math]::Sin($radCurl + 0.5) * 20)
        $p4 = New-Object System.Drawing.Point($p4x, $p4y)

        # Thick leg
        $legPen = New-Object System.Drawing.Pen($baseColor, 22)
        $legPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $legPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        
        $legBorderPen = New-Object System.Drawing.Pen($borderColor, 28)
        $legBorderPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $legBorderPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        
        # Draw Border
        $g.DrawBezier($legBorderPen, $p1, $p2, $p3, $p4)
        # Draw Fill
        $g.DrawBezier($legPen, $p1, $p2, $p3, $p4)
        
        # Draw Suckers (Dots)
        $suckerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 255, 255, 255))
        $mx = ($p2x + $p3x) / 2
        $my = ($p2y + $p3y) / 2
        $g.FillEllipse($suckerBrush, [int]$mx, [int]$my, 8, 8)
    }

    # --- 2. Draw 3D Head ---
    $g.FillEllipse($gradientBrush, $rect)
    $g.DrawEllipse($pen, $rect)

    # --- 3. Anime Eyes ---
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    
    # Left Eye
    $g.FillEllipse($whiteBrush, 70, 70, 50, 50)
    $g.DrawEllipse($pen, 70, 70, 50, 50)
    $g.FillEllipse($blackBrush, 85, 80, 25, 30) # Pupil
    $g.FillEllipse($whiteBrush, 90, 85, 10, 10) # Sparkle
    
    # Right Eye
    $g.FillEllipse($whiteBrush, 136, 70, 50, 50)
    $g.DrawEllipse($pen, 136, 70, 50, 50)
    $g.FillEllipse($blackBrush, 146, 80, 25, 30) # Pupil
    $g.FillEllipse($whiteBrush, 151, 85, 10, 10) # Sparkle
    
    # --- 4. Cute Mouth ---
    $mouthPen = New-Object System.Drawing.Pen($borderColor, 4)
    $g.DrawArc($mouthPen, 118, 125, 20, 10, 0, 180) # Smile
    
    # --- 5. Cheeks ---
    $cheekBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 255, 100, 100))
    $g.FillEllipse($cheekBrush, 60, 100, 20, 10)
    $g.FillEllipse($cheekBrush, 176, 100, 20, 10)

    $filename = "$currentDir\ryoppy_$i.png"
    $bmp.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created Octopus-v3 $i"
}
