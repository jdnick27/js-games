# 2D Golf Game

A simple browser golf game. Aim the ball and launch it toward the hole on a flat course filled with hazards.

## The Maze

Navigate a ball through a procedurally generated maze. Each of the five levels increases in size and features its own color scheme. Reach the exit to advance to the next level and escape the final maze to win.

## Baseball Game

Time your swing to hit the pitched ball. Press the Space key when the ball crosses the plate.

## Stick Figure Fighting

Face off against an improved AI opponent. Use the left and right arrow keys to move, the
up arrow to jump, press **A** to attack and hold **S** to block. Each fighter can
take about five hits before being defeated. The enemy now reacts to your attacks
and strikes more aggressively.

## Playing

Open `index.html` in a web browser to access the home menu. Choose **Start Game** to play or read **About Game/Rules** for instructions. The game canvas will scale to your browser window. Use the left and right arrow keys to adjust the shot angle. The controls are inverted so the left arrow rotates the aim right and the right arrow rotates it left.
An on-screen arrow shows your current aim direction. Press the Space key once to start the power meter and press again to launch the ball. Try to land it in the hole on the right side of the screen.
Visit the **Settings** page from the home menu to toggle between light and dark themes. Your preference is saved across visits and defaults to your browser's color scheme.
Avoid trees, water, bunkers and hills along the way. The green around the hole is slicker, so the ball rolls farther. Each hole may have between one and three trees that vary in size, so pay attention to your surroundings. If your shot lands in the water hazard a penalty stroke is added and the ball is dropped on the side of the water farther from the hole.
Press **R** to rehit from your previous location. This counts your last stroke and adds a penalty stroke, unless that stroke already incurred a water or out-of-bounds penalty.
Press **N** to restart the current hole from the tee without changing the layout.

The ball's animation now updates every other frame so its motion looks a bit
slower without affecting distance.

The game now features 18 holes played in sequence. Each hole's **par** is
determined by its distance from the tee:

- Par 3: 75–225yd
- Par 4: 226–420yd
- Par 5: 421–699yd

Distances shown in the game are derived from the screen width using an
approximate conversion of 0.3 yards per pixel so that each hole falls within a
plausible real-world range.

The overlay at the
top of the screen shows the current hole number, its par and distance. Your
strokes for each hole are recorded on the scoreboard shown on the right side of
the screen along with how many strokes over or under par you were. When the
ball drops into the cup the hole is complete and the next hole will
automatically load until all 18 are finished.

## Development

Run `npm install` to install development dependencies. The project uses [Prettier](https://prettier.io/) for formatting and `jshint` for basic linting.

Format the source files with:

```bash
npx prettier -w *.js *.html *.css README.md
```

Check the main script for common mistakes:

```bash
npx jshint games/golf/game.js
```

Delete local branches whose remote counterparts were removed:

```bash
./cleanupBranches.sh
```
