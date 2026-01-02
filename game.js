const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
let player = {
    x: 20,
    y: 400, // Spawn in air to land safely
    width: 50,
    height: 50,
    dx: 0,
    dy: 0,
    speed: 5,
    jumpPower: -12,
    grounded: false,
    jumpCount: 0, // Track jumps
    maxJumps: 2,  // Allow double jump
    color: 'red',
    facingRight: true,
    hp: 4,
    maxHp: 4,
    invincible: 0, // Frames of invincibility
    lastSafeX: 20,
    lastSafeY: 400,
    damageTaken: false, // Track for perfect clear

    // Abilities
    canTripleShot: false,
    canHeal: false,
    healUsed: false,
    canFly: false,
    flyUsed: false,
    isFlying: false,
    flyTimer: 0,
    canTimeStop: false,
    timeStopUsed: false,
    isTimeStopped: false,
    timeStopTimer: 0,
    canInvincible: false,
    invincibleUsed: false,
    isSuperInvincible: false,
    isSuperInvincible: false,
    canStrongBeam: false,
    canSpeedUp: false,
    speedUpUsed: false,
    isSpeedUp: false,
    canSpeedUp: false,
    speedUpUsed: false,
    isSpeedUp: false,
    speedUpTimer: 0,
    canBuildBridge: false,
    bridgeBuilt: false,
    canPlaceBlock: false,
    blockCount: 0,
    isPlacingBlock: false
};

let gravity = 0.5;
let friction = 0.8;

let keys = {};

// Game State
let gameState = 'SELECTION'; // 'SELECTION', 'PLAYING', 'GAMEOVER', 'WIN'
let selectedLevelLength = 10000; // Default 1km (10000px)
let levelWidth = 10000;
let camera = { x: 0, y: 0 };

// Load Images
let characters = [];
for (let i = 0; i < 10; i++) {
    let img = new Image();
    img.src = `ryoppy_${i}.png`;
    characters.push(img);
}
let playerImg = characters[0]; // Default

const ballImg = new Image();
ballImg.src = 'ball.png';

const ironBallImg = new Image();
ironBallImg.src = 'iron_ball.png';

const chestImg = new Image();
chestImg.src = 'chest.png';

// Audio
const bgm = new Audio('bgm.mp3');
bgm.loop = true;
bgm.volume = 0.5;

// Game Objects
// Procedural Platform Generator
const generatePlatforms = (levelLen) => {
    let plats = [
        // --- Start Area (Safe Zone) ---
        { x: 0, y: 500, width: 200, height: 20 },
        { x: 200, y: 450, width: 150, height: 20 },
        { x: 50, y: 400, width: 80, height: 20 },
        { x: 450, y: 350, width: 150, height: 20 }
    ];

    // Generate segments from x=800 until boss area (levelLen - 800)
    let currentX = 800;
    while (currentX < levelLen - 800) {
        let type = Math.floor(Math.random() * 4); // 0-3

        if (type === 0) {
            // Steps Up
            plats.push({ x: currentX, y: 450, width: 100, height: 20 });
            plats.push({ x: currentX + 120, y: 350, width: 100, height: 20 });
            plats.push({ x: currentX + 240, y: 250, width: 100, height: 20 });
            currentX += 350;
        } else if (type === 1) {
            // Long Jump Gap
            plats.push({ x: currentX, y: 400, width: 100, height: 20 });
            plats.push({ x: currentX + 250, y: 400, width: 100, height: 20 });
            currentX += 350;
        } else if (type === 2) {
            // High Bridge (Lowered for better accessibility)
            plats.push({ x: currentX, y: 350, width: 50, height: 20 });
            plats.push({ x: currentX + 100, y: 250, width: 200, height: 20 }); // Bridge
            plats.push({ x: currentX + 350, y: 350, width: 50, height: 20 });
            currentX += 450;
        } else {
            // Low Ground Run
            plats.push({ x: currentX, y: 500, width: 300, height: 20 });
            currentX += 320;
        }
    }
    return plats;
};

// Initial placeholder (will be overwritten)
let platforms = [];

