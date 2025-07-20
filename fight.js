const canvas = document.getElementById("fight");
const ctx = canvas.getContext("2d");

let width;
let height;
let groundY;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  groundY = height - 60;
}

const gravity = 0.5;

function createFighter(x, facing) {
  return {
    x,
    y: groundY,
    vx: 0,
    vy: 0,
    facing,
    width: 10,
    height: 50,
    health: 100,
    attacking: false,
    blocking: false,
  };
}

const player = createFighter(100, 1);
let enemy;

function resetEnemy() {
  enemy = createFighter(width - 100, -1);
}

function drawStick(f, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const headY = f.y - f.height;
  ctx.beginPath();
  ctx.arc(f.x, headY, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(f.x, headY + 10);
  ctx.lineTo(f.x, f.y - 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(f.x, headY + 20);
  ctx.lineTo(f.x + 15 * f.facing, headY + 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(f.x, headY + 20);
  ctx.lineTo(f.x - 15 * f.facing, headY + 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(f.x, f.y - 20);
  ctx.lineTo(f.x + 10, f.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(f.x, f.y - 20);
  ctx.lineTo(f.x - 10, f.y);
  ctx.stroke();
  if (f.blocking) {
    ctx.beginPath();
    ctx.moveTo(f.x + 20 * f.facing, f.y - 30);
    ctx.lineTo(f.x + 20 * f.facing, f.y - 10);
    ctx.stroke();
  }
}

function drawHealth() {
  ctx.fillStyle = "#555";
  ctx.fillRect(20, 20, 200, 10);
  ctx.fillRect(width - 220, 20, 200, 10);
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(20, 20, (player.health / 100) * 200, 10);
  ctx.fillRect(width - 220, 20, (enemy.health / 100) * 200, 10);
}

function attack(attacker, defender) {
  if (attacker.attacking) return;
  attacker.attacking = true;
  setTimeout(() => {
    attacker.attacking = false;
  }, 300);
  if (
    Math.abs(attacker.x - defender.x) < 40 &&
    Math.abs(attacker.y - defender.y) < 40
  ) {
    if (!defender.blocking) {
      const dmg = 18 + Math.random() * 8;
      defender.health -= dmg;
      if (defender.health < 0) defender.health = 0;
    }
  }
}

function updateFighter(f) {
  f.x += f.vx;
  f.y += f.vy;
  if (f.y < groundY) {
    f.vy += gravity;
  } else {
    f.y = groundY;
    f.vy = 0;
  }
}

const keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyF") attack(player, enemy);
  if (e.code === "KeyG") player.blocking = true;
  if (e.code === "ArrowUp" && player.y === groundY) player.vy = -10;
});

document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
  if (e.code === "KeyG") player.blocking = false;
});

let aiTimer = 0;

function aiAct() {
  const distance = player.x - enemy.x;
  enemy.facing = distance > 0 ? 1 : -1;
  if (Math.abs(distance) < 50 && Math.random() < 0.6) {
    attack(enemy, player);
    return;
  }
  const choice = Math.random();
  if (choice < 0.3) {
    enemy.blocking = true;
    setTimeout(() => {
      enemy.blocking = false;
    }, 500);
  } else if (choice < 0.6) {
    enemy.vx = distance > 0 ? 2 : -2;
    setTimeout(() => {
      enemy.vx = 0;
    }, 400);
  } else if (enemy.y === groundY) {
    enemy.vy = -10;
  }
}

function loop(timestamp) {
  ctx.clearRect(0, 0, width, height);
  drawHealth();
  drawStick(player, "#000");
  drawStick(enemy, "#000");
  updateFighter(player);
  updateFighter(enemy);
  if (keys["ArrowLeft"]) {
    player.vx = -2;
    player.facing = -1;
  } else if (keys["ArrowRight"]) {
    player.vx = 2;
    player.facing = 1;
  } else {
    player.vx = 0;
  }
  if (enemy.health > 0 && player.health > 0) {
    if (timestamp > aiTimer) {
      aiAct();
      aiTimer = timestamp + 700 + Math.random() * 600;
    }
  } else {
    const msg = player.health <= 0 ? "You Lose" : "You Win";
    ctx.fillStyle = "#000";
    ctx.font = "30px sans-serif";
    ctx.fillText(msg, width / 2 - 50, height / 2);
  }
  requestAnimationFrame(loop);
}

window.addEventListener("resize", () => {
  resize();
  resetEnemy();
});

resize();
resetEnemy();
requestAnimationFrame(loop);
