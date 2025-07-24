const canvas = document.getElementById("bowling");
const ctx = canvas.getContext("2d");

let width;
let height;
let laneWidth;

const BALL_RADIUS = 10;
const PIN_RADIUS = 8;
const SPEED = 8;

let ball;
let pins = [];
let rolling = false;

let rolls = []; // pins knocked down per roll
let frame = 1;
let rollInFrame = 1;
let pinsStanding = 10;

const frameInfoEl = document.getElementById("frameInfo");
const scoreInfoEl = document.getElementById("scoreInfo");
const scoresEl = document.getElementById("scores");
const totalScoreEl = document.getElementById("totalScore");

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  laneWidth = Math.min(300, width * 0.4);
  resetBall();
  setupPins();
  updateFrameInfo();
  updateScoreboard();
}

function resetBall() {
  ball = { x: width / 2, y: height - 40, vy: 0 };
}

function setupPins() {
  pins = [];
  const startY = 100;
  const spacing = 26;
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i <= r; i++) {
      const offset = (i * 2 - r) * (spacing / 2);
      pins.push({ x: width / 2 + offset, y: startY + r * spacing, knocked: false });
    }
  }
}

function drawLane() {
  const left = width / 2 - laneWidth / 2;
  ctx.fillStyle = "#d2a679";
  ctx.fillRect(left, 0, laneWidth, height);
  ctx.fillStyle = "#888";
  ctx.fillRect(left, 0, 10, height);
  ctx.fillRect(left + laneWidth - 10, 0, 10, height);
}

function drawPins() {
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#333";
  pins.forEach((p) => {
    if (!p.knocked) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, PIN_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#333";
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  drawLane();
  drawPins();
  drawBall();
}

function update() {
  if (rolling) {
    ball.y += ball.vy;
    checkCollisions();
    if (ball.y < 60 || pins.every((p) => p.knocked)) {
      finishRoll();
    }
  }
}

function checkCollisions() {
  pins.forEach((p) => {
    if (!p.knocked && Math.hypot(ball.x - p.x, ball.y - p.y) < BALL_RADIUS + PIN_RADIUS) {
      p.knocked = true;
    }
  });
}

function finishRoll() {
  rolling = false;
  const standing = pins.filter((p) => !p.knocked).length;
  const knocked = pinsStanding - standing;
  rolls.push(knocked);
  pinsStanding = standing;
  updateScoreboard();

  if (frame === 10) {
    handleTenthFrame(knocked);
    return;
  }

  if (knocked === 10 && rollInFrame === 1) {
    nextFrame();
  } else if (rollInFrame === 2 || pinsStanding === 0) {
    nextFrame();
  } else {
    rollInFrame = 2;
    resetBall();
  }
  updateFrameInfo();
}

function handleTenthFrame(knocked) {
  if (rollInFrame === 1 && knocked === 10) {
    pinsStanding = 10;
    setupPins();
    rollInFrame = 2;
    resetBall();
  } else if (rollInFrame === 1) {
    rollInFrame = 2;
    resetBall();
  } else if (rollInFrame === 2 && pinsStanding === 0) {
    pinsStanding = 10;
    setupPins();
    rollInFrame = 3;
    resetBall();
  } else if (rollInFrame === 3 || (rollInFrame === 2 && pinsStanding > 0)) {
    frame++;
    rollInFrame = 1;
    pinsStanding = 10;
    setupPins();
    resetBall();
  } else if (rollInFrame === 2) {
    rollInFrame = 3;
    resetBall();
  }
  updateFrameInfo();
  if (frame > 10) {
    scoreInfoEl.textContent = `Final Score: ${computeScore()}`;
  }
}

function nextFrame() {
  frame++;
  rollInFrame = 1;
  pinsStanding = 10;
  setupPins();
  resetBall();
}

function updateFrameInfo() {
  if (frame <= 10) {
    frameInfoEl.textContent = `Frame ${frame}, Roll ${rollInFrame}`;
  } else {
    frameInfoEl.textContent = "Game Over";
  }
}

function computeScore() {
  let score = 0;
  let r = 0;
  for (let f = 0; f < 10; f++) {
    const first = rolls[r];
    if (first === undefined) break;
    if (first === 10) {
      score += 10 + (rolls[r + 1] || 0) + (rolls[r + 2] || 0);
      r += 1;
    } else {
      const second = rolls[r + 1] || 0;
      const frameTotal = first + second;
      if (frameTotal === 10) {
        score += 10 + (rolls[r + 2] || 0);
      } else {
        score += frameTotal;
      }
      r += 2;
    }
  }
  return score;
}

function updateScoreboard() {
  const totals = [];
  let score = 0;
  let r = 0;
  for (let f = 0; f < 10 && r < rolls.length; f++) {
    const first = rolls[r];
    if (first === undefined) break;
    if (first === 10) {
      score += 10 + (rolls[r + 1] || 0) + (rolls[r + 2] || 0);
      totals.push(score);
      r += f === 9 ? 1 : 1;
    } else {
      const second = rolls[r + 1] || 0;
      const frameTotal = first + second;
      if (frameTotal === 10) {
        score += 10 + (rolls[r + 2] || 0);
      } else {
        score += frameTotal;
      }
      totals.push(score);
      r += 2;
    }
  }
  scoresEl.innerHTML = totals.map((t, i) => `<li>Frame ${i + 1}: ${t}</li>`).join("");
  totalScoreEl.textContent = `Total: ${computeScore()}`;
  scoreInfoEl.textContent = `Score: ${computeScore()}`;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function moveBall(dx) {
  if (!rolling) {
    const left = width / 2 - laneWidth / 2 + BALL_RADIUS;
    const right = width / 2 + laneWidth / 2 - BALL_RADIUS;
    ball.x = Math.max(left, Math.min(right, ball.x + dx));
  }
}

function startRoll() {
  if (!rolling && frame <= 10) {
    ball.vy = -SPEED;
    rolling = true;
  }
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") moveBall(-10);
  if (e.key === "ArrowRight") moveBall(10);
  if (e.key === " ") startRoll();
});

resize();
loop();
