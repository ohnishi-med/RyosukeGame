const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
window.onerror = function (msg, url, line, col, error) {
    alert("Error: " + msg + "\nLine: " + line + "\nCol: " + col);
};

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
    speedUpUsed: false,
    isSpeedUp: false,
    speedUpTimer: 0,
    isAttackBoost: false, // New Ability
    canPlaceBlock: false,
    blockCount: 0,
    isPlacingBlock: false,
    shotCooldown: 0, // New cooldown for shooting

    // Ultimate Skill
    ultimateCooldown: 0, // 3600 = 60 seconds
    ultimateActive: 0    // Duration of effect
};

let gravity = 0.5;
let friction = 0.8;
let score = 0;

let keys = {};

// Game State
let gameState = 'SELECTION'; // 'SELECTION', 'PLAYING', 'GAMEOVER', 'WIN', 'VICTORY_DANCE'
let selectedLevelLength = 10000; // Default 1km (10000px)
let bossMode = false; // Toggle for Sudden Boss Battle
let levelWidth = 10000;
let gameWon = false;
let specialChest = null; // {x, y, width, height, active}
let victoryDancePlayers = []; // Array of clone objects
let camera = { x: 0, y: 0 };

// Load Images
let characters = [];
for (let i = 0; i < 10; i++) {
    let img = new Image();
    img.src = `assets/ryoppy_${i}.png`;
    characters.push(img);
}
let playerImg = characters[0]; // Default

const ballImg = new Image();
ballImg.src = 'assets/ball.png';

const ironBallImg = new Image();
ironBallImg.src = 'assets/iron_ball.png';

const awakenedBossImg = new Image();
awakenedBossImg.src = 'assets/kakusei_dragon.png';

const chestImg = new Image();
chestImg.src = 'assets/chest.png';

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
        if (Math.random() < 0.4) {
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
        currentX += 300; // Normal spacing
    }
    return enemiesList;
};

let enemies = [];

