const canvas = document.getElementById("archerydarts");
const ctx = canvas.getContext("2d");

let width;
let height;

const board = { x: 0, y: 0, radius: 150 };
let aimX = 0;
let aimY = 0;
const arrows = [];
let score = 0;
let shots = 3;
let message = "";

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  board.x = width / 2;
  board.y = height / 2;
  aimX = board.x;
  aimY = board.y;
}

function drawBoard() {
  const colors = ["#fff", "#ffec99", "#9fd356", "#5383ec", "#d14"];
  for (let i = 5; i > 0; i--) {
    ctx.beginPath();
    ctx.fillStyle = colors[i - 1];
    ctx.arc(board.x, board.y, (board.radius * i) / 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAim() {
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(aimX - 10, aimY);
  ctx.lineTo(aimX + 10, aimY);
  ctx.moveTo(aimX, aimY - 10);
  ctx.lineTo(aimX, aimY + 10);
  ctx.stroke();
}

function drawArrows() {
  ctx.fillStyle = "#000";
  arrows.forEach((a) => {
    ctx.beginPath();
    ctx.arc(a.x, a.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawScore() {
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score} Shots: ${shots}`, 10, 30);
  if (message) ctx.fillText(message, 10, 60);
}

function computeScore(x, y) {
  const dx = x - board.x;
  const dy = y - board.y;
  const dist = Math.hypot(dx, dy);
  const r = board.radius;
  if (dist < r * 0.2) return 50;
  if (dist < r * 0.4) return 25;
  if (dist < r * 0.6) return 10;
  if (dist < r * 0.8) return 5;
  if (dist < r) return 1;
  return 0;
}

function shoot() {
  if (shots <= 0) return;
  arrows.push({ x: aimX, y: aimY });
  score += computeScore(aimX, aimY);
  shots -= 1;
  if (shots === 0) message = "Game Over! Press R to restart";
}

function reset() {
  arrows.length = 0;
  score = 0;
  shots = 3;
  message = "";
  aimX = board.x;
  aimY = board.y;
}

function loop() {
  ctx.clearRect(0, 0, width, height);
  drawBoard();
  drawArrows();
  if (shots > 0) drawAim();
  drawScore();
  requestAnimationFrame(loop);
}

function handleKey(e) {
  const step = 5;
  switch (e.code) {
    case "ArrowUp":
      aimY = Math.max(board.y - board.radius, aimY - step);
      break;
    case "ArrowDown":
      aimY = Math.min(board.y + board.radius, aimY + step);
      break;
    case "ArrowLeft":
      aimX = Math.max(board.x - board.radius, aimX - step);
      break;
    case "ArrowRight":
      aimX = Math.min(board.x + board.radius, aimX + step);
      break;
    case "Space":
      shoot();
      break;
    case "KeyR":
      if (shots === 0) reset();
      break;
  }
}

window.addEventListener("keydown", handleKey);
window.addEventListener("resize", resize);
resize();
loop();
