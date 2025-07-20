const canvas = document.getElementById("baseball");
const ctx = canvas.getContext("2d");

let score = 0;
let message = "";

const ball = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 10,
  active: false,
  hit: false,
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function pitch() {
  ball.x = canvas.width - 50;
  ball.y = canvas.height / 2;
  ball.vx = -6;
  ball.vy = 0;
  ball.active = true;
  ball.hit = false;
  message = "";
}

function update() {
  if (!ball.active) return;
  ball.x += ball.vx;
  ball.y += ball.vy;
  if (!ball.hit && ball.x < -ball.radius) {
    message = "Miss!";
    ball.active = false;
    setTimeout(pitch, 1000);
  }
  if (
    ball.hit &&
    (ball.x > canvas.width + ball.radius || ball.y < -ball.radius)
  ) {
    ball.active = false;
    setTimeout(pitch, 1000);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  ctx.fillRect(canvas.width / 4 - 5, canvas.height / 2 - 40, 10, 80);
  if (ball.active) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#e74c3c";
    ctx.fill();
  }
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.fillText(`Hits: ${score}`, 20, 30);
  ctx.fillText(message, 20, 60);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && ball.active && !ball.hit) {
    const zoneStart = canvas.width / 4 - 20;
    const zoneEnd = canvas.width / 4 + 20;
    if (ball.x >= zoneStart && ball.x <= zoneEnd) {
      ball.hit = true;
      ball.vx = 6;
      ball.vy = -6;
      score += 1;
      message = "Hit!";
    } else {
      message = "Miss!";
      ball.active = false;
      setTimeout(pitch, 1000);
    }
  }
});

window.addEventListener("resize", resize);

resize();
pitch();
loop();