// Procedural Enemy Generator
const generateEnemies = (levelLen) => {
    let enemiesList = [
        { x: 500, y: 310, width: 40, height: 40, speed: 1.5, dir: 1, type: 'normal' }
    ];

    let currentX = 800;
    while (currentX < levelLen - 1500) { // Stop earlier so Boss is alone
        // Chance to spawn enemy per segment
        if (Math.random() < 0.7) {
            let type = Math.random() < 0.3 ? 'strong' : 'normal';
            let yPos = Math.random() < 0.5 ? 400 : 200; // Ground or High

            enemiesList.push({
                x: currentX + Math.random() * 200,
                y: yPos,
                width: type === 'strong' ? 50 : 40,
                height: type === 'strong' ? 50 : 40,
                speed: type === 'strong' ? 1 : 2 + Math.random(),
                dir: 1,
                type: type,
                hp: type === 'strong' ? 3 : 1, // Strong needs 3 hits
                maxHp: type === 'strong' ? 3 : 1
            });
        }
        currentX += 300; // Space them out
    }
    return enemiesList;
};

let enemies = [];

let goal = { x: 5800, y: 180, width: 60, height: 60 }; // Moved goal to near the end (6000)
let gameWon = false;

let lasers = [];
let enemyProjectiles = []; // Fireballs

// Helper to reset abilities
function setCharacterAbilities(idx) {
    // Red (0): Heal
    player.canHeal = (idx === 0);
    player.healUsed = false;

    // White (1): Triple Shot
    player.canTripleShot = (idx === 1);

    // Green (2): Triple Jump
    player.maxJumps = (idx === 2) ? 3 : 2;

    // Yellow (3): Fly
    player.canFly = (idx === 3);
    player.flyUsed = false;
    player.isFlying = false;
    player.flyTimer = 0;

    // Pink (4): Time Stop
    player.canTimeStop = (idx === 4);
    player.timeStopUsed = false;
    player.isTimeStopped = false;
    player.timeStopTimer = 0;

    // Purple (5): Invincible
    player.canInvincible = (idx === 5);
    player.invincibleUsed = false;
    player.isSuperInvincible = false;

    // Orange (6): Strong Beam
    player.canStrongBeam = (idx === 6);

    // Light Blue (7): Speed & Jump Up
    player.canSpeedUp = (idx === 7);
    player.speedUpUsed = false;
    player.isSpeedUp = false;
    // Light Blue (7): Speed & Jump Up
    player.canSpeedUp = (idx === 7);
    player.speedUpUsed = false;
    player.isSpeedUp = false;
    player.speedUpTimer = 0;

    // Black (8): Bridge Build
    player.canBuildBridge = (idx === 8);
    player.bridgeBuilt = false;

    // Grey (9): Block Builder
    player.canPlaceBlock = (idx === 9);
    player.isPlacingBlock = false;
    player.blockCount = 7;
}

// Game Start / Reset Function
function startNewGame(idx) {
    playerImg = characters[idx];
    gameState = 'PLAYING';
    gameWon = false;

    // Reset Player
    player.x = 20;
    player.y = 400;
    player.dx = 0;
    player.dy = 0;
    player.hp = player.maxHp;
    player.invincible = 0;
    player.damageTaken = false;
    player.lastSafeX = 20;
    player.lastSafeY = 400;

    // Reset Objects
    lasers = [];
    enemyProjectiles = [];
    platforms = generatePlatforms(selectedLevelLength);
    enemies = generateEnemies(selectedLevelLength);

    // Set Level
    levelWidth = selectedLevelLength;
    goal.x = levelWidth - 200;
    goal.active = false; // Hidden until boss defeated

    // Add Boss Enemy
    enemies.push({
        x: levelWidth - 400,
        y: 200, // On platform
        width: 100, // Big
        height: 100,
        speed: 2,
        dir: -1,
        type: 'boss',
        hp: 30,
        maxHp: 30,
        nextShot: 100 // Cooldown for fireball
    });

    // Add Goal Platform
    platforms.push({
        x: levelWidth - 500,
        y: 300,
        width: 500,
        height: 20
    });

    setCharacterAbilities(idx);

    bgm.currentTime = 0;
    bgm.play().catch(e => console.log('No BGM'));
}

