const canvas = document.getElementById("baseball");
const ctx = canvas.getContext("2d");

let width;
let height;
let groundY;
const playerX = 120;

const ballRadius = 8;
let ball;
let message = "";
let hits = 0;
let attempts = 0;
let swinging = false;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  groundY = height - 60;
}

function pitch() {
  ball = { x: width - 40, y: groundY - ballRadius, vx: -6, vy: 0, hit: false };
  message = "";
}

function update() {
  if (!ball) {
    return;
  }
  ball.x += ball.vx;
  ball.y += ball.vy;
  if (ball.hit) {
    ball.vy += 0.3;
    if (ball.y > groundY - ballRadius) {
      ball.y = groundY - ballRadius;
      ball.vy = 0;
      ball.vx = 0;
    }
  } else if (ball.x < playerX - ballRadius) {
    message = "Strike!";
    ball = null;
    setTimeout(pitch, 1000);
  }
  if (ball && (ball.x > width + ballRadius || ball.x < -ballRadius)) {
    ball = null;
    setTimeout(pitch, 1000);
  }
}

function drawField() {
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, width, groundY);
  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(0, groundY, width, height - groundY);
}

function drawPlayer() {
  ctx.fillStyle = "#333";
  ctx.fillRect(playerX - 5, groundY - 40, 10, 40);
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.stroke();
}

function draw() {
  drawField();
  drawPlayer();
  if (ball) {
    drawBall();
  }
  document.getElementById("score").textContent = `Hits: ${hits}/${attempts}`;
  document.getElementById("message").textContent = message;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function swing() {
  if (!ball) {
    return;
  }
  attempts++;
  if (!swinging && Math.abs(ball.x - playerX) < 20 && !ball.hit) {
    ball.hit = true;
    ball.vx = 7;
    ball.vy = -8;
    hits++;
    message = "Hit!";
  } else if (!ball.hit) {
    message = "Miss!";
  }
  swinging = true;
  setTimeout(() => {
    swinging = false;
  }, 200);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    swing();
  }
});

window.addEventListener("resize", resize);

resize();
pitch();

if (
  typeof window !== "undefined" &&
  (typeof module === "undefined" || !module.exports)
) {
  loop();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {};
}
