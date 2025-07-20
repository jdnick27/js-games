const canvas = document.getElementById("maze");
const ctx = canvas.getContext("2d");

const LEVELS = [
  {
    size: 8,
    colors: { bg: "#f8f8ff", wall: "#333", player: "#e74c3c", exit: "#2ecc71" },
  },
  {
    size: 10,
    colors: { bg: "#fff0f5", wall: "#222", player: "#3498db", exit: "#27ae60" },
  },
  {
    size: 12,
    colors: { bg: "#f0fff0", wall: "#111", player: "#9b59b6", exit: "#16a085" },
  },
  {
    size: 14,
    colors: { bg: "#f5fffa", wall: "#000", player: "#f1c40f", exit: "#2980b9" },
  },
  {
    size: 16,
    colors: { bg: "#fffff0", wall: "#444", player: "#e67e22", exit: "#8e44ad" },
  },
];

const CELL_SIZE = 40;
let level = 0;
let maze;
let player;

function resize() {
  canvas.width = LEVELS[level].size * CELL_SIZE;
  canvas.height = LEVELS[level].size * CELL_SIZE;
}

function createGrid(size) {
  const grid = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      row.push({
        x,
        y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      });
    }
    grid.push(row);
  }
  return grid;
}

function removeWalls(a, b) {
  const dx = b.x - a.x;
  if (dx === 1) {
    a.walls.right = false;
    b.walls.left = false;
  } else if (dx === -1) {
    a.walls.left = false;
    b.walls.right = false;
  }
  const dy = b.y - a.y;
  if (dy === 1) {
    a.walls.bottom = false;
    b.walls.top = false;
  } else if (dy === -1) {
    a.walls.top = false;
    b.walls.bottom = false;
  }
}

function generateMaze(size) {
  const grid = createGrid(size);
  const stack = [];
  let current = grid[0][0];
  current.visited = true;
  let visited = 1;
  const total = size * size;

  while (visited < total) {
    const neighbors = [];
    if (current.x > 0 && !grid[current.y][current.x - 1].visited)
      neighbors.push(grid[current.y][current.x - 1]);
    if (current.x < size - 1 && !grid[current.y][current.x + 1].visited)
      neighbors.push(grid[current.y][current.x + 1]);
    if (current.y > 0 && !grid[current.y - 1][current.x].visited)
      neighbors.push(grid[current.y - 1][current.x]);
    if (current.y < size - 1 && !grid[current.y + 1][current.x].visited)
      neighbors.push(grid[current.y + 1][current.x]);

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      stack.push(current);
      removeWalls(current, next);
      current = next;
      current.visited = true;
      visited++;
    } else if (stack.length > 0) {
      current = stack.pop();
    }
  }

  return grid;
}

function drawMaze() {
  const { bg, wall, player: playerColor, exit } = LEVELS[level].colors;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = wall;
  ctx.lineWidth = 2;

  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      const cell = maze[y][x];
      const sx = x * CELL_SIZE;
      const sy = y * CELL_SIZE;
      if (cell.walls.top) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + CELL_SIZE, sy);
        ctx.stroke();
      }
      if (cell.walls.right) {
        ctx.beginPath();
        ctx.moveTo(sx + CELL_SIZE, sy);
        ctx.lineTo(sx + CELL_SIZE, sy + CELL_SIZE);
        ctx.stroke();
      }
      if (cell.walls.bottom) {
        ctx.beginPath();
        ctx.moveTo(sx, sy + CELL_SIZE);
        ctx.lineTo(sx + CELL_SIZE, sy + CELL_SIZE);
        ctx.stroke();
      }
      if (cell.walls.left) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy + CELL_SIZE);
        ctx.stroke();
      }
    }
  }

  // draw exit
  ctx.fillStyle = exit;
  ctx.fillRect(
    (maze.length - 1) * CELL_SIZE + CELL_SIZE / 4,
    (maze.length - 1) * CELL_SIZE + CELL_SIZE / 4,
    CELL_SIZE / 2,
    CELL_SIZE / 2,
  );

  // draw player
  ctx.fillStyle = playerColor;
  ctx.beginPath();
  ctx.arc(
    player.x * CELL_SIZE + CELL_SIZE / 2,
    player.y * CELL_SIZE + CELL_SIZE / 2,
    CELL_SIZE / 3,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

function startLevel() {
  document.getElementById("levelInfo").textContent =
    `Level ${level + 1}/${LEVELS.length}`;
  document.getElementById("winMsg").textContent = "";
  resize();
  maze = generateMaze(LEVELS[level].size);
  player = { x: 0, y: 0 };
  drawMaze();
}

function move(dx, dy) {
  const cell = maze[player.y][player.x];
  if (dx === -1 && !cell.walls.left) player.x -= 1;
  if (dx === 1 && !cell.walls.right) player.x += 1;
  if (dy === -1 && !cell.walls.top) player.y -= 1;
  if (dy === 1 && !cell.walls.bottom) player.y += 1;
  drawMaze();
  if (player.x === maze.length - 1 && player.y === maze.length - 1) {
    level++;
    if (level >= LEVELS.length) {
      document.getElementById("winMsg").textContent = "You escaped the maze!";
    } else {
      startLevel();
    }
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") move(0, -1);
  if (e.key === "ArrowDown") move(0, 1);
  if (e.key === "ArrowLeft") move(-1, 0);
  if (e.key === "ArrowRight") move(1, 0);
});

window.addEventListener("resize", () => {
  resize();
  drawMaze();
});

startLevel();
