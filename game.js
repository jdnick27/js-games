const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let hits = 0;
const counterEl = document.getElementById('counter');

function updateCounter() {
  if (counterEl) {
    counterEl.textContent = `Hits: ${hits}`;
  }
}

const ball = {
  x: 50,
  y: canvas.height - 20,
  radius: 10,
  vx: 0,
  vy: 0,
  moving: false
};

let angle = Math.PI / 4; // aiming angle in radians
let power = 20;          // launch power
const GRAVITY = 0.4;
const FRICTION = 0.99;

let lastSpace = 0;
const DOUBLE_TIME = 300; // ms for double click

function launch() {
  if (ball.moving) return;
  ball.vx = Math.cos(angle) * power;
  ball.vy = -Math.sin(angle) * power;
  ball.moving = true;
  hits++;
  updateCounter();
}

function update() {
  if (ball.moving) {
    ball.vy += GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    if (ball.y + ball.radius > canvas.height - 10) {
      ball.y = canvas.height - 10 - ball.radius;
      ball.vy *= -0.5;
      if (Math.abs(ball.vy) < 1) {
        ball.vy = 0;
        ball.vx *= 0.5;
        if (Math.abs(ball.vx) < 0.5) {
          ball.vx = 0;
          ball.moving = false;
        }
      }
    }
  }
}

function drawGround() {
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
}

function drawHole() {
  const r = 8;
  const hx = canvas.width - 50;
  const hy = canvas.height - 10;
  ctx.beginPath();
  ctx.arc(hx, hy, r, Math.PI, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();

  if (!ball.moving && Math.hypot(ball.x - hx, ball.y - hy + r) < r) {
    ctx.fillStyle = 'green';
    ctx.font = '24px Arial';
    ctx.fillText('You win!', canvas.width / 2 - 50, canvas.height / 2);
  }
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#3498db';
  ctx.fill();
}

function drawAim() {
  if (ball.moving) return;
  const len = power * 2;
  ctx.strokeStyle = 'red';
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y);
  ctx.lineTo(ball.x + Math.cos(angle) * len, ball.y - Math.sin(angle) * len);
  ctx.stroke();
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  drawGround();
  drawHole();
  drawBall();
  drawAim();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' && !ball.moving) angle -= 0.05;
  if (e.code === 'ArrowRight' && !ball.moving) angle += 0.05;
  if (e.code === 'ArrowUp' && !ball.moving) power = Math.min(power + 1, 50);
  if (e.code === 'ArrowDown' && !ball.moving) power = Math.max(power - 1, 5);
  if (e.code === 'Space') {
    const now = performance.now();
    if (now - lastSpace < DOUBLE_TIME) {
      launch();
    }
    lastSpace = now;
  }
});

updateCounter();
loop();
