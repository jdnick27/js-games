const canvas = document.getElementById("archery");
const ctx = canvas.getContext("2d");

let width;
let height;
let startY;
const ARROW_START_X = 60;

const board = { x: 0, y: 0, radius: 60 };
let angle = -Math.PI / 4; // initial upward
let power = 0;
let charging = false;
const POWER_RATE = 0.25;
const MAX_POWER = 15;

let arrow = null;
let shots = 0;
const MAX_SHOTS = 5;
let score = 0;
let message = "";

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  startY = height - 60;
  board.x = width - 150;
  board.y = height / 2;
}

function shoot() {
  arrow = {
    x: ARROW_START_X,
    y: startY,
    vx: Math.cos(angle) * power,
    vy: Math.sin(angle) * power,
    hit: false,
  };
  shots++;
  power = 0;
}

function update() {
  if (charging) {
    power += POWER_RATE;
    if (power > MAX_POWER) power = MAX_POWER;
  }
  if (arrow) {
    arrow.vy += 0.3;
    arrow.x += arrow.vx;
    arrow.y += arrow.vy;
    if (!arrow.hit && arrow.x >= board.x) {
      const dx = arrow.x - board.x;
      const dy = arrow.y - board.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= board.radius) {
        arrow.hit = true;
        arrow.vx = 0;
        arrow.vy = 0;
        let pts;
        if (dist < board.radius * 0.33) pts = 50;
        else if (dist < board.radius * 0.66) pts = 30;
        else pts = 10;
        score += pts;
        message = `Hit! +${pts}`;
      } else {
        message = "Miss!";
        arrow = null;
      }
    }
    if (arrow && (arrow.y > height || arrow.x > width + 20)) {
      message = "Miss!";
      arrow = null;
    }
  }
}

function drawBoard() {
  ctx.fillStyle = "#bdc3c7";
  ctx.beginPath();
  ctx.arc(board.x, board.y, board.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3498db";
  ctx.beginPath();
  ctx.arc(board.x, board.y, board.radius * 0.66, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(board.x, board.y, board.radius * 0.33, 0, Math.PI * 2);
  ctx.fill();
}

function drawArrow(obj) {
  const ang = Math.atan2(obj.vy, obj.vx);
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.rotate(ang);
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.moveTo(-10, -2);
  ctx.lineTo(10, 0);
  ctx.lineTo(-10, 2);
  ctx.fill();
  ctx.restore();
}

function drawAim() {
  ctx.beginPath();
  ctx.moveTo(ARROW_START_X, startY);
  ctx.lineTo(
    ARROW_START_X + Math.cos(angle) * 40,
    startY + Math.sin(angle) * 40,
  );
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function draw() {
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
    "--game-bg",
  );
  ctx.fillRect(0, 0, width, height);
  drawBoard();
  if (arrow) {
    drawArrow(arrow);
  } else {
    drawAim();
  }
  document.getElementById("score").textContent =
    `Score: ${score} | Shot ${shots}/${MAX_SHOTS}`;
  document.getElementById("message").textContent = message;
}

function loop() {
  update();
  draw();
  if (shots < MAX_SHOTS || arrow) {
    requestAnimationFrame(loop);
  } else {
    message = `Game Over! Final score: ${score}`;
    draw();
  }
}

function keydown(e) {
  if (e.code === "ArrowLeft") {
    angle -= 0.05;
  } else if (e.code === "ArrowRight") {
    angle += 0.05;
  } else if (e.code === "Space" && !charging && !arrow && shots < MAX_SHOTS) {
    charging = true;
    power = 0;
  }
}

function keyup(e) {
  if (e.code === "Space" && charging) {
    charging = false;
    shoot();
  }
}

document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);
window.addEventListener("resize", resize);

resize();
loop();
