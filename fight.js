const canvas = document.getElementById("fight");
const ctx = canvas.getContext("2d");

let width;
let height;
let groundY;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  groundY = height - 100;
}

const GRAVITY = 0.6;

function createFighter(x, color, ai) {
  return {
    x,
    y: groundY,
    vx: 0,
    vy: 0,
    facing: 1,
    color,
    health: 100,
    blocking: false,
    attacking: false,
    attackCooldown: 0,
    ai,
  };
}

let player;
let enemy;

function init() {
  resize();
  player = createFighter(150, "#333", false);
  enemy = createFighter(width - 150, "#900", true);
}

const keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

function attack(attacker, defender) {
  if (
    Math.abs(attacker.x - defender.x) < 40 &&
    Math.abs(attacker.y - defender.y) < 80
  ) {
    let dmg = 18 + Math.random() * 8;
    if (defender.blocking) {
      dmg /= 2;
    }
    defender.health = Math.max(defender.health - dmg, 0);
  }
}

function updateFighter(f) {
  f.vy += GRAVITY;
  f.x += f.vx;
  f.y += f.vy;
  if (f.y > groundY) {
    f.y = groundY;
    f.vy = 0;
  }
  f.vx *= 0.8;
  if (f.attackCooldown > 0) {
    f.attackCooldown--;
    if (f.attackCooldown === 0) {
      f.attacking = false;
      f.blocking = false;
    }
  }
}

function aiBehavior() {
  const dx = player.x - enemy.x;
  enemy.facing = dx >= 0 ? 1 : -1;
  if (Math.abs(dx) > 60) {
    enemy.vx = 1.5 * enemy.facing;
  } else if (enemy.attackCooldown === 0) {
    const r = Math.random();
    if (r < 0.4) {
      enemy.attacking = true;
      attack(enemy, player);
      enemy.attackCooldown = 30;
    } else if (r < 0.6 && enemy.y === groundY) {
      enemy.vy = -9;
    } else {
      enemy.blocking = true;
      enemy.attackCooldown = 20;
    }
  }
}

function handleInput() {
  player.blocking = keys["KeyX"] || false;
  if (keys["ArrowLeft"]) {
    player.vx = -2.5;
    player.facing = -1;
  }
  if (keys["ArrowRight"]) {
    player.vx = 2.5;
    player.facing = 1;
  }
  if (keys["ArrowUp"] && player.y === groundY) {
    player.vy = -10;
  }
  if (keys["KeyZ"] && player.attackCooldown === 0) {
    player.attacking = true;
    attack(player, enemy);
    player.attackCooldown = 20;
  }
}

function drawFighter(f) {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(f.facing, 1);
  ctx.strokeStyle = f.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -30, 10, 0, Math.PI * 2);
  ctx.moveTo(0, -20);
  ctx.lineTo(0, 10);
  ctx.moveTo(0, -10);
  ctx.lineTo(15, 0);
  ctx.moveTo(0, -10);
  ctx.lineTo(-15, 0);
  ctx.moveTo(0, 10);
  ctx.lineTo(10, 30);
  ctx.moveTo(0, 10);
  ctx.lineTo(-10, 30);
  ctx.stroke();
  ctx.restore();
}

function drawHealth() {
  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, player.health * 2, 10);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(20, 20, 200, 10);
  ctx.fillStyle = "red";
  ctx.fillRect(width - 220, 20, enemy.health * 2, 10);
  ctx.strokeRect(width - 220, 20, 200, 10);
}

let gameOver = false;

function update() {
  if (gameOver) {
    return;
  }
  handleInput();
  updateFighter(player);
  aiBehavior();
  updateFighter(enemy);
  if (player.health <= 0 || enemy.health <= 0) {
    gameOver = true;
    document.getElementById("result").textContent =
      player.health > enemy.health ? "You win!" : "You lose!";
  }
}

function draw() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ccc";
  ctx.fillRect(0, groundY + 10, width, height - groundY - 10);
  drawFighter(player);
  drawFighter(enemy);
  drawHealth();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);

resize();
init();
loop();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { attack };
}
