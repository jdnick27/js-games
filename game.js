const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const hole = {
  x: 0,
  y: 0,
  radius: 8,
  greenRadius: 40
};

let obstacles = [];

const ball = {
  x: 50,
  y: 0, // will be set in setupCourse
  radius: 10,
  vx: 0,
  vy: 0,
  moving: false
};

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function setupCourse() {
  hole.x = canvas.width - 80;
  hole.y = canvas.height - 10;
  obstacles = [
    { type: 'tree', x: canvas.width * 0.3, width: 20, height: 60 },
    { type: 'water', x: canvas.width * 0.45, width: 60, depth: 15 },
    { type: 'bunker', x: canvas.width * 0.65, width: 80, depth: 12 },
    { type: 'hill', x: canvas.width * 0.55, width: 50, height: 30 }
  ];
  ball.x = 50;
  ball.y = canvas.height - 20;
}

window.addEventListener('resize', () => {
  resizeCanvas();
  setupCourse();
});
resizeCanvas();
setupCourse();

let hits = 0;
const counterEl = document.getElementById('counter');

function updateCounter() {
  if (counterEl) {
    counterEl.textContent = `Hits: ${hits}`;
  }
}

let angle = Math.PI / 4; // aiming angle in radians
const powerBar = document.getElementById('powerBar');
const powerLevel = document.getElementById('powerLevel');

let power = 10;                // selected launch power
const MAX_POWER = 50;          // maximum launch strength shown by meter
const POWER_SCALE = 0.5;       // scale factor for actual launch strength
let meterActive = false;
let meterPercent = 0;
let meterDirection = 1;
const METER_SPEED = 2;         // percent per frame
const GRAVITY = 0.4;
// Friction values for different surfaces
const FRICTION_NORMAL = 0.99;
const FRICTION_GREEN = 0.995;
const FRICTION_BUNKER = 0.92;

function ballInBunker() {
  return obstacles.some(o =>
    o.type === 'bunker' &&
    ball.x > o.x &&
    ball.x < o.x + o.width &&
    ball.y + ball.radius > canvas.height - 10 - o.depth);
}

function getFriction() {
  if (ballInBunker()) return FRICTION_BUNKER;
  const dist = Math.hypot(ball.x - hole.x, ball.y - hole.y);
  if (dist < hole.greenRadius) return FRICTION_GREEN;
  return FRICTION_NORMAL;
}


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
    const friction = getFriction();
    ball.vx *= friction;
    ball.vy *= friction;

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

    // obstacle collisions and effects
    const ground = canvas.height - 10;
    obstacles.forEach(o => {
      if (o.type === 'tree') {
        const left = o.x - o.width / 2;
        const right = o.x + o.width / 2;
        const top = ground - o.height;
        if (ball.y + ball.radius > top && ball.y - ball.radius < ground &&
            ball.x + ball.radius > left && ball.x - ball.radius < right) {
          if (ball.x < o.x) {
            ball.x = left - ball.radius;
          } else {
            ball.x = right + ball.radius;
          }
          ball.vx *= -0.5;
        }
      } else if (o.type === 'water') {
        if (ball.x > o.x && ball.x < o.x + o.width &&
            ball.y + ball.radius > ground - o.depth) {
          // reset ball on water hazard
          ball.x = 50;
          ball.y = canvas.height - 20;
          ball.vx = 0;
          ball.vy = 0;
          ball.moving = false;
        }
      } else if (o.type === 'hill') {
        if (ball.x > o.x && ball.x < o.x + o.width) {
          const t = (ball.x - o.x) / o.width;
          const heightAtX = ground - o.height * (1 - Math.abs(2 * t - 1));
          if (ball.y + ball.radius > heightAtX) {
            ball.y = heightAtX - ball.radius;
            if (ball.vy > 0) ball.vy *= -0.5;
          }
        }
      }
    });
  }
}

function drawGround() {
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
}

function drawHole() {
  // green area
  ctx.fillStyle = '#3cb371';
  ctx.beginPath();
  ctx.arc(hole.x, hole.y, hole.greenRadius, 0, Math.PI * 2);
  ctx.fill();

  // actual hole
  ctx.beginPath();
  ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();

  if (!ball.moving && Math.hypot(ball.x - hole.x, ball.y - hole.y) < hole.radius) {
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

function drawObstacles() {
  const ground = canvas.height - 10;
  obstacles.forEach(o => {
    if (o.type === 'tree') {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(o.x - o.width / 2, ground - o.height, o.width, o.height);
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(o.x, ground - o.height, o.width, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === 'water') {
      ctx.fillStyle = '#00bfff';
      ctx.fillRect(o.x, ground - o.depth, o.width, o.depth);
    } else if (o.type === 'bunker') {
      ctx.fillStyle = '#e0c068';
      ctx.fillRect(o.x, ground - o.depth, o.width, o.depth);
    } else if (o.type === 'hill') {
      ctx.fillStyle = '#8FBC8F';
      ctx.beginPath();
      ctx.moveTo(o.x, ground);
      ctx.lineTo(o.x + o.width / 2, ground - o.height);
      ctx.lineTo(o.x + o.width, ground);
      ctx.fill();
    }
  });
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
  drawObstacles();
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
    power = 15;
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
