const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const hole = {
  x: 0,
  y: 0,
  radius: 12,
  greenRadius: 80,
  cupDepth: 15,
  par: 4,
  distance: 0
};

let obstacles = [];

const BALL_RADIUS = 10;
const TREE_BASE_WIDTH = 20;
const TREE_BASE_HEIGHT = 60;
const ROCK_RADIUS = 20;
const BUSH_RADIUS = 15;
const GROUND_THICKNESS = 20; // thickness of the ground from the bottom of the canvas

const ball = {
  x: 50,
  y: 0, // will be set in setupCourse
  radius: BALL_RADIUS,
  vx: 0,
  vy: 0,
  moving: false,
  falling: false
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
  } else if (ob.type === 'rock' || ob.type === 'bush') {
    return { left: ob.x - ob.radius, right: ob.x + ob.radius };
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
  for (let i = 0; i < 100; i++) {
    const x = randomRange(minX, maxX);
    const ob = { type, x, ...props };
    if (!obstacles.some(o => obstaclesOverlap(o, ob)) &&
        !avoid.some(r => rangesOverlap(obstacleRange(ob), r))) {
      return ob;
    }
  }
  return null; // failed to find valid placement
}

function setupCourse() {
  // randomize hole and obstacle positions for each hole
  hole.x = randomRange(canvas.width * 0.7, canvas.width - 80);
  hole.y = canvas.height - GROUND_THICKNESS;
  // distance the ball can travel past the hole before penalty
  hole.maxOvershoot = randomRange(canvas.width * 0.2, canvas.width * 0.4);
  hole.maxDistance = hole.x + hole.maxOvershoot;
  hole.distance = Math.round(hole.x - 50);
  if (hole.distance >= 75 && hole.distance <= 225) {
    hole.par = 3;
  } else if (hole.distance >= 226 && hole.distance <= 420) {
    hole.par = 4;
  } else {
    hole.par = 5;
  }

  const avoidGreen = [{
    left: hole.x - hole.greenRadius,
    right: hole.x + hole.greenRadius
  }];

  obstacles = [];
  const treeCount = Math.floor(randomRange(1, 4));
  for (let i = 0; i < treeCount; i++) {
    const scale = randomRange(1.5, 3);
    const ob = createObstacle(
      'tree',
      canvas.width * 0.2,
      canvas.width * 0.4,
      { width: TREE_BASE_WIDTH * scale, height: TREE_BASE_HEIGHT * scale },
      avoidGreen
    );
    if (ob) obstacles.push(ob);
  }

  const bushCount = Math.floor(randomRange(1, 4));
  for (let i = 0; i < bushCount; i++) {
    const ob = createObstacle(
      'bush',
      canvas.width * 0.25,
      canvas.width * 0.6,
      { radius: randomRange(BUSH_RADIUS * 0.8, BUSH_RADIUS * 1.2) },
      avoidGreen
    );
    if (ob) obstacles.push(ob);
  }

  const rockCount = Math.floor(randomRange(0, 3));
  for (let i = 0; i < rockCount; i++) {
    const ob = createObstacle(
      'rock',
      canvas.width * 0.3,
      canvas.width * 0.7,
      { radius: randomRange(ROCK_RADIUS * 0.8, ROCK_RADIUS * 1.2) },
      avoidGreen
    );
    if (ob) obstacles.push(ob);
  }

  // Place the hill before water and sand so they avoid its space
  const hill = createObstacle(
    'hill',
    canvas.width * 0.4,
    canvas.width * 0.75,
    { width: randomRange(80, 120), height: randomRange(30, 50) },
    avoidGreen
  );
  if (hill) obstacles.push(hill);

  if (Math.random() < 0.7) {
    const ob = createObstacle(
      'water',
      canvas.width * 0.35,
      canvas.width * 0.7,
      { width: randomRange(50, 80) },
      avoidGreen
    );
    if (ob) obstacles.push(ob);
  }

  if (Math.random() < 0.7) {
    const ob = createObstacle(
      'bunker',
      canvas.width * 0.55,
      canvas.width * 0.85,
      { width: randomRange(60, 100), depth: 12 },
      avoidGreen
    );
    if (ob) obstacles.push(ob);
  }

  ball.x = 50;
  ball.y = canvas.height - GROUND_THICKNESS - BALL_RADIUS;
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
  updateHoleInfo();
  setupCourse();
  ball.radius = BALL_RADIUS;
  ball.falling = false;
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

// how strongly gravity pulls the ball along slopes
const SLOPE_ACCEL = 0.2;

function groundHeightAt(x) {
  let y = canvas.height - GROUND_THICKNESS;
  obstacles.forEach(o => {
    if (o.type === 'hill' && x >= o.x && x <= o.x + o.width) {
      const t = (x - o.x) / o.width;
      const height = o.height * Math.sin(Math.PI * t);
      y -= height;
    }
  });
  return y;
}

function groundSlopeAt(x) {
  let slope = 0;
  obstacles.forEach(o => {
    if (o.type === 'hill' && x >= o.x && x <= o.x + o.width) {
      const t = (x - o.x) / o.width;
      slope = -o.height * Math.PI / o.width * Math.cos(Math.PI * t);
    }
  });
  return slope;
}

function ballInBunker() {
  return obstacles.some(o =>
    o.type === 'bunker' &&
    ball.x > o.x &&
    ball.x < o.x + o.width &&
    ball.y + ball.radius > groundHeightAt(ball.x) - o.depth);
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
  if (ball.falling) {
    ball.vy += GRAVITY;
    ball.y += ball.vy;
    if (ball.radius > 0.5) {
      ball.radius *= 0.95;
    }
    if (ball.y - ball.radius > hole.y + hole.cupDepth) {
      ball.falling = false;
      ball.moving = false;
      holeCompleted = true;
      scores.push(hits);
      updateScoreboard();
      setTimeout(nextHole, 1000);
    }
    return;
  }
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

    const groundY = groundHeightAt(ball.x);
    let onGround = false;
    if (ball.y + ball.radius > groundY) {
      ball.y = groundY - ball.radius;
      onGround = true;
      if (ball.vy > 0) ball.vy *= -0.5;
    }

    const friction = getFriction();
    ball.vx *= friction;
    ball.vy *= friction;

    if (onGround) {
      const slope = groundSlopeAt(ball.x);
      ball.vx += slope * SLOPE_ACCEL;
      if (Math.abs(ball.vy) < 0.5 && Math.abs(ball.vx) < 0.5) {
        ball.vx = 0;
        ball.vy = 0;
        ball.moving = false;
      }
    }

    // obstacle collisions and effects
    obstacles.forEach(o => {
      if (o.type === 'tree') {
        const ground = groundHeightAt(o.x);
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
          if (ball.x > o.x && ball.x < o.x + o.width) {
            const ground = groundHeightAt(ball.x);
            if (ball.y + ball.radius >= ground) {
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
          }
        } else if (o.type === 'rock') {
          const cx = o.x;
          const cy = groundHeightAt(o.x) - o.radius;
          const dx = ball.x - cx;
          const dy = ball.y - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < ball.radius + o.radius) {
            const overlap = ball.radius + o.radius - dist;
            const ang = Math.atan2(dy, dx);
            ball.x += Math.cos(ang) * overlap;
            ball.y += Math.sin(ang) * overlap;
            const speed = Math.hypot(ball.vx, ball.vy);
            const dir = Math.atan2(ball.vy, ball.vx);
            const newDir = 2 * ang - dir;
            ball.vx = Math.cos(newDir) * speed * 0.5;
            ball.vy = Math.sin(newDir) * speed * 0.5;
          }
        } else if (o.type === 'bush') {
          const cx = o.x;
          const cy = groundHeightAt(o.x) - o.radius;
          const dx = ball.x - cx;
          const dy = ball.y - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < ball.radius + o.radius) {
            const overlap = ball.radius + o.radius - dist;
            const ang = Math.atan2(dy, dx);
            ball.x += Math.cos(ang) * overlap;
            ball.y += Math.sin(ang) * overlap;
            ball.vx *= 0.3;
            ball.vy *= 0.3;
          }
        }
    });

    // penalty when ball goes too far past the hole
    if (ball.x > hole.maxDistance) {
      hits++;
      updateCounter();
      // Place ball next to the out of bounds marker but still in bounds
      ball.x = hole.maxDistance - 30;
      ball.y = canvas.height - GROUND_THICKNESS - BALL_RADIUS;
      ball.vx = 0;
      ball.vy = 0;
      ball.moving = false;
      viewOffset = 0;
    }
  }

  const distToHole = Math.hypot(ball.x - hole.x, ball.y - hole.y);
  if (!holeCompleted && !ball.falling && distToHole < hole.radius && ball.y + ball.radius >= hole.y) {
    ball.falling = true;
    ball.moving = true;
    pars.push(hole.par);
    ball.vx = 0;
    ball.vy = 0;
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
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  for (let x = 0; x <= width; x += 4) {
    ctx.lineTo(x, groundHeightAt(x));
  }
  ctx.lineTo(width, canvas.height);
  ctx.closePath();
  ctx.fill();
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
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, hole.y, canvas.width, canvas.height - hole.y);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(hole.x, hole.y, hole.radius + 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ccc';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();
  ctx.restore();

  if (holeCompleted) {
    ctx.fillStyle = 'green';
    ctx.font = '24px Arial';
    const msg = currentHole > TOTAL_HOLES ? 'Game Over' : 'Hole Complete!';
    ctx.fillText(msg, canvas.width / 2 - 60, canvas.height / 2);
  }
}

