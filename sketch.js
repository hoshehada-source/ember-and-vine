/*
 * All core project mechanics are explicitly tagged alongside my original comments:
 * - "Part 2a": Character visual states (Standing, Walking, Jumping).
 * - "Part 2b": Base scenery objects (Canyon, Collectable, Mountains, Clouds, Trees).
 * - "Part 3a": Character interaction, keyboard controls, and gravity system.
 * - "Part 3b": Advanced scenery interaction (Falling in Canyon, Collecting Item).
 * Any other feature is explicitly labeled as "Extra Work".
 */

// GLOBAL VARIABLES
// Character & Physics
let gameChar_x;
let gameChar_y;
let floorPos_y;
let velY;           // Vertical velocity for jump physics
let lastMoveDir = 1; // Last facing direction (1 = right, -1 = left)

// Control & Movement Flags
let isLeft;
let isRight;
let isFalling;
let isPlummeting;

// Environment & Scenery Arrays
let canyons;
let trees_x;
let treePos_y;
let mountains;
let clouds;
let birds;
let collectables;
let platforms;
let enemies;
let spaceships;
let rocks;

// Game Stats & Progression
let gameScore;
let lives;
let cameraPosX;
let world2Start;
let gameState;      // Current game state ("menu" or "playing")
let storySlide;     // Current story page in menu

// Audio Elements
let jumpSound;
let coinSound;
let winSound;
let fallSound;
let loseLifeSound;
let gameOverSound;
let stompSound;
let rockThrowSound;
let rockPickupSound;
let hitSound;
let bonusLifeSound;
let menuMusic;

// Extra Work Features (Combat, Shop, Weather & Timers)
let rockCount;
let playerProjectiles;
let throwTimer;
let isRaining;
let missionTimer;
let bossDefeatedTimer;
let rainTimer;
let rainCheckTimer;
let raindrops;
let ashFlakes;
let enrageMsgTimer;
let extraLifeGiven;
let extraLifeTimer;
let noRocksTimer;
let edgeMsgTimer;
let walletCoins;
let shopItems;
let hasShield;
let hasArrow;
let arrowCount;
let purchaseMsgTimer;
let purchaseMsgAmount;
let shieldHp;