let goal = { x: 5800, y: 180, width: 60, height: 60 }; // Moved goal to near the end (6000)

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
    player.ultimateCooldown = 0; // Reset Ult Cooldown on new game

    // Reset Objects
    lasers = [];
    lasers = [];
    enemyProjectiles = [];
    specialChest = null;
    victoryDancePlayers = [];

    // BOSS MODE LOGIC
    if (bossMode) {
        selectedLevelLength = 2000; // Short Arena

        // Simple Arena Floor
        platforms = [
            { x: 0, y: 500, width: 2500, height: 50 } // Long flat floor
        ];

        // Safety Blocks (to escape fire)
        platforms.push({ x: 400, y: 350, width: 100, height: 20 });
        platforms.push({ x: 800, y: 350, width: 100, height: 20 });
        platforms.push({ x: 1200, y: 350, width: 100, height: 20 });

        // No random enemies
        enemies = [];
    } else {
        platforms = generatePlatforms(selectedLevelLength);
        enemies = generateEnemies(selectedLevelLength);
    }

    // Set Level
    if (bossMode) {
        selectedLevelLength = 1000; // Force short level for immediate battle
    }
    levelWidth = selectedLevelLength;
    goal.x = levelWidth - 200;
    goal.active = false; // Hidden until boss defeated

    // Add Boss Enemy
    let isSuper = bossMode;
    // User Request: Instant Hydra if Super Boss Mode
    let startAwakened = isSuper;

    enemies.push({
        x: isSuper ? 500 : levelWidth - 400, // Spawn close (500) if Super
        y: 200,
        width: isSuper ? 150 : 100,
        height: isSuper ? 150 : 100,
        speed: isSuper ? 3 : 2, // Faster if Super
        dir: -1,
        type: 'boss',
        hp: isSuper ? 150 : 30, // 300 HP for Hydra
        maxHp: isSuper ? 150 : 30,
        nextShot: 100,
        isSuper: isSuper,
        isAwakened: startAwakened, // Start as Hydra immediately
        awakeningWave: startAwakened ? 0 : undefined, // Start effect
        color: startAwakened ? 'purple' : 'red',
        laserTimer: 600, // 10 seconds
        laserWarningTimer: 0,
        potentialLasers: []
    });

    if (bossMode) {
        // SUPER BUFF for Player
        player.maxHp = 20;
        player.hp = 20;
    } else {
        player.maxHp = 4; // Normal
        player.hp = 4;
    }

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
        if (player.shotCooldown > 0) return; // Cooldown check

        player.shotCooldown = 20; // Set cooldown (0.3s)

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

        // BOSS MODE TOGGLE BUTTON
        if (mouseX > 600 && mouseX < 780 &&
            mouseY > 20 && mouseY < 80) {
            bossMode = !bossMode;
            return;
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

        // Attack Boost Button Click (Purple)
        if (player.canInvincible && !player.invincibleUsed && !player.isAttackBoost) {
            if (mouseX > 650 && mouseX < 750 &&
                mouseY > 230 && mouseY < 270) {

                player.isAttackBoost = true;
                player.invincibleUsed = true;
                player.ultimateActive = 1200; // 20s (Reusing timer logic)
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
    // UPDATE VICTORY DANCE
    if (gameState === 'VICTORY_DANCE') {
        victoryDancePlayers.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.rotation += 0.1;

            // Bounce off walls
            if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

            // Change color
            p.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        });
        return; // Skip normal update
    }

    if (gameState !== 'PLAYING') return;
    // Check Goal Collision
    // ... (Existing Goal Logic)

    // CHECK CHEST COLLISION (Victory Dance Trigger)
    if (specialChest && specialChest.active &&
        player.x < specialChest.x + specialChest.width &&
        player.x + player.width > specialChest.x &&
        player.y < specialChest.y + specialChest.height &&
        player.y + player.height > specialChest.y) {

        // TRIGGER VICTORY DANCE
        gameState = 'VICTORY_DANCE';
        specialChest.active = false;

        // SAVE VICTORY RECORD
        try {
            localStorage.setItem('ryosuke_super_win', 'true');
        } catch (e) { console.log('Storage failed', e); }

        // Spawn Clones
        for (let i = 0; i < 10; i++) {
            victoryDancePlayers.push({
                x: Math.random() * canvas.width,
                y: Math.random() * 500,
                dx: (Math.random() - 0.5) * 10,
                dy: (Math.random() - 0.5) * 10,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                rotation: 0
            });
        }
    }



    if (gameWon) return;

        // Laser Movement & Collision (Player Lasers)
    for (let i = lasers.length - 1; i >= 0; i--) {
        let laser = lasers[i];

        // Move Laser
        laser.x += laser.vx;
        laser.y += laser.vy;

        if (laser.x < 0 || laser.x > levelWidth || laser.y < 0 || laser.y > canvas.height + 200) {
            lasers.splice(i, 1);
            continue;
        }

        // Check collision with enemies (Moved Logic Here)
        for (let j = enemies.length - 1; j >= 0; j--) {
            let enemy = enemies[j];
            if (laser.x < enemy.x + enemy.width &&
                laser.x + laser.width > enemy.x &&
                laser.y < enemy.y + enemy.height &&
                laser.y + laser.height > enemy.y) {

                if (enemy.type === 'strong') {
                     if (laser.isStrong) {
                        enemies.splice(j, 1);
                        if (!laser.isPiercing) lasers.splice(i, 1);
                    } else if (player.isAttackBoost) {
                        enemy.hp -= 2.5;
                        if (enemy.hp <= 0) enemies.splice(j, 1);
                        lasers.splice(i, 1);
                    } else {
                        lasers.splice(i, 1);
                    }
                } else if (enemy.type === 'boss') {
                    let damage = laser.isStrong ? 3 : 1;
                    if (player.isAttackBoost) damage *= 2.5;
                    enemy.hp -= damage;
                    if (!laser.isPiercing) lasers.splice(i, 1);
                } else {
                    enemies.splice(j, 1);
                    if (!laser.isPiercing) lasers.splice(i, 1);
                }
                break;
            }
        }
    }


    // Enemy Projectile Logic (Moved Outside)
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        let p = enemyProjectiles[i];
        if (!player.isTimeStopped) {
            p.x += p.vx;
            p.y += p.vy;
        }

        // Cleanup (Allow lasers to be big/offscreen as long as origin is reasonable? Or just large bounds)
        // For beams, width is 2000, so we check origin.
        if (p.x < -2000 || p.x > levelWidth + 2000 || p.y < -2000 || p.y > canvas.height + 2000) {
            enemyProjectiles.splice(i, 1);
            continue;
        }

        // COLLISION
        let hit = false;
        
        if (p.isLaser) {
            // BEAM COLLISION (Line vs Circle approx)
            // Beam segment from (p.x, p.y) to (endX, endY)
            let len = p.width; // Width is length
            let endX = p.x + Math.cos(p.angle) * len;
            let endY = p.y + Math.sin(p.angle) * len;

            // Player Center
            let cx = player.x + player.width / 2;
            let cy = player.y + player.height / 2;
            let r = Math.max(player.width, player.height) / 2;

            // Distance from point C to segment AB
            let A = {x: p.x, y: p.y};
            let B = {x: endX, y: endY};
            let C = {x: cx, y: cy};

            let AB = {x: B.x - A.x, y: B.y - A.y};
            let AC = {x: C.x - A.x, y: C.y - A.y};
            
            let t = (AC.x * AB.x + AC.y * AB.y) / (len * len);
            t = Math.max(0, Math.min(1, t)); // Clamp to segment

            let closest = {x: A.x + t * AB.x, y: A.y + t * AB.y};
            let distSq = (C.x - closest.x)**2 + (C.y - closest.y)**2;
            
            // Hit radius: beam thickness/2 + player radius
            let hitR = (p.height / 2) + r;

            if (distSq < hitR * hitR) {
                hit = true;
            }

        } else {
            // STANDARD AABB
            if (player.x < p.x + p.width &&
                player.x + player.width > p.x &&
                player.y < p.y + p.height &&
                player.y + player.height > p.y) {
                hit = true;
            }
        }

        if (hit) {
            if (player.isSuperInvincible) {
                 enemyProjectiles.splice(i, 1);
            } else {
                let dmg = p.isPoison ? 3 : 1;
                takeDamage(false, dmg);
                if (!p.isLaser) enemyProjectiles.splice(i, 1); // Beams don't disappear on hit
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

    // Shot Cooldown Logic
    if (player.shotCooldown > 0) {
        player.shotCooldown--;
    }

    // ULTIMATE SKILL LOGIC
    if (player.ultimateCooldown > 0) player.ultimateCooldown--;
    if (player.ultimateActive > 0) player.ultimateActive--;

    // Input for Ultimate (X Key)
    if (keys['KeyX'] && player.ultimateCooldown <= 0) {
        activateUltimate();
    }

    // Continuous Effects for Ultimates
    if (player.ultimateActive > 0) {
        // 3. Meteor Smash (Green) - handled in draw/physics
        // 4. Zero G (Yellow)
        if (playerImg === characters[3]) {
            player.dy = 0;
            if (keys['ArrowUp']) player.y -= 10;
            if (keys['ArrowDown']) player.y += 10;
            if (keys['ArrowLeft']) player.x -= 10;
            if (keys['ArrowRight']) player.x += 10;
        }
        // 5. Time Stop (Pink) - Handled in enemy loop
        // 6. Hyper Mod (Purple) - Handled in collision
        // 8. Light Speed (Light Blue)
        if (playerImg === characters[7]) {
            // Speed handled in movement
        }
    }

    player.x += player.dx;
    player.y += player.dy;

    // PROJECTILE COLLISION (Laser vs Fireball)
    for (let i = lasers.length - 1; i >= 0; i--) {
        for (let j = enemyProjectiles.length - 1; j >= 0; j--) {
            let l = lasers[i];
            let ep = enemyProjectiles[j];

            if (l.x < ep.x + ep.width &&
                l.x + l.width > ep.x &&
                l.y < ep.y + ep.height &&
                l.y + l.height > ep.y) {

                // Collision! Remove both
                lasers.splice(i, 1);
                enemyProjectiles.splice(j, 1);

                // Break to avoid accessing spliced index or double removal
                break;
            }
        }
    }

    // Invincibility Timer
    if (player.invincible > 0) {
        player.invincible--;
        if (player.invincible <= 0) {
            player.isSuperInvincible = false;
        }
    }

    // Ultimate Ability Timer (Generic)
    if (player.ultimateActive > 0) {
        player.ultimateActive--;
        if (player.ultimateActive <= 0) {
            player.isAttackBoost = false; // Reset Attack Boost
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

        // HIDDEN ENEMY INVINCIBILITY LOGIC
        if (enemy.invincible > 0) enemy.invincible--;

        // ONLY MOVE IF TIME IS NOT STOPPED
        if (!player.isTimeStopped) {
            if (enemy.type === 'boss') {
                // BOSS AI: Chase Player when close
                let distX = Math.abs(enemy.x - player.x);
                // Activation Range: 500px (5m)
                if (distX < 800) {
                    if (enemy.nextShot > 0) enemy.nextShot--;
                    else {
                        // SHOOT FIREBALL (Regular) or POISON BALL (Awakened)
                        let isPoison = enemy.isAwakened;

                        let angle = Math.atan2(
                            (player.y + player.height / 2) - (enemy.y + enemy.height / 2),
                            (player.x + player.width / 2) - (enemy.x + enemy.width / 2)
                        );
                        let speed = enemy.isSuper ? 10 : 6; // Fast shot for Super Boss

                        if (isPoison) {
                            // DOUBLE POISON SHOT (Hydra) - Reduced from Triple
                            let offsets = [-0.15, 0.15];
                            offsets.forEach(offset => {
                                enemyProjectiles.push({
                                    x: enemy.x + enemy.width / 2 - 10,
                                    y: enemy.y + enemy.height / 2 - 10,
                                    width: 30, // Bigger
                                    height: 30,
                                    vx: Math.cos(angle + offset) * speed,
                                    vy: Math.sin(angle + offset) * speed,
                                    color: 'purple',
                                    isPoison: true
                                });
                            });
                            enemy.nextShot = 120; // Reduced frequency (2.0s)
                        } else {
                            // Normal Shot
                            enemyProjectiles.push({
                                x: enemy.x + enemy.width / 2 - 10,
                                y: enemy.y + enemy.height / 2 - 10,
                                width: 20,
                                height: 20,
                                vx: Math.cos(angle) * speed,
                                vy: Math.sin(angle) * speed,
                                color: 'red',
                                isPoison: false
                            });
                            enemy.nextShot = enemy.isSuper ? 120 : 240;
                        }
                    }
                }

                // SUPER BOSS AI: Chase & Laser Attack
                if (enemy.isSuper) {
                    // 1. Chase Player (Slowly)
                    if (enemy.x < player.x - 200) enemy.x += 1;
                    if (enemy.x > player.x + 200) enemy.x -= 1;

                                       // 2. Laser Attack Logic (Every 10 seconds)
                    if (enemy.laserTimer > 0) {
                        enemy.laserTimer--;
                    } else if (enemy.laserWarningTimer === 0 && (!enemy.potentialLasers || enemy.potentialLasers.length === 0)) {
                        // START WARNING PHASE
                        enemy.potentialLasers = [];
                        for (let i = 0; i < 4; i++) {
                            let side = Math.floor(Math.random() * 3);
                            let startX, startY;
                            if (side === 0) { startX = camera.x + Math.random() * canvas.width; startY = -50; }
                            else if (side === 1) { startX = camera.x - 50; startY = Math.random() * 500; }
                            else { startX = camera.x + canvas.width + 50; startY = Math.random() * 500; }

                            let angle = Math.atan2(
                                (player.y + player.height / 2) - startY,
                                (player.x + player.width / 2) - startX
                            );
                            
                            enemy.potentialLasers.push({ x: startX, y: startY, angle: angle });
                        }
                        enemy.laserWarningTimer = 90; // 1.5 second warning // 1 second warning
                    }

                    // Handle Warning Countdown and Firing
                    if (enemy.laserWarningTimer > 0) {
                        enemy.laserWarningTimer--;
                        if (enemy.laserWarningTimer === 0) {
                            // FIRE!
                            enemy.potentialLasers.forEach(p => {
                                let speed = 10; // Slightly faster for surprise
                                enemyProjectiles.push({
                                    x: p.x,
                                    y: p.y,
                                    width: 2000, height: 24,
                                    vx: Math.cos(p.angle) * speed,
                                    vy: Math.sin(p.angle) * speed,
                                    color: 'magenta',
                                    isLaser: true,
                                    angle: p.angle
                                });
                            });
                            enemy.potentialLasers = [];
                            enemy.laserTimer = 600; // Reset timer after firing
                        }
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

            if (player.isSuperInvincible) {
                // DEAL DAMAGE TO ENEMY
                if (enemy.invincible && enemy.invincible > 0) {
                    // Enemy is i-framed (e.g. just hit)
                } else {
                    enemy.hp -= 5; // Big damage per frame of contact? Too fast.
                    // Let's do instant kill for minions, big damage for boss with cooldown

                    if (enemy.type === 'boss') {
                        if (!enemy.invincible || enemy.invincible <= 0) {
                            enemy.hp -= 2; // Damage
                            enemy.invincible = 30; // 0.5s i-frame for boss
                            // Add hit effect?
                        }
                    } else {
                        // Minions die instantly
                        enemy.hp = 0;
                    }

                    // Cleanup dead enemies handled at start of loop or next frame
                    // But we should probably check here
                    if (enemy.hp <= 0 && enemy.type !== 'boss') {
                        enemies.splice(i, 1);
                        continue; // Skip to next enemy
                    }
                }
            } else {
                takeDamage(false, 1); // false = enemy touch
            }
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

    // CHECK BOSS DEATH / AWAKENING
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];

        if (enemy.hp <= 0 && enemy.type === 'boss') {
            if (enemy.isSuper) {
                if (!enemy.isAwakened) {
                    // --- AWAKENING EVENT ---
                    enemy.isAwakened = true;
                    enemy.hp = 150;
                    enemy.maxHp = 150;
                    enemy.color = 'purple';
                    enemy.awakeningWave = 0;
                    enemy.speed = 3;

                    // Player Buff
                    player.maxHp = 20;
                    player.hp = 20;
                    enemy.x += 100;
                }
                else {
                    // --- TRUE DEATH (Hydra Defeated) ---
                    enemy.hp = 0;
                    gameState = 'VICTORY_DANCE';
                    if (specialChest) specialChest.active = false;

                    try {
                        localStorage.setItem('ryosuke_super_win', 'true');
                    } catch (e) { console.log('Storage failed', e); }

                    // Spawn Clones
                    for (let k = 0; k < 10; k++) {
                        victoryDancePlayers.push({
                            x: Math.random() * canvas.width,
                            y: Math.random() * 500,
                            dx: (Math.random() - 0.5) * 10,
                            dy: (Math.random() - 0.5) * 10,
                            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                            rotation: 0
                        });
                    }
                    enemies.splice(i, 1); // Remove Hydra!
                }
            } else {
                // --- NORMAL BOSS DEATH ---
                goal.x = enemy.x;
                goal.y = enemy.y + enemy.height - goal.height;
                goal.active = true;
                enemies.splice(i, 1); // Remove Normal Boss
            }
        }

        // UPDATE WAVE
        enemies.forEach(e => {
            if (e.isAwakened && e.awakeningWave !== undefined) {
                e.awakeningWave += 15; // Expand speed
                if (e.awakeningWave > 2000) e.awakeningWave = undefined; // Stop
            }
        });
    }
}

function takeDamage(isLava, amount = 1) {
    if (player.invincible > 0) return;

    player.hp -= amount;
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

    // SKY COLOR (Static for now)
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Draw sky fixed to screen

    let boss = enemies.find(e => e.type === 'boss');

    // TIME STOP EFFECT (Purple tint)
    if (player.isTimeStopped) {
        ctx.fillStyle = 'rgba(100, 0, 100, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (gameState === 'SELECTION') {
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('キャラクターをえらんでね！', 150, 100);

        // CHECK BADGE
        let hasBadge = localStorage.getItem('ryosuke_super_win');
        if (hasBadge === 'true') {
            // Draw Badge
            ctx.filter = 'drop-shadow(0px 0px 5px gold)';
            ctx.fillStyle = 'gold';
            ctx.font = '40px Arial';
            ctx.fillText('👑', 30, 460); // Crown icon (Bottom Left)
            ctx.font = 'bold 20px Arial';
            ctx.fillText('真の勇者', 70, 460); // Text next to crown
            ctx.filter = 'none';
        }

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

        // BOSS MODE BUTTON DRAW
        ctx.fillStyle = bossMode ? 'red' : 'gray';
        ctx.fillRect(600, 20, 180, 60);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('スーパー', 640, 50);
        ctx.fillText('ボス戦', 655, 75);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.strokeRect(600, 20, 180, 60);

        if (bossMode) {
            ctx.fillStyle = 'yellow';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('BOSS MODE ON!', 630, 100);
        }

        const abilityNames = [
            "かいふく",       // 1: Red
            "3ほうこう",      // 2: White
            "3だんジャンプ",  // 3: Green
            "そらをとぶ",     // 4: Yellow
            "じかんていし",   // 5: Pink
            "こうげき2.5ばい", // 6: Purple
            "さいきょうビーム", // 7: Orange
            "スピード＆ジャンプ", // 8: Light Blue
            "こうげき2.5ばい", // 9: Black
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

    // SUPER BOSS LASER COUNTDOWN
    if (boss && boss.isSuper) {
        let timeLeft = Math.ceil(boss.laserTimer / 60);
        ctx.fillStyle = timeLeft <= 3 ? 'red' : 'white';
        ctx.font = 'bold 30px Arial';

        if (boss.laserWarningTimer > 0) {
            ctx.fillStyle = 'red';
            ctx.font = 'bold 50px Arial';
            ctx.fillText('レーザーがくるぞ！！', 250, 150);
        } else {
            ctx.fillText('レーザー攻撃まで: ' + timeLeft, 350, 100);
            if (timeLeft <= 3) {
                ctx.font = 'bold 50px Arial';
                ctx.fillText('キケン！', 350, 150);
            }
        }
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

    // Draw Enemy Projectiles (Fireballs / Poison / Boss Lasers)
    enemyProjectiles.forEach(p => {
        if (p.isLaser) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.fillRect(0, -p.height / 2, p.width, p.height);
            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'white';
            ctx.fillRect(0, -p.height / 2, p.width, p.height);
            ctx.restore();
        } else {
            ctx.fillStyle = p.color ? p.color : 'orange'; // Respects 'purple' for poison
            ctx.beginPath();
            ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = p.isPoison ? 'black' : 'red';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // Draw Laser Warnings
    let bossInDraw = enemies.find(e => e.type === 'boss');
    if (bossInDraw && bossInDraw.laserWarningTimer > 0 && bossInDraw.potentialLasers) {
        ctx.save();
        ctx.strokeStyle = '#FF3300'; // Bright Orange/Red
        ctx.lineWidth = 4;
        ctx.setLineDash([]); // Solid lines for better visibility
        ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 100) * 0.3; // Slower pulsing
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'red';

        bossInDraw.potentialLasers.forEach(p => {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            let lineLen = 2500;
            ctx.lineTo(p.x + Math.cos(p.angle) * lineLen, p.y + Math.sin(p.angle) * lineLen);
            ctx.stroke();
        });
        ctx.restore();
    }

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

    // DRAW SPECIAL CHEST
    if (specialChest && specialChest.active) {
        let screenX = specialChest.x - camera.x;
        ctx.fillStyle = 'gold';
        ctx.fillRect(screenX, specialChest.y, specialChest.width, specialChest.height);
        ctx.strokeStyle = 'brown';
        ctx.lineWidth = 4;
        ctx.strokeRect(screenX, specialChest.y, specialChest.width, specialChest.height);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText('お宝', screenX + 10, specialChest.y + 30);
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

                if (enemy.isAwakened) {
                    // --- AWAKENED (Custom Image) ---
                    if (awakenedBossImg && awakenedBossImg.complete) {
                        ctx.save();
                        // Swaying Effect for whole body or internal heads?
                        // Determine Sway
                        let swayX = Math.sin(Date.now() / 300) * 5;
                        let swayY = Math.cos(Date.now() / 300) * 5;

                        ctx.translate(swayX, swayY); // Apply sway relative to the current origin (boss center)

                        // Draw Bigger for impact
                        let drawW = enemy.width * 1.5;
                        let drawH = enemy.height * 1.5;

                        ctx.drawImage(awakenedBossImg, -drawW / 2, -drawH / 2, drawW, drawH);
                        ctx.restore();
                    }
                } else {
                    // NORMAL BOSS (Dragon)
                    // Draw Big
                    ctx.drawImage(bossImg, -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
                }

                /* 
                // --- OLD MANUAL HYDRA MODE (Removed/Fallback Logic handling above) ---
                if (enemy.isAwakened) { ... }
                */

                ctx.restore();


            } else {
                // Fallback
                ctx.fillStyle = enemy.isAwakened ? 'purple' : 'red';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }

            // Draw Boss HP Bar
            ctx.fillStyle = 'black';
            ctx.fillRect(enemy.x, enemy.y - 20, enemy.width, 10);
            ctx.fillStyle = enemy.isAwakened ? 'purple' : 'green';
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

    // Attack Boost Indicator (Purple/Black)
    if (player.isAttackBoost) {
        ctx.fillStyle = 'red';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('攻撃力2.5倍！', 350, 100);
    }

    // Attack Boost Button (Purple Character Only - Was Invincible)
    if (player.canInvincible) {
        if (player.isAttackBoost) {
            // Already active, draw status handled by generic indicator
        } else if (!player.invincibleUsed) {
            ctx.fillStyle = 'purple';
            ctx.fillRect(650, 230, 100, 40);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText('攻撃2.5倍', 660, 258);

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
        ctx.textAlign = 'start'; // Reset alignment
    }

    // DRAW VICTORY DANCE (Overlay)
    if (gameState === 'VICTORY_DANCE') {
        // Semi-transparent overlay to darken game world but keep it visible
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        // Flashing background effect (Disco lights)
        if (Math.random() > 0.8) ctx.fillStyle = `hsla(${Math.random() * 360}, 50%, 50%, 0.3)`;

        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Clones
        victoryDancePlayers.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            // Draw Player Image
            if (playerImg.complete) {
                ctx.drawImage(playerImg, -30, -30, 60, 60);
            } else {
                ctx.fillStyle = p.color;
                ctx.fillRect(-30, -30, 60, 60);
            }

            // Add colorful border
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 5;
            ctx.strokeRect(-30, -30, 60, 60);
            ctx.restore();
        });

        // VICTORY TEXT
        ctx.save();
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'gold';
        ctx.font = '80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SUPER VICTORY!!', canvas.width / 2, 200);

        ctx.font = '40px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('ヒュドラ討伐おめでとう！', canvas.width / 2, 300);
        ctx.fillText('F5キーで タイトルへ', canvas.width / 2, 500);
        ctx.restore();

        ctx.textAlign = 'left';
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

    // Draw Ultimate UI
    if (gameState === 'PLAYING') {
        let timeLeft = Math.ceil(player.ultimateCooldown / 60);
        let label = timeLeft > 0 ? timeLeft : 'READY!';

        ctx.fillStyle = timeLeft > 0 ? 'gray' : 'gold'; // Gold if ready
        ctx.fillRect(350, 20, 100, 60);

        ctx.fillStyle = timeLeft > 0 ? 'white' : 'red';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('ULT技', 375, 45);
        ctx.fillText(label, 375, 70);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(350, 20, 100, 60);
    }

    drawVirtualControls();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}



// --- MOBILE TOUCH CONTROLS ---

const touchControls = [
    { id: 'left', x: 20, y: 500, width: 80, height: 80, key: 'ArrowLeft', label: '←' },
    { id: 'right', x: 120, y: 500, width: 80, height: 80, key: 'ArrowRight', label: '→' },
    { id: 'jump', x: 680, y: 500, width: 80, height: 80, key: 'Space', label: 'JUMP' },
    { id: 'attack', x: 580, y: 500, width: 80, height: 80, key: 'KeyZ', label: 'ATK' },
    { id: 'ult', x: 350, y: 20, width: 100, height: 60, key: 'KeyX', label: 'ULT技' }
];

function activateUltimate() {
    player.ultimateCooldown = 3600; // 60 seconds

    // Determine Character Index based on image source name or checking array
    let charIdx = characters.indexOf(playerImg);
    if (charIdx === -1) charIdx = 0; // Default

    // EFFECT LOGIC per Character
    if (charIdx === 0) { // Red: Full Heal
        player.hp = player.maxHp;
    }
    else if (charIdx === 1) { // White: Omni Shot
        // Shoot 8 directions
        let dirs = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
        dirs.forEach(d => {
            lasers.push({
                x: player.x + player.width / 2, y: player.y + player.height / 2,
                width: 40, height: 40, vx: d[0] * 15, vy: d[1] * 15,
                color: 'white', isStrong: true
            });
        });
    }
    else if (charIdx === 2) { // Green: Meteor
        player.dy = -30; // Launch up
        setTimeout(() => { player.dy = 50; }, 500); // Slam down
    }
    else if (charIdx === 3) { // Yellow: Zero G
        player.ultimateActive = 1200; // 20s
    }
    else if (charIdx === 4) { // Pink: The World
        player.isTimeStopped = true;
        player.timeStopTimer = 600; // 10s (Using existing variable)
        player.ultimateCooldown = 3600;
    }
    else if (charIdx === 5) { // Purple: Attack Boost
        player.isAttackBoost = true;
        player.ultimateActive = 1200; // 20s
    }
    else if (charIdx === 6) { // Orange: Giga Beam
        // Huge Piercing Beam
        lasers.push({
            x: player.x + 50, y: player.y,
            width: 800, height: 60,
            vx: 30, vy: 0,
            color: 'orange',
            isStrong: true,
            isPiercing: true // Don't disappear on hit
        });
    }
    else if (charIdx === 7) { // Light Blue: Light Speed
        player.isSpeedUp = true;
        player.speedUpTimer = 1200; // 20s
    }
    else if (charIdx === 8) { // Black: Attack Boost
        player.isAttackBoost = true;
        player.ultimateActive = 1200; // 20s
    }
    else if (charIdx === 9) { // Grey: Refill
        player.blockCount += 20;
        if (player.hp < player.maxHp) player.hp++;
    }
}


function drawVirtualControls() {
    // Only draw if screen width is small (simulating mobile) OR if we just want to force it for testing
    // For now, let's always draw them if the device supports touch or screen is small
    // Simple check: always draw for this prototype

    ctx.save();
    ctx.globalAlpha = 0.5;

    touchControls.forEach(btn => {
        ctx.fillStyle = '#333';
        ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
    });

    ctx.restore();
}

function handleTouch(e) {
    e.preventDefault(); // Prevent scrolling

    // Reset mapped keys first (optional, but safer to assume no touch = no key press for these specific keys)
    // Actually, we should track active touches.

    // Clear our virtual keys for this frame (simulated)
    // But we can't clear ALL keys, only the ones we control.
    // Better approach: Check all active touches and set keys true if they match a button.

    // 1. Reset virtual keys false
    touchControls.forEach(btn => {
        keys[btn.key] = false;
    });

    // 2. Check active touches
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const rect = canvas.getBoundingClientRect();

        // Scale touch coordinates to canvas size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const touchX = (touch.clientX - rect.left) * scaleX;
        const touchY = (touch.clientY - rect.top) * scaleY;

        touchControls.forEach(btn => {
            if (touchX > btn.x && touchX < btn.x + btn.width &&
                touchY > btn.y && touchY < btn.y + btn.height) {
                keys[btn.key] = true;

                // Special handling for jump (Space causes jump on keydown)
                // In game loop, we check keys['Space']. 
                // The original code uses 'keydown' event for jump initiation.
                // We might need to manually trigger logic or ensure keys['Space'] being true works.
                // Original: if (e.code === 'Space') ... 
                // We need to simulate the "keydown" effect if it wasn't pressed before.
            }
        });
    }
}

// Attach listeners
canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });
canvas.addEventListener('touchend', handleTouch, { passive: false });

// Also handle jump trigger specifically if needed, but the loop checks keys['Space']
// Wait, the jump logic is in 'keydown' event listener (lines 328).
// "if (e.code === 'Space')" -> this only runs once per press.
// If I just set keys['Space'] = true, the `update` loop might not catch the specific "initiate jump" moment 
// because that logic is INSIDE the event listener, not the update loop. (Lines 327-346)

// FIX: We need to move the Jump logic into `update()` or trigger it manually.
// Refactoring Jump Logic:
// I will extract the jump logic into a function `doJump()` and call it.
// Or, detecting a "new press" in the update loop.

// Let's modify the update loop to handle jump if keys['Space'] is held? 
// No, we want distinct jumps.

// To support touch "tap" for jump:
// specific logic in handleTouch for 'touchstart'.
canvas.addEventListener('touchstart', function (e) {
    handleTouch(e); // Update keys

    // Trigger "Jump" logic if Jump button was just touched
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const touchX = (touch.clientX - rect.left) * scaleX;
        const touchY = (touch.clientY - rect.top) * scaleY;

        // Check Jump Button
        let jumpBtn = touchControls.find(b => b.id === 'jump');
        if (touchX > jumpBtn.x && touchX < jumpBtn.x + jumpBtn.width &&
            touchY > jumpBtn.y && touchY < jumpBtn.y + jumpBtn.height) {
            // Simulate Jump Event Logic
            // Copying logic from keydown listener
            if (player.isFlying) {
                // Handled in update
            } else {
                if (player.jumpCount < player.maxJumps) {
                    let jumpForce = player.jumpPower;
                    if (player.isSpeedUp) jumpForce *= 1.5;

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

        // Check Attack Button
        let atkBtn = touchControls.find(b => b.id === 'attack');
        if (touchX > atkBtn.x && touchX < atkBtn.x + atkBtn.width &&
            touchY > atkBtn.y && touchY < atkBtn.y + atkBtn.height) {

            if (player.shotCooldown > 0) continue; // Cooldown Check
            player.shotCooldown = 20;

            // Simulate Attack Logic (KeyZ)
            // Copying logic from keydown (lines 296-323)
            let dir = player.facingRight ? 1 : -1;
            let speed = 10;
            let shots = [];
            if (player.canTripleShot) {
                shots.push({ vx: speed * dir, vy: 0 });
                shots.push({ vx: speed * dir, vy: -2 });
                shots.push({ vx: speed * dir, vy: 2 });
            } else {
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
    }
}, { passive: false });

// --- MOUSE CONTROLS FOR VIRTUAL BUTTONS (PC Support) ---
canvas.addEventListener('mousedown', function (e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    touchControls.forEach(btn => {
        if (mouseX > btn.x && mouseX < btn.x + btn.width &&
            mouseY > btn.y && mouseY < btn.y + btn.height) {
            keys[btn.key] = true;

            // Handle Jump Logic explicitly for mouse click too
            if (btn.id === 'jump') {
                if (!player.isFlying && player.jumpCount < player.maxJumps) {
                    let jumpForce = player.jumpPower;
                    if (player.isSpeedUp) jumpForce *= 1.5;

                    if (player.jumpCount === 0) player.dy = jumpForce;
                    else player.dy = jumpForce * 0.7;

                    player.grounded = false;
                    player.jumpCount++;
                }
            }
            // Handle Attack Logic
            if (btn.id === 'attack') {
                if (player.shotCooldown <= 0) {
                    player.shotCooldown = 20;
                    // Simulate Attack
                    let dir = player.facingRight ? 1 : -1;
                    let speed = 10;
                    let shots = [];
                    if (player.canTripleShot) {
                        shots.push({ vx: speed * dir, vy: 0 });
                        shots.push({ vx: speed * dir, vy: -2 });
                        shots.push({ vx: speed * dir, vy: 2 });
                    } else {
                        shots.push({ vx: speed * dir, vy: 0 });
                    }
                    shots.forEach(shot => {
                        lasers.push({
                            x: player.x + player.width / 2, y: player.y + player.height / 2, width: 30, height: 5,
                            vx: shot.vx, vy: shot.vy, color: player.canStrongBeam ? 'orange' : 'yellow', isStrong: player.canStrongBeam
                        });
                    });
                }
            }
            // Handle Ultimate Logic
            if (btn.id === 'ult') {
                if (player.ultimateCooldown <= 0) activateUltimate();
            }
        }
    });
});

canvas.addEventListener('mouseup', function (e) {
    // Release all virtual keys
    touchControls.forEach(btn => {
        keys[btn.key] = false;
    });
});

canvas.addEventListener('mouseout', function (e) {
    // Release all virtual keys if mouse leaves canvas
    touchControls.forEach(btn => {
        keys[btn.key] = false;
    });
});

gameLoop();

