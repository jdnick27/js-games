const canvas = document.getElementById("fighter");
const ctx = canvas.getContext("2d");

let width;
let height;
const groundOffset = 60;
const gravity = 0.5;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

class StickFighter {
  constructor(x, color) {
    this.x = x;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.health = 5;
    this.blocking = false;
    this.attacking = false;
  }

  get groundY() {
    return height - groundOffset;
  }

  update() {
    // horizontal movement
    this.x += this.vx;
    // gravity
    this.vy += gravity;
    this.y += this.vy;
    if (this.y > this.groundY) {
      this.y = this.groundY;
      this.vy = 0;
    }
  }

  draw() {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // head
    ctx.arc(this.x, this.y - 20, 5, 0, Math.PI * 2);
    // body
    ctx.moveTo(this.x, this.y - 15);
    ctx.lineTo(this.x, this.y - 5);
    // arms
    if (this.blocking) {
      ctx.moveTo(this.x - 7, this.y - 10);
      ctx.lineTo(this.x + 7, this.y - 10);
    } else {
      ctx.moveTo(this.x - 7, this.y - 12);
      ctx.lineTo(this.x + 7, this.y - 8);
    }
    // legs
    ctx.moveTo(this.x, this.y - 5);
    ctx.lineTo(this.x - 5, this.y + 8);
    ctx.moveTo(this.x, this.y - 5);
    ctx.lineTo(this.x + 5, this.y + 8);
    ctx.stroke();
  }
}

const player = new StickFighter(80, "#333");
const ai = new StickFighter(240, "#e74c3c");

let keys = {};

function handleInput() {
  player.vx = 0;
  if (keys.ArrowLeft) player.vx = -2;
  if (keys.ArrowRight) player.vx = 2;
  if (keys.ArrowUp && player.y === player.groundY) player.vy = -8;
  player.blocking = keys.ShiftLeft || keys.ShiftRight;
}

function checkAttack(attacker, defender) {
  if (attacker.attacking) {
    attacker.attacking = false;
    if (Math.abs(attacker.x - defender.x) < 25 && !defender.blocking) {
      defender.health -= Math.random() < 0.5 ? 1 : 2;
    }
  }
}

let aiTimer = 0;
function aiLogic() {
  aiTimer--;
  if (aiTimer <= 0) {
    aiTimer = 60; // roughly once per second
    const distance = player.x - ai.x;
    if (Math.abs(distance) < 30 && Math.random() < 0.6) {
      ai.attacking = true;
    } else {
      ai.vx = distance > 0 ? 2 : -2;
      ai.blocking = Math.random() < 0.3;
      if (Math.random() < 0.2 && ai.y === ai.groundY) ai.vy = -8;
    }
  }
}

function update() {
  handleInput();
  aiLogic();
  player.update();
  ai.update();
  checkAttack(player, ai);
  checkAttack(ai, player);
}

function drawHealth(fighter, x, label) {
  ctx.fillStyle = fighter.color;
  ctx.fillRect(x, 10, fighter.health * 20, 10);
  ctx.strokeStyle = fighter.color;
  ctx.strokeRect(x, 10, 100, 10);
  ctx.fillStyle = "#000";
  ctx.fillText(label, x, 35);
}

function draw() {
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(0, height - groundOffset + 5, width, groundOffset);

  player.draw();
  ai.draw();

  drawHealth(player, 20, "Player");
  drawHealth(ai, width - 120, "AI");
}

function loop() {
  update();
  draw();
  if (player.health <= 0 || ai.health <= 0) {
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    const msg = player.health <= 0 ? "You lose" : "You win";
    ctx.fillText(msg, width / 2 - 40, height / 2);
    return;
  }
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyF") player.attacking = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

window.addEventListener("resize", resize);
resize();
loop();
