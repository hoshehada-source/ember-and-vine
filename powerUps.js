// Extra work _power-ups module
let powerUps;
let invincibleTimer;
let treasureChests;
let chestMsgTimer;

function resetPowerUps() {
    powerUps = [
        { x_pos: -500, y_pos: floorPos_y - 20, isFound: false }
    ];
    invincibleTimer = 0;
    treasureChests = [
        { x_pos: -2280, y_pos: floorPos_y - 110 - 20, isFound: false, coinBonus: 15 }
    ];
    chestMsgTimer = 0;
}

function drawPowerUp(p) {
    push();
    // make it float up and down
    let bob = 0;
    if (frameCount % 30 < 15) {
        bob = -4;
    } else {
        bob = 4;
    }
    let py = p.y_pos + bob;

    // glow effect
    let glowPulse = 0;
    if (frameCount % 15 < 8) {
        glowPulse = 6;
    } else {
        glowPulse = 0;
    }
    noStroke();
    fill(190, 30, 255, 90);
    ellipse(p.x_pos, py, 40 + glowPulse, 40 + glowPulse);

    let pulse = 0;
    if (frameCount % 20 < 10) {
        pulse = 3;
    } else {
        pulse = 0;
    }
    fill(190, 30, 255);
    triangle(p.x_pos - 12 - pulse, py + 6, p.x_pos + 12 + pulse, py + 6, p.x_pos, py - 14 - pulse);
    triangle(p.x_pos - 10, py - 6, p.x_pos + 10, py - 6, p.x_pos, py + 12);
    pop();
}

function checkPowerUp(p) {
    if (p.isFound) {
        return;
    }
    let d = dist(gameChar_x, gameChar_y, p.x_pos, p.y_pos);
    if (d < 25) {
        p.isFound = true;
        invincibleTimer = 300;
    }
}

function drawChest(c) {
    push();
    noStroke();

    let glowPulse = 0;
    if (frameCount % 25 < 13) {
        glowPulse = 8;
    } else {
        glowPulse = 0;
    }
    fill(255, 215, 0, 70);
    ellipse(c.x_pos, c.y_pos - 4, 55 + glowPulse, 45 + glowPulse);

    fill(110, 70, 35);
    rect(c.x_pos - 16, c.y_pos - 14, 32, 22);
    fill(80, 50, 25);
    rect(c.x_pos - 16, c.y_pos - 18, 32, 6);
    fill(255, 215, 0);
    ellipse(c.x_pos, c.y_pos - 4, 6, 6);

    // sparkle glints around the lid
    let glintPoints = [[-14, -18], [16, -16], [0, -22]];
    for (let g = 0; g < glintPoints.length; g++) {
        let phase = (frameCount + g * 13) % 40;
        if (phase < 6) {
            fill(255, 255, 255, 220);
            ellipse(c.x_pos + glintPoints[g][0], c.y_pos + glintPoints[g][1], 4, 4);
        }
    }
    pop();
}

function checkChest(c) {
    if (c.isFound) {
        return;
    }
    let d = dist(gameChar_x, gameChar_y, c.x_pos, c.y_pos);
    if (d < 25) {
        c.isFound = true;
        gameScore += c.coinBonus;
        walletCoins += c.coinBonus;
        chestMsgTimer = 120;
        coinSound.play();
        checkBonusLife(); // chest coins count toward the 20-coin bonus life too
    }
}

// update timers
function updatePowerUpTimers() {
    if (invincibleTimer > 0) {
        invincibleTimer -= 1;
    }
    if (chestMsgTimer > 0) {
        chestMsgTimer -= 1;
    }
}

// draw player invincibility glow
function drawInvincibleGlow(x, y) {
    if (invincibleTimer <= 0) {
        return;
    }
    push();
    let pulse = 0;
    if (frameCount % 10 < 5) {
        pulse = 5;
    } else {
        pulse = 0;
    }

    let cy = y - 36;

    // soft filled glow
    noStroke();
    fill(190, 30, 255, 90);
    ellipse(x, cy, 60 + pulse, 105 + pulse);

    // outline ring
    noFill();
    stroke(220, 100, 255, 230);
    strokeWeight(3);
    ellipse(x, cy, 55 + pulse, 100 + pulse);

    // sparkles around player
    noStroke();
    fill(255, 255, 255, 230);
    let sparklePoints = [[0, -54], [30, -27], [30, 27], [0, 54], [-30, 27], [-30, -27]];
    for (let p = 0; p < sparklePoints.length; p++) {
        ellipse(x + sparklePoints[p][0], cy + sparklePoints[p][1], 6, 6);
    }
    pop();
}

// draw HUD text and messages
function drawPowerUpHUD() {
    if (invincibleTimer > 0) {
        noStroke();
        fill(190, 30, 255);
        textSize(24);
        text("INVINCIBLE!", 45, 148);
    }
    if (chestMsgTimer > 0) {
        noStroke();
        fill(0, 0, 0, 160);
        rect(width / 2 - 200, 190, 400, 40, 8);
        fill(255, 215, 0);
        textSize(22);
        text("Found a hidden stash! +15 coins", width / 2 - 185, 218);
    }
}