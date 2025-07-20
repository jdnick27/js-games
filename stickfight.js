const canvas = document.getElementById("stickfight");
const ctx = canvas.getContext("2d");

let width;
let height;
let groundY;

const GRAVITY = 0.5;
const MOVE_SPEED = 4;
const JUMP_SPEED = -10;
const ATTACK_FRAMES = 10;
// How often the enemy AI evaluates its next action (ms)
const AI_INTERVAL = 300;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  groundY = height - 60;
}

function createFighter(x, color) {
  return {
    x,
    y: groundY,
    vx: 0,
    vy: 0,
    color,
    health: 5,
    attacking: 0,
    blocking: false,
    hitCooldown: 0,
  };
}

let player;
let enemy;

function reset() {
  resize();
  player = createFighter(100, "#333");
  enemy = createFighter(width - 100, "#a00");
  updateHealth();
  messageEl.textContent = "";
}

function drawFighter(f) {
  const headR = 10;
  const legLen = 20;
  const bodyLen = 30;
  const headY = f.y - legLen - bodyLen - headR;
  ctx.strokeStyle = f.color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(f.x, headY, headR, 0, Math.PI * 2);
  ctx.moveTo(f.x, headY + headR);
  ctx.lineTo(f.x, f.y - legLen);
  ctx.moveTo(f.x, headY + headR + 5);
  ctx.lineTo(f.x - 10, f.y - legLen - 5);
  ctx.moveTo(f.x, headY + headR + 5);
  ctx.lineTo(f.x + 10, f.y - legLen - 5);
  ctx.moveTo(f.x, f.y - legLen);
  ctx.lineTo(f.x - 10, f.y);
  ctx.moveTo(f.x, f.y - legLen);
  ctx.lineTo(f.x + 10, f.y);
  ctx.stroke();

  if (f.blocking) {
    ctx.strokeRect(f.x - 15, f.y - legLen - 15, 30, 30);
  }
  if (f.attacking > 0) {
    const dir = f === player ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(f.x, f.y - legLen - 5);
    ctx.lineTo(f.x + dir * 20, f.y - legLen - 10);
    ctx.stroke();
  }
}

function updateFighter(f) {
  f.x += f.vx;
  f.y += f.vy;
  f.vy += GRAVITY;
  if (f.y > groundY) {
    f.y = groundY;
    f.vy = 0;
  }
  f.vx *= 0.8;
  if (f.attacking > 0) {
    f.attacking--;
  }
  if (f.hitCooldown > 0) {
    f.hitCooldown--;
  }
}

const keys = {};
const healthEl = document.getElementById("health");
const messageEl = document.getElementById("message");

function updateHealth() {
  if (healthEl) {
    healthEl.textContent = `Player: ${player.health.toFixed(1)} \u2013 Enemy: ${enemy.health.toFixed(1)}`;
  }
}

document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyS") {
    player.blocking = true;
  }
  if (e.code === "KeyA" && player.attacking === 0) {
    player.attacking = ATTACK_FRAMES;
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
  if (e.code === "KeyS") {
    player.blocking = false;
  }
});

function handleInput() {
  if (keys["ArrowLeft"]) {
    player.vx = -MOVE_SPEED;
  }
  if (keys["ArrowRight"]) {
    player.vx = MOVE_SPEED;
  }
  if (keys["ArrowUp"] && player.y === groundY) {
    player.vy = JUMP_SPEED;
  }
}

function checkAttacks() {
  const dist = Math.abs(player.x - enemy.x);
  if (
    player.attacking > 0 &&
    dist < 40 &&
    !enemy.blocking &&
    enemy.hitCooldown === 0
  ) {
    enemy.health -= 0.8 + Math.random() * 0.4;
    enemy.hitCooldown = 20;
    updateHealth();
  }
  if (
    enemy.attacking > 0 &&
    dist < 40 &&
    !player.blocking &&
    player.hitCooldown === 0
  ) {
    player.health -= 0.8 + Math.random() * 0.4;
    player.hitCooldown = 20;
    updateHealth();
  }
}

function aiAct() {
  if (enemy.health <= 0 || player.health <= 0) return;

  const dist = player.x - enemy.x;
  enemy.blocking = false;
  const close = Math.abs(dist) < 50;

  // React to player attacks when nearby
  if (player.attacking > 0 && close && Math.random() < 0.8) {
    enemy.blocking = true;
    return;
  }

  if (Math.abs(dist) > 60) {
    enemy.vx = dist > 0 ? MOVE_SPEED : -MOVE_SPEED;
    if (Math.random() < 0.2 && enemy.y === groundY) {
      enemy.vy = JUMP_SPEED;
    }
  } else {
    const r = Math.random();
    if (enemy.attacking === 0 && r < 0.7) {
      enemy.attacking = ATTACK_FRAMES;
    } else if (r < 0.9) {
      enemy.blocking = true;
    } else if (enemy.y === groundY) {
      enemy.vy = JUMP_SPEED;
    }
  }
}

function drawGround() {
  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(0, groundY, width, height - groundY);
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  drawGround();
  drawFighter(player);
  drawFighter(enemy);
}

function loop() {
  handleInput();
  updateFighter(player);
  updateFighter(enemy);
  checkAttacks();
  if (player.health <= 0 || enemy.health <= 0) {
    if (messageEl && !messageEl.textContent) {
      messageEl.textContent = player.health <= 0 ? "You Lose" : "You Win";
    }
  } else {
    draw();
    requestAnimationFrame(loop);
  }
}

window.addEventListener("resize", reset);
reset();
setInterval(aiAct, AI_INTERVAL);
loop();
