const canvas = document.getElementById("archery");
const ctx = canvas.getContext("2d");

let width;
let height;

const archer = { x: 80, y: 0 };
let aiming = false;
let aimPos = { x: 0, y: 0 };

const gravity = 0.25;
const arrows = [];
let score = 0;

const target = { x: 0, y: 0, radius: 100 };
const rings = [100, 80, 60, 40, 20];

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  archer.y = height - 80;
  target.x = width - 200;
  target.y = height / 2;
}

function addArrow(vx, vy) {
  arrows.push({ x: archer.x, y: archer.y, vx, vy });
}

function update() {
  arrows.forEach((a) => {
    a.vy += gravity;
    a.x += a.vx;
    a.y += a.vy;
    // check hit
    const dx = a.x - target.x;
    const dy = a.y - target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (!a.hit && dist <= target.radius) {
      a.hit = true;
      for (let i = rings.length - 1; i >= 0; i--) {
        if (dist <= rings[i]) {
          score += rings.length - i;
          break;
        }
      }
    }
  });
}

function drawTarget() {
  for (let i = 0; i < rings.length; i++) {
    ctx.beginPath();
    ctx.arc(target.x, target.y, rings[i], 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? "#fff" : "#ddd";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.stroke();
  }
}

function drawArcher() {
  ctx.fillStyle = "#333";
  ctx.fillRect(archer.x - 10, archer.y - 40, 20, 40);
}

function drawArrows() {
  ctx.fillStyle = "#e74c3c";
  arrows.forEach((a) => {
    ctx.beginPath();
    ctx.arc(a.x, a.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawAimLine() {
  if (aiming) {
    ctx.beginPath();
    ctx.moveTo(archer.x, archer.y);
    ctx.lineTo(aimPos.x, aimPos.y);
    ctx.strokeStyle = "#e67e22";
    ctx.stroke();
  }
}

function draw() {
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
    "--game-bg",
  );
  ctx.fillRect(0, 0, width, height);
  drawTarget();
  drawArcher();
  drawArrows();
  drawAimLine();
  document.getElementById("score").textContent = `Score: ${score}`;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

canvas.addEventListener("mousedown", (e) => {
  aiming = true;
  aimPos.x = e.clientX;
  aimPos.y = e.clientY;
});

canvas.addEventListener("mousemove", (e) => {
  if (aiming) {
    aimPos.x = e.clientX;
    aimPos.y = e.clientY;
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (aiming) {
    const dx = e.clientX - archer.x;
    const dy = e.clientY - archer.y;
    addArrow(dx / 15, dy / 15);
    aiming = false;
  }
});

window.addEventListener("resize", resize);

resize();

if (
  typeof window !== "undefined" &&
  (typeof module === "undefined" || !module.exports)
) {
  loop();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {};
}