// Event Listeners
document.addEventListener('keydown', function (e) {
    if (gameState === 'SELECTION') {
        const num = parseInt(e.key);
        if (!isNaN(num)) {
            let idx = num === 0 ? 9 : num - 1; // 1-9, 0=10
            if (idx < characters.length) {
                startNewGame(idx);
            }
        }
        return;
    }

    // Shooting Logic (Z Key)
    if (e.code === 'KeyZ') {
        let dir = player.facingRight ? 1 : -1;
        let speed = 10;

        let shots = [];
        if (player.canTripleShot) {
            // Triple Shot: Straight, Up-Diagonal, Down-Diagonal
            shots.push({ vx: speed * dir, vy: 0 });
            shots.push({ vx: speed * dir, vy: -2 }); // Diagonal Up
            shots.push({ vx: speed * dir, vy: 2 });  // Diagonal Down
        } else {
            // Normal Shot
            shots.push({ vx: speed * dir, vy: 0 });
        }

        shots.forEach(shot => {
            lasers.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                width: 30,
                height: 5,
                vx: shot.vx,
                vy: shot.vy,
                color: player.canStrongBeam ? 'orange' : 'yellow',
                isStrong: player.canStrongBeam
            });
        });
    }

    keys[e.code] = true;

    // Jump Logic (On Key Press)
    if (e.code === 'Space') {
        // If Flying, Space goes up
        if (player.isFlying) {
            // Handled in update
        } else {
            if (player.jumpCount < player.maxJumps) {
                let jumpForce = player.jumpPower;
                if (player.isSpeedUp) jumpForce *= 1.5; // 1.5x Jump Power (2x is too high!)

                if (player.jumpCount === 0) {
                    player.dy = jumpForce;
                } else {
                    player.dy = jumpForce * 0.7;
                }
                player.grounded = false;
                player.jumpCount++;
            }
        }
    }

    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', function (e) {
    keys[e.code] = false;
});

canvas.addEventListener('click', function (e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (gameState === 'SELECTION') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // LENGTH SELECTION BUTTONS (Top Row)
        const lengths = [2000, 4000, 6000, 8000, 10000];
        for (let j = 0; j < 5; j++) {
            if (mouseX > 50 + j * 110 && mouseX < 150 + j * 110 &&
                mouseY > 20 && mouseY < 60) {
                selectedLevelLength = lengths[j];
                return; // Updated length, don't select char yet
            }
        }

        for (let i = 0; i < 10; i++) {
            let row = Math.floor(i / 5);
            let col = i % 5;
            let cx = 50 + col * 140;
            let cy = 150 + row * 150;
            if (mouseX > cx && mouseX < cx + 100 &&
                mouseY > cy && mouseY < cy + 100) {
                startNewGame(i);
                break; // Stop loop once selected
            }
        }
    }
    else if (gameState === 'PLAYING') {
        // Heal Button Click (Red)
        if (player.canHeal && !player.healUsed) {
            if (mouseX > 650 && mouseX < 750 &&
                mouseY > 80 && mouseY < 120) {
                if (player.hp < player.maxHp) {
                    player.hp++;
                    player.healUsed = true;
                }
            }
        }

        // Fly Button Click (Yellow)
        if (player.canFly && !player.flyUsed && !player.isFlying) {
            if (mouseX > 650 && mouseX < 750 &&
                mouseY > 130 && mouseY < 170) {

                player.isFlying = true;
                player.flyUsed = true;
                player.dy = 0; // Stop falling
                player.flyTimer = 600; // 10 seconds
            }
        }

        // Time Stop Button Click (Pink)
        if (player.canTimeStop && !player.timeStopUsed && !player.isTimeStopped) {
            if (mouseX > 650 && mouseX < 750 &&
                mouseY > 180 && mouseY < 220) {

                player.isTimeStopped = true;
                player.timeStopUsed = true;
                player.timeStopTimer = 600; // 10 seconds
            }
        }

        // Invincible Button Click (Purple)
        if (player.canInvincible && !player.invincibleUsed && !player.isSuperInvincible) {
            if (mouseX > 650 && mouseX < 750 &&
                mouseY > 230 && mouseY < 270) {

                player.isSuperInvincible = true;
                player.invincibleUsed = true;
                player.invincible = 480; // 8 seconds (60 * 8)
            }
        }

        // Speed Up Button Click (Light Blue)
        if (player.canSpeedUp && !player.speedUpUsed && !player.isSpeedUp) {
            if (mouseX > 650 && mouseX < 750 &&
                mouseY > 280 && mouseY < 320) {

                player.isSpeedUp = true;
                player.speedUpUsed = true;
                player.speedUpTimer = 600; // 10 seconds
            }
        }

        // Build Bridge Button Click (Black)
        if (player.canBuildBridge && !player.bridgeBuilt) {
            if (mouseX > 650 && mouseX < 750 &&
                mouseY > 330 && mouseY < 370) {

                // Create 100m Bridge (1000px)
                platforms.push({
                    x: player.x,
                    y: player.y + player.height + 5, // Under feet
                    width: 1000,
                    height: 20,
                    color: 'black'
                });
                player.bridgeBuilt = true;
                player.dy = 0; // Stop falling momentarily
                player.y -= 5; // Pop up slightly
            }
        }

        // Block Builder Button Click (Grey - Index 9)
        if (player.canPlaceBlock && player.blockCount > 0) {
            // Button Click
            if (mouseX > 650 && mouseX < 750 &&
                mouseY > 380 && mouseY < 420) {

                player.isPlacingBlock = !player.isPlacingBlock; // Toggle Mode
                return; // Prevent placing block on the button!
            }
        }

        // ACTUAL BLOCK PLACEMENT (If Mode Active)
        if (player.canPlaceBlock && player.isPlacingBlock && player.blockCount > 0) {
            // Only place if NOT clicking UI area
            if (mouseX < 600) {
                let worldX = mouseX + camera.x;
                let worldY = mouseY;

                platforms.push({
                    x: worldX - 25,
                    y: worldY - 10,
                    width: 50,
                    height: 20,
                    color: 'gray'
                });

                player.blockCount--;
                if (player.blockCount <= 0) {
                    player.isPlacingBlock = false;
                }
            }
        }
    }
});

