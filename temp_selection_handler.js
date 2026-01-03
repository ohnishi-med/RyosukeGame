
// --- SELECTION SCREEN CLICK HANDLER ---
canvas.addEventListener('mousedown', function (e) {
    if (gameState !== 'SELECTION') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // 1. Check Character Select (10 grid items)
    for (let i = 0; i < 10; i++) {
        let row = Math.floor(i / 5);
        let col = i % 5;
        let cx = 50 + col * 140;
        let cy = 150 + row * 150;
        if (clickX > cx && clickX < cx + 100 && clickY > cy && clickY < cy + 100) {
            startNewGame(i);
            return;
        }
    }

    // 2. Check Level Length
    const lengths = [2000, 4000, 6000, 8000, 10000];
    for (let j = 0; j < 5; j++) {
        let lx = 50 + j * 110;
        let ly = 20;
        if (clickX > lx && clickX < lx + 100 && clickY > ly && clickY < ly + 40) {
            selectedLevelLength = lengths[j];
        }
    }

    // 3. Check Boss Mode Button
    if (clickX > 600 && clickX < 780 && clickY > 20 && clickY < 80) {
        bossMode = !bossMode;
    }
});
