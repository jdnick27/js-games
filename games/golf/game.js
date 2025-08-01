const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hole = {
  x: 0,
  y: 0,
  radius: 12,
  greenRadius: 80,
  cupDepth: 15,
  par: 4,
  distance: 0,
};

let obstacles = [];

const BALL_RADIUS = 10;
const TREE_BASE_WIDTH = 20;
const TREE_BASE_HEIGHT = 60;
const GROUND_THICKNESS = 20; // thickness of the ground from the bottom of the canvas
// Rough conversion factor from pixels to yards for distance labels
const PIXELS_TO_YARDS = 0.3;

const ball = {
  x: 50,
  y: 0, // will be set in setupCourse
  radius: BALL_RADIUS,
  vx: 0,
  vy: 0,
  moving: false,
  falling: false,
};

// DOM elements
const counterEl = document.getElementById("counter");
const holeInfoEl = document.getElementById("holeInfo");
const scoresEl = document.getElementById("scores");
const totalScoreEl = document.getElementById("totalScore");
const powerBar = document.getElementById("powerBar");
const powerLevel = document.getElementById("powerLevel");
const messageEl = document.getElementById("message");

const WATER_PENALTY_MSG = "Water hazard! -1 penalty";
const OOB_PENALTY_MSG = "Out of bounds! -1 penalty";

// Game state
const TOTAL_HOLES = 18;
let currentHole = 1;
let hits = 0;
let scores = [];
let pars = [];
let holeCompleted = false;
let viewOffset = 0; // camera offset to keep ball in view
let prevX = 50;
let prevY = 0;
let hazardPenalty = false;
const SWING_FRAMES = 15; // frames to show club swing animation
let swingFrames = 0;
let golferX = ball.x - 20;
const DANCE_DURATION = 300; // frames for victory dance (5s)
let danceFrames = 0;
let angle = Math.PI / 4; // aiming angle in radians
const FRAME_INTERVAL = 2; // draw/update every other frame for slower look
let frameCounter = 0;

function aimAtHole() {
  angle = Math.atan2(ball.y - hole.y, hole.x - ball.x);
}

let wasMoving = false;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function obstacleRange(ob) {
  if (ob.type === "tree") {
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
    const overlapsExisting = obstacles.some((o) => obstaclesOverlap(o, ob));
    const overlapsAvoid = avoid.some((r) =>
      rangesOverlap(obstacleRange(ob), r),
    );
    if (!overlapsExisting && !overlapsAvoid) {
      break;
    }
  } while (attempts < 100);
  return ob;
}

function setupCourse() {
  // randomize hole and obstacle positions for each hole
  hole.x = randomRange(canvas.width * 0.7, canvas.width - 80);
  hole.y = canvas.height - GROUND_THICKNESS;
  // distance the ball can travel past the hole before penalty
  hole.maxOvershoot = randomRange(canvas.width * 0.2, canvas.width * 0.4);
  hole.maxDistance = hole.x + hole.maxOvershoot;
  const pixelDist = hole.x - 50;
  hole.distance = Math.round(pixelDist * PIXELS_TO_YARDS);
  if (hole.distance >= 75 && hole.distance <= 225) {
    hole.par = 3;
  } else if (hole.distance >= 226 && hole.distance <= 420) {
    hole.par = 4;
  } else {
    hole.par = 5;
  }

  const avoidGreen = [
    {
      left: hole.x - hole.greenRadius,
      right: hole.x + hole.greenRadius,
    },
  ];

  obstacles = [];
  const treeCount = Math.floor(randomRange(1, 4));
  for (let i = 0; i < treeCount; i++) {
    const scale = randomRange(1.5, 3);
    obstacles.push(
      createObstacle(
        "tree",
        canvas.width * 0.2,
        canvas.width * 0.4,
        { width: TREE_BASE_WIDTH * scale, height: TREE_BASE_HEIGHT * scale },
        avoidGreen,
      ),
    );
  }
  // Place the hill before water and sand so they avoid its space
  obstacles.push(
    createObstacle(
      "hill",
      canvas.width * 0.5,
      canvas.width * 0.7,
      { width: 100, height: 40 },
      avoidGreen,
    ),
  );
  // Water hazards sit on top of the ground and extend halfway down
  obstacles.push(
    createObstacle(
      "water",
      canvas.width * 0.4,
      canvas.width * 0.6,
      { width: 60 },
      avoidGreen,
    ),
  );
  obstacles.push(
    createObstacle(
      "bunker",
      canvas.width * 0.6,
      canvas.width * 0.8,
      { width: 80, depth: 12 },
      avoidGreen,
    ),
  );

  ball.x = 50;
  ball.y = canvas.height - GROUND_THICKNESS - BALL_RADIUS;
  golferX = ball.x - 20;
  viewOffset = 0;
  prevX = ball.x;
  prevY = ball.y;
  aimAtHole();
}

