// Maze game with 5 progressively larger levels
const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

const LEVELS = [
  { size: 10, colors: { bg: "#f4f4f4", wall: "#222", ball: "#e74c3c" } },
  { size: 12, colors: { bg: "#e8f8ff", wall: "#005f99", ball: "#ff6600" } },
  { size: 14, colors: { bg: "#fbeed7", wall: "#7b3f00", ball: "#008000" } },
  { size: 16, colors: { bg: "#e9e9ff", wall: "#3a0ca3", ball: "#ff1493" } },
  { size: 18, colors: { bg: "#fff0f5", wall: "#4b0082", ball: "#0000cd" } },
];

let level = 0;
let maze;
let cellSize;
let player;
let win = false;

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.walls = { top: true, right: true, bottom: true, left: true };
    this.visited = false;
  }
}

function generateMaze(cols, rows) {
  const grid = [];
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      row.push(new Cell(x, y));
    }
    grid.push(row);
  }
  const stack = [];
  let current = grid[0][0];
  current.visited = true;
  let visitedCount = 1;
  const total = cols * rows;

  while (visitedCount < total) {
    const { x, y } = current;
    const neighbors = [];
    if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]); // top
    if (x < cols - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]); // right
    if (y < rows - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]); // bottom
    if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]); // left

    if (neighbors.length) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      stack.push(current);
      removeWalls(current, next);
      current = next;
      current.visited = true;
      visitedCount++;
    } else if (stack.length) {
      current = stack.pop();
    }
  }
  return grid;
}

function removeWalls(a, b) {
  const x = a.x - b.x;
  const y = a.y - b.y;
  if (x === 1) {
    a.walls.left = false;
    b.walls.right = false;
  } else if (x === -1) {
    a.walls.right = false;
    b.walls.left = false;
  } else if (y === 1) {
    a.walls.top = false;
    b.walls.bottom = false;
  } else if (y === -1) {
    a.walls.bottom = false;
    b.walls.top = false;
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function drawMaze() {
  ctx.fillStyle = LEVELS[level].colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = LEVELS[level].colors.wall;
  ctx.lineWidth = 2;

  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      const cell = maze[y][x];
      const px = x * cellSize;
      const py = y * cellSize;
      if (cell.walls.top) drawLine(px, py, px + cellSize, py);
      if (cell.walls.right)
        drawLine(px + cellSize, py, px + cellSize, py + cellSize);
      if (cell.walls.bottom)
        drawLine(px + cellSize, py + cellSize, px, py + cellSize);
      if (cell.walls.left) drawLine(px, py + cellSize, px, py);
    }
  }

  // draw exit marker
  ctx.fillStyle = LEVELS[level].colors.wall;
  ctx.fillRect(
    (maze[0].length - 1) * cellSize + cellSize * 0.25,
    (maze.length - 1) * cellSize + cellSize * 0.25,
    cellSize * 0.5,
    cellSize * 0.5,
  );
}

function drawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawPlayer() {
  ctx.fillStyle = LEVELS[level].colors.ball;
  ctx.beginPath();
  ctx.arc(
    player.x * cellSize + cellSize / 2,
    player.y * cellSize + cellSize / 2,
    cellSize * 0.3,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

function render() {
  resizeCanvas();
  cellSize = Math.min(
    canvas.width / maze[0].length,
    canvas.height / maze.length,
  );
  drawMaze();
  drawPlayer();
}

function move(dx, dy) {
  const cell = maze[player.y][player.x];
  if (dx === -1 && !cell.walls.left) player.x--;
  if (dx === 1 && !cell.walls.right) player.x++;
  if (dy === -1 && !cell.walls.top) player.y--;
  if (dy === 1 && !cell.walls.bottom) player.y++;
  checkWin();
  render();
}

function checkWin() {
  if (player.x === maze[0].length - 1 && player.y === maze.length - 1) {
    level++;
    if (level >= LEVELS.length) {
      win = true;
      document.getElementById("levelInfo").textContent = "You won!";
      window.removeEventListener("keydown", handleKey);
    } else {
      startLevel();
    }
  }
}

function handleKey(e) {
  switch (e.key) {
    case "ArrowLeft":
      move(-1, 0);
      break;
    case "ArrowRight":
      move(1, 0);
      break;
    case "ArrowUp":
      move(0, -1);
      break;
    case "ArrowDown":
      move(0, 1);
      break;
  }
}

function startLevel() {
  const cfg = LEVELS[level];
  maze = generateMaze(cfg.size, cfg.size);
  player = { x: 0, y: 0 };
  document.getElementById("levelInfo").textContent = `Level ${level + 1}/5`;
  render();
}

window.addEventListener("keydown", handleKey);
window.addEventListener("resize", render);

startLevel();
