const canvas = document.getElementById("maze");
const ctx = canvas.getContext("2d");

const levelInfoEl = document.getElementById("levelInfo");
const msgEl = document.getElementById("mazeMsg");

const LEVELS = [
  { rows: 10, cols: 10, bg: "#f8f8f8", walls: "#333" },
  { rows: 12, cols: 12, bg: "#e8f0ff", walls: "#224" },
  { rows: 14, cols: 14, bg: "#fff0e8", walls: "#642" },
  { rows: 16, cols: 16, bg: "#f0ffe8", walls: "#264" },
  { rows: 18, cols: 18, bg: "#f5e8ff", walls: "#426" },
];

class Maze {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.cells = [];
    for (let r = 0; r < rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < cols; c++) {
        this.cells[r][c] = {
          N: true,
          S: true,
          E: true,
          W: true,
          visited: false,
        };
      }
    }
  }

  generate() {
    const stack = [];
    let current = { r: 0, c: 0 };
    this.cells[0][0].visited = true;
    let visited = 1;
    while (visited < this.rows * this.cols) {
      const nbs = [];
      const { r, c } = current;
      if (r > 0 && !this.cells[r - 1][c].visited)
        nbs.push({ r: r - 1, c, dir: "N", opp: "S" });
      if (r < this.rows - 1 && !this.cells[r + 1][c].visited)
        nbs.push({ r: r + 1, c, dir: "S", opp: "N" });
      if (c > 0 && !this.cells[r][c - 1].visited)
        nbs.push({ r, c: c - 1, dir: "W", opp: "E" });
      if (c < this.cols - 1 && !this.cells[r][c + 1].visited)
        nbs.push({ r, c: c + 1, dir: "E", opp: "W" });

      if (nbs.length) {
        const next = nbs[Math.floor(Math.random() * nbs.length)];
        this.cells[r][c][next.dir] = false;
        this.cells[next.r][next.c][next.opp] = false;
        stack.push(current);
        current = { r: next.r, c: next.c };
        this.cells[current.r][current.c].visited = true;
        visited++;
      } else {
        current = stack.pop();
      }
    }
  }

  hasWall(r, c, dir) {
    return this.cells[r][c][dir];
  }

  draw(ctx, size, wallColor) {
    const cellSize = size / this.cols;
    ctx.strokeStyle = wallColor;
    ctx.lineWidth = 2;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[r][c];
        const x = c * cellSize;
        const y = r * cellSize;
        ctx.beginPath();
        if (cell.N) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellSize, y);
        }
        if (cell.S) {
          ctx.moveTo(x, y + cellSize);
          ctx.lineTo(x + cellSize, y + cellSize);
        }
        if (cell.W) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellSize);
        }
        if (cell.E) {
          ctx.moveTo(x + cellSize, y);
          ctx.lineTo(x + cellSize, y + cellSize);
        }
        ctx.stroke();
      }
    }
  }
}

let levelIndex = 0;
let maze;
let player;

function startLevel() {
  const level = LEVELS[levelIndex];
  canvas.width = canvas.height = 600;
  canvas.style.background = level.bg;
  maze = new Maze(level.rows, level.cols);
  maze.generate();
  const cellSize = canvas.width / level.cols;
  player = { r: 0, c: 0, radius: cellSize / 3 };
  levelInfoEl.textContent = `Level ${levelIndex + 1} / ${LEVELS.length}`;
  msgEl.textContent = "";
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const level = LEVELS[levelIndex];
  maze.draw(ctx, canvas.width, level.walls);
  drawPlayer();
}

function drawPlayer() {
  const cellSize = canvas.width / maze.cols;
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(
    player.c * cellSize + cellSize / 2,
    player.r * cellSize + cellSize / 2,
    player.radius,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

function tryMove(dr, dc) {
  const dirs = { "-1,0": "N", "1,0": "S", "0,-1": "W", "0,1": "E" };
  const dir = dirs[`${dr},${dc}`];
  if (!maze.hasWall(player.r, player.c, dir)) {
    player.r += dr;
    player.c += dc;
    draw();
    checkGoal();
  }
}

function checkGoal() {
  if (player.r === maze.rows - 1 && player.c === maze.cols - 1) {
    levelIndex += 1;
    if (levelIndex >= LEVELS.length) {
      msgEl.textContent = "You escaped the maze!";
    } else {
      msgEl.textContent = "Level complete!";
      setTimeout(startLevel, 1000);
    }
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") tryMove(-1, 0);
  else if (e.key === "ArrowDown") tryMove(1, 0);
  else if (e.key === "ArrowLeft") tryMove(0, -1);
  else if (e.key === "ArrowRight") tryMove(0, 1);
});

startLevel();