window.addEventListener("resize", () => {
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
    scoresEl.innerHTML = scores
      .map((s, i) => {
        const par = pars[i];
        const diff = s - par;
        const diffStr = diff === 0 ? "E" : diff > 0 ? `+${diff}` : diff;
        return `<li>Hole ${i + 1} - Par ${par}: ${s} (${diffStr})</li>`;
      })
      .join("");
  }
  if (totalScoreEl) {
    const totalDiff = scores.reduce((acc, s, i) => acc + (s - pars[i]), 0);
    const diffStr =
      totalDiff === 0 ? "E" : totalDiff > 0 ? `+${totalDiff}` : totalDiff;
    totalScoreEl.textContent = `Total: ${diffStr}`;
  }
}

function showMessage(msg) {
  if (!messageEl) return;
  messageEl.textContent = msg;
  clearTimeout(showMessage.timeoutId);
  showMessage.timeoutId = setTimeout(() => {
    messageEl.textContent = "";
  }, 2000);
}

function nextHole() {
  currentHole++;
  if (currentHole > TOTAL_HOLES) {
    if (holeInfoEl) holeInfoEl.textContent = "Game Over";
    return;
  }
  hits = 0;
  holeCompleted = false;
  danceFrames = 0;
  updateCounter();
  updateHoleInfo();
  setupCourse();
  ball.radius = BALL_RADIUS;
  ball.falling = false;
  hazardPenalty = false;
}

function restartHole() {
  hits = 0;
  holeCompleted = false;
  danceFrames = 0;
  updateCounter();
  // keep the current hole layout and just reset the ball
  updateHoleInfo();
  ball.radius = BALL_RADIUS;
  ball.x = 50;
  ball.y = canvas.height - GROUND_THICKNESS - BALL_RADIUS;
  golferX = ball.x - 20;
  ball.vx = 0;
  ball.vy = 0;
  ball.moving = false;
  ball.falling = false;
  power = 15;
  meterActive = false;
  powerBar.style.display = "none";
  powerLevel.style.width = "0%";
  hazardPenalty = false;
  viewOffset = 0;
  prevX = ball.x;
  prevY = ball.y;
  aimAtHole();
}

let power = 10; // selected launch power
const MAX_POWER = 50; // maximum launch strength shown by meter
const POWER_SCALE = 0.5; // scale factor for actual launch strength
let meterActive = false;
let meterPercent = 0;
let meterDirection = 1;
const METER_SPEED = 1.4; // percent per frame (30% slower)
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
  obstacles.forEach((o) => {
    if (o.type === "hill" && x >= o.x && x <= o.x + o.width) {
      const t = (x - o.x) / o.width;
      const height = o.height * Math.sin(Math.PI * t);
      y -= height;
    }
  });
  return y;
}

function groundSlopeAt(x) {
  let slope = 0;
  obstacles.forEach((o) => {
    if (o.type === "hill" && x >= o.x && x <= o.x + o.width) {
      const t = (x - o.x) / o.width;
      slope = ((-o.height * Math.PI) / o.width) * Math.cos(Math.PI * t);
    }
  });
  return slope;
}

function ballInBunker() {
  return obstacles.some(
    (o) =>
      o.type === "bunker" &&
      ball.x > o.x &&
      ball.x < o.x + o.width &&
      ball.y + ball.radius > groundHeightAt(ball.x) - o.depth,
  );
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
  prevX = ball.x;
  prevY = ball.y;
  hazardPenalty = false;
  swingFrames = SWING_FRAMES;
  ball.vx = Math.cos(angle) * scaled;
  ball.vy = -Math.sin(angle) * scaled;
  ball.moving = true;
  hits++;
  updateCounter();
}

