const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

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
const powerBar = document.getElementById('powerBar');
const powerLevel = document.getElementById('powerLevel');

let power = 25;                // selected launch power
const MAX_POWER = 50;          // maximum launch strength shown by meter
const POWER_SCALE = 0.5;       // scale factor for actual launch strength
let meterActive = false;
let meterPercent = 0;
let meterDirection = 1;
const METER_SPEED = 3;         // percent per frame
const GRAVITY = 0.4;
const FRICTION = 0.99;


function launch() {
  if (ball.moving) return;
  const scaled = power * POWER_SCALE;
  ball.vx = Math.cos(angle) * scaled;
  ball.vy = -Math.sin(angle) * scaled;
  ball.moving = true;
  hits++;
  updateCounter();
}

function update() {
  if (meterActive) {
    meterPercent += METER_SPEED * meterDirection;
    if (meterPercent >= 100) {
      meterPercent = 100;
      meterDirection = -1;
    } else if (meterPercent <= 0) {
      meterPercent = 0;
      meterDirection = 1;
    }
    powerLevel.style.width = meterPercent + '%';
  }

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
  const displayPower = meterActive ? (meterPercent / 100 * MAX_POWER) : power;
  const len = displayPower * 4; // larger visual meter
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
  if (e.code === 'KeyR') {
    ball.x = 50;
    ball.y = canvas.height - 20;
    ball.vx = 0;
    ball.vy = 0;
    ball.moving = false;
    power = 25;
    meterActive = false;
    powerBar.style.display = 'none';
    powerLevel.style.width = '0%';
  }
  if (e.code === 'Space' && !ball.moving) {
    if (!meterActive) {
      meterActive = true;
      meterPercent = 0;
      meterDirection = 1;
      powerBar.style.display = 'block';
    } else {
      meterActive = false;
      powerBar.style.display = 'none';
      power = meterPercent / 100 * MAX_POWER;
      powerLevel.style.width = '0%';
      launch();
    }
  }
});

updateCounter();
loop();
