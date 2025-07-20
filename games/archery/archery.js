const canvas = document.getElementById("archery");
const ctx = canvas.getContext("2d");

let width;
let height;
let groundY;

const GRAVITY = 0.25;
const POWER = 20;

let angle = Math.PI / 4; // aiming angle
let arrow;
let board;
let score = 0;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  groundY = height - 40;
  arrow = { x: 60, y: groundY, vx: 0, vy: 0, flying: false };
  board = { x: width - 120, y: height / 2, radius: 100 };
}

function drawBoard() {
  for (let i = 5; i > 0; i--) {
    ctx.beginPath();
    ctx.arc(board.x, board.y, (board.radius / 5) * i, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? "#e74c3c" : "#fff";
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(board.x, board.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#333";
  ctx.fill();
}

function drawArrow() {
  ctx.save();
  ctx.translate(arrow.x, arrow.y);
  const a = arrow.flying ? Math.atan2(arrow.vy, arrow.vx) : -angle;
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(-20, -2);
  ctx.lineTo(0, 0);
  ctx.lineTo(-20, 2);
  ctx.fillStyle = "#333";
  ctx.fill();
  ctx.fillRect(0, -2, 25, 4);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, width, groundY);
  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(0, groundY, width, height - groundY);
  drawBoard();
  drawArrow();
  ctx.fillStyle = "#333";
  ctx.fillText(`Score: ${score}`, 20, 30);
}

function update() {
  if (arrow.flying) {
    arrow.vy += GRAVITY;
    arrow.x += arrow.vx;
    arrow.y += arrow.vy;
    if (hitBoard()) {
      arrow.flying = false;
      const dist = Math.hypot(arrow.x - board.x, arrow.y - board.y);
      const ring = Math.min(5, Math.ceil((dist / board.radius) * 5));
      score += 6 - ring;
      setTimeout(resetArrow, 1000);
    } else if (arrow.x > width || arrow.y > height || arrow.y < 0) {
      setTimeout(resetArrow, 1000);
    }
  }
}

function hitBoard() {
  return (
    arrow.x >= board.x - board.radius &&
    Math.hypot(arrow.x - board.x, arrow.y - board.y) <= board.radius
  );
}

function resetArrow() {
  arrow = { x: 60, y: groundY, vx: 0, vy: 0, flying: false };
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function keydown(e) {
  if (!arrow.flying) {
    if (e.key === "ArrowLeft") angle = Math.min(angle + 0.05, Math.PI / 2);
    if (e.key === "ArrowRight") angle = Math.max(angle - 0.05, 0);
    if (e.key === " ") {
      arrow.vx = POWER * Math.cos(angle);
      arrow.vy = -POWER * Math.sin(angle);
      arrow.flying = true;
    }
  }
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", keydown);
resize();
loop();