function update() {
  if (swingFrames > 0) swingFrames--;
  if (danceFrames > 0) danceFrames--;
  if (ball.falling) {
    ball.vy += GRAVITY;
    ball.y += ball.vy;
    if (ball.radius > 0.5) {
      ball.radius *= 0.95;
    }
    if (ball.y - ball.radius > hole.y + hole.cupDepth) {
      ball.falling = false;
      ball.moving = false;
      golferX = ball.x - 20;
      holeCompleted = true;
      scores.push(hits);
      updateScoreboard();
      danceFrames = DANCE_DURATION;
      meterActive = false;
      powerBar.style.display = "none";
      setTimeout(nextHole, 5000);
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
    powerLevel.style.width = meterPercent + "%";
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
        golferX = ball.x - 20;
      }
    }

    // obstacle collisions and effects
    obstacles.forEach((o) => {
      if (o.type === "tree") {
        const ground = groundHeightAt(o.x);
        const left = o.x - o.width / 2;
        const right = o.x + o.width / 2;
        const top = ground - o.height;
        if (
          ball.y + ball.radius > top &&
          ball.y - ball.radius < ground &&
          ball.x + ball.radius > left &&
          ball.x - ball.radius < right
        ) {
          if (ball.x < o.x) {
            ball.x = left - ball.radius;
          } else {
            ball.x = right + ball.radius;
          }
          ball.vx *= -0.5;
        }
      } else if (o.type === "water") {
        if (ball.x > o.x && ball.x < o.x + o.width) {
          const ground = groundHeightAt(ball.x);
          if (ball.y + ball.radius >= ground) {
            // water penalty: add stroke and drop ball behind water
            hits++;
            updateCounter();
            hazardPenalty = true;
            showMessage(WATER_PENALTY_MSG);
            ball.x = o.x - ball.radius - 5;
            if (ball.x < ball.radius) ball.x = ball.radius;
            ball.y = ground - ball.radius;
            ball.vx = 0;
            ball.vy = 0;
            ball.moving = false;
            golferX = ball.x - 20;
          }
        }
      }
    });

    // penalty when ball goes too far past the hole
    if (ball.x > hole.maxDistance) {
      hits++;
      updateCounter();
      hazardPenalty = true;
      showMessage(OOB_PENALTY_MSG);
      // Place ball next to the out of bounds marker but still in bounds
      ball.x = hole.maxDistance - 30;
      ball.y = canvas.height - GROUND_THICKNESS - BALL_RADIUS;
      ball.vx = 0;
      ball.vy = 0;
      ball.moving = false;
      golferX = ball.x - 20;
      viewOffset = 0;
    }
  }

  const distToHole = Math.hypot(ball.x - hole.x, ball.y - hole.y);
  if (
    !holeCompleted &&
    !ball.falling &&
    distToHole < hole.radius &&
    ball.y + ball.radius >= hole.y
  ) {
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
      // allow negative offsets so the camera can pan left of the tee
      viewOffset = ball.x - 100;
    }
  }

  if (!ball.moving && wasMoving) {
    aimAtHole();
  }
  wasMoving = ball.moving;
}

function drawGround() {
  ctx.fillStyle = "#654321";
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
  ctx.fillStyle = "#3cb371";
  ctx.fill();
  ctx.restore();

  // actual hole
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, hole.y, canvas.width, canvas.height - hole.y);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(hole.x, hole.y, hole.radius + 3, 0, Math.PI * 2);
  ctx.fillStyle = "#ccc";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.restore();

  if (holeCompleted) {
    ctx.fillStyle = "green";
    ctx.font = "24px Arial";
    let msg = currentHole > TOTAL_HOLES ? "Game Over" : "Hole Complete!";
    if (hits === 1 && currentHole <= TOTAL_HOLES) {
      msg = "That's your bad shot!";
    }
    const textWidth = ctx.measureText(msg).width;
    ctx.fillText(msg, canvas.width / 2 - textWidth / 2, canvas.height / 2);
  }
}