function drawBall() {
  if (holeCompleted) return;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#3498db';
  ctx.fill();
}

function drawObstacles() {
  obstacles.forEach(o => {
    const groundCenter = groundHeightAt(o.x + (o.width || 0) / 2);
    if (o.type === 'tree') {
      ctx.fillStyle = '#8B4513';
      const trunkWidth = o.width * 0.4;
      ctx.fillRect(o.x - trunkWidth / 2, groundCenter - o.height, trunkWidth, o.height);
      ctx.fillStyle = '#228B22';
      const r = o.width;
      ctx.beginPath();
      ctx.arc(o.x, groundCenter - o.height, r, 0, Math.PI * 2);
      ctx.arc(o.x - r * 0.6, groundCenter - o.height + r * 0.3, r * 0.8, 0, Math.PI * 2);
      ctx.arc(o.x + r * 0.6, groundCenter - o.height + r * 0.3, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === 'water') {
      ctx.fillStyle = '#00bfff';
      ctx.beginPath();
      ctx.moveTo(o.x, groundHeightAt(o.x));
      for (let x = o.x; x <= o.x + o.width; x += 2) {
        ctx.lineTo(x, groundHeightAt(x));
      }
      for (let x = o.x + o.width; x >= o.x; x -= 2) {
        ctx.lineTo(x, groundHeightAt(x) - 2);
      }
      ctx.closePath();
      ctx.fill();
    } else if (o.type === 'bunker') {
      ctx.fillStyle = '#e0c068';
      ctx.beginPath();
      ctx.moveTo(o.x, groundHeightAt(o.x));
      for (let x = o.x; x <= o.x + o.width; x += 2) {
        ctx.lineTo(x, groundHeightAt(x));
      }
      for (let x = o.x + o.width; x >= o.x; x -= 2) {
        ctx.lineTo(x, groundHeightAt(x) - o.depth);
      }
      ctx.closePath();
      ctx.fill();
    } else if (o.type === 'rock') {
      ctx.fillStyle = '#808080';
      ctx.beginPath();
      ctx.arc(o.x, groundCenter - o.radius, o.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === 'bush') {
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(o.x, groundCenter - o.radius * 0.5, o.radius, 0, Math.PI * 2);
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
  if (e.code === 'ArrowLeft' && !ball.moving) angle += 0.05;  // inverted controls
  if (e.code === 'ArrowRight' && !ball.moving) angle -= 0.05; // inverted controls
  if (e.code === 'KeyR') {
    ball.x = 50;
    ball.y = canvas.height - GROUND_THICKNESS - BALL_RADIUS;
    ball.vx = 0;
    ball.vy = 0;
    ball.moving = false;
    ball.radius = BALL_RADIUS;
    ball.falling = false;
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