function update() {
    if (gameState !== 'PLAYING') return;
    if (gameWon) return;

    // Laser Movement & Collision
    for (let i = lasers.length - 1; i >= 0; i--) {
        let laser = lasers[i];

        // Move Laser (Now supports vectors)
        laser.x += laser.vx;
        laser.y += laser.vy;

        if (laser.x < 0 || laser.x > levelWidth || laser.y < 0 || laser.y > canvas.height + 200) { // Cleanup off-screen
            lasers.splice(i, 1);
            continue;
        }

        // PROJECTILE LOGIC
        for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
            let p = enemyProjectiles[i];
            if (!player.isTimeStopped) {
                p.x += p.vx;
                p.y += p.vy;
            }

            // Remove if OOB
            if (p.x < 0 || p.x > levelWidth || p.y < 0 || p.y > canvas.height) {
                enemyProjectiles.splice(i, 1);
                continue;
            }

            // Collision with Player
            if (player.x < p.x + p.width &&
                player.x + player.width > p.x &&
                player.y < p.y + p.height &&
                player.y + player.height > p.y) {

                takeDamage(false);
                enemyProjectiles.splice(i, 1); // Hit and disappear
            }
        }

        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            let enemy = enemies[j];
            if (laser.x < enemy.x + enemy.width &&
                laser.x + laser.width > enemy.x &&
                laser.y < enemy.y + enemy.height &&
                laser.y + laser.height > enemy.y) {

                if (enemy.type === 'strong') {
                    if (laser.isStrong) {
                        enemies.splice(j, 1); // Kill strong enemy!
                        lasers.splice(i, 1);
                    } else {
                        lasers.splice(i, 1); // Normal laser dies
                    }
                } else if (enemy.type === 'boss') {
                    let damage = laser.isStrong ? 3 : 1;
                    enemy.hp -= damage;
                    lasers.splice(i, 1); // Laser disappears
                    if (enemy.hp <= 0) {
                        enemies.splice(j, 1); // Boss Dies
                        goal.active = true; // Spawn Chest

                        // Create Boss Explosion Effect (Optional simple visual)
                        // For now just disappear
                    }
                } else {
                    enemies.splice(j, 1);
                    lasers.splice(i, 1);
                }
                break;
            }
        }
    }

    // Movement logic
    let currentSpeed = player.speed;
    if (player.isSpeedUp) currentSpeed *= 2; // Double Speed!

    if (keys['ArrowRight']) {
        player.dx = currentSpeed;
        player.facingRight = true;
    } else if (keys['ArrowLeft']) {
        player.dx = -currentSpeed;
        player.facingRight = false;
    } else {
        player.dx *= friction;
    }

    // Applying Physics
    if (player.isFlying) {
        player.dy = 0; // No gravity
        // Fly movement
        if (keys['ArrowUp']) player.y -= player.speed;
        if (keys['ArrowDown']) player.y += player.speed;
        if (keys['Space']) player.y -= player.speed; // Space also goes up

        player.flyTimer--;
        if (player.flyTimer <= 0) {
            player.isFlying = false; // Stop flying
        }
    } else {
        // Normal Gravity
        player.dy += gravity;
    }

    player.x += player.dx;
    player.y += player.dy;

    // Invincibility Timer
    if (player.invincible > 0) {
        player.invincible--;
        if (player.invincible <= 0) {
            player.isSuperInvincible = false;
        }
    }

    // Time Stop Logic
    if (player.isTimeStopped) {
        player.timeStopTimer--;
        if (player.timeStopTimer <= 0) {
            player.isTimeStopped = false;
        }
    }

    // Speed Up Logic
    if (player.isSpeedUp) {
        player.speedUpTimer--;
        if (player.speedUpTimer <= 0) {
            player.isSpeedUp = false;
        }
    }

    // Level Boundaries (instead of canvas.width)
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > levelWidth) {
        player.x = levelWidth - player.width;
    }

    // Floor Collision = LAVA (Damage + Respawn)
    if (player.y + player.height > 550) {
        if (player.isSuperInvincible) {
            // Run on Lava!
            player.y = 550 - player.height;
            player.dy = 0;
            player.grounded = true;
            player.jumpCount = 0;
        } else {
            takeDamage(true); // true = lava (respawn)
            if (player.isFlying) player.isFlying = false; // Cancel fly on death
        }
    }

    // Platform Collision
    player.grounded = false;

    platforms.forEach(plat => {
        if (player.x < plat.x + plat.width &&
            player.x + player.width > plat.x &&
            player.y < plat.y + plat.height &&
            player.y + player.height > plat.y) {

            let overlapX = (player.width / 2 + plat.width / 2) - Math.abs((player.x + player.width / 2) - (plat.x + plat.width / 2));
            let overlapY = (player.height / 2 + plat.height / 2) - Math.abs((player.y + player.height / 2) - (plat.y + plat.height / 2));

            if (overlapX < overlapY) {
                if (player.x < plat.x) player.x = plat.x - player.width;
                else player.x = plat.x + plat.width;
                player.dx = 0;
            } else {
                if (player.y < plat.y) {
                    player.y = plat.y - player.height;
                    player.dy = 0;
                    player.grounded = true;
                    player.jumpCount = 0;

                    // CHECKPOINT: Save safe position
                    player.lastSafeX = player.x;
                    player.lastSafeY = player.y;
                } else {
                    player.y = plat.y + plat.height;
                    player.dy = 0;
                }
            }
        }
    });

    // Enemy Logic
    let boss = enemies.find(e => e.type === 'boss');

    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];

        // START: Remove enemies near Boss (10m = 1000px)
        if (boss && enemy !== boss) {
            let distToBoss = Math.abs(enemy.x - boss.x);
            if (distToBoss < 1000) {
                enemies.splice(i, 1);
                continue;
            }
        }
        // END: Remove enemies near Boss

        // ONLY MOVE IF TIME IS NOT STOPPED
        if (!player.isTimeStopped) {
            if (enemy.type === 'boss') {
                // BOSS AI: Chase Player when close
                let distX = Math.abs(enemy.x - player.x);
                // Activation Range: 500px (5m)
                if (distX < 800) {
                    if (enemy.nextShot > 0) enemy.nextShot--;
                    else {
                        // SHOOT FIREBALL
                        let angle = Math.atan2(
                            (player.y + player.height / 2) - (enemy.y + enemy.height / 2),
                            (player.x + player.width / 2) - (enemy.x + enemy.width / 2)
                        );
                        let speed = 6; // Reasonable speed

                        enemyProjectiles.push({
                            x: enemy.x + enemy.width / 2 - 10,
                            y: enemy.y + enemy.height / 2 - 10,
                            width: 20,
                            height: 20,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            color: 'red'
                        });

                        enemy.nextShot = 240; // 4 seconds cooldown
                    }
                }
            } else {
                enemy.x += enemy.speed * enemy.dir;
                // Simple Patrol Logic
                if (enemy.x > levelWidth - 50 || enemy.x < 50) enemy.dir *= -1;
            }
        }

        // Collision with Player
        // Hitbox slightly reduced for fairness
        if (player.x < enemy.x + enemy.width - 15 &&
            player.x + player.width > enemy.x + 15 &&
            player.y < enemy.y + enemy.height - 15 &&
            player.y + player.height > enemy.y + 15) {

            takeDamage(false); // false = enemy touch
        }
    }

    // Goal Collision (Only if active)
    if (goal.active &&
        player.x < goal.x + goal.width &&
        player.x + player.width > goal.x &&
        player.y < goal.y + goal.height &&
        player.y + player.height > goal.y) {
        gameWon = true;
    }

    // Camera Logic
    // Center the player in the screen
    camera.x = player.x - canvas.width / 2 + player.width / 2;

    // Clamp camera within level bounds
    if (camera.x < 0) camera.x = 0;
    if (camera.x > levelWidth - canvas.width) camera.x = levelWidth - canvas.width;
}

function takeDamage(isLava) {
    if (player.invincible > 0) return;

    player.hp--;
    player.invincible = 60; // 1 second invincibility
    player.damageTaken = true; // Flawless run failed

    // Knockback
    player.dy = -10;
    player.dx = player.facingRight ? -10 : 10;

    if (player.hp <= 0) {
        gameState = 'GAMEOVER';
        return;
    }

    if (isLava) {
        // Respawn at last safe grounded position
        player.x = player.lastSafeX;
        player.y = player.lastSafeY - 10; // Slight offset up to avoid clipping
        player.dx = 0;
        player.dy = 0;
    }
}

function draw() {
    // Clear screen (Sky remains static!)
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Draw sky fixed to screen

    // TIME STOP EFFECT (Purple tint)
    if (player.isTimeStopped) {
        ctx.fillStyle = 'rgba(100, 0, 100, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (gameState === 'SELECTION') {
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('キャラクターをえらんでね！', 150, 100);

        // LENGTH SELECTION UI
        const lengths = [2000, 4000, 6000, 8000, 10000];
        const labels = ["200m", "400m", "600m", "800m", "1km"];

        ctx.font = '20px Arial';
        ctx.fillText('ステージのながさ:', 50, 15); // Label

        for (let j = 0; j < 5; j++) {
            let lx = 50 + j * 110;
            let ly = 20;

            // Highlight selected
            if (selectedLevelLength === lengths[j]) {
                ctx.fillStyle = 'yellow';
            } else {
                ctx.fillStyle = 'gray';
            }
            ctx.fillRect(lx, ly, 100, 40);

            ctx.fillStyle = 'black';
            ctx.fillText(labels[j], lx + 25, ly + 27);

            ctx.strokeStyle = 'white';
            ctx.strokeRect(lx, ly, 100, 40);
        }

        const abilityNames = [
            "かいふく",       // 1: Red
            "3ほうこう",      // 2: White
            "3だんジャンプ",  // 3: Green
            "そらをとぶ",     // 4: Yellow
            "じかんていし",   // 5: Pink
            "むてき",         // 6: Purple
            "さいきょうビーム", // 7: Orange
            "スピード＆ジャンプ", // 8: Light Blue
            "100mのはし",     // 9: Black
            "ブロックx7",     // 10: Grey
            ""
        ];

        for (let i = 0; i < 10; i++) {
            let row = Math.floor(i / 5);
            let col = i % 5;
            let cx = 50 + col * 140;
            let cy = 150 + row * 150;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(cx, cy, 100, 100);
            if (characters[i].complete) {
                ctx.drawImage(characters[i], cx + 10, cy + 10, 80, 80);
            }
            ctx.fillStyle = '#333';
            ctx.font = '20px Arial';
            ctx.fillText(i + 1, cx + 5, cy + 25);

            // Draw Ability Name
            if (abilityNames[i]) {
                ctx.fillStyle = 'blue';
                ctx.font = 'bold 16px Arial';
                ctx.fillText(abilityNames[i], cx + 5, cy + 120);
            }
        }
        return;
    }

    // === START CAMERA TRANSFORM ===
    ctx.save();
    ctx.translate(-camera.x, 0); // Move everything left by camera.x

    // Draw Floor (LAVA)
    ctx.fillStyle = '#FF4500'; // OrangeRed
    ctx.fillRect(0, 550, levelWidth, 50);

    // Draw Platforms
    platforms.forEach(plat => {
        ctx.fillStyle = plat.color ? plat.color : '#8B4513';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    });

    // Draw Goal (Chest) - Only if Active
    if (goal.active) {
        if (chestImg.complete) {
            ctx.drawImage(chestImg, goal.x, goal.y, goal.width, goal.height);
        } else {
            ctx.fillStyle = 'gold';
            ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
        }
    }

    // Draw Lasers
    lasers.forEach(laser => {
        ctx.fillStyle = laser.color;
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
    });

    // Draw Enemy Projectiles (Fireballs)
    enemyProjectiles.forEach(p => {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Draw Player
    let shouldDraw = true;
    // Blink if invincible (normal blink)
    if (player.invincible > 0 && !player.isSuperInvincible) {
        if (player.invincible % 10 >= 5) shouldDraw = false;
    }

    if (shouldDraw) {
        // SUPER INVINCIBLE EFFECT (AURA)
        if (player.isSuperInvincible) {
            ctx.fillStyle = `hsl(${Date.now() % 360}, 100%, 50%)`; // Rainbow Aura
            ctx.fillRect(player.x - 5, player.y - 5, player.width + 10, player.height + 10);
        }

        if (playerImg.complete && playerImg.naturalHeight !== 0) {
            ctx.save();
            ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
            if (!player.facingRight) ctx.scale(-1, 1);

            let bounce = 0;
            if (player.dx !== 0 && player.grounded) {
                bounce = Math.sin(Date.now() / 100) * 5;
            }
            ctx.drawImage(playerImg, -player.width / 2, -player.height / 2 + bounce, player.width, player.height);
            ctx.restore();
        } else {
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
    }

    // Draw Enemies
    enemies.forEach(enemy => {
        let img = ballImg;
        if (enemy.type === 'strong') img = ironBallImg;
        if (enemy.type === 'boss') {
            // Draw Boss (Giant Red Dragon - Character 0)
            let bossImg = characters[0]; // Reuse Red Dragon sprite

            if (bossImg && bossImg.complete) {
                ctx.save();
                ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

                // Face Player
                if (player.x > enemy.x) {
                    ctx.scale(-1, 1);
                }

                // Draw Big
                ctx.drawImage(bossImg, -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
                ctx.restore();
            } else {
                // Fallback
                ctx.fillStyle = 'red';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }

            // Draw Boss HP Bar
            ctx.fillStyle = 'black';
            ctx.fillRect(enemy.x, enemy.y - 20, enemy.width, 10);
            ctx.fillStyle = 'green';
            let hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
            ctx.fillRect(enemy.x, enemy.y - 20, enemy.width * hpPercent, 10);
            return;
        }

        if (img.complete) {
            ctx.save();
            ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

            // Spin only if NOT topped
            if (!player.isTimeStopped) {
                ctx.rotate(Date.now() / 200);
            }

            ctx.drawImage(img, -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
            ctx.restore();
        } else {
            ctx.fillStyle = (enemy.type === 'strong') ? 'black' : 'purple';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });

    // === END CAMERA TRANSFORM ===
    ctx.restore();

    // UI Distance Meter
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    let dist = Math.max(0, Math.floor((goal.x - player.x) / 10)); // Dynamic distance
    let text = 'ゴールまで: ' + dist + 'm';
    ctx.strokeText(text, 550, 40);
    ctx.fillText(text, 550, 40);

    // HP Display (Hearts)
    ctx.fillStyle = 'red';
    ctx.font = '30px Arial';
    let hearts = '❤'.repeat(player.hp);
    ctx.strokeText(hearts, 20, 50);
    ctx.fillText(hearts, 20, 50);

    // Heal Button (Red Character Only)
    if (player.canHeal && !player.healUsed) {
        ctx.fillStyle = 'green';
        ctx.fillRect(650, 80, 100, 40);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('回復', 670, 108);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(650, 80, 100, 40);
    }

    // Fly Button (Yellow Character Only)
    if (player.canFly) {
        if (player.isFlying) {
            // Draw Timer
            ctx.fillStyle = 'orange';
            ctx.font = '30px Arial';
            ctx.fillText('飛行中: ' + Math.ceil(player.flyTimer / 60), 650, 160);
        } else if (!player.flyUsed) {
            // Draw Button
            ctx.fillStyle = '#00BFFF'; // Deep Sky Blue
            ctx.fillRect(650, 130, 100, 40);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('飛ぶ', 670, 158);

            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(650, 130, 100, 40);
        }
    }

    // Time Stop Button (Pink Character Only)
    if (player.canTimeStop) {
        if (player.isTimeStopped) {
            ctx.fillStyle = 'purple';
            ctx.font = '30px Arial';
            ctx.fillText('時間停止中: ' + Math.ceil(player.timeStopTimer / 60), 650, 210);
        } else if (!player.timeStopUsed) {
            ctx.fillStyle = '#DA70D6'; // Orchid
            ctx.fillRect(650, 180, 100, 40);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('止める', 660, 208);

            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(650, 180, 100, 40);
        }
    }

    // Invincible Button (Purple Character Only)
    if (player.canInvincible) {
        if (player.isSuperInvincible) {
            ctx.fillStyle = 'gold'; // Gold Text
            ctx.font = '30px Arial';
            ctx.fillText('無敵中: ' + Math.ceil(player.invincible / 60), 650, 260);
        } else if (!player.invincibleUsed) {
            ctx.fillStyle = '#9370DB'; // Medium Purple
            ctx.fillRect(650, 230, 100, 40);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('無敵', 670, 258);

            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(650, 230, 100, 40);
        }
    }

    // Speed Up Button (Light Blue)
    if (player.canSpeedUp) {
        if (player.isSpeedUp) {
            ctx.fillStyle = 'cyan';
            ctx.font = '24px Arial';
            ctx.fillText('超加速中: ' + Math.ceil(player.speedUpTimer / 60), 650, 310);
        } else if (!player.speedUpUsed) {
            ctx.fillStyle = '#00FFFF'; // Cyan
            ctx.fillRect(650, 280, 100, 40);
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.fillText('加速', 670, 308);

            ctx.strokeStyle = 'white';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(650, 280, 100, 40);
        }
    }

    // Bridge Button (Black)
    if (player.canBuildBridge && !player.bridgeBuilt) {
        ctx.fillStyle = '#333'; // Dark Grey
        ctx.fillRect(650, 330, 100, 40);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('橋を作る', 660, 358);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(650, 330, 100, 40);
    }

    // Block Builder UI (Grey - Index 9)
    if (player.canPlaceBlock) {
        // Draw Button
        ctx.fillStyle = player.isPlacingBlock ? 'yellow' : 'gray'; // Highlight if active
        ctx.fillRect(650, 380, 100, 40);
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial'; // Smaller font to fit
        ctx.fillText('ブロック: ' + player.blockCount, 655, 405);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(650, 380, 100, 40);

        // Draw Helper Text if Active
        if (player.isPlacingBlock) {
            ctx.fillStyle = 'red';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('クリックして設置！', 300, 100);
        }
    }

    // Win Message and Victory Dance
    if (gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Darken background

        // Draw Dancing Player
        if (playerImg.complete) {
            ctx.save();
            let centerX = canvas.width / 2;
            let centerY = canvas.height / 2;

            let jump, rotate;

            if (!player.damageTaken) {
                // SPECIAL DANCE (Perfect!)
                // High speed, high jump, full rotation!
                jump = Math.abs(Math.sin(Date.now() / 100)) * -120; // Super High Jump
                rotate = (Date.now() / 100); // Continuous Spin (Somersault)
            } else {
                // NORMAL DANCE
                jump = Math.abs(Math.sin(Date.now() / 150)) * -60;
                rotate = Math.sin(Date.now() / 100) * 0.3;
            }

            ctx.translate(centerX, centerY + jump);
            ctx.rotate(rotate);
            ctx.scale(3, 3); // Make it BIG

            ctx.drawImage(playerImg, -player.width / 2, -player.height / 2, player.width, player.height);
            ctx.restore();
        }

        ctx.textAlign = 'center';

        if (!player.damageTaken) {
            ctx.fillStyle = '#FF00FF'; // Magenta for special
            ctx.font = '80px Arial';
            ctx.fillText('パーフェクト！！', canvas.width / 2, 200);
            ctx.fillStyle = 'gold';
            ctx.font = '40px Arial';
            ctx.fillText('すごい！ノーダメージクリア！', canvas.width / 2, 300);
        } else {
            ctx.fillStyle = 'gold';
            ctx.font = '60px Arial';
            ctx.fillText('クリア！おめでとう！', canvas.width / 2, 200);
        }

        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('F5キーで もういっかい！', canvas.width / 2, 500);
        ctx.textAlign = 'start'; // Reset alignment
    }

    // Game Over Message
    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.fillStyle = 'red';
        ctx.font = '60px Arial';
        ctx.fillText('ゲームオーバー...', canvas.width / 2, 300);
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('F5キーでやりなおし', canvas.width / 2, 400);
        ctx.textAlign = 'start';
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
