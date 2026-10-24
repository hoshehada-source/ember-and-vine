// draw canyon hazard (fire or vine)
function drawCanyonEruption(t_canyon) {
    let eruptPhase = frameCount % 480;

    if (gameChar_x < world2Start) {
        // volcano world fire
        if (eruptPhase >= 420 && eruptPhase < 450) {
            // warning blink
            if (frameCount % 10 < 5) {
                fill(255, 230, 0);
                ellipse(t_canyon.x_pos + t_canyon.width / 2, floorPos_y + 120, 40, 15);
            }
        }

        if (eruptPhase >= 450) {
            // draw flame animation
            let flicker = 0;
            if (frameCount % 6 < 3) {
                flicker = 10;
            } else {
                flicker = -10;
            }

            for (let fl = 0; fl < 3; fl++) {
                let tongueX = t_canyon.x_pos + t_canyon.width / 2 + (fl - 1) * 16;
                let tongueHeight = 210 - fl * 20 + flicker;

                fill(255, 90, 0, 210);
                triangle(tongueX - 16, floorPos_y + 110, tongueX + 16, floorPos_y + 110, tongueX, floorPos_y + 110 - tongueHeight);
                fill(255, 170, 0, 220);
                triangle(tongueX - 9, floorPos_y + 110, tongueX + 9, floorPos_y + 110, tongueX, floorPos_y + 110 - tongueHeight + 40);
                fill(255, 230, 100, 230);
                triangle(tongueX - 4, floorPos_y + 110, tongueX + 4, floorPos_y + 110, tongueX, floorPos_y + 110 - tongueHeight + 70);
            }

            // sparks flying up
            for (let em = 0; em < 3; em++) {
                fill(255, 200, 0, 200);
                ellipse(t_canyon.x_pos + t_canyon.width / 2 + (em - 1) * 20, floorPos_y - (frameCount % 100) - em * 20, 4);
            }
        }

    } else {
        // nature world vine
        if (eruptPhase >= 420 && eruptPhase < 450) {
            // warning glow
            if (frameCount % 10 < 5) {
                fill(100, 255, 120);
                ellipse(t_canyon.x_pos + t_canyon.width / 2, floorPos_y + 120, 40, 15);
            }
        }

        if (eruptPhase >= 450) {
            // draw vine stem
            let vineZig = [0, 10, -10, 12, -12, 8, -8, 4];
            for (let vz = 0; vz < vineZig.length; vz++) {
                let stemSize = 16 - vz;
                fill(20, 130, 150);
                ellipse(t_canyon.x_pos + t_canyon.width / 2 + vineZig[vz], floorPos_y + 110 - vz * 26, stemSize, stemSize);
            }

            // draw leaves
            for (let lf = 1; lf < vineZig.length; lf += 2) {
                let leafX = t_canyon.x_pos + t_canyon.width / 2 + vineZig[lf];
                let leafY = floorPos_y + 110 - lf * 26;
                let leafDir = 14;
                if (vineZig[lf] < 0) {
                    leafDir = -14;
                }
                fill(50, 190, 200);
                ellipse(leafX + leafDir, leafY, 16, 9);
            }

            // draw thorns
            for (let th = 0; th < vineZig.length; th++) {
                fill(10, 90, 110);
                let thornX = t_canyon.x_pos + t_canyon.width / 2 + vineZig[th];
                let thornY = floorPos_y + 110 - th * 26;
                triangle(thornX + 8, thornY, thornX + 16, thornY - 4, thornX + 8, thornY + 4);
                triangle(thornX - 8, thornY, thornX - 16, thornY - 4, thornX - 8, thornY + 4);
            }

            // vine tip
            let tipX = t_canyon.x_pos + t_canyon.width / 2 + vineZig[vineZig.length - 1];
            let tipY = floorPos_y + 110 - (vineZig.length - 1) * 26;
            fill(0, 255, 255, 200);
            ellipse(tipX, tipY - 12, 12, 12);
            fill(180, 255, 255, 220);
            ellipse(tipX, tipY - 12, 6, 6);
        }
    }
}

// check if player gets hit by hazard
function checkCanyonEruption(t_canyon) {
    let eruptPhase = frameCount % 480;
    if (eruptPhase < 450) {
        return;
    }

    let nearCanyon = gameChar_x > t_canyon.x_pos - 10 && gameChar_x < t_canyon.x_pos + t_canyon.width + 10;
    let inReach = false;

    if (gameChar_x < world2Start) {
        inReach = gameChar_y > floorPos_y - 110; // fire height
    } else {
        inReach = gameChar_y > floorPos_y - 72; // vine height
    }
    // shield takes the hit if available
    if (nearCanyon && inReach && lives > 0 && invincibleTimer <= 0 && shieldHp > 0) {
        shieldHp -= 1;
        if (shieldHp <= 0) {
            hasShield = false; // shield is gone for good once used up
        }
        hitSound.play();
        resetPlayer();
        return;
    }

    // lose life if hit
    if (nearCanyon && inReach && lives > 0 && invincibleTimer <= 0) {
        lives -= 1;
        if (lives > 0) {
            hitSound.play();
            resetPlayer();
        } else {
            gameOverSound.play();
        }
    }
}