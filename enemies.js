// Enemies module (Constructor Function)
function Enemy(x, y, range, hp, size) {
    this.x = x;
    this.y = y;
    this.range = range;
    this.currentX = x;
    this.incAmount = 1; // Extra Work - how many pixels it moves per frame, doubles once enraged
    this.inc = this.incAmount;
    this.isDead = false;
    this.maxHp = hp || 1; // some enemies need more than one stomp
    this.hp = this.maxHp;
    this.size = size || 1;
    this.isEnraged = false; // Extra Work - true once a boss drops below half health
    this.fireballTimer = 100; // Extra Work - bosses only, counts down to the next fireball throw
    this.fireballs = []; // Extra Work - bosses only, fire rolling toward the player

    this.update = function () {
        // Extra Work - the boss paces back and forth, but reverses early if you get too close
        if (this.maxHp > 1) {
            let distToPlayer = abs(gameChar_x - this.currentX);
            if (distToPlayer < 80) {
                if (gameChar_x > this.currentX && this.inc > 0) {
                    this.inc = -this.incAmount;
                } else if (gameChar_x < this.currentX && this.inc < 0) {
                    this.inc = this.incAmount;
                }
            }
        }
        this.currentX = this.currentX + this.inc;
        // Extra Work - hard clamp keeps it inside its patrol zone
        if (this.currentX > this.x + this.range) {
            this.currentX = this.x + this.range;
            this.inc = -this.incAmount;
        } else if (this.currentX < this.x) {
            this.currentX = this.x;
            this.inc = this.incAmount;
        }
    };

    // Extra Work - bosses throw fire along the ground
    this.updateFireballs = function () {
        if (this.maxHp <= 1 || this.isDead) {
            return;
        }
        this.fireballTimer -= 1;
        if (this.fireballTimer <= 0) {
            let dir = 1;
            if (gameChar_x < this.currentX) {
                dir = -1;
            }
            this.fireballs.push({ x: this.currentX, y: this.y, dir: dir, active: true });
            this.fireballTimer = 150;
        }
        for (let f = 0; f < this.fireballs.length; f++) {
            if (!this.fireballs[f].active) {
                continue;
            }
            this.fireballs[f].x += this.fireballs[f].dir * 4;

            noStroke();
            fill(255, 120, 0);
            ellipse(this.fireballs[f].x, this.fireballs[f].y, 16, 12);
            fill(255, 220, 0);
            ellipse(this.fireballs[f].x, this.fireballs[f].y, 8, 6);

            let traveled = abs(this.fireballs[f].x - this.currentX);
            if (traveled > 400) {
                this.fireballs[f].active = false;
            }
        }
    };

    // Extra Work - checks if a fireball just hit the player (jumping over it dodges it)
    this.checkFireballHit = function (gcX, gcY) {
        if (this.maxHp <= 1) {
            return false;
        }
        for (let f = 0; f < this.fireballs.length; f++) {
            if (this.fireballs[f].active) {
                let d = dist(gcX, gcY, this.fireballs[f].x, this.fireballs[f].y);
                if (d < 18) {
                    this.fireballs[f].active = false;
                    return true;
                }
            }
        }
        return false;
    };

    this.draw = function () {
        if (this.isDead) {
            return;
        }
        this.update();
        let bob = 0;
        if (frameCount % 20 < 10) {
            bob = -2;
        } else {
            bob = 2;
        }
        let s = this.size;
        // Extra Work - blinking eyes
        let blink = false;
        if (frameCount % 90 < 6) {
            blink = true;
        }
        // Extra Work - red glow behind the tougher enemies
        if (this.maxHp > 1) {
            noStroke();
            fill(255, 0, 0, 40);
            ellipse(this.currentX, this.y, 40 * s, 30 * s);

            // Extra Work - ring of spikes marks this one as rock-only, not stompable
            noStroke();
            fill(110, 25, 25);
            let cx = this.currentX;
            let cy = this.y;
            triangle(cx - 6 * s, cy - 18 * s, cx + 6 * s, cy - 18 * s, cx, cy - 34 * s);
            triangle(cx - 6 * s, cy + 18 * s, cx + 6 * s, cy + 18 * s, cx, cy + 34 * s);
            triangle(cx - 18 * s, cy - 6 * s, cx - 18 * s, cy + 6 * s, cx - 34 * s, cy);
            triangle(cx + 18 * s, cy - 6 * s, cx + 18 * s, cy + 6 * s, cx + 34 * s, cy);
            triangle(cx + 10 * s, cy - 14 * s, cx + 16 * s, cy - 8 * s, cx + 26 * s, cy - 26 * s);
            triangle(cx - 10 * s, cy - 14 * s, cx - 16 * s, cy - 8 * s, cx - 26 * s, cy - 26 * s);
            triangle(cx + 10 * s, cy + 14 * s, cx + 16 * s, cy + 8 * s, cx + 26 * s, cy + 26 * s);
            triangle(cx - 10 * s, cy + 14 * s, cx - 16 * s, cy + 8 * s, cx - 26 * s, cy + 26 * s);

            // throw and move the fire, drawn behind the boss's body
            this.updateFireballs();
        }
        stroke(0);
        strokeWeight(1.5);
        if (gameChar_x < world2Start) {
            // Volcano world
            fill(230, 0, 140);
            ellipse(this.currentX, this.y + bob, 26 * s, 20 * s);
            fill(255, 0, 90);
            triangle(this.currentX - 10 * s, this.y + bob - 6 * s, this.currentX - 6 * s, this.y + bob - 16 * s, this.currentX - 2 * s, this.y + bob - 6 * s);
            triangle(this.currentX + 2 * s, this.y + bob - 6 * s, this.currentX + 6 * s, this.y + bob - 16 * s, this.currentX + 10 * s, this.y + bob - 6 * s);
            noStroke();
            if (blink) {
                fill(0);
                rect(this.currentX - 7 * s, this.y + bob - 4 * s, 4 * s, 1 * s);
                rect(this.currentX + 3 * s, this.y + bob - 4 * s, 4 * s, 1 * s);
            } else {
                fill(0, 255, 255);
                ellipse(this.currentX - 5 * s, this.y + bob - 3 * s, 5 * s, 5 * s);
                ellipse(this.currentX + 5 * s, this.y + bob - 3 * s, 5 * s, 5 * s);
                fill(0);
                ellipse(this.currentX - 5 * s, this.y + bob - 3 * s, 2 * s, 2 * s);
                ellipse(this.currentX + 5 * s, this.y + bob - 3 * s, 2 * s, 2 * s);
            }
        } else {
            // Nature world
            fill(235, 60, 20);
            ellipse(this.currentX, this.y + bob, 26 * s, 20 * s);
            fill(0);
            triangle(this.currentX - 10 * s, this.y + bob - 4 * s, this.currentX - 7 * s, this.y + bob - 13 * s, this.currentX - 4 * s, this.y + bob - 4 * s);
            triangle(this.currentX - 2 * s, this.y + bob - 6 * s, this.currentX, this.y + bob - 16 * s, this.currentX + 2 * s, this.y + bob - 6 * s);
            triangle(this.currentX + 4 * s, this.y + bob - 4 * s, this.currentX + 7 * s, this.y + bob - 13 * s, this.currentX + 10 * s, this.y + bob - 4 * s);
            noStroke();
            if (blink) {
                fill(0);
                rect(this.currentX - 7 * s, this.y + bob - 2 * s, 4 * s, 1 * s);
                rect(this.currentX + 3 * s, this.y + bob - 2 * s, 4 * s, 1 * s);
            } else {
                fill(255, 255, 0);
                ellipse(this.currentX - 5 * s, this.y + bob - 1 * s, 5 * s, 5 * s);
                ellipse(this.currentX + 5 * s, this.y + bob - 1 * s, 5 * s, 5 * s);
                fill(0);
                ellipse(this.currentX - 5 * s, this.y + bob - 1 * s, 2 * s, 2 * s);
                ellipse(this.currentX + 5 * s, this.y + bob - 1 * s, 2 * s, 2 * s);
            }
        }
        noStroke();

        // health bar - only for enemies that need more than one stomp
        if (this.maxHp > 1) {
            let barWidth = 30 * s;
            fill(60, 0, 0);
            rect(this.currentX - barWidth / 2, this.y - 32 * s, barWidth, 5);
            fill(0, 220, 0);
            rect(this.currentX - barWidth / 2, this.y - 32 * s, barWidth * (this.hp / this.maxHp), 5);
        }
    };
    this.checkContact = function (gcX, gcY) {
        if (this.isDead) {
            return false;
        }
        let d = dist(gcX, gcY, this.currentX, this.y);
        if (d < 20 * this.size) {
            return true;
        } else {
            return false;
        }
    };

    // Extra Work - jump on the enemy's head to kill it
    this.checkStomp = function (gcX, gcY, charVelY) {
        if (this.isDead) {
            return false;
        }
        let closeEnough = abs(gcX - this.currentX) < 18 * this.size;
        let landingOnTop = gcY < this.y && gcY > this.y - 20 * this.size;
        let isFalling = charVelY > 0;
        if (closeEnough && landingOnTop && isFalling) {
            return true;
        } else {
            return false;
        }
    };
}
