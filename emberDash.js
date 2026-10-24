// Ember Dash module (Extra Work - the speed boost ability)
let boostTimer; // counts down while the dash is active
let chargeTimer; // counts down while recharging after a dash
let chargePulseTimer; // short glow around the player once charging finishes
let notReadyTimer; // shows a message when Q is pressed too early
let boostSoundPlayed; // whoosh plays once, on the first movement of the dash
let boostArmed; // Q was pressed and ready, but the timer only starts once the player walks
let boostActivateSound; // whoosh sound when the dash kicks in
let boostReadySound; // ding sound when the dash finishes charging

function emberDashPreload() {
    boostActivateSound = loadSound('sounds/boost_activate.wav');
    boostReadySound = loadSound('sounds/boost_ready.wav');
}

function resetEmberDash() {
    boostTimer = 0;
    chargeTimer = 0;
    chargePulseTimer = 0;
    notReadyTimer = 0;
    boostSoundPlayed = false;
    boostArmed = false;
}

// Extra Work - Q key logic
function tryActivateEmberDash() {
    if (boostTimer <= 0 && chargeTimer <= 0 && !boostArmed) {
        boostArmed = true; // ready to go, the timer starts on the first movement
        boostSoundPlayed = false; // whoosh plays on the first movement
    } else if (chargeTimer > 0) {
        notReadyTimer = 60; // let the player know it's not charged yet
    }
}

// updates the timers every frame
function updateEmberDash() {
    if (boostTimer > 0) {
        boostTimer -= 1;
        if (boostTimer <= 0) {
            chargeTimer = 360; // long recharge keeps the dash from being spammed
        }
    }
    if (chargeTimer > 0) {
        chargeTimer -= 1;
        if (chargeTimer <= 0) {
            chargePulseTimer = 60; // glow around the player once charging is done
            boostReadySound.play(); // ding to signal it's ready again
        }
    }
    if (chargePulseTimer > 0) {
        chargePulseTimer -= 1;
    }
}

// called from charMove(), returns the speed to use
function emberDashMove(isMoving) {
    if (boostArmed && isMoving) {
        boostTimer = 90;
        boostArmed = false;
    }
    if (boostTimer > 0 && isMoving && !boostSoundPlayed) {
        boostActivateSound.play();
        boostSoundPlayed = true;
    }
    if (boostTimer > 0) {
        return 10;
    } else {
        return 5;
    }
}

// flame ring while active, or blue glow while charging
function drawEmberDashRing(x, y) {
    if (boostTimer > 0 || boostArmed) {
        let flamePoints = [[0, -20], [14, -10], [14, 10], [0, 20], [-14, 10], [-14, -10]];
        for (let p = 0; p < flamePoints.length; p++) {
            fill(255, 100, 0, 180);
            ellipse(x + flamePoints[p][0], y - 20 + flamePoints[p][1], 8, 8);
        }
    } else if (chargePulseTimer > 0) {
        let chargePulse = 0;
        if (frameCount % 20 < 10) {
            chargePulse = 6;
        } else {
            chargePulse = 0;
        }
        fill(0, 100, 255, 90);
        ellipse(x, y - 20, 40 + chargePulse, 40 + chargePulse);
    }
}

// fire trailing from the back, used while walking
function drawEmberDashTrail(x, bodyY, facingRight) {
    if (boostTimer <= 0) {
        return;
    }
    let dir = 1;
    if (facingRight) {
        dir = -1;
    }
    for (let f = 0; f < 3; f++) {
        for (let side = 0; side < 2; side++) {
            fill(255, 140 - f * 30, 0, 220 - f * 50);
            triangle(x + 8 * dir, bodyY + 9 + side * 11, x + 8 * dir, bodyY + 19 + side * 11, x + (23 + f * 7) * dir, bodyY + 14 + side * 11);
        }
    }
}

// status text + charging bar, called from drawHUD()
function drawEmberDashHUD() {
    noStroke();
    fill(0);
    textSize(24);
    if (boostTimer > 0) {
        text("Speed: BOOSTING!", 45, 118);
    } else if (chargeTimer > 0) {
        text("Speed: CHARGING", 45, 118);
    } else {
        text("Speed: READY (Q)", 45, 118);
    }
    if (chargeTimer > 0) {
        let maxCharge = 360;
        let barWidth = 100;
        let filled = barWidth * ((maxCharge - chargeTimer) / maxCharge);
        noStroke();
        fill(60, 60, 60);
        rect(45, 126, barWidth, 10);
        fill(0, 150, 255);
        rect(45, 126, filled, 10);
    }
    if (notReadyTimer > 0) {
        fill(220, 30, 30);
        stroke(255);
        strokeWeight(2);
        textSize(28);
        text("Not charged yet!", width / 2 - 130, height / 2 - 100);
        notReadyTimer -= 1;
    }
}
