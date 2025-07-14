const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const hole = {
  x: 0,
  y: 0,
  radius: 8,
  greenRadius: 40,
  par: 4,
  distance: 0
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

// DOM elements
const counterEl = document.getElementById('counter');
const holeInfoEl = document.getElementById('holeInfo');
const scoresEl = document.getElementById('scores');
const powerBar = document.getElementById('powerBar');
const powerLevel = document.getElementById('powerLevel');

// Game state
const TOTAL_HOLES = 18;
let currentHole = 1;
let hits = 0;
let scores = [];
let pars = [];
let holeCompleted = false;
let viewOffset = 0;    // camera offset to keep ball in view

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function obstacleRange(ob) {
  if (ob.type === 'tree') {
    return { left: ob.x - ob.width / 2, right: ob.x + ob.width / 2 };
  }
  return { left: ob.x, right: ob.x + ob.width };
}

function obstaclesOverlap(a, b) {
  const ra = obstacleRange(a);
  const rb = obstacleRange(b);
  return ra.left < rb.right && ra.right > rb.left;
}

function rangesOverlap(a, b) {
  return a.left < b.right && a.right > b.left;
}

function createObstacle(type, minX, maxX, props, avoid = []) {
  let ob;
  let attempts = 0;
  do {
    const x = randomRange(minX, maxX);
    ob = { type, x, ...props };
    attempts++;
  } while ((obstacles.some(o => obstaclesOverlap(o, ob)) ||
            avoid.some(r => rangesOverlap(obstacleRange(ob), r))) &&
           attempts < 100);
  return ob;
}

function setupCourse() {
  // randomize hole and obstacle positions for each hole
  hole.x = randomRange(canvas.width * 0.7, canvas.width - 80);
  hole.y = canvas.height - 10;
  // distance the ball can travel past the hole before penalty
  hole.maxOvershoot = randomRange(canvas.width * 0.2, canvas.width * 0.4);
  hole.maxDistance = hole.x + hole.maxOvershoot;
  hole.distance = Math.round(hole.x - 50);
  hole.par = Math.floor(randomRange(3, 6));

  const avoidGreen = [{
    left: hole.x - hole.greenRadius,
    right: hole.x + hole.greenRadius
  }];

  obstacles = [];
  obstacles.push(createObstacle('tree', canvas.width * 0.2, canvas.width * 0.4, { width: 20, height: 60 }, avoidGreen));
  obstacles.push(createObstacle('water', canvas.width * 0.4, canvas.width * 0.6, { width: 60, depth: 15 }, avoidGreen));
  obstacles.push(createObstacle('bunker', canvas.width * 0.6, canvas.width * 0.8, { width: 80, depth: 12 }, avoidGreen));
  obstacles.push(createObstacle('hill', canvas.width * 0.5, canvas.width * 0.7, { width: 50, height: 30 }, avoidGreen));

  ball.x = 50;
  ball.y = canvas.height - 20;
  viewOffset = 0;
}

window.addEventListener('resize', () => {
  resizeCanvas();
  setupCourse();
  updateHoleInfo();
});
resizeCanvas();
setupCourse();
updateHoleInfo();
updateScoreboard();

function updateCounter() {
  if (counterEl) {
    counterEl.textContent = `Hits: ${hits}`;
  }
}

function updateHoleInfo() {
  if (holeInfoEl) {
    holeInfoEl.textContent = `Hole ${currentHole}/${TOTAL_HOLES} - Par ${hole.par} - ${hole.distance}yd`;
  }
}

function updateScoreboard() {
  if (scoresEl) {
    scoresEl.innerHTML = scores.map((s, i) => {
      const par = pars[i];
      const diff = s - par;
      const diffStr = diff === 0 ? 'E' : (diff > 0 ? `+${diff}` : diff);
      return `<li>Hole ${i + 1}: ${s} (${diffStr})</li>`;
    }).join('');
  }
}

function nextHole() {
  currentHole++;
  if (currentHole > TOTAL_HOLES) {
    if (holeInfoEl) holeInfoEl.textContent = 'Game Over';
    return;
  }
  hits = 0;
  holeCompleted = false;
  updateCounter();
  setupCourse();
  updateHoleInfo();
}

let angle = Math.PI / 4; // aiming angle in radians

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
let bunkerPenaltyApplied = false;

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

  if (!ball.moving && ballInBunker()) {
    if (!bunkerPenaltyApplied) {
      power = Math.max(5, power * 0.7);
      bunkerPenaltyApplied = true;
    }
  } else if (!ballInBunker()) {
    bunkerPenaltyApplied = false;
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
          // water penalty: add stroke and drop ball behind water
          hits++;
          updateCounter();
          ball.x = o.x - ball.radius - 5;
          if (ball.x < ball.radius) ball.x = ball.radius;
          ball.y = ground - ball.radius;
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

    // penalty when ball goes too far past the hole
    if (ball.x > hole.maxDistance) {
      hits++;
      updateCounter();
      // Place ball next to the out of bounds marker but still in bounds
      ball.x = hole.maxDistance - 30;
      ball.y = canvas.height - 20;
      ball.vx = 0;
      ball.vy = 0;
      ball.moving = false;
      viewOffset = 0;
    }
  }

  if (!ball.moving && !holeCompleted && Math.hypot(ball.x - hole.x, ball.y - hole.y) < hole.radius) {
    holeCompleted = true;
    scores.push(hits);
    pars.push(hole.par);
    updateScoreboard();
    setTimeout(nextHole, 1000);
  }

  // adjust camera view to follow the ball once it passes the hole
  if (ball.x > hole.x) {
    if (ball.x - viewOffset > canvas.width - 100) {
      viewOffset = ball.x - (canvas.width - 100);
    }
  } else {
    if (ball.x - viewOffset < 100) {
      viewOffset = Math.max(0, ball.x - 100);
    }
  }
}

function drawGround() {
  ctx.fillStyle = '#654321';
  const width = Math.max(canvas.width, hole.maxDistance + 100);
  ctx.fillRect(0, canvas.height - 10, width, 10);
}

function drawHole() {
  // green area - draw flattened ellipse and clip so nothing shows above ground
  const vertRadius = hole.greenRadius * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, hole.y, canvas.width, canvas.height - hole.y);
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(hole.x, hole.y, hole.greenRadius, vertRadius, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3cb371';
  ctx.fill();
  ctx.restore();

  // actual hole
  ctx.beginPath();
  ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();

  if (!ball.moving && Math.hypot(ball.x - hole.x, ball.y - hole.y) < hole.radius) {
    ctx.fillStyle = 'green';
    ctx.font = '24px Arial';
    const msg = currentHole > TOTAL_HOLES ? 'Game Over' : 'Hole Complete!';
    ctx.fillText(msg, canvas.width / 2 - 60, canvas.height / 2);
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
  // constant length so aim does not scale with power meter
  const len = 80;
  const endX = ball.x + Math.cos(angle) * len;
  const endY = ball.y - Math.sin(angle) * len;

  ctx.strokeStyle = 'red';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // draw arrow head to show direction
  const headLength = 10;
  const offset = Math.PI / 7;
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - offset),
    endY + headLength * Math.sin(angle - offset)
  );
  ctx.lineTo(
    endX - headLength * Math.cos(angle + offset),
    endY + headLength * Math.sin(angle + offset)
  );
  ctx.closePath();
  ctx.fill();
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  ctx.save();
  ctx.translate(-viewOffset, 0);
  drawGround();
  drawObstacles();
  drawHole();
  drawBall();
  drawAim();
  ctx.restore();
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
updateHoleInfo();
loop();
