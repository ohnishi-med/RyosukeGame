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
    [System.Drawing.Color]::FromArgb(30, 30, 30),     # 8: Black
    [System.Drawing.Color]::Gray                      # 9: Grey
)

$size = 256
$currentDir = Get-Location

for ($i = 0; $i -lt 10; $i++) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    $color = $colors[$i]
    $brush = New-Object System.Drawing.SolidBrush($color)
    $blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 8)
    
    # Draw Head
    $headRect = New-Object System.Drawing.Rectangle(64, 32, 128, 140)
    $g.FillEllipse($brush, $headRect)
    $g.DrawEllipse($pen, $headRect)
    
    # Draw Legs (simplified arcs/bubbles)
    for ($j = 0; $j -lt 8; $j++) {
        $angle = ($j * 45 + 20) * [Math]::PI / 180
        $lx = 128 + [Math]::Cos($angle) * 70
        $ly = 160 + [Math]::Sin($angle) * 40
        $legRect = New-Object System.Drawing.Rectangle([int]($lx - 20), [int]($ly - 20), 40, 40)
        $g.FillEllipse($brush, $legRect)
        $g.DrawEllipse($pen, $legRect)
    }
    
    # Eyes
    $g.FillEllipse($whiteBrush, 90, 80, 30, 35)
    $g.FillEllipse($whiteBrush, 135, 80, 30, 35)
    $g.DrawEllipse($pen, 90, 80, 30, 35)
    $g.DrawEllipse($pen, 135, 80, 30, 35)
    
    $g.FillEllipse($blackBrush, 100, 95, 15, 15)
    $g.FillEllipse($blackBrush, 145, 95, 15, 15)
    
    # Mouth
    $g.DrawArc($pen, 113, 130, 30, 20, 0, 180)
    
    $filename = "$currentDir\ryoppy_$i.png"
    $bmp.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created Octopus $i"
}
