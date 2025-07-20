const canvas = document.getElementById("stickfight");
const ctx = canvas.getContext("2d");

let width;
let height;
let groundY;

const GRAVITY = 0.5;
const MOVE_SPEED = 4;
const JUMP_SPEED = -10;
const ATTACK_FRAMES = 10;
const MAX_HEALTH = 5;

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
    health: MAX_HEALTH,
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
  messageEl.textContent = "";
}

function drawFighter(f) {
  const headR = 10;
  const legLen = 20;
  const bodyLen = 30;
  const headY = f.y - legLen - bodyLen - headR;
  const barWidth = 40;
  const barHeight = 5;
  const barX = f.x - barWidth / 2;
  const barY = headY - 15;
  ctx.fillStyle = "#555";
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = "#2ecc71";
  const ratio = Math.max(f.health, 0) / MAX_HEALTH;
  ctx.fillRect(barX, barY, barWidth * ratio, barHeight);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(barX, barY, barWidth, barHeight);
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
const messageEl = document.getElementById("message");

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
  }
  if (
    enemy.attacking > 0 &&
    dist < 40 &&
    !player.blocking &&
    player.hitCooldown === 0
  ) {
    player.health -= 0.8 + Math.random() * 0.4;
    player.hitCooldown = 20;
  }
}

function aiAct() {
  if (enemy.health <= 0 || player.health <= 0) return;
  const dist = player.x - enemy.x;
  enemy.blocking = false;
  if (Math.abs(dist) > 60) {
    enemy.vx = dist > 0 ? MOVE_SPEED / 2 : -MOVE_SPEED / 2;
    if (Math.random() < 0.1 && enemy.y === groundY) {
      enemy.vy = JUMP_SPEED;
    }
  } else {
    const r = Math.random();
    if (r < 0.5 && enemy.attacking === 0) {
      enemy.attacking = ATTACK_FRAMES;
    } else if (r < 0.8) {
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
setInterval(aiAct, 500);
loop();