function drawBall() {
  if (holeCompleted) return;
  const { x, y, radius: r } = ball;
  const grad = ctx.createRadialGradient(
    x - r * 0.3,
    y - r * 0.3,
    r * 0.2,
    x,
    y,
    r,
  );
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(1, "#cccccc");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  const d = r * 0.15;
  [
    [-0.3, -0.3],
    [0.3, -0.3],
    [-0.3, 0.3],
    [0.3, 0.3],
    [0, 0],
  ].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(x + dx * r, y + dy * r, d, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawObstacles() {
  obstacles.forEach((o) => {
    const groundCenter = groundHeightAt(o.x + (o.width || 0) / 2);
    if (o.type === "tree") {
      // add slight gradient to the trunk
      const trunkWidth = o.width * 0.4;
      const trunkGrad = ctx.createLinearGradient(
        0,
        groundCenter - o.height,
        0,
        groundCenter,
      );
      trunkGrad.addColorStop(0, "#A0522D");
      trunkGrad.addColorStop(1, "#8B4513");
      ctx.fillStyle = trunkGrad;
      ctx.fillRect(
        o.x - trunkWidth / 2,
        groundCenter - o.height,
        trunkWidth,
        o.height,
      );

      // bark lines
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = trunkWidth * 0.1;
      for (let i = -0.3; i <= 0.3; i += 0.3) {
        ctx.beginPath();
        ctx.moveTo(o.x + i * trunkWidth, groundCenter);
        ctx.lineTo(o.x + i * trunkWidth, groundCenter - o.height);
        ctx.stroke();
      }

      // branches
      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = trunkWidth * 0.3;
      ctx.beginPath();
      ctx.moveTo(o.x, groundCenter - o.height * 0.7);
      ctx.lineTo(o.x - trunkWidth, groundCenter - o.height * 0.9);
      ctx.moveTo(o.x, groundCenter - o.height * 0.5);
      ctx.lineTo(o.x + trunkWidth, groundCenter - o.height * 0.7);
      ctx.stroke();

      // draw layered canopy for more detail
      const r = o.width;
      ctx.fillStyle = "#228B22";
      ctx.beginPath();
      ctx.arc(o.x, groundCenter - o.height, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2e8b57";
      ctx.beginPath();
      ctx.arc(
        o.x - r * 0.6,
        groundCenter - o.height + r * 0.3,
        r * 0.8,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        o.x + r * 0.6,
        groundCenter - o.height + r * 0.3,
        r * 0.8,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      ctx.fillStyle = "#3cb371";
      ctx.beginPath();
      ctx.arc(o.x, groundCenter - o.height + r * 0.4, r * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#006400";
      [
        [-0.4, -0.2, 0.5],
        [0.4, -0.2, 0.5],
        [-0.2, 0.5, 0.5],
        [0.2, 0.5, 0.5],
      ].forEach(([dx, dy, scale]) => {
        ctx.beginPath();
        ctx.arc(
          o.x + dx * r,
          groundCenter - o.height + dy * r,
          r * scale,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });
    } else if (o.type === "water") {
      ctx.fillStyle = "#00bfff";
      ctx.beginPath();
      ctx.moveTo(o.x, groundHeightAt(o.x));
      for (let x = o.x; x <= o.x + o.width; x += 2) {
        ctx.lineTo(x, groundHeightAt(x));
      }
      for (let x = o.x + o.width; x >= o.x; x -= 2) {
        ctx.lineTo(x, groundHeightAt(x) + GROUND_THICKNESS / 2);
      }
      ctx.closePath();
      ctx.fill();
    } else if (o.type === "bunker") {
      ctx.fillStyle = "#e0c068";
      ctx.beginPath();
      ctx.moveTo(o.x, groundHeightAt(o.x));
      for (let x = o.x; x <= o.x + o.width; x += 2) {
        ctx.lineTo(x, groundHeightAt(x));
      }
      for (let x = o.x + o.width; x >= o.x; x -= 2) {
        ctx.lineTo(x, groundHeightAt(x) + o.depth);
      }
      ctx.closePath();
      ctx.fill();
    }
  });
}

function drawGolfer() {
  const groundY = groundHeightAt(golferX);
  let x = golferX;
  let y = groundY;
  const dancing = danceFrames > 0;
  if (dancing) {
    const t = (DANCE_DURATION - danceFrames) / 10;
    x += Math.sin(t) * 5;
    y -= Math.abs(Math.sin(t)) * 5;
  }
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  // legs
  ctx.beginPath();
  if (dancing) {
    const legSwing = Math.sin((DANCE_DURATION - danceFrames) / 5) * 5;
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x - 5 - legSwing, y);
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x + 5 + legSwing, y);
  } else {
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x - 5, y);
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x + 5, y);
  }
  ctx.stroke();

  // body
  ctx.beginPath();
  ctx.moveTo(x, y - 40);
  ctx.lineTo(x, y - 20);
  ctx.stroke();

  // arms
  ctx.beginPath();
  if (dancing) {
    const armSwing = Math.sin((DANCE_DURATION - danceFrames) / 4) * 8;
    ctx.moveTo(x, y - 32);
    ctx.lineTo(x - 8 - armSwing, y - 24);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y - 32);
    ctx.lineTo(x + 8 + armSwing, y - 24);
    ctx.stroke();
  } else {
    ctx.moveTo(x, y - 32);
    ctx.lineTo(x - 8, y - 24);
    ctx.stroke();

    const handX = x + 8;
    const handY = y - 24;
    ctx.beginPath();
    ctx.moveTo(x, y - 32);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    const progress = swingFrames > 0 ? 1 - swingFrames / SWING_FRAMES : 0;
    const baseAngle = -Math.PI / 3;
    const clubAngle = baseAngle + progress * 1.5;
    const clubLen = 25;
    const clubX = handX + Math.cos(clubAngle) * clubLen;
    const clubY = handY + Math.sin(clubAngle) * clubLen;

    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(clubX, clubY);
    ctx.stroke();

    if (swingFrames > 0) {
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.arc(handX, handY, clubLen * 1.2, baseAngle, clubAngle);
      ctx.stroke();
      ctx.strokeStyle = "black";
    }
  }

  // head
  ctx.beginPath();
  ctx.arc(x, y - 48, 6, 0, Math.PI * 2);
  ctx.stroke();
}

function drawAim() {
  if (ball.moving || danceFrames > 0 || holeCompleted) return;
  // constant length so aim does not scale with power meter
  const len = 80;
  const endX = ball.x + Math.cos(angle) * len;
  const endY = ball.y - Math.sin(angle) * len;

  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // draw arrow head to show direction
  const headLength = 10;
  const offset = Math.PI / 7;
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - offset),
    endY + headLength * Math.sin(angle - offset),
  );
  ctx.lineTo(
    endX - headLength * Math.cos(angle + offset),
    endY + headLength * Math.sin(angle + offset),
  );
  ctx.closePath();
  ctx.fill();
}