// PRELOAD ASSETS
function preload() {
    // Core game sound effects
    jumpSound = loadSound('sounds/jump.wav');
    coinSound = loadSound('sounds/coin.wav');
    winSound = loadSound('sounds/win.wav');
    fallSound = loadSound('sounds/fall.wav');
    loseLifeSound = loadSound('sounds/lose_life.wav');
    gameOverSound = loadSound('sounds/game_over.wav');
    stompSound = loadSound('sounds/stomp.wav');

    // Extra Work sound effects & background music
    rockThrowSound = loadSound('sounds/rock_throw.wav');
    rockPickupSound = loadSound('sounds/rock_pickup.wav');
    hitSound = loadSound('sounds/hit.wav');
    bonusLifeSound = loadSound('sounds/bonus_life.wav');
    menuMusic = loadSound('sounds/menu_music.mp3');

    emberDashPreload(); // Loads additional Ember Dash audio assets
}
// SETUP FUNCTION
function setup() {
    createCanvas(1024, 576);

    floorPos_y = height * 3 / 4; // Set ground level
    lives = 3;
    gameState = "menu"; // Start with the main menu

    // Shop currency and purchases setup (reset only here so they survive restarts)
    walletCoins = 0;
    purchaseMsgTimer = 0;
    purchaseMsgAmount = 0;
    hasShield = false;
    hasArrow = false;
    shopItems = [
        { name: "Extra Life", price: 30, type: "life" },
        { name: "Shield", price: 15, type: "shield" },
        { name: "Arrow Weapon", price: 15, type: "arrow" },
        { name: "Invincibility Star", price: 20, type: "star" }
    ];

    startGame();
}
// DRAW FUNCTION
function draw() {
    // Check game screens/states (menu, instructions, shop, story, pause)
    if (gameState == "menu") {
        drawMenu();
        return;
    }
    if (gameState == "instructions") {
        drawInstructions();
        return;
    }
    if (gameState == "shop") {
        drawShop();
        return;
    }
    if (gameState == "story") {
        drawStory();
        return;
    }
    if (gameState == "paused") {
        drawPauseMenu();
        return;
    }
    // Update camera and background
    updateCamera();
    drawBackground();
    push();
    translate(-cameraPosX, 0);
    // Draw environment and world elements
    drawGround();
    drawScenery();
    drawMountains();
    drawTrees();
    drawSpaceship();
    // Warning signs before big canyons and before the boss
    drawWarningSign();
    drawBossWarningSign();
    // Check spaceship status
    if (!anySpaceshipReached()) {
        checkSpaceship();
    } else {
        missionTimer += 1; // Ship keeps rising the longer it's reached
    }
    // Loop to draw and check enemies and collisions
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].draw();

        if (anySpaceshipReached()) {
            continue;
        }

        // Boss gets faster when health drops to half
        if (enemies[i].maxHp > 1 && !enemies[i].isEnraged && !enemies[i].isDead && enemies[i].hp <= enemies[i].maxHp / 2) {
            enemies[i].isEnraged = true;
            enemies[i].incAmount = 2;
            enrageMsgTimer = 120;
        }

        // Check stomping or hitting regular enemies vs boss
        if (enemies[i].maxHp <= 1 && enemies[i].checkStomp(gameChar_x, gameChar_y, velY)) {
            enemies[i].hp -= 1;
            if (enemies[i].hp <= 0) {
                enemies[i].isDead = true;
            }
            stompSound.play();
            velY = -8;
        }
        else if (enemies[i].checkContact(gameChar_x, gameChar_y) && lives > 0 && invincibleTimer > 0) {
            if (enemies[i].maxHp <= 1) {
                enemies[i].isDead = true;
                stompSound.play();
            }
        }
        else if (enemies[i].checkContact(gameChar_x, gameChar_y) && lives > 0 && shieldHp > 0) {
            // Shield takes the hit instead of player (has 3 charges)
            shieldHp -= 1;
            if (shieldHp <= 0) {
                hasShield = false; // Shield used up and gone for good
            }
            hitSound.play();
            resetPlayer();
        }
        else if (enemies[i].checkContact(gameChar_x, gameChar_y) && lives > 0) {
            lives -= 1;
            if (lives > 0) {
                hitSound.play();
                resetPlayer();
            } else {
                gameOverSound.play();
            }
            break;
        }
        else if (enemies[i].checkFireballHit(gameChar_x, gameChar_y) && lives > 0 && invincibleTimer <= 0) {
            // Check boss fireball hit
            if (shieldHp > 0) {
                shieldHp -= 1;
                if (shieldHp <= 0) {
                    hasShield = false;
                }
                hitSound.play();
                resetPlayer();
            } else {
                lives -= 1;
                if (lives > 0) {
                    hitSound.play();
                    resetPlayer();
                } else {
                    gameOverSound.play();
                }
                break;
            }
        }
    }

    // Check if player fell off screen or into canyon
    checkPlayerDie();
    if (gameChar_y >= floorPos_y) {
        isPlummeting = false;
    }

    for (let i = 0; i < canyons.length; i++) {
        drawCanyon(canyons[i]);
        checkCanyon(canyons[i]);
    }

    if (isPlummeting == true) {
        gameChar_y += 4;
        isLeft = false;
        isRight = false;
    }

    // Check and draw collectables, power-ups, chests, and rocks
    for (let i = 0; i < collectables.length; i++) {
        if (!collectables[i].isFound) {
            drawCollectable(collectables[i]);
            checkCollectable(collectables[i]);
        }
    }

    for (let i = 0; i < powerUps.length; i++) {
        if (!powerUps[i].isFound) {
            drawPowerUp(powerUps[i]);
            checkPowerUp(powerUps[i]);
        }
    }

    for (let i = 0; i < treasureChests.length; i++) {
        if (!treasureChests[i].isFound) {
            drawChest(treasureChests[i]);
            checkChest(treasureChests[i]);
        }
    }

    for (let i = 0; i < rocks.length; i++) {
        if (!rocks[i].isFound) {
            drawRock(rocks[i]);
            checkRock(rocks[i]);
        }
    }

    // Move, draw, and check thrown rocks or arrows
    for (let i = 0; i < playerProjectiles.length; i++) {
        if (playerProjectiles[i].active) {
            playerProjectiles[i].x += playerProjectiles[i].dir * 8;

            let traveled = abs(playerProjectiles[i].x - playerProjectiles[i].startX);
            if (traveled > 300) {
                playerProjectiles[i].active = false; // Projectile disappears if it flies too far without hitting anything
            }

            noStroke();
            if (playerProjectiles[i].isArrow) {
                // Draw the custom shop arrow
                fill(139, 90, 43);
                rect(playerProjectiles[i].x - 8 * playerProjectiles[i].dir, playerProjectiles[i].y - 1, 16 * playerProjectiles[i].dir, 2);
                fill(90, 90, 95);
                triangle(playerProjectiles[i].x + 6 * playerProjectiles[i].dir, playerProjectiles[i].y - 4, playerProjectiles[i].x + 6 * playerProjectiles[i].dir, playerProjectiles[i].y + 4, playerProjectiles[i].x + 12 * playerProjectiles[i].dir, playerProjectiles[i].y);
            } else {
                fill(120, 110, 100);
                ellipse(playerProjectiles[i].x, playerProjectiles[i].y, 10, 10);
            }

            // Check if projectile hits any enemy
            for (let j = 0; j < enemies.length; j++) {
                if (!enemies[j].isDead) {
                    let d = dist(playerProjectiles[i].x, playerProjectiles[i].y, enemies[j].currentX, enemies[j].y);
                    if (d < 25) {
                        enemies[j].hp -= 1;
                        if (enemies[j].hp <= 0) {
                            enemies[j].isDead = true;
                            if (enemies[j].maxHp > 1) {
                                bossDefeatedTimer = 180; // Boss defeat message timer
                            }
                        }
                        playerProjectiles[i].active = false;
                        stompSound.play();
                    }
                }
            }
        }
    }
    // DRAW PLATFORMS
    for (let i = 0; i < platforms.length; i++) {
        platforms[i].draw();
    }
    // Draw clouds depending on where the player is
    drawClouds();
    // DRAW & MOVE BIRDS
    drawBirds();
    // Update Ember Dash (speed boost) state
    updateEmberDash();
    // Keep checking whether it should start/stop raining
    updateRain();
    // Power-up timers (invincibility, chest message)
    updatePowerUpTimers();
    // PART 2a - CHARACTER RENDERING
    // The player boards the ship and disappears once it's reached
    if (!anySpaceshipReached()) {
        drawGameChar();
        drawInvincibleGlow(gameChar_x, gameChar_y);
    }
    // End camera scroll frame
    pop();
    // Rain is drawn on the screen itself, not the scrolling world
    drawRain();
    // Ash falls in the volcano world, also drawn on the screen itself
    drawAsh();
    drawHUD();
    // Part 3a - CHARACTER MOVEMENT
    // Move horizontally based on input
    charMove();
    // Invisible wall so the player can't wander past the end of the level
    if (gameChar_x > 4300) {
        gameChar_x = 4300;
        edgeMsgTimer = 90;
    }
    if (gameChar_x < -3900) {
        gameChar_x = -3900;
    }
    // Part 3a - GRAVITY SYSTEM
    gravityMov();
}
// Part 3a - KEY PRESSED
function keyPressed() {
    // Make sure sound is allowed to play after this key press
    if (getAudioContext().state != "running") {
        getAudioContext().resume();
    }
    // Ignore key presses unless the game is playing
    if (gameState != "playing") {
        return;
    }
    // Horizontal movement
    if (anySpaceshipReached() || lives < 1) {
        isLeft = false;
        isRight = false;
        isPlummeting = false;
        // Press space to restart after winning or losing
        if (key == ' ') {
            restartGame();
        }
    }
    else {
        if (key == 'd' || key == 'D' || keyCode == 39) {
            isRight = true;
        }
        if (key == 'a' || key == 'A' || keyCode == 37) {
            isLeft = true;
        }
        // Jump (only if on ground)
        if ((key == 'w' || key == 'W' || keyCode == 38) && isFalling == false) {
            velY = -12;
            jumpSound.play();
        }
        // Throw an arrow or a rock at the enemy (arrows go first, separate ammo from rocks)
        if (key == 'f' || key == 'F' || keyCode == 70) {
            if (arrowCount > 0) {
                arrowCount -= 1;
                playerProjectiles.push({ x: gameChar_x, y: gameChar_y - 30, startX: gameChar_x, dir: lastMoveDir, active: true, isArrow: true });
                rockThrowSound.play();
                throwTimer = 15;
            } else if (rockCount > 0) {
                rockCount -= 1;
                playerProjectiles.push({ x: gameChar_x, y: gameChar_y - 30, startX: gameChar_x, dir: lastMoveDir, active: true, isArrow: false });
                rockThrowSound.play();
                throwTimer = 15;
            } else {
                noRocksTimer = 90;
            }
        }
        // Ember Dash (speed boost), only works if fully charged (ready)
        if (key == 'q' || key == 'Q' || keyCode == 81) {
            tryActivateEmberDash();
        }
        // Part 3b - Disable movement while falling in canyon
        if (isPlummeting) {
            isLeft = false;
            isRight = false;
        }
    }
}
// Part 3a - KEY RELEASED
function keyReleased() {
    // Stop horizontal movement
    if (key == 'd' || key == 'D' || keyCode == 39) {
        isRight = false;
    }
    if (key == 'a' || key == 'A' || keyCode == 37) {
        isLeft = false;
    }
}
// Part 2b - Mountains
function drawMountains() {
    for (let i = 0; i < mountains.length; i++) {
        noStroke();
        if (gameChar_x < world2Start) {
            // VOLCANO WORLD
            // Back mountain
            fill(50, 20, 20);
            triangle(mountains[i].x_pos - 30, mountains[i].y,
                mountains[i].x_pos + 150, mountains[i].y,
                mountains[i].x_pos + 40, mountains[i].y - 260);
            // Big volcano
            fill(70, 25, 25);
            triangle(mountains[i].x_pos + 20, mountains[i].y,
                mountains[i].x_pos + 220, mountains[i].y,
                mountains[i].x_pos + 120, mountains[i].y - 290);
            // Volcano shadow
            fill(35, 12, 12);
            triangle(mountains[i].x_pos + 120, mountains[i].y,
                mountains[i].x_pos + 220, mountains[i].y,
                mountains[i].x_pos + 150, mountains[i].y - 210);
            // Lava 1
            fill(255, 65, 0, 180);
            triangle(mountains[i].x_pos + 95, mountains[i].y,
                mountains[i].x_pos + 135, mountains[i].y,
                mountains[i].x_pos + 120, mountains[i].y - 180);
            // Lava 2 (inner)
            fill(255, 140, 0);
            triangle(mountains[i].x_pos + 105, mountains[i].y,
                mountains[i].x_pos + 125, mountains[i].y,
                mountains[i].x_pos + 120, mountains[i].y - 120);
            // Top glow
            fill(255, 90, 0, 160);
            ellipse(mountains[i].x_pos + 120, mountains[i].y - 275, 25, 15);
            // Drifting ash fog near the volcano base
            fill(90, 60, 60, 40);
            let ashShift = (frameCount % 200) - 100;
            ellipse(mountains[i].x_pos + 120 + ashShift, mountains[i].y - 10, 150, 20);
            // Lava bubbles floating up, same frameCount trick as everywhere else
            for (let b = 0; b < 3; b++) {
                fill(255, 120, 0);
                ellipse(mountains[i].x_pos + 110 + b * 10,
                    (mountains[i].y - 260) - (frameCount % 60) - b * 15, 6);
            }
            // Sparks flying up from the lava, same modulo trick as the bubbles
            for (let sp = 0; sp < 2; sp++) {
                fill(255, 200, 0, 180);
                ellipse(mountains[i].x_pos + 110 + sp * 20,
                    (mountains[i].y - 260) - (frameCount % 80) - sp * 10, 3);
            }
        } else {
            // Normal WORLD
            // Left small mountain
            fill(110, 135, 160);
            triangle(mountains[i].x_pos - 60, mountains[i].y,
                mountains[i].x_pos + 70, mountains[i].y,
                mountains[i].x_pos, mountains[i].y - 150);
            // Right small mountain
            fill(85, 105, 125);
            triangle(mountains[i].x_pos + 120, mountains[i].y,
                mountains[i].x_pos + 250, mountains[i].y,
                mountains[i].x_pos + 185, mountains[i].y - 130);
            // Big mountain left side
            fill(145, 175, 205);
            triangle(mountains[i].x_pos, mountains[i].y,
                mountains[i].x_pos + 100, mountains[i].y,
                mountains[i].x_pos + 100, mountains[i].y - 250);
            // Big mountain right side
            fill(100, 120, 145);
            triangle(mountains[i].x_pos + 100, mountains[i].y,
                mountains[i].x_pos + 200, mountains[i].y,
                mountains[i].x_pos + 100, mountains[i].y - 250);
            // Snow on top
            fill(255, 255, 255);
            triangle(mountains[i].x_pos + 84, mountains[i].y - 210,
                mountains[i].x_pos + 116, mountains[i].y - 210,
                mountains[i].x_pos + 100, mountains[i].y - 250);
            triangle(mountains[i].x_pos - 13, mountains[i].y - 120,
                mountains[i].x_pos + 13, mountains[i].y - 120,
                mountains[i].x_pos, mountains[i].y - 150);
            // Snow sparkle on the peak, same modulo trick as the drone light
            if (frameCount % 40 < 5) {
                stroke(255, 240, 150);
                strokeWeight(2);
                line(mountains[i].x_pos + 94, mountains[i].y - 245, mountains[i].x_pos + 106, mountains[i].y - 245);
                line(mountains[i].x_pos + 100, mountains[i].y - 251, mountains[i].x_pos + 100, mountains[i].y - 239);
                noStroke();
            }
            // Soft fog drifting near the mountain base, only while it's raining
            if (isRaining) {
                fill(220, 220, 230, 40);
                let fogShift = (frameCount % 200) - 100;
                ellipse(mountains[i].x_pos + 100 + fogShift, mountains[i].y - 10, 150, 20);
            }
        }
    }
}
// Part 2b - Clouds
function drawClouds() {
    for (let i = 0; i < clouds.length; i++) {
        noStroke();
        // Soft shadow under the cloud, on the ground - only shows up while it's raining
        if (isRaining) {
            fill(0, 0, 0, 40);
            ellipse(clouds[i].x, floorPos_y - 5, clouds[i].size + 20, 10);
        }
        if (gameChar_x < world2Start) {
            // [VOLCANO WORLD] dark smoke and fire clouds
            fill(255, 65, 0, 160);
            ellipse(clouds[i].x, clouds[i].y + 5, clouds[i].size + 15);
            ellipse(clouds[i].x + 30, clouds[i].y + 5, clouds[i].size + 5);
            ellipse(clouds[i].x - 30, clouds[i].y + 5, clouds[i].size + 5);
            ellipse(clouds[i].x + 120, clouds[i].y + 5, clouds[i].size + 15);
            ellipse(clouds[i].x + 150, clouds[i].y + 5, clouds[i].size + 5);
            ellipse(clouds[i].x + 90, clouds[i].y + 5, clouds[i].size + 5);

            // Main body
            fill(85, 80, 85);
            ellipse(clouds[i].x, clouds[i].y, clouds[i].size + 10);
            ellipse(clouds[i].x + 30, clouds[i].y, clouds[i].size);
            ellipse(clouds[i].x - 30, clouds[i].y, clouds[i].size);
            ellipse(clouds[i].x + 120, clouds[i].y, clouds[i].size + 10);
            ellipse(clouds[i].x + 150, clouds[i].y, clouds[i].size);
            ellipse(clouds[i].x + 90, clouds[i].y, clouds[i].size);
            // Light grey highlight on top
            fill(185, 175, 175);
            ellipse(clouds[i].x, clouds[i].y - 3, clouds[i].size);
            ellipse(clouds[i].x + 120, clouds[i].y - 3, clouds[i].size);
        } else {
            // More organic puff sizes + soft grey underside for volume
            let puffs = [[0, 0, 10], [30, 2, 0], [-30, 2, 0], [15, -8, -4], [-15, -8, -4], [120, 0, 10], [150, 2, 0], [90, 2, 0]];
            for (let p = 0; p < puffs.length; p++) {
                fill(210, 210, 220); // Shaded underside, drawn first so the white puff covers most of it
                ellipse(clouds[i].x + puffs[p][0], clouds[i].y + puffs[p][1] + 3, clouds[i].size + puffs[p][2]);
            }
            for (let p = 0; p < puffs.length; p++) {
                fill(255);
                ellipse(clouds[i].x + puffs[p][0], clouds[i].y + puffs[p][1], clouds[i].size + puffs[p][2]);
            }
        }
    }
    // Keeps the clouds slowly drifting
    for (let i = 0; i < clouds.length; i++) {
        clouds[i].x = clouds[i].x + 0.5; // Move them slowly to the right
        // If it goes off screen on the right, bring it back from the left side
        if (clouds[i].x > 4600) {
            clouds[i].x = -4600;
        }
    }
}
// Part 2b - Trees
function drawTrees() {
    for (let i = 0; i < trees_x.length; i++) {
        if (gameChar_x < world2Start) {
            // WORLD 2 - DEAD / BURNT TREES (left side volcano)
            // Trunk
            fill(60, 30, 20);
            rect(trees_x[i], treePos_y, 45, 150);
            // Branches only (no leaves)
            stroke(80, 40, 30);
            strokeWeight(4);
            line(trees_x[i] + 20, treePos_y + 40, trees_x[i] - 20, treePos_y);
            line(trees_x[i] + 25, treePos_y + 60, trees_x[i] + 60, treePos_y + 20);
            line(trees_x[i] + 20, treePos_y + 90, trees_x[i] - 30, treePos_y + 70);
            noStroke();
            // Small lava glow spots
            fill(255, 80, 0, 120);
            ellipse(trees_x[i] + 20, treePos_y + 10, 10);
            // Ember particles drifting up from the glow spot
            for (let e = 0; e < 2; e++) {
                fill(255, 140, 0, 180);
                ellipse(trees_x[i] + 20 + e * 6, treePos_y + 10 - (frameCount % 50) - e * 10, 3);
            }
        } else {
            // WORLD 1 - NORMAL TREES
            fill(110, 75, 35);
            rect(trees_x[i], treePos_y, 45, 150);
            fill(85, 55, 25);
            rect(trees_x[i] + 30, treePos_y, 15, 150);
            // Gentle sway on the treetop
            let sway = 0;
            if (frameCount % 60 < 30) {
                sway = 2;
            } else {
                sway = -2;
            }
            // Tree variety based on its position
            let treeVariety = (trees_x[i] % 30) - 15;

            fill(30, 95, 45);
            triangle(trees_x[i] - 50 + sway, treePos_y + 60,
                trees_x[i] + 22 + sway, treePos_y - 20,
                trees_x[i] + 95 + sway, treePos_y + 60);
            // Shaded side of the canopy
            fill(20, 70, 35, 140);
            triangle(trees_x[i] + 22 + sway, treePos_y - 20,
                trees_x[i] + 95 + sway, treePos_y + 60,
                trees_x[i] + 22 + sway, treePos_y + 60);

            fill(39, 130, 60);
            triangle(trees_x[i] - 40 + sway, treePos_y + 15,
                trees_x[i] + 22 + sway, treePos_y - 65 + treeVariety,
                trees_x[i] + 85 + sway, treePos_y + 15);
            fill(28, 100, 46, 140);
            triangle(trees_x[i] + 22 + sway, treePos_y - 65 + treeVariety,
                trees_x[i] + 85 + sway, treePos_y + 15,
                trees_x[i] + 22 + sway, treePos_y + 15);

            fill(46, 204, 113);
            triangle(trees_x[i] - 30 + sway, treePos_y - 25,
                trees_x[i] + 22 + sway, treePos_y - 105 + treeVariety,
                trees_x[i] + 75 + sway, treePos_y - 25);

            // Leafy clumps along the canopy edges
            let leafClumps = [[-35, 40], [10, -5], [55, 40], [-20, -10], [50, -10]];
            for (let c = 0; c < leafClumps.length; c++) {
                fill(50, 160, 75);
                ellipse(trees_x[i] + leafClumps[c][0] + sway, treePos_y + leafClumps[c][1], 16, 16);
                fill(39, 130, 60);
                ellipse(trees_x[i] + leafClumps[c][0] + sway, treePos_y + leafClumps[c][1] + 3, 12, 10);
            }

            // Leaves falling from the treetop
            for (let l = 0; l < 3; l++) {
                let leafY = (frameCount * 0.5 + l * 40) % 100;
                fill(60, 150, 70, 150);
                ellipse(trees_x[i] + 22 + (l - 1) * 20, treePos_y - 60 + leafY, 4, 4);
            }
        }
    }
}
// Part 2b - Collectable coins
function drawCollectable(t_collectable) {
    if (t_collectable.isFound == false) {
        // Collectable floats up and down
        if (frameCount % 40 < 20) {
            t_collectable.y_pos += 0.3;
        } else {
            t_collectable.y_pos -= 0.3;
        }
        noStroke();
        fill(255, 225, 50, 120);
        ellipse(t_collectable.x_pos, t_collectable.y_pos, t_collectable.size - 10);
        stroke(255);
        strokeWeight(2);
        fill(255, 195, 0);
        ellipse(t_collectable.x_pos, t_collectable.y_pos, t_collectable.size - 25);
        noStroke();
        fill(255, 230, 100);
        ellipse(t_collectable.x_pos, t_collectable.y_pos, t_collectable.size - 38);
        // Little particle ring around the coin
        let coinRingPoints = [[20, 0], [0, 20], [-20, 0], [0, -20]];
        for (let p = 0; p < coinRingPoints.length; p++) {
            let spin = (frameCount + p * 16) % 40;
            if (spin < 20) {
                fill(255, 230, 100, 220);
            } else {
                fill(255, 230, 100, 60);
            }
            ellipse(t_collectable.x_pos + coinRingPoints[p][0], t_collectable.y_pos + coinRingPoints[p][1], 5, 5);
        }
    }
}
// Rock pickup
function drawRock(t_rock) {
    // Floating direction (Extra Work) - same trick as the coins
    if (frameCount % 40 < 20) {
        t_rock.y_pos += 0.3;
    } else {
        t_rock.y_pos -= 0.3;
    }

    noStroke();
    fill(80, 210, 225, 110);
    ellipse(t_rock.x_pos, t_rock.y_pos, t_rock.size);
    // Rock body
    stroke(20, 20, 25);
    strokeWeight(2);
    fill(70, 65, 75);
    ellipse(t_rock.x_pos, t_rock.y_pos, t_rock.size - 12);
    // Glowing crystal effect on the rock
    noStroke();
    fill(110, 230, 240);
    ellipse(t_rock.x_pos - 4, t_rock.y_pos - 3, t_rock.size - 26, t_rock.size - 30);
    // Little particle ring around the rock
    let rockRingPoints = [[26, 0], [0, 26], [-26, 0], [0, -26]];
    for (let p = 0; p < rockRingPoints.length; p++) {
        let spin = (frameCount + p * 16) % 40;
        if (spin < 20) {
            fill(110, 230, 240, 220);
        } else {
            fill(110, 230, 240, 60);
        }
        ellipse(t_rock.x_pos + rockRingPoints[p][0], t_rock.y_pos + rockRingPoints[p][1], 5, 5);
    }
}
function checkRock(t_rock) {
    if (dist(gameChar_x, gameChar_y, t_rock.x_pos, t_rock.y_pos) < 35) {
        t_rock.isFound = true;
        rockCount += 1;
        rockPickupSound.play();
    }
}
// Part 2b - Canyons
function drawCanyon(t_canyon) {
    noStroke();
    fill(15, 10, 10);
    rect(t_canyon.x_pos, floorPos_y, t_canyon.width, 145);

    // Canyon looks different depending on the world
    if (gameChar_x < world2Start) {
        // Volcano world canyon side rocks
        fill(70, 60, 60);
        triangle(t_canyon.x_pos, floorPos_y,
            t_canyon.x_pos + 30, floorPos_y + 60,
            t_canyon.x_pos, floorPos_y + 130);

        fill(85, 70, 70);
        triangle(t_canyon.x_pos + t_canyon.width, floorPos_y,
            t_canyon.x_pos + t_canyon.width - 30, floorPos_y + 70,
            t_canyon.x_pos + t_canyon.width, floorPos_y + 140);

        // Lava movement animation logic
        let lavaY = floorPos_y + 125;
        if (frameCount % 40 < 20) {
            lavaY = floorPos_y + 110;
        }
        // Glow
        fill(255, 100, 0, 90);
        ellipse(t_canyon.x_pos + t_canyon.width / 2, floorPos_y + 140, 80, 30);
        // The lava itself
        fill(255, 140, 0);
        triangle(
            t_canyon.x_pos + t_canyon.width / 2 - 15, floorPos_y + 145,
            t_canyon.x_pos + t_canyon.width / 2, lavaY,
            t_canyon.x_pos + t_canyon.width / 2 + 15, floorPos_y + 145
        );
        // Extra bright part in the middle of the lava
        fill(255, 230, 0);
        triangle(
            t_canyon.x_pos + t_canyon.width / 2 - 7, floorPos_y + 145,
            t_canyon.x_pos + t_canyon.width / 2, lavaY + 10,
            t_canyon.x_pos + t_canyon.width / 2 + 7, floorPos_y + 145
        );
    } else {
        // Normal world canyon ground edge
        fill(55, 40, 35);
        rect(t_canyon.x_pos, floorPos_y, t_canyon.width, 10);

        // Side rocks
        fill(70, 55, 45);
        triangle(t_canyon.x_pos, floorPos_y,
            t_canyon.x_pos + 30, floorPos_y + 60,
            t_canyon.x_pos, floorPos_y + 130);

        fill(80, 60, 50);
        triangle(t_canyon.x_pos + t_canyon.width, floorPos_y,
            t_canyon.x_pos + t_canyon.width - 30, floorPos_y + 70,
            t_canyon.x_pos + t_canyon.width, floorPos_y + 140);

        // Lava movement animation logic
        let lavaY = floorPos_y + 125;
        if (frameCount % 40 < 20) {
            lavaY = floorPos_y + 110;
        }

        // Glow
        fill(0, 200, 255, 70);
        ellipse(t_canyon.x_pos + t_canyon.width / 2, floorPos_y + 140, 80, 30);

        // The lava itself
        fill(0, 255, 255);
        triangle(
            t_canyon.x_pos + t_canyon.width / 2 - 15, floorPos_y + 145,
            t_canyon.x_pos + t_canyon.width / 2, lavaY,
            t_canyon.x_pos + t_canyon.width / 2 + 15, floorPos_y + 145
        );
    }
    // Fire/vine eruption out of the canyon
    drawCanyonEruption(t_canyon);
}
// Part 3b - Collecting an item
function checkCollectable(t_collectable) {
    // Check distance between character and collectable
    if (dist(gameChar_x, gameChar_y, t_collectable.x_pos, t_collectable.y_pos) < 35) {
        t_collectable.isFound = true;
        gameScore += 1;
        walletCoins += 1; // Banked for the shop, doesn't get lost when you die
        coinSound.play();
        checkBonusLife();
    }
}

