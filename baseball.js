const canvas = document.getElementById("baseball");
const ctx = canvas.getContext("2d");

const ball = { x: 0, y: 0, r: 8, vx: -6, vy: 0, hit: false };
let hits = 0;
let misses = 0;
let swung = false;

const counterEl = document.getElementById("hitCounter");
const msgEl = document.getElementById("pitchMsg");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function updateCounter() {
  counterEl.textContent = `Hits: ${hits} - Misses: ${misses}`;
}

function resetBall() {
  ball.x = canvas.width - 30;
  ball.y = canvas.height - 60;
  ball.vx = -(Math.random() * 3 + 5);
  ball.vy = 0;
  ball.hit = false;
  swung = false;
  msgEl.textContent = "";
}

function drawBall() {
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
}

function drawBatZone() {
  ctx.strokeStyle = "#333";
  ctx.strokeRect(120, canvas.height - 120, 20, 60);
}

function drawGround() {
  ctx.fillStyle = "#d2b48c";
  ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGround();
  drawBatZone();

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.hit) {
    ball.vy += 0.2;
    if (ball.y > canvas.height - ball.r - 20) {
      resetBall();
    }
  } else if (ball.x < -ball.r) {
    misses++;
    msgEl.textContent = "Strike!";
    updateCounter();
    resetBall();
  }

  drawBall();
  requestAnimationFrame(update);
}

function swing() {
  if (swung) return;
  swung = true;
  if (
    !ball.hit &&
    ball.x < 140 &&
    ball.x > 100 &&
    ball.y > canvas.height - 120 &&
    ball.y < canvas.height - 60
  ) {
    ball.hit = true;
    ball.vx = Math.random() * 4 + 5;
    ball.vy = -8;
    hits++;
    msgEl.textContent = "Hit!";
  } else {
    misses++;
    msgEl.textContent = "Miss!";
  }
  updateCounter();
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    swing();
  }
});

window.addEventListener("resize", resize);

resize();
updateCounter();
resetBall();
update();