function loop() {
  requestAnimationFrame(loop);
  frameCounter++;
  if (frameCounter % FRAME_INTERVAL !== 0) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  ctx.save();
  ctx.translate(-viewOffset, 0);
  drawGround();
  drawObstacles();
  drawHole();
  drawGolfer();
  drawBall();
  drawAim();
  ctx.restore();
}

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft" && !ball.moving && danceFrames === 0)
    angle += 0.05; // inverted controls
  if (e.code === "ArrowRight" && !ball.moving && danceFrames === 0)
    angle -= 0.05; // inverted controls
  if (e.code === "KeyR") {
    ball.x = prevX;
    ball.y = prevY;
    ball.vx = 0;
    ball.vy = 0;
    ball.moving = false;
    golferX = ball.x - 20;
    ball.radius = BALL_RADIUS;
    ball.falling = false;
    power = 15;
    meterActive = false;
    powerBar.style.display = "none";
    powerLevel.style.width = "0%";
    if (!hazardPenalty && hits > 1) {
      hits++;
      updateCounter();
    } else {
      hazardPenalty = false;
    }
    prevX = ball.x;
    prevY = ball.y;
    aimAtHole();
    danceFrames = 0;
  }
  if (e.code === "KeyN") {
    restartHole();
  }
  if (e.code === "Space" && !ball.moving && danceFrames === 0) {
    if (!meterActive) {
      meterActive = true;
      meterPercent = 0;
      meterDirection = 1;
      powerBar.style.display = "block";
    } else {
      meterActive = false;
      powerBar.style.display = "none";
      power = (meterPercent / 100) * MAX_POWER;
      powerLevel.style.width = "0%";
      launch();
    }
  }
});

if (
  typeof window !== "undefined" &&
  (typeof module === "undefined" || !module.exports)
) {
  loop();
}

if (typeof module !== "undefined" && module.exports) {
  /* global module */
  module.exports = {
    randomRange,
    obstacleRange,
    obstaclesOverlap,
    rangesOverlap,
    groundHeightAt,
    groundSlopeAt,
    ballInBunker,
    getFriction,
    GROUND_THICKNESS,
    obstacles,
    ball,
    hole,
  };
}