// Extra Work - bonus life once the score reaches 20, no matter where the coins came from
// (called after normal coins and after a treasure chest, so a chest bonus can't skip past it)
function checkBonusLife() {
    if (gameScore >= 20 && !extraLifeGiven) {
        lives += 1;
        extraLifeGiven = true;
        extraLifeTimer = 90;
        bonusLifeSound.play();
    }
}
// Part 3b - Falling into a canyon
function checkCanyon(t_canyon) {
    // Check if character is over canyon area
    if (gameChar_x < (t_canyon.x_pos + t_canyon.width - 10) &&
        gameChar_x - 15 > t_canyon.x_pos &&
        gameChar_y >= floorPos_y) {
        if (!isPlummeting && lives > 1) {
            fallSound.play();
        }
        isPlummeting = true;
    }

    // Fire/vine eruption hazard check
    checkCanyonEruption(t_canyon);
}

function drawSpaceship() {
    for (let i = 0; i < spaceships.length; i++) {
        let f = spaceships[i];
        push();
        noStroke();

        // Landing pad stays on the ground even after the ship lifts off
        fill(60, 60, 65);
        rect(f.x_pos - 35, floorPos_y - 8, 70, 8);
        fill(90, 90, 95);
        rect(f.x_pos - 35, floorPos_y - 12, 70, 4);

        // The ship rises the longer it's been reached
        let liftOff = 0;
        if (f.isReached) {
            liftOff = missionTimer * 3;
            if (liftOff > 500) {
                liftOff = 500;
            }
        }
        translate(0, -liftOff);

        // Fire blasting out from under the ship, rises together with it
        if (f.isReached) {
            let flicker = 0;
            if (frameCount % 10 < 5) {
                flicker = 5;
            } else {
                flicker = 0;
            }
            let flameSpots = [-18, -8, 0, 8, 18];
            for (let fs = 0; fs < flameSpots.length; fs++) {
                fill(255, 140, 0, 200);
                triangle(f.x_pos + flameSpots[fs] - 7, floorPos_y - 12, f.x_pos + flameSpots[fs] + 7, floorPos_y - 12, f.x_pos + flameSpots[fs], floorPos_y - 12 + 26 + flicker);
                fill(255, 255, 120, 220);
                triangle(f.x_pos + flameSpots[fs] - 3, floorPos_y - 12, f.x_pos + flameSpots[fs] + 3, floorPos_y - 12, f.x_pos + flameSpots[fs], floorPos_y - 12 + 16 + flicker);
            }
        }

        // Landing legs
        fill(100, 100, 105);
        rect(f.x_pos - 28, floorPos_y - 40, 4, 30);
        rect(f.x_pos + 24, floorPos_y - 40, 4, 30);

        // Side fins
        fill(150, 150, 160);
        triangle(f.x_pos - 25, floorPos_y - 70, f.x_pos - 45, floorPos_y - 40, f.x_pos - 25, floorPos_y - 40);
        triangle(f.x_pos + 25, floorPos_y - 70, f.x_pos + 45, floorPos_y - 40, f.x_pos + 25, floorPos_y - 40);

        // Main body
        fill(200, 200, 210);
        ellipse(f.x_pos, floorPos_y - 120, 50, 130);

        // Nose cone (gray before, gold once you're allowed to launch)
        if (f.isReached) {
            fill(255, 215, 0);
        } else {
            fill(150, 150, 160);
        }
        triangle(f.x_pos - 25, floorPos_y - 175, f.x_pos + 25, floorPos_y - 175, f.x_pos, floorPos_y - 215);

        // Cockpit window
        fill(100, 200, 255);
        ellipse(f.x_pos, floorPos_y - 140, 22, 22);
        fill(0);
        ellipse(f.x_pos, floorPos_y - 140, 14, 14);

        // Blinking hull light
        if (frameCount % 30 < 15) {
            fill(255, 0, 0);
        } else {
            fill(120, 0, 0);
        }
        ellipse(f.x_pos, floorPos_y - 95, 5, 5);

        // Engine glow - dim normally, bright once enemies are cleared and it's ready to launch
        if (f.isReached) {
            fill(0, 200, 255, 200);
        } else {
            fill(100, 100, 110, 100);
        }
        ellipse(f.x_pos, floorPos_y - 55, 30, 16);

        // Thruster flame powering up once the ship is ready
        if (f.isReached) {
            for (let fl = 0; fl < 3; fl++) {
                fill(255, 200 - fl * 40, 0, 220 - fl * 50);
                ellipse(f.x_pos, floorPos_y - 40 - fl * 10, 20 - fl * 4, 12 - fl * 2);
            }
        }

        pop();
    }
}

// Extra Work - warning sign right before the second canyon.
function drawWarningSign() {
    let signX = 2600;
    push();
    noStroke();

    // post
    fill(80, 60, 40);
    rect(signX - 4, floorPos_y - 80, 8, 80);

    // sign board pulses a little so it catches your eye
    let pulse = 0;
    if (frameCount % 30 < 15) {
        pulse = 2;
    } else {
        pulse = 0;
    }
    fill(255, 180, 0);
    triangle(signX - 30 - pulse, floorPos_y - 70, signX + 30 + pulse, floorPos_y - 70, signX, floorPos_y - 120 - pulse);
    fill(30, 20, 10);
    triangle(signX - 22, floorPos_y - 76, signX + 22, floorPos_y - 76, signX, floorPos_y - 114);

    // exclamation mark
    fill(255, 180, 0);
    rect(signX - 3, floorPos_y - 107, 6, 20);
    ellipse(signX, floorPos_y - 82, 7, 7);

    pop();
}

// Extra Work - a scarier red sign with a skull, warns that the boss and the end of the level are close
function drawBossWarningSign() {
    let signX = -3450;
    push();
    noStroke();

    // post
    fill(80, 60, 40);
    rect(signX - 4, floorPos_y - 80, 8, 80);

    // sign board pulses faster than the other sign, feels more urgent
    let pulse = 0;
    if (frameCount % 20 < 10) {
        pulse = 3;
    } else {
        pulse = 0;
    }
    fill(200, 0, 0);
    triangle(signX - 32 - pulse, floorPos_y - 70, signX + 32 + pulse, floorPos_y - 70, signX, floorPos_y - 124 - pulse);
    fill(20, 10, 10);
    triangle(signX - 24, floorPos_y - 76, signX + 24, floorPos_y - 76, signX, floorPos_y - 116);

    // skull face
    fill(255);
    ellipse(signX - 7, floorPos_y - 95, 6, 6);
    ellipse(signX + 7, floorPos_y - 95, 6, 6);
    fill(20, 10, 10);
    ellipse(signX - 7, floorPos_y - 95, 3, 3);
    ellipse(signX + 7, floorPos_y - 95, 3, 3);
    fill(255);
    triangle(signX - 4, floorPos_y - 85, signX + 4, floorPos_y - 85, signX, floorPos_y - 78);

    pop();
}

function checkSpaceship() {
    for (let i = 0; i < spaceships.length; i++) {
        let d = abs(gameChar_x - spaceships[i].x_pos);
        if (d < 15 && allEnemiesDead()) {
            spaceships[i].isReached = true;
            winSound.play();
        }
    }
}

