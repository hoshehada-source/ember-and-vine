# Ember & Vine

Final project for Introduction to Programming.

Story: you crash on a planet split into two parts: a green nature world and a volcano world. aliens took over the volcano and are moving into the nature side. your ship is parked in the nature world, so you have to fight through the volcano (and the boss at the end) and get back to your ship to win and go back home.
(there's also a story intro when you click start).

## Controls
- A/D or Left/Right arrows — move
- W or Up arrow — jump
- F — throw a rock (or arrow, if bought)
- Q — speed boost (needs to recharge)
- SPACE — restart after winning/losing

## how the code is structured
i marked the required parts right in sketch.js:
part 2a: character visual states
part 2b: base scenery (canyons, collectables, mountains, trees, clouds)
part 3a: movement, controls, gravity
part 3b: falling in canyons, collecting items
everything else I added is labeled as "Extra Work" in the comments. to keep things from getting messy, I split it into a few files:
1.sketch.js (main loop: Global variables, Drawing functions for each element, Screen functions, Gameplay logic)
2.enemies.js (normal enemies + boss)
3.platforms.js (platforms)
4.emberDash.js (q boost)
5.canyonHazard.js (fire/vine eruptions)
6.powerUps.js (star + chest)

## extra stuff i added
1.two worlds: volcano and nature look different (different ground, enemies, hazards). switches based on your x position.
2.rocks: pick them up off the ground and throw with f. regular enemies die from a stomp or rock. boss only takes damage from rocks (jumping on it hurts you because of its spikes).
3.boss: way harder, has a health bar, tries to keep its distance, shoots fireballs along the ground that you have to jump over, and gets faster when its health drops below half.
4.canyon hazards: fire or vines pop out of canyons every 8 sec with a quick warning blink. touching them costs a life.
5.ember dash (q): a quick speed boost with a recharge bar in the HUD.
6.weather: rain in nature, ash in volcano.
7.power-ups: purple star gives 5 seconds of invincibility (enemies die on touch, except boss), and a hidden chest on a platform gives +15 bonus coins.
8.the shop: button in the corner during play. coins are saved in a wallet that doesn't reset when you die. you can buy an extra life, a shield (blocks 3 hits, one-time use), arrows (alternative ammo for f, separate from rocks), or an invincibility star.
9.spaceship win condition: you have to kill every enemy. if you try to go to the ship early it warns you. once clear, walking up to it plays a launch animation and shows "MISSION COMPLETE".
10.warning signs: placed before dangerous spots like the volcano canyon and the boss.
11.sound: menu music + sound effects for everything (jump, hits, rocks, coins, win/lose, boost ready/active).
12.menus: pause menu, how to play, and the intro story.
