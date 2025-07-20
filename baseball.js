const canvas = document.getElementById("baseball");
const ctx = canvas.getContext("2d");

const ball = {
  x: 50,
  y: 0,
  radius: 8,
  vx: 0,
  vy: 0,
  moving: false,
  hitChecked: false,
};
const bat = { width: 10, height: 60, swinging: false, angle: 0 };

let hits = 0;
let attempts = 0;
let message = "";

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ball.y = canvas.height / 2;
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#e74c3c";
  ctx.fill();
}

function drawBat() {
  ctx.save();
  ctx.translate(canvas.width - 80, canvas.height / 2);
  ctx.rotate(bat.angle);
  ctx.fillStyle = "#8e44ad";
  ctx.fillRect(0, -bat.height / 2, bat.width, bat.height);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBall();
  drawBat();
}

function updateBall() {
  if (ball.moving) {
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vy += 0.2; // gravity
  }
}

function checkHit() {
  if (ball.moving && !ball.hitChecked && ball.x >= canvas.width - 100) {
    attempts += 1;
    if (bat.swinging && bat.angle > 0.1) {
      ball.vx = 6;
      ball.vy = -5;
      message = "Hit!";
      hits += 1;
    } else {
      message = "Miss!";
    }
    ball.hitChecked = true;
    document.getElementById("msg").textContent = message;
    document.getElementById("score").textContent =
      `Hits: ${hits} / ${attempts}`;
  }
}

function resetBall() {
  ball.x = 50;
  ball.y = canvas.height / 2;
  ball.vx = 0;
  ball.vy = 0;
  ball.moving = false;
  ball.hitChecked = false;
}

function update() {
  updateBall();
  checkHit();
  if (ball.x > canvas.width || ball.y > canvas.height) {
    resetBall();
  }
  if (bat.swinging) {
    bat.angle += 0.2;
    if (bat.angle >= Math.PI / 2) {
      bat.angle = 0;
      bat.swinging = false;
    }
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (!ball.moving) {
      ball.vx = 5;
      ball.vy = 0;
      ball.moving = true;
      message = "";
      document.getElementById("msg").textContent = "";
    }
  }
  if (e.key.toLowerCase() === "s") {
    if (!bat.swinging) {
      bat.swinging = true;
      bat.angle = 0;
    }
  }
});

window.addEventListener("resize", () => {
  resize();
});

resize();
resetBall();
loop();