// Extra Work - the ship only works once every single enemy is gone
function allEnemiesDead() {
    for (let i = 0; i < enemies.length; i++) {
        if (!enemies[i].isDead) {
            return false;
        }
    }
    return true;
}

// Extra Work - true while standing at the ship while it's still locked
function nearLockedSpaceship() {
    for (let i = 0; i < spaceships.length; i++) {
        let d = abs(gameChar_x - spaceships[i].x_pos);
        if (d < 15 && !allEnemiesDead()) {
            return true;
        }
    }
    return false;
}

function anySpaceshipReached() {
    for (let i = 0; i < spaceships.length; i++) {
        if (spaceships[i].isReached)
            return true;
    }
    return false;
}

function checkPlayerDie() {
    if (gameChar_y >= height && lives > 0) {
        lives -= 1;

        if (lives > 0) {
            loseLifeSound.play();
            resetPlayer();
        } else {
            gameOverSound.play();
        }
    }
}

function resetPlayer() {
    isPlummeting = false;
    isFalling = false;
    isLeft = false;
    isRight = false;
    velY = 0;
    let pushedX = gameChar_x - (lastMoveDir * 60); // push away from where we died
    gameChar_x = findSafeX(pushedX);
    gameChar_y = floorPos_y;
}

function findSafeX(startX) {
    let x = startX;
    // check each canyon
    for (let i = 0; i < canyons.length; i++) {
        let c = canyons[i];
        if (x > c.x_pos - 30 && x < c.x_pos + c.width + 30) {
            // push to the side we came from
            if (lastMoveDir == 1) {
                x = c.x_pos - 30;
            } else {
                x = c.x_pos + c.width + 30;
            }
        }
    }
    return x;
}

// Resets lives and calls startGame() again to restart the whole level
function restartGame() {
    lives = 3;
    hasShield = false; // Extra Work - the shield only lasts the one attempt you bought it for, gone once you restart
    hasArrow = false;  // Extra Work - same deal for the arrows, gone once you restart
    startGame();
}
function startGame() {
    // Initial character states
    isPlummeting = false;
    isFalling = false;
    isLeft = false;
    isRight = false;
    velY = 0;
    extraLifeGiven = false;
    extraLifeTimer = 0;
    noRocksTimer = 0;
    edgeMsgTimer = 0;
    throwTimer = 0;
    resetEmberDash(); // Extra Work
    missionTimer = 0; // Extra Work - the ship launch animation
    bossDefeatedTimer = 0; // Extra Work - the boss defeated message

    // Extra Work - rain state
    isRaining = false;
    rainTimer = 0;
    rainCheckTimer = random(200, 400);
    raindrops = [];
    for (let r = 0; r < 60; r++) {
        // Extra Work - rain starts below the clouds
        raindrops.push({ x: random(0, width), y: random(140, height), speed: random(8, 14) });
    }

    // Extra Work - ash falling in the volcano world, same idea as the rain
    ashFlakes = [];
    for (let a = 0; a < 50; a++) {
        ashFlakes.push({ x: random(0, width), y: random(0, height), speed: random(2, 5) });
    }

    enrageMsgTimer = 0;

    // Extra Work - fresh shield charges every run, only if you bought one
    shieldHp = 0;
    if (hasShield) {
        shieldHp = 3;
    }
    resetPowerUps(); // Extra Work

    // where the player landed
    gameChar_x = 4100;
    gameChar_y = floorPos_y;

    // Vertical position where all trees are drawn
    treePos_y = height / 2;

    // Define canyon (position + width)
    canyons = [
        { x_pos: 30, width: 100 },
        { x_pos: 1100, width: 100 },
        { x_pos: 1800, width: 100 },
        { x_pos: 2000, width: 100 },
        { x_pos: 2650, width: 100 },
        { x_pos: -1800, width: 100 },
        { x_pos: -1100, width: 100 },
        { x_pos: -2000, width: 100 },
        { x_pos: 3400, width: 260 },
        { x_pos: -3260, width: 260 },
        { x_pos: -2650, width: 100 }
    ];

    // Define collectable item (position + size)
    collectables = [
        { x_pos: -200, y_pos: 420, size: 60, isFound: false },
        { x_pos: 250, y_pos: 420, size: 60, isFound: false },
        { x_pos: 800, y_pos: 400, size: 60, isFound: false },
        { x_pos: 1500, y_pos: 430, size: 60, isFound: false },
        { x_pos: 2500, y_pos: 420, size: 60, isFound: false },
        { x_pos: -2500, y_pos: 420, size: 60, isFound: false },
        { x_pos: 2450, y_pos: floorPos_y - 110 - 30, size: 60, isFound: false },
        { x_pos: -2120, y_pos: floorPos_y - 110 - 30, size: 60, isFound: false },
        { x_pos: 2970, y_pos: floorPos_y - 110 - 30, size: 60, isFound: false },
        { x_pos: 970, y_pos: floorPos_y - 110 - 30, size: 60, isFound: false },
        { x_pos: -2830, y_pos: floorPos_y - 110 - 30, size: 60, isFound: false },
        // Coins for the empty platforms
        { x_pos: 670, y_pos: floorPos_y - 110 - 30, size: 60, isFound: false },
        { x_pos: 1280, y_pos: floorPos_y - 110 - 30, size: 60, isFound: false },
        { x_pos: -1680, y_pos: floorPos_y - 110 - 30, size: 60, isFound: false },
        { x_pos: -970, y_pos: floorPos_y - 110 - 30, size: 60, isFound: false },
        // Filling empty gaps
        { x_pos: 2170, y_pos: 420, size: 60, isFound: false },
        { x_pos: -2170, y_pos: 420, size: 60, isFound: false },
        // Coins
        { x_pos: 1600, y_pos: floorPos_y - 210 - 30, size: 60, isFound: false },
        { x_pos: 1630, y_pos: floorPos_y - 210 - 30, size: 60, isFound: false },
        { x_pos: 1660, y_pos: floorPos_y - 210 - 30, size: 60, isFound: false },
        { x_pos: -1560, y_pos: floorPos_y - 210 - 30, size: 60, isFound: false },
        { x_pos: -1530, y_pos: floorPos_y - 210 - 30, size: 60, isFound: false },
        { x_pos: -1500, y_pos: floorPos_y - 210 - 30, size: 60, isFound: false },
        // coins next to the ship
        { x_pos: 3150, y_pos: 420, size: 60, isFound: false },
        { x_pos: 3850, y_pos: 420, size: 60, isFound: false },
        { x_pos: 4050, y_pos: 420, size: 60, isFound: false }
    ];

    // Extra Work - rocks to pick up and throw at the boss
    rocks = [
        { x_pos: 350, y_pos: 340, size: 40, isFound: false }, // Higher up, needs a jump
        { x_pos: 950, y_pos: 405, size: 40, isFound: false },
        { x_pos: 1650, y_pos: 415, size: 40, isFound: false },
        { x_pos: 2150, y_pos: 400, size: 40, isFound: false },
        { x_pos: 2550, y_pos: 410, size: 40, isFound: false },
        { x_pos: 2850, y_pos: 420, size: 40, isFound: false },
        { x_pos: 3150, y_pos: 345, size: 40, isFound: false }, // Higher up, needs a jump
        { x_pos: 3680, y_pos: 412, size: 40, isFound: false },
        { x_pos: 3900, y_pos: 404, size: 40, isFound: false },
        { x_pos: -350, y_pos: 340, size: 40, isFound: false }, // Higher up, needs a jump
        { x_pos: -950, y_pos: 405, size: 40, isFound: false },
        { x_pos: -1650, y_pos: 415, size: 40, isFound: false },
        { x_pos: -2150, y_pos: 400, size: 40, isFound: false },
        { x_pos: -2530, y_pos: 410, size: 40, isFound: false },
        { x_pos: -2850, y_pos: 420, size: 40, isFound: false },
        { x_pos: -3150, y_pos: 345, size: 40, isFound: false }, // Higher up, needs a jump
        { x_pos: -3434, y_pos: 412, size: 40, isFound: false },
        { x_pos: -3529, y_pos: 404, size: 40, isFound: false }
    ];
    rockCount = 0;

    // Extra Work - fresh arrow ammo every run, only if you bought the arrow weapon
    arrowCount = 0;
    if (hasArrow) {
        arrowCount = 10;
    }
    playerProjectiles = [];

    // Bird position variables (movement control)
    birds = [
        { x: -4400, y: 90 }, { x: -4000, y: 110 }, { x: -3600, y: 80 }, { x: -3200, y: 120 },
        { x: -2800, y: 90 }, { x: -2400, y: 110 }, { x: -2000, y: 80 }, { x: -1600, y: 120 },
        { x: -1200, y: 90 }, { x: -800, y: 110 }, { x: -400, y: 80 }, { x: 0, y: 120 },
        { x: 400, y: 90 }, { x: 800, y: 110 }, { x: 1200, y: 80 }, { x: 1600, y: 120 },
        { x: 2000, y: 90 }, { x: 2400, y: 110 }, { x: 2800, y: 80 }, { x: 3200, y: 120 },
        { x: 3600, y: 90 }, { x: 4000, y: 110 }, { x: 4400, y: 80 }
    ];

    // Spaceship position and state - Extra Work: only one spaceship, and it's in the nature world
    spaceships = [
        { x_pos: 4150, isReached: false }
    ];

    // X positions for multiple trees
    trees_x = [-1500, -1100, -700, -300, 300, 700, 1100, 1500];

    // Mountains
    mountains = [
        { x_pos: 380, y: 432 },
        { x_pos: 1000, y: 432 },
        { x_pos: 1400, y: 432 },
        { x_pos: 2200, y: 432 },
        { x_pos: 4150, y: 432 }, // Extra Work - right at the ship
        { x_pos: 3700, y: 432 }, // Extra Work - right after the first canyon
        { x_pos: -500, y: 432 },
        { x_pos: -1000, y: 432 },
        { x_pos: -1400, y: 432 },
        { x_pos: -2200, y: 432 }
    ];

    // Clouds
    clouds = [
        { x: -4400, y: 100, size: 30 }, { x: -4000, y: 125, size: 40 },
        { x: -3600, y: 100, size: 30 }, { x: -3200, y: 125, size: 40 },
        { x: -2800, y: 100, size: 30 }, { x: -2400, y: 125, size: 40 },
        { x: -2000, y: 100, size: 30 }, { x: -1600, y: 125, size: 40 },
        { x: -1200, y: 100, size: 30 }, { x: -800, y: 125, size: 40 },
        { x: -400, y: 100, size: 30 }, { x: 0, y: 125, size: 40 },
        { x: 400, y: 100, size: 30 }, { x: 800, y: 125, size: 40 },
        { x: 1200, y: 100, size: 30 }, { x: 1600, y: 125, size: 40 },
        { x: 2000, y: 100, size: 30 }, { x: 2400, y: 125, size: 40 },
        { x: 2800, y: 100, size: 30 }, { x: 3200, y: 125, size: 40 },
        { x: 3600, y: 100, size: 30 }, { x: 4000, y: 125, size: 40 },
        { x: 4400, y: 100, size: 30 }
    ];

    platforms = [];
    platforms.push(createPlatform(1210, floorPos_y - 110, 150));
    platforms.push(createPlatform(-1750, floorPos_y - 110, 150));
    platforms.push(createPlatform(-1050, floorPos_y - 110, 150));
    platforms.push(createPlatform(900, floorPos_y - 110, 150));
    platforms.push(createPlatform(600, floorPos_y - 110, 150));
    platforms.push(createPlatform(2250, floorPos_y - 110, 240));
    platforms.push(createPlatform(-2300, floorPos_y - 110, 240));
    platforms.push(createPlatform(2900, floorPos_y - 110, 150));
    platforms.push(createPlatform(-2900, floorPos_y - 110, 150));
    platforms.push(createPlatform(3450, floorPos_y - 20, 60));
    platforms.push(createPlatform(3560, floorPos_y - 20, 60));
    platforms.push(createPlatform(-3110, floorPos_y - 20, 60));
    platforms.push(createPlatform(-3220, floorPos_y - 20, 60));
    // Jump on the low one then the high one
    platforms.push(createPlatform(1500, floorPos_y - 110, 120));
    platforms.push(createPlatform(1580, floorPos_y - 210, 100));
    platforms.push(createPlatform(-1500, floorPos_y - 110, 120));
    platforms.push(createPlatform(-1580, floorPos_y - 210, 100));

    enemies = [];
    // Extra Work - a mix of ground enemies and platform guards spread across both worlds, boss at the far end
    enemies.push(new Enemy(-3650, floorPos_y - 10, 300, 5, 1.5)); // The boss, last enemy before you turn back for the ship
    enemies.push(new Enemy(-2900, floorPos_y - 110 - 10, 130)); // Guards the platform coins
    enemies.push(new Enemy(-2420, floorPos_y - 10, 100));
    enemies.push(new Enemy(-2280, floorPos_y - 110 - 10, 130)); // Guards the platform coins
    enemies.push(new Enemy(-1750, floorPos_y - 110 - 10, 130)); // Guards the platform coins
    enemies.push(new Enemy(-1600, floorPos_y - 10, 150));
    enemies.push(new Enemy(-1050, floorPos_y - 110 - 10, 130)); // Guards the platform coins
    enemies.push(new Enemy(-850, floorPos_y - 10, 100));
    enemies.push(new Enemy(-150, floorPos_y - 10, 100));
    // Extra Work - the last stretch of the volcano, then the guards on the nature side near the ship
    enemies.push(new Enemy(600, floorPos_y - 10, 130)); // Ground enemy
    enemies.push(new Enemy(900, floorPos_y - 110 - 10, 130)); // Guards the platform coins
    enemies.push(new Enemy(1210, floorPos_y - 10, 130));
    enemies.push(new Enemy(1920, floorPos_y - 10, 60));
    enemies.push(new Enemy(2250, floorPos_y - 110 - 10, 220)); // Guards the platform coins
    enemies.push(new Enemy(2900, floorPos_y - 110 - 10, 130)); // Guards the platform coins, before the second canyon
    enemies.push(new Enemy(3750, floorPos_y - 10, 150)); // Guards the ship

    gameScore = 0; // Initialize score
    cameraPosX = 0;

    // Extra Work - the boundary between the two worlds: volcano to the left of it, nature (and the ship) to the right
    world2Start = 2750;
}
// Updates the camera so it tracks the character horizontally
function updateCamera() {
    cameraPosX = gameChar_x - width / 2;
}

// Extra Work: main menu screen when you first launch the game
function drawMenu() {
    // Keep the background track playing on the menu
    if (!menuMusic.isPlaying()) {
        menuMusic.loop();
    }

    noStroke();
    // Left side is volcano themed, right side is nature themed
    fill(40, 40, 60);
    rect(0, 0, width / 2, height);
    fill(100, 155, 255);
    rect(width / 2, 0, width / 2, height);

    // Decorative mountains at the bottom of the menu
    fill(50, 20, 20);
    triangle(-30, height, 140, height, 60, height - 130);
    fill(70, 25, 25);
    triangle(60, height, 260, height, 160, height - 190);

    fill(100, 120, 145);
    triangle(width - 240, height, width - 60, height, width - 150, height - 130);
    fill(145, 175, 205);
    triangle(width - 320, height, width - 120, height, width - 220, height - 190);

    // Game title text with a shadow effect
    textSize(55);
    fill(0, 0, 0, 160);
    text("Ember & Vine", width / 2 - 197, height / 2 - 97);
    fill(255, 215, 0);
    text("Ember & Vine", width / 2 - 200, height / 2 - 100);

    // Start button that pulses to catch attention
    let pulse = 0;
    if (frameCount % 60 < 30) {
        pulse = 6;
    }
    fill(255, 255, 255, 230);
    rect(width / 2 - 100 - pulse / 2, height / 2 + 10, 200 + pulse, 50, 10);
    fill(20, 20, 40);
    textSize(24);
    text("Click to Start", width / 2 - 78, height / 2 + 43);

    // Extra Work: instructions button right below the start button
    fill(255, 255, 255, 200);
    rect(width / 2 - 100, height / 2 + 70, 200, 42, 10);
    fill(20, 20, 40);
    textSize(19);
    text("How to Play", width / 2 - 62, height / 2 + 97);
}

// Extra Work: instructions to help screen explaining controls and goals
function drawInstructions() {
    // Keep the music running here too
    if (!menuMusic.isPlaying()) {
        menuMusic.loop();
    }

    background(20, 20, 40);
    noStroke();
    fill(255);
    textSize(36);
    text("How to Play", width / 2 - 112, 65);

    // Extra Work: split text into two clean columns for readability
    let leftX = 60;
    let rightX = 532;

    // LEFT COLUMN
    fill(255, 215, 0);
    textSize(20);
    text("Controls", leftX, 120);
    fill(255);
    textSize(16);
    text("A / D or Left/Right Arrows - move", leftX, 148);
    text("W or Up Arrow - jump", leftX, 170);
    text("F - throw a rock (or arrow if bought)", leftX, 192);
    text("Walk over rocks to pick them up", leftX, 214);
    text("Q - speed boost (needs to charge up)", leftX, 236);

    fill(255, 215, 0);
    textSize(20);
    text("Combat", leftX, 272);
    fill(255);
    textSize(16);
    text("Jump ON TOP of a regular enemy to defeat it", leftX, 300);
    text("Tougher enemies show a health bar", leftX, 322);
    text("The boss can't be stomped - only rocks hurt it", leftX, 344);
    text("It throws fire too - jump over it to dodge!", leftX, 366);

    // RIGHT COLUMN
    fill(255, 215, 0);
    textSize(20);
    text("Coins & Shop", rightX, 120);
    fill(255);
    textSize(16);
    text("Collect coins - 20 coins gives a bonus life", rightX, 148);
    text("Coins are saved even if you die or restart", rightX, 170);
    text("Shop is under the Menu button (top right)", rightX, 192);
    text("Buy a shield (blocks 3 hits), arrows, or a star", rightX, 214);

    fill(255, 215, 0);
    textSize(20);
    text("Hazards", rightX, 250);
    fill(255, 120, 120);
    textSize(16);
    text("Canyons erupt with fire or thorny vines", rightX, 278);
    text("Watch for the warning flash just before they erupt", rightX, 300);
    text("They still erupt even after enemies are gone!", rightX, 322);

    fill(255, 215, 0);
    textSize(20);
    text("Goal", rightX, 358);
    fill(255);
    textSize(16);
    text("Defeat every enemy in the level,", rightX, 386);
    text("then make it back to your ship to win!", rightX, 408);
    text("Press SPACE to restart after winning/losing", rightX, 430);

    // Button to go back to the menu
    fill(255, 255, 255, 230);
    rect(width / 2 - 80, height - 90, 160, 50, 10);
    fill(20, 20, 40);
    textSize(20);
    text("Back", width / 2 - 22, height - 58);
}

// Extra Work: shop screen to spend coins saved across different runs
function drawShop() {
    if (!menuMusic.isPlaying()) {
        menuMusic.loop();
    }

    background(20, 20, 40);
    noStroke();
    fill(255);
    textSize(36);
    text("Shop", width / 2 - 60, 65);

    fill(255, 215, 0);
    textSize(20);
    text("Coins: " + walletCoins, width / 2 - 150, 110);
    fill(200);
    textSize(13);
    text("(every coin you collect is saved here, even if you die or restart)", width / 2 - 150, 130);

    // Extra Work: temporary notification that pops up when an item is bought
    if (purchaseMsgTimer > 0) {
        fill(255, 80, 80);
        textSize(20);
        text("-" + purchaseMsgAmount + " coins", width / 2 + 30, 110);
        purchaseMsgTimer -= 1;
    }

    for (let i = 0; i < shopItems.length; i++) {
        let item = shopItems[i];
        let boxY = 140 + i * 70;
        let owned = false;
        if (item.type == "shield") {
            owned = hasShield;
        }
        if (item.type == "arrow") {
            owned = hasArrow;
        }

        if (owned) {
            fill(255, 255, 255, 230);
        } else if (walletCoins >= item.price) {
            fill(200, 230, 255, 230);
        } else {
            fill(100, 100, 100, 180);
        }
        rect(width / 2 - 150, boxY, 300, 55, 10);

    // draw a tiny icon for each item in the shop, so the player can see what they're buying
    let iconX = width / 2 - 130;
    let iconY = boxY + 27;
    if (item.type == "life") {
        fill(220, 30, 60);
        ellipse(iconX - 4, iconY - 2, 10, 10);
        ellipse(iconX + 4, iconY - 2, 10, 10);
        triangle(iconX - 9, iconY, iconX + 9, iconY, iconX, iconY + 10);
    } else if (item.type == "shield") {
        fill(100, 200, 255);
        rect(iconX - 8, iconY - 10, 16, 12, 4, 4, 0, 0);
        triangle(iconX - 8, iconY + 1, iconX + 8, iconY + 1, iconX, iconY + 11);
    } else if (item.type == "arrow") {
        fill(139, 90, 43);
        rect(iconX - 8, iconY - 1, 12, 2);
        fill(90, 90, 95);
        triangle(iconX + 4, iconY - 4, iconX + 4, iconY + 4, iconX + 10, iconY);
    } else if (item.type == "star") {
        fill(190, 30, 255);
        triangle(iconX - 9, iconY + 4, iconX + 9, iconY + 4, iconX, iconY - 9);
        triangle(iconX - 7, iconY - 4, iconX + 7, iconY - 4, iconX, iconY + 8);
    }

    fill(0);
    textSize(20);
    text(item.name, width / 2 - 105, boxY + 25);
    if (owned) {
        text("Owned", width / 2 - 105, boxY + 45);
    } else {
        text(item.price + " coins", width / 2 - 105, boxY + 45);
    }
}

// back button to return to menu
fill(255, 255, 255, 230);
rect(width / 2 - 80, height - 90, 160, 50, 10);
fill(20, 20, 40);
textSize(20);
text("Back", width / 2 - 22, height - 58);
}

// draw a simple enemy just for the story slides
function drawSimpleEnemy(x, y) {
    fill(230, 0, 140);
    ellipse(x, y, 24, 18);
    fill(255, 0, 90);
    triangle(x - 9, y - 5, x - 5, y - 14, x - 1, y - 5);
    triangle(x + 1, y - 5, x + 5, y - 14, x + 9, y - 5);
}

// draw a small spaceship for the story pages
function drawStoryShip(x, y) {
    fill(150, 150, 160);
    triangle(x - 16, y - 10, x - 30, y + 10, x - 16, y + 22);
    triangle(x + 16, y - 10, x + 30, y + 10, x + 16, y + 22);
    fill(200, 200, 210);
    ellipse(x, y, 36, 90);
    fill(255, 215, 0);
    triangle(x - 18, y - 45, x + 18, y - 45, x, y - 72);
    fill(100, 200, 255);
    ellipse(x, y - 15, 16, 16);
    fill(0);
    ellipse(x, y - 15, 10, 10);
    fill(0, 200, 255, 200);
    ellipse(x, y + 42, 22, 12);
}

// show the story page by page from the menu
function drawStory() {
    // keep music playing while reading the story
    if (!menuMusic.isPlaying()) {
        menuMusic.loop();
    }

    noStroke();

    if (storySlide == 0) {
        // page 1 - space arrival
        background(10, 10, 30);
        for (let i = 0; i < 40; i++) {
            fill(255, 255, 255, random(100, 255));
            ellipse(random(0, width), random(0, height - 120), 2);
        }
        drawStoryShip(width / 2, 220);

        fill(255);
        textSize(20);
        text("Picked up a weird distress call and flew out here to check it out.", width / 2 - 250, 320);
    }
    else if (storySlide == 1) {
        // page 2 - volcano world is taken over
        background(40, 40, 60);
        fill(70, 25, 25);
        triangle(150, 400, 350, 400, 250, 220);
        fill(50, 20, 20);
        triangle(450, 400, 650, 400, 550, 250);
        drawSimpleEnemy(230, 390);
        drawSimpleEnemy(320, 390);
        drawSimpleEnemy(540, 390);

        fill(255);
        textSize(20);
        text("Tiny alien creatures invaded this world.", width / 2 - 200, 320);
        text("They already rule the volcano lands.", width / 2 - 190, 345);
    }
    else if (storySlide == 2) {
        // page 3 - green world is in danger
        background(100, 155, 255);
        fill(30, 120, 45);
        triangle(500, 400, 650, 400, 575, 250);
        fill(40, 150, 60);
        triangle(600, 400, 730, 400, 665, 270);
        drawSimpleEnemy(150, 390);
        drawSimpleEnemy(230, 390);
        drawSimpleEnemy(300, 390);

        fill(0);
        textSize(20);
        text("Now they're moving into the last green world. We can't let them win.", width / 2 - 235, 320);
        text("If they take it too, it is over.", width / 2 - 160, 345);
    }
    else {
        // page 4 - action prompt / start game
        background(100, 155, 255);
        drawStoryShip(width / 2, 110);

        fill(0);
        textSize(18);
        text("Your ship is parked safe in the green world.", width / 2 - 290, 175);
        text("But the volcano lands are crawling with enemies - defeat them all to get through.", width / 2 - 290, 200);
        text("One tough monster guards the end - it can't be stomped, so save some rocks for it!", width / 2 - 290, 225);
        text("Clear every enemy, then head back to your ship to finish the mission.", width / 2 - 290, 250);
        text("Watch out though - canyons keep erupting even on the way home!", width / 2 - 290, 275);

        // pulsing start button
        let pulse = 0;
        if (frameCount % 60 < 30) {
            pulse = 8;
        }
        fill(255, 255, 255, 230);
        rect(width / 2 - 110 - pulse / 2, 355, 220 + pulse, 50, 12);
        fill(20, 20, 40);
        textSize(24);
        text("Land and Fight!!", width / 2 - 78, 386);
    }

    // next button on the bottom right
    if (storySlide < 3) {
        fill(255, 255, 255, 230);
        rect(width - 130, height - 60, 110, 40, 8);
        fill(20, 20, 40);
        textSize(18);
        text("Next", width - 100, height - 33);
    }
}
// Pause menu shown during gameplay
function drawPauseMenu() {
    background(20, 20, 35);
    noStroke();
    fill(255);
    textSize(45);
    text("Paused", width / 2 - 95, height / 2 - 110);

    // Continue button
    fill(255, 255, 255, 230);
    rect(width / 2 - 100, height / 2 - 70, 200, 50, 10);
    fill(20, 20, 40);
    textSize(22);
    text("Continue", width / 2 - 55, height / 2 - 37);

    // Restart button
    fill(255, 255, 255, 230);
    rect(width / 2 - 100, height / 2 - 10, 200, 50, 10);
    fill(20, 20, 40);
    text("Restart", width / 2 - 45, height / 2 + 23);

    // Exit to Menu button
    fill(255, 255, 255, 230);
    rect(width / 2 - 100, height / 2 + 50, 200, 50, 10);
    fill(20, 20, 40);
    text("Exit to Menu", width / 2 - 75, height / 2 + 83);

    // Control reminders at the bottom
    fill(180);
    textSize(13);
    text("A/D or Arrows - move   W - jump   F - throw rock   Q - speed boost   20 coins = +1 life", width / 2 - 260, height - 25);
}

// Handle mouse clicks for menu items and buttons
function mousePressed() {
    // Resume audio context on first click
    if (getAudioContext().state != "running") {
        getAudioContext().resume();
    }

    if (gameState == "menu") {
        // Start button opens the story first
        if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 && mouseY > height / 2 + 10 && mouseY < height / 2 + 60) {
            gameState = "story";
            storySlide = 0;
        }
        // Instructions button
        else if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 && mouseY > height / 2 + 70 && mouseY < height / 2 + 112) {
            gameState = "instructions";
        }
    }
    else if (gameState == "instructions") {
        // Back button
        if (mouseX > width / 2 - 80 && mouseX < width / 2 + 80 && mouseY > height - 90 && mouseY < height - 40) {
            gameState = "menu";
        }
    }
    else if (gameState == "shop") {
        // Handle purchasing items in the shop
        for (let i = 0; i < shopItems.length; i++) {
            let item = shopItems[i];
            let boxY = 140 + i * 70;
            let clickedBox = mouseX > width / 2 - 150 && mouseX < width / 2 + 150 && mouseY > boxY && mouseY < boxY + 55;
            if (clickedBox && walletCoins >= item.price) {
                let didBuy = false;
                if (item.type == "life") {
                    walletCoins -= item.price;
                    gameScore -= item.price;
                    lives += 1;
                    didBuy = true;
                } else if (item.type == "shield" && !hasShield) {
                    walletCoins -= item.price;
                    gameScore -= item.price;
                    hasShield = true;
                    shieldHp = 3;
                    didBuy = true;
                } else if (item.type == "arrow" && !hasArrow) {
                    walletCoins -= item.price;
                    gameScore -= item.price;
                    hasArrow = true;
                    arrowCount = 10;
                    didBuy = true;
                } else if (item.type == "star") {
                    walletCoins -= item.price;
                    gameScore -= item.price;
                    invincibleTimer = 300;
                    didBuy = true;
                }
                // Prevent negative score
                if (gameScore < 0) {
                    gameScore = 0;
                }
                // Show purchase notification
                if (didBuy) {
                    purchaseMsgTimer = 60;
                    purchaseMsgAmount = item.price;
                }
            }
        }
        // Back to game from shop
        if (mouseX > width / 2 - 80 && mouseX < width / 2 + 80 && mouseY > height - 90 && mouseY < height - 40) {
            menuMusic.stop();
            gameState = "playing";
        }
    }
    else if (gameState == "story") {
        // Progress through story slides or start the game
        if (storySlide < 3) {
            if (mouseX > width - 130 && mouseX < width - 20 && mouseY > height - 60 && mouseY < height - 20) {
                storySlide += 1;
            }
        } else {
            if (mouseX > width / 2 - 115 && mouseX < width / 2 + 115 && mouseY > 355 && mouseY < 405) {
                menuMusic.stop();
                gameState = "playing";
            }
        }
    }
    else if (gameState == "paused") {
        // Continue game
        if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 && mouseY > height / 2 - 70 && mouseY < height / 2 - 20) {
            menuMusic.stop();
            gameState = "playing";
        }
        // Restart game
        if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 && mouseY > height / 2 - 10 && mouseY < height / 2 + 40) {
            menuMusic.stop();
            restartGame();
            gameState = "playing";
        }
        // Exit to main menu
        if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 && mouseY > height / 2 + 50 && mouseY < height / 2 + 100) {
            restartGame();
            gameState = "menu";
        }
    }
    else if (lives < 1 || (anySpaceshipReached() && missionTimer > 90)) {
        // Play again button
        if (mouseX > width / 2 - 180 && mouseX < width / 2 - 20 && mouseY > height / 2 + 30 && mouseY < height / 2 + 80) {
            restartGame();
        }
        // Main menu button
        if (mouseX > width / 2 + 20 && mouseX < width / 2 + 180 && mouseY > height / 2 + 30 && mouseY < height / 2 + 80) {
            restartGame();
            gameState = "menu";
        }
    }
    else if (gameState == "playing") {
        // Pause button in the top corner
        if (mouseX > width - 90 && mouseX < width - 20 && mouseY > 10 && mouseY < 45) {
            gameState = "paused";
        }
        // Shop button below the pause button
        if (mouseX > width - 90 && mouseX < width - 20 && mouseY > 50 && mouseY < 85) {
            gameState = "shop";
        }
    }
}

// Draw the background based on which world the player is in
function drawBackground() {
    if (gameChar_x < world2Start) {
        background(40, 40, 60); // Volcano world (left side)
    } else {
        background(100, 155, 255); // Nature world (right side)
    }
}

// Draw the ground depending on the current world
function drawGround() {
    noStroke();

    if (gameChar_x < world2Start) {
        // Volcano world ground
        fill(25, 15, 15);
        rect(-8000, floorPos_y, 16000, height - floorPos_y);

        // Lava trenches
        for (let i = -8000; i < 8000; i += 300) {
            fill(150, 15, 0);
            rect(i + 40, floorPos_y + 15, 60, height - floorPos_y - 15);

            fill(220, 50, 0);
            rect(i + 45, floorPos_y + 25, 50, height - floorPos_y - 25);
        }
        // Obsidian blocks
        for (let i = -8000; i < 8000; i += 300) {
            fill(35, 25, 25);
            rect(i, floorPos_y + 10, 200, 50);

            fill(50, 38, 38);
            rect(i, floorPos_y, 200, 10);
        }
        // Buried skulls
        for (let i = -7800; i < 7800; i += 700) {
            fill(190, 180, 170);
            ellipse(i + 150, floorPos_y + 60, 14, 10);
            fill(40);
            ellipse(i + 147, floorPos_y + 60, 2, 2);
            ellipse(i + 153, floorPos_y + 60, 2, 2);
        }
        // Rocks and bones
        for (let i = -8000; i < 8000; i += 200) {
            fill(100, 95, 90);
            ellipse(i + 15, floorPos_y - 2, 25, 8);
        }

        for (let i = -7800; i < 7800; i += 800) {
            fill(200, 195, 180);
            ellipse(i + 120, floorPos_y + 65, 12, 10);
            rect(i + 100, floorPos_y + 63, 15, 3);
        }
        // Ash particles
        for (let i = 0; i < 20; i++) {
            fill(150, 150, 150, 80);
            ellipse(random(-2000, 2000), random(floorPos_y - 100, floorPos_y - 40), 2);
        }
    }
    else {
        // Nature world ground
        fill(74, 50, 30);
        rect(-8000, floorPos_y, 16000, height - floorPos_y);

        fill(100, 70, 45);
        rect(-8000, floorPos_y + 12, 16000, 25);

        fill(34, 139, 34);
        rect(-8000, floorPos_y, 16000, 12);

        // Underground details and treasures
        for (let i = -8000; i < 8000; i += 160) {
            fill(130, 110, 90);
            ellipse(i + 20, floorPos_y + 45, 18, 12);
            fill(110, 90, 75);
            ellipse(i + 90, floorPos_y + 85, 24, 14);

            fill(60, 40, 20);
            ellipse(i + 140, floorPos_y + 55, 16, 16);
            fill(105, 75, 50);
            rect(i + 136, floorPos_y + 54, 8, 3);
            rect(i + 138, floorPos_y + 50, 4, 10);

            // Glowing crystals
            if (frameCount % 40 < 20) {
                fill(0, 255, 255, 200);
            } else {
                fill(0, 180, 255, 150);
            }
            triangle(i + 60, floorPos_y + 70, i + 65, floorPos_y + 60, i + 70, floorPos_y + 70);
            triangle(i + 60, floorPos_y + 70, i + 65, floorPos_y + 80, i + 70, floorPos_y + 70);

            if (frameCount % 30 < 15) {
                fill(255, 215, 0, 220);
            } else {
                fill(200, 160, 0, 140);
            }
            ellipse(i + 110, floorPos_y + 30, 8, 6);
        }

        // Surface grass tufts
        for (let i = -8000; i < 8000; i += 60) {
            fill(0, 160, 0);
            triangle(i, floorPos_y, i + 4, floorPos_y - 10, i + 8, floorPos_y);
        }

        // Surface flowers
        for (let i = -8000; i < 8000; i += 220) {
            fill(255, 105, 180);
            ellipse(i, floorPos_y - 8, 6, 6);
            fill(255, 255, 0);
            ellipse(i, floorPos_y - 6, 3, 3);
        }
    }
}
// Draw environmental scenery like glowing lights or sun based on the world
function drawScenery() {
    noStroke();
    if (gameChar_x < world2Start) {
        fill(255, 80, 0, 60);
        ellipse(gameChar_x + 100, 120, 300);
    } else {
        fill(255, 255, 180);
        ellipse(gameChar_x + 200, 100, 90);
    }
}

// Part 2a - Draw the main character in each visual state, plus a companion drone
function drawGameChar() {
    // Dynamic visor color depending on the world
    let visorColor;
    if (gameChar_x < world2Start) {
        visorColor = color(255, 69, 0); // Volcano world
    } else {
        visorColor = color(100, 200, 255); // Nature world
    }

    if (isLeft == true || isRight == true) {
        fill(255, 255, 255, 100);
        ellipse(gameChar_x, gameChar_y + 4, 15, 5);
    }

    // Floating companion drone
    let droneMove;
    if (frameCount % 20 < 10) {
        droneMove = 3;
    } else {
        droneMove = -3;
    }

    // Drone flips sides based on character facing direction
    let droneSide = 35;
    if (lastMoveDir == -1) {
        droneSide = -35;
    }
    let droneX = gameChar_x + droneSide;
    let droneY = gameChar_y - 60 + droneMove;

    fill(180); // Drone body
    ellipse(droneX, droneY, 12, 12);

    let droneLightX = droneX + 3;
    if (lastMoveDir == -1) {
        droneLightX = droneX - 3;
    }

    // Blinking drone light
    if (frameCount % 30 < 15) {
        fill(0, 255, 255);
    } else {
        fill(0, 120, 120);
    }
    ellipse(droneLightX, droneY, 3, 3);

    fill(255, 255, 255, 120); // Orbiting dots
    ellipse(droneX - 6, droneY - 4, 2, 2);
    ellipse(droneX + 6, droneY + 4, 2, 2);

    // Ember Dash special effect ring
    drawEmberDashRing(gameChar_x, gameChar_y);

    let headY = gameChar_y - 50;
    let bodyY = gameChar_y - 40;

    if (isLeft == true && isFalling == true) {
        fill(75, 0, 130);
        if (velY < 0 && !isPlummeting) {
            // Jumping up left (rocket shape)
            quad(gameChar_x - 10, bodyY - 12, gameChar_x + 10, bodyY - 12, gameChar_x + 6, bodyY + 18, gameChar_x - 6, bodyY + 18);

            // Chest armor core
            fill(40, 20, 60);
            rect(gameChar_x - 8, bodyY + 2, 16, 10);
            if (gameChar_x < world2Start) {
                fill(255, 60, 30, 200);
            } else {
                fill(0, 255, 255, 200);
            }
            ellipse(gameChar_x, bodyY + 7, 5, 5);

            fill(150, 150, 160);
            triangle(gameChar_x - 4, bodyY, gameChar_x - 8, bodyY + 6, gameChar_x - 4, bodyY + 10);
            triangle(gameChar_x + 4, bodyY, gameChar_x + 8, bodyY + 6, gameChar_x + 4, bodyY + 10);

            fill(200, 200, 200);
            ellipse(gameChar_x, headY - 10, 22);
            fill(visorColor);
            rect(gameChar_x - 8, headY - 15, 16, 8, 5);
            fill(0);
            ellipse(gameChar_x - 3, headY - 11, 4, 4);

            // Thruster flame
            fill(255, 140, 0, 230);
            triangle(gameChar_x - 5, bodyY + 18, gameChar_x + 5, bodyY + 18, gameChar_x, bodyY + 38);
        } else {
            // Falling down left (glider shape)
            quad(gameChar_x - 14, bodyY, gameChar_x + 14, bodyY, gameChar_x + 10, bodyY + 22, gameChar_x - 10, bodyY + 22);

            fill(40, 20, 60);
            rect(gameChar_x - 10, bodyY + 4, 20, 10);
            if (gameChar_x < world2Start) {
                fill(255, 60, 30, 200);
            } else {
                fill(0, 255, 255, 200);
            }
            ellipse(gameChar_x, bodyY + 9, 5, 5);

            fill(150, 150, 160);
            triangle(gameChar_x - 10, bodyY + 4, gameChar_x - 24, bodyY + 12, gameChar_x - 10, bodyY + 20);
            triangle(gameChar_x + 10, bodyY + 4, gameChar_x + 24, bodyY + 12, gameChar_x + 10, bodyY + 20);

            fill(200, 200, 200);
            ellipse(gameChar_x, headY, 22);
            fill(visorColor);
            rect(gameChar_x - 8, headY - 5, 16, 8, 5);
            fill(0);
            ellipse(gameChar_x - 3, headY - 1, 4, 4);
        }
    }
    else if (isRight == true && isFalling == true) {
        fill(75, 0, 130);
        if (velY < 0 && !isPlummeting) {
            // Jumping up right
            quad(gameChar_x - 10, bodyY - 12, gameChar_x + 10, bodyY - 12, gameChar_x + 6, bodyY + 18, gameChar_x - 6, bodyY + 18);

            fill(40, 20, 60);
            rect(gameChar_x - 8, bodyY + 2, 16, 10);
            if (gameChar_x < world2Start) {
                fill(255, 60, 30, 200);
            } else {
                fill(0, 255, 255, 200);
            }
            ellipse(gameChar_x, bodyY + 7, 5, 5);

            fill(150, 150, 160);
            triangle(gameChar_x - 4, bodyY, gameChar_x - 8, bodyY + 6, gameChar_x - 4, bodyY + 10);
            triangle(gameChar_x + 4, bodyY, gameChar_x + 8, bodyY + 6, gameChar_x + 4, bodyY + 10);

            fill(200, 200, 200);
            ellipse(gameChar_x, headY - 10, 22);
            fill(visorColor);
            rect(gameChar_x - 8, headY - 15, 16, 8, 5);
            fill(0);
            ellipse(gameChar_x + 3, headY - 11, 4, 4);

            fill(255, 140, 0, 230);
            triangle(gameChar_x - 5, bodyY + 18, gameChar_x + 5, bodyY + 18, gameChar_x, bodyY + 38);
        } else {
            // Falling down right
            quad(gameChar_x - 14, bodyY, gameChar_x + 14, bodyY, gameChar_x + 10, bodyY + 22, gameChar_x - 10, bodyY + 22);

            fill(40, 20, 60);
            rect(gameChar_x - 10, bodyY + 4, 20, 10);
            if (gameChar_x < world2Start) {
                fill(255, 60, 30, 200);
            } else {
                fill(0, 255, 255, 200);
            }
            ellipse(gameChar_x, bodyY + 9, 5, 5);

            fill(150, 150, 160);
            triangle(gameChar_x - 10, bodyY + 4, gameChar_x - 24, bodyY + 12, gameChar_x - 10, bodyY + 20);
            triangle(gameChar_x + 10, bodyY + 4, gameChar_x + 24, bodyY + 12, gameChar_x + 10, bodyY + 20);

            fill(200, 200, 200);
            ellipse(gameChar_x, headY, 22);
            fill(visorColor);
            rect(gameChar_x - 8, headY - 5, 16, 8, 5);
            fill(0);
            ellipse(gameChar_x + 3, headY - 1, 4, 4);
        }
    }
    else if (isLeft == true) {
        // Walking left with a forward lean
        push();
        let stepBounce = 0;
        if (frameCount % 20 < 10) {
            stepBounce = -1;
        } else {
            stepBounce = 1;
        }
        translate(0, stepBounce);

        // Motion speed trails behind
        for (let s = 0; s < 3; s++) {
            stroke(180, 150, 255, 180 - s * 50);
            strokeWeight(2);
            line(gameChar_x + 15 + (s * 5), bodyY + 10 + (s * 4), gameChar_x + 25 + (s * 6), bodyY + 10 + (s * 4));
        }
        noStroke();

        fill(75, 0, 130);
        quad(gameChar_x - 20, bodyY, gameChar_x + 2, bodyY, gameChar_x + 6, bodyY + 30, gameChar_x - 10, bodyY + 30);

        fill(40, 20, 60);
        quad(gameChar_x - 16, bodyY + 2, gameChar_x - 1, bodyY + 2, gameChar_x + 1, bodyY + 14, gameChar_x - 12, bodyY + 14);

        let corePulse = 0;
        if (frameCount % 30 < 15) {
            corePulse = 2;
        } else {
            corePulse = 0;
        }
        if (gameChar_x < world2Start) {
            fill(255, 60, 30, 200);
        } else {
            fill(0, 255, 255, 200);
        }
        ellipse(gameChar_x - 9, bodyY + 8, 5 + corePulse, 5 + corePulse);

        // Wheels
        fill(50, 50, 60);
        rect(gameChar_x - 12, bodyY + 26, 4, 12);
        rect(gameChar_x + 4, bodyY + 26, 4, 12);
        fill(30, 30, 35);
        ellipse(gameChar_x - 10, bodyY + 40, 10, 10);
        ellipse(gameChar_x + 6, bodyY + 40, 10, 10);

        if (frameCount % 20 < 10) {
            fill(150);
        } else {
            fill(100);
        }
        ellipse(gameChar_x - 10, bodyY + 40, 4, 4);
        ellipse(gameChar_x + 6, bodyY + 40, 4, 4);

        // Head and antenna
        fill(200, 200, 200);
        ellipse(gameChar_x - 10, headY, 22);
        fill(visorColor);
        rect(gameChar_x - 18, headY - 5, 16, 8, 5);
        fill(0);
        ellipse(gameChar_x - 15, headY - 1, 4, 4);

        fill(0);
        rect(gameChar_x - 12, headY - 12, 4, 8);
        fill(255, 215, 0);
        ellipse(gameChar_x - 12, headY - 15, 6, 6);
        pop();

        // Walking dust particles
        for (let d = 0; d < 3; d++) {
            fill(200, 190, 170, 120);
            ellipse(gameChar_x + 6 + (d * 5), gameChar_y + 4, 7, 5);
        }
        drawEmberDashTrail(gameChar_x, bodyY, false);
    }
    else if (isRight == true) {
        // Walking right with a forward lean
        push();
        let stepBounce = 0;
        if (frameCount % 20 < 10) {
            stepBounce = -1;
        } else {
            stepBounce = 1;
        }
        translate(0, stepBounce);

        // Motion speed trails behind
        for (let s = 0; s < 3; s++) {
            stroke(180, 150, 255, 180 - s * 50);
            strokeWeight(2);
            line(gameChar_x - 15 - (s * 5), bodyY + 10 + (s * 4), gameChar_x - 25 - (s * 6), bodyY + 10 + (s * 4));
        }
        noStroke();

        fill(75, 0, 130);
        quad(gameChar_x - 2, bodyY, gameChar_x + 20, bodyY, gameChar_x + 10, bodyY + 30, gameChar_x - 6, bodyY + 30);

        fill(40, 20, 60);
        quad(gameChar_x + 1, bodyY + 2, gameChar_x + 16, bodyY + 2, gameChar_x + 12, bodyY + 14, gameChar_x - 1, bodyY + 14);

        let corePulse = 0;
        if (frameCount % 30 < 15) {
            corePulse = 2;
        } else {
            corePulse = 0;
        }
        if (gameChar_x < world2Start) {
            fill(255, 60, 30, 200);
        } else {
            fill(0, 255, 255, 200);
        }
        ellipse(gameChar_x + 9, bodyY + 8, 5 + corePulse, 5 + corePulse);

        // Wheels
        fill(50, 50, 60);
        rect(gameChar_x - 8, bodyY + 26, 4, 12);
        rect(gameChar_x + 8, bodyY + 26, 4, 12);
        fill(30, 30, 35);
        ellipse(gameChar_x - 6, bodyY + 40, 10, 10);
        ellipse(gameChar_x + 10, bodyY + 40, 10, 10);

        if (frameCount % 20 < 10) {
            fill(150);
        } else {
            fill(100);
        }
        ellipse(gameChar_x - 6, bodyY + 40, 4, 4);
        ellipse(gameChar_x + 10, bodyY + 40, 4, 4);

        // Head
        fill(200, 200, 200);
        ellipse(gameChar_x + 10, headY, 22);
        fill(visorColor);
        rect(gameChar_x + 2, headY - 5, 16, 8, 5);
        fill(0);
        ellipse(gameChar_x + 15, headY - 1, 4, 4);
        // antenna
        fill(0);
        rect(gameChar_x + 8, headY - 12, 4, 8);
        fill(255, 215, 0);
        ellipse(gameChar_x + 12, headY - 15, 6, 6);
        pop();

        // Walking dust
        for (let d = 0; d < 3; d++) {
            fill(200, 190, 170, 120);
            ellipse(gameChar_x - 6 - (d * 5), gameChar_y + 4, 7, 5);
        }
        drawEmberDashTrail(gameChar_x, bodyY, true);
    }
    else if (isFalling == true || isPlummeting == true) {
        fill(75, 0, 130);
        if (velY < 0 && !isPlummeting) {
            // Straight Up Jump
            quad(gameChar_x - 10, bodyY - 12, gameChar_x + 10, bodyY - 12, gameChar_x + 6, bodyY + 18, gameChar_x - 6, bodyY + 18);

            // Coherent chest armor belt & core
            fill(40, 20, 60);
            rect(gameChar_x - 8, bodyY + 2, 16, 10);
            if (gameChar_x < world2Start) {
                fill(255, 60, 30, 200);
            } else {
                fill(0, 255, 255, 200);
            }
            ellipse(gameChar_x, bodyY + 7, 5, 5);

            fill(200, 200, 200);
            ellipse(gameChar_x, headY - 10, 22);
            fill(visorColor);
            rect(gameChar_x - 8, headY - 15, 16, 8, 5);
            fill(255, 140, 0, 230);
            triangle(gameChar_x - 5, bodyY + 18, gameChar_x + 5, bodyY + 18, gameChar_x, bodyY + 38);
        } else {
            // Plummeting
            quad(gameChar_x - 14, bodyY, gameChar_x + 14, bodyY, gameChar_x + 10, bodyY + 22, gameChar_x - 10, bodyY + 22);

            // Coherent chest armor belt & core
            fill(40, 20, 60);
            rect(gameChar_x - 10, bodyY + 4, 20, 10);
            if (gameChar_x < world2Start) {
                fill(255, 60, 30, 200);
            } else {
                fill(0, 255, 255, 200);
            }
            ellipse(gameChar_x, bodyY + 9, 5, 5);

            fill(200, 200, 200);
            ellipse(gameChar_x, headY, 22);
            fill(visorColor);
            rect(gameChar_x - 8, headY - 5, 16, 8, 5);
        }
    }
    else {
        // Standing Idle
        fill(75, 0, 130);
        quad(gameChar_x - 12, bodyY, gameChar_x + 12, bodyY, gameChar_x + 8, bodyY + 30, gameChar_x - 8, bodyY + 30);
        fill(40, 20, 60);
        rect(gameChar_x - 15, bodyY + 2, 30, 12);

        let corePulse = 0;
        if (frameCount % 30 < 15) {
            corePulse = 2;
        } else {
            corePulse = 0;
        }
        noStroke();
        if (gameChar_x < world2Start) {
            fill(255, 60, 30, 200);
        } else {
            fill(0, 255, 255, 200);
        }
        ellipse(gameChar_x, bodyY + 19, 6 + corePulse, 6 + corePulse);

        fill(50, 50, 60);
        rect(gameChar_x - 10, bodyY + 26, 4, 12);
        rect(gameChar_x + 6, bodyY + 26, 4, 12);
        fill(30, 30, 35);
        ellipse(gameChar_x - 8, bodyY + 40, 10, 10);
        ellipse(gameChar_x + 8, bodyY + 40, 10, 10);

        fill(200, 200, 200);
        ellipse(gameChar_x, headY, 22);
        fill(visorColor);
        rect(gameChar_x - 8, headY - 5, 16, 8, 5);

        // Extra Work - little eye inside the visor, looks whichever way you last faced
        let eyeShift = 3;
        if (lastMoveDir == -1) {
            eyeShift = -3;
        }
        fill(0);
        ellipse(gameChar_x + eyeShift, headY - 1, 4, 4);

        fill(0);
        rect(gameChar_x - 2, headY - 12, 4, 8);

        // Extra Work - the antenna light acts like a little radar, points whichever way you last faced
        let faceShift = 2;
        if (lastMoveDir == -1) {
            faceShift = -2;
        }
        fill(255, 215, 0);
        ellipse(gameChar_x + faceShift, headY - 15, 6, 6);

        // Idle energy ring - nested loop, outer loop goes around 8 fixed points, inner loop draws 2 glow layers per point
        let ringPoints = [
            [0, -11], [8, -8], [11, 0], [8, 8],
            [0, 11], [-8, 8], [-11, 0], [-8, -8]
        ];
        for (let p = 0; p < ringPoints.length; p++) {
            let spin = (frameCount + p * 8) % 64;
            let ringX = gameChar_x + ringPoints[p][0];
            let ringY = headY - 15 + ringPoints[p][1];
            for (let layer = 0; layer < 2; layer++) {
                if (gameChar_x < world2Start) {
                    if (spin < 48) {
                        fill(255, 60, 30, 170 - layer * 70);
                    } else {
                        fill(200, 30, 10, 90 - layer * 40);
                    }
                } else {
                    if (spin < 48) {
                        fill(0, 255, 255, 170 - layer * 70);
                    } else {
                        fill(0, 150, 150, 90 - layer * 40);
                    }
                }
                ellipse(ringX, ringY, 5 - layer * 2, 5 - layer * 2);
            }
        }
    }

    // Throwing Arm Overlay
    if (throwTimer > 0) {
        fill(200, 200, 200);
        if (lastMoveDir == 1) {
            rect(gameChar_x + 10, bodyY + 5, 16, 6);
            fill(70, 65, 75);
            ellipse(gameChar_x + 28, bodyY + 8, 10);
            fill(110, 230, 240);
            ellipse(gameChar_x + 30, bodyY + 6, 4);
        } else {
            rect(gameChar_x - 26, bodyY + 5, 16, 6);
            fill(70, 65, 75);
            ellipse(gameChar_x - 28, bodyY + 8, 10);
            fill(110, 230, 240);
            ellipse(gameChar_x - 30, bodyY + 6, 4);
        }
        throwTimer -= 1;
    }
}
function drawBirds() {
    for (let i = 0; i < birds.length; i++) {
        // Move birds slowly to the right
        birds[i].x = birds[i].x + 1.2;
        if (birds[i].x > 4600) {
            birds[i].x = -4600;
        }
        // Extra Work - wings flap up and down
        let wingY = 0;
        if (frameCount % 20 < 10) {
            wingY = -8;
        } else {
            wingY = 4;
        }
        // Extra Work - little bob while flying, same trick as the coin float
        let flyBob = 0;
        if (frameCount % 30 < 15) {
            flyBob = -1;
        } else {
            flyBob = 1;
        }
        // Wings flapping
        stroke(70);
        strokeWeight(2.5);
        line(birds[i].x, birds[i].y + flyBob, birds[i].x - 12, birds[i].y + flyBob + wingY); // Back wing
        line(birds[i].x, birds[i].y + flyBob, birds[i].x + 12, birds[i].y + flyBob + wingY); // Front wing
        // Bird body
        noStroke();
        fill(245);
        ellipse(birds[i].x, birds[i].y + flyBob, 16, 7);
        // Beak
        fill(255, 140, 0);
        triangle(birds[i].x + 8, birds[i].y + flyBob - 2,
            birds[i].x + 13, birds[i].y + flyBob,
            birds[i].x + 8, birds[i].y + flyBob + 2);
    }
}
// Extra Work - rain that comes and goes randomly
function updateRain() {
    if (isRaining) {
        rainTimer -= 1;
        if (rainTimer <= 0) {
            isRaining = false;
            rainCheckTimer = random(200, 400); // Wait a while before checking again
        }
    } else {
        rainCheckTimer -= 1;
        if (rainCheckTimer <= 0) {
            if (random(1) < 0.5) {
                isRaining = true;
                rainTimer = random(300, 3000); // Rains for up to 50 seconds (50 * 60 frames)
            }
            rainCheckTimer = random(200, 400); // Check again in a bit either way
        }
    }
}
function drawRain() {
    if (!isRaining) {
        return;
    }
    // Extra Work - rain only happens in the nature world, the volcano world has ash instead
    if (gameChar_x < world2Start) {
        return;
    }
    stroke(180, 200, 255, 150);
    strokeWeight(2);
    for (let r = 0; r < raindrops.length; r++) {
        line(raindrops[r].x, raindrops[r].y, raindrops[r].x - 4, raindrops[r].y + 16);
        raindrops[r].y += raindrops[r].speed;
        // Extra Work - stop the drop at ground level
        if (raindrops[r].y > floorPos_y) {
            raindrops[r].y = 140; // Extra Work - starts below the clouds
            raindrops[r].x = random(0, width);
        }
    }
    noStroke();
}
// Extra Work - ash falling in the volcano world, same idea as the rain but always on there
function drawAsh() {
    if (gameChar_x >= world2Start) {
        return;
    }
    noStroke();
    fill(130, 120, 110, 160);
    for (let a = 0; a < ashFlakes.length; a++) {
        ellipse(ashFlakes[a].x, ashFlakes[a].y, 4, 4);
        ashFlakes[a].y += ashFlakes[a].speed;
        // Extra Work - stop the flake at ground level, same as the rain
        if (ashFlakes[a].y > floorPos_y) {
            ashFlakes[a].y = 0;
            ashFlakes[a].x = random(0, width);
        }
    }
}
function drawHUD() {
    // Extra Work - small pause button, shown during play
    if (lives > 0 && !anySpaceshipReached()) {
        noStroke();
        fill(255, 255, 255, 200);
        rect(width - 90, 10, 70, 35, 8);
        fill(20, 20, 40);
        textSize(18);
        text("Menu", width - 78, 33);

        // Extra Work - Shop button, right under the Menu button
        fill(255, 255, 255, 200);
        rect(width - 90, 50, 70, 35, 8);
        fill(20, 20, 40);
        textSize(18);
        text("Shop", width - 78, 73);
    }

    // Extra Work - mini coin icon next to Score
    noStroke();
    fill(255, 225, 50, 150);
    ellipse(30, 22, 18);
    fill(255, 195, 0);
    ellipse(30, 22, 13);
    fill(255, 230, 100);
    ellipse(30, 22, 7);

    noStroke();
    fill(0);
    textSize(24);
    text("Score: " + gameScore, 45, 28);

    // Extra Work - mini heart icon next to Lives
    noStroke();
    fill(220, 30, 60);
    ellipse(26, 48, 10, 10);
    ellipse(34, 48, 10, 10);
    triangle(21, 51, 39, 51, 30, 62);

    fill(0);
    textSize(24);
    text("Lives: " + lives, 45, 58);

    // Extra Work - mini rock icon next to Rocks
    noStroke();
    fill(80, 210, 225, 130);
    ellipse(30, 82, 16);
    stroke(20, 20, 25);
    strokeWeight(1);
    fill(70, 65, 75);
    ellipse(30, 82, 11);
    noStroke();
    fill(110, 230, 240);
    ellipse(28, 80, 4);

    // Extra Work - show how many rocks the player is holding
    fill(0);
    textSize(24);
    text("Rocks: " + rockCount, 45, 88);

    // Extra Work - Ember Dash HUD (status text + charging bar)
    drawEmberDashHUD();

    // Extra Work - arrow count and shield charges,  in the top middle of the screen only if the player has them
    if (hasArrow && arrowCount > 0) {
        noStroke();
        fill(139, 90, 43);
        rect(width / 2 - 70, 21, 16, 2);
        fill(90, 90, 95);
        triangle(width / 2 - 54, 18, width / 2 - 54, 26, width / 2 - 48, 22);
        fill(0);
        textSize(20);
        text("x" + arrowCount, width / 2 - 40, 28);
    }
    if (hasShield && shieldHp > 0) {
        noStroke();
        fill(100, 200, 255);
        rect(width / 2 + 20, 15, 16, 12, 4, 4, 0, 0);
        triangle(width / 2 + 20, 26, width / 2 + 36, 26, width / 2 + 28, 36);
        fill(0);
        textSize(20);
        text("x" + shieldHp, width / 2 + 50, 32);
    }

    if (lives < 1) {
        fill(0);
        stroke(10);
        textSize(50);
        text("GAME OVER", width / 2 - 150, height / 2);
        noStroke();
        fill(220, 30, 30);
        textSize(15);
        text("Don't give up - try again! Let's save what's left and finish them off.", width / 2 - 220, height / 2 + 22);
    }
    // Extra Work - wait a bit so the launch animation plays before the text shows up
    if (anySpaceshipReached() && missionTimer > 90) {
        fill(0);
        stroke(10);
        textSize(50);
        text("MISSION COMPLETE", width / 2 - 230, 70);
    }

    // Extra Work - message that shows the boss is finally defeated
    if (bossDefeatedTimer > 0) {
        noStroke();
        fill(0, 0, 0, 160);
        rect(width / 2 - 260, 90, 520, 40, 8);
        fill(255, 215, 0);
        textSize(24);
        text("Boss defeated! Head back to the ship!", width / 2 - 220, 118);
        bossDefeatedTimer -= 1;
    }

    // Extra Work - warning that the boss just got faster
    if (enrageMsgTimer > 0) {
        noStroke();
        fill(0, 0, 0, 160);
        rect(width / 2 - 260, 140, 520, 40, 8);
        fill(255, 80, 80);
        textSize(24);
        text("The boss is furious now - watch out, it's faster!", width / 2 - 220, 168);
        enrageMsgTimer -= 1;
    }

    // Extra Work - power-up status text and chest message
    drawPowerUpHUD();

    // Extra Work - warning shown while standing at the ship with enemies still alive
    if (nearLockedSpaceship()) {
        noStroke();
        fill(0, 0, 0, 160);
        rect(width / 2 - 260, 90, 520, 40, 8);
        fill(255, 80, 80);
        textSize(22);
        text("Enemies still alive! Go kill them all first!", width / 2 - 245, 118);
    }

    // Extra Work - buttons shown after winning or losing (waits for the launch animation too)
    let showEndButtons = false;
    if (lives < 1) {
        showEndButtons = true;
    }
    if (anySpaceshipReached() && missionTimer > 90) {
        showEndButtons = true;
    }
    if (showEndButtons) {
        noStroke();
        fill(255, 255, 255, 230);
        rect(width / 2 - 180, height / 2 + 30, 160, 50, 10);
        fill(20, 20, 40);
        textSize(20);
        text("Play Again", width / 2 - 160, height / 2 + 62);

        fill(255, 255, 255, 230);
        rect(width / 2 + 20, height / 2 + 30, 160, 50, 10);
        fill(20, 20, 40);
        text("Main Menu", width / 2 + 42, height / 2 + 62);
    }

    // +1 life text
    if (extraLifeTimer > 0) {
        fill(0, 220, 0);
        stroke(255);
        strokeWeight(2);
        textSize(40);
        text("+1 LIFE!", width / 2 - 90, height / 2 - 100);
        extraLifeTimer -= 1;
    }
    // Extra Work - no rocks warning
    if (noRocksTimer > 0) {
        fill(220, 30, 30);
        stroke(255);
        strokeWeight(2);
        textSize(28);
        text("No rocks! Go collect some.", width / 2 - 175, height / 2 - 100);
        noRocksTimer -= 1;
    }

    // Extra Work - nothing this way, points the player back toward the enemies
    if (edgeMsgTimer > 0) {
        fill(220, 30, 30);
        stroke(255);
        strokeWeight(2);
        textSize(28);
        text("Nothing this way - the enemies are the other direction!", width / 2 - 280, height / 2 - 100);
        edgeMsgTimer -= 1;
    }

}
function gravityMov() {
    if (!isPlummeting) {
        velY += 0.6;
        gameChar_y += velY;

        let groundY = floorPos_y;
        for (let i = 0; i < platforms.length; i++) {
            let withinX = gameChar_x > platforms[i].x &&
                gameChar_x < platforms[i].x + platforms[i].length;

            let fallingOntoIt = velY >= 0 &&
                gameChar_y >= platforms[i].y &&
                (gameChar_y - velY) <= platforms[i].y;
            if (withinX && fallingOntoIt) {
                groundY = platforms[i].y;
                break;
            }
        }
        if (gameChar_y >= groundY) {
            gameChar_y = groundY;
            velY = 0;
            isFalling = false;

        } else {
            isFalling = true;
        }
    }
}
function charMove() {
    if (anySpaceshipReached() || lives < 1) return;
    // Extra Work - Ember Dash sets the speed and starts its timer on movement
    let speed = emberDashMove(isLeft || isRight);
    if (isLeft) { gameChar_x -= speed; lastMoveDir = -1; }
    if (isRight) { gameChar_x += speed; lastMoveDir = 1; }
}