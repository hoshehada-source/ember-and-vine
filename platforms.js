// Platforms (Factory Pattern)
function createPlatform(x, y, length) {
    let p = {
        x: x,
        y: y,
        length: length,
        draw: function () {
            noStroke();
            fill(60, 45, 40);
            rect(this.x, this.y + 6, this.length, 14);
            fill(90, 70, 55);
            rect(this.x, this.y, this.length, 8);
        }
    };
    return p;
}
