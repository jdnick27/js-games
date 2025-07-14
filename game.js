const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    radius: 15,
    vx: 0,
    vy: 0
};

const pole = {
    angle: 0,
    time: 0
};

const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
const ACCEL = 0.2; // acceleration from input
const FRICTION = 0.98; // friction to slow the ball

function rotateVector(x, y, angle) {
    return {
        x: x * Math.cos(angle) - y * Math.sin(angle),
        y: x * Math.sin(angle) + y * Math.cos(angle)
    };
}

function update() {
    pole.time += 0.01;
    pole.angle = Math.sin(pole.time) * 0.5; // wobbling floor

    let ax = 0,
        ay = 0;
    if (keys.ArrowUp) ay -= 1;
    if (keys.ArrowDown) ay += 1;
    if (keys.ArrowLeft) ax -= 1;
    if (keys.ArrowRight) ax += 1;

    // rotate the acceleration by the pole angle
    const rotated = rotateVector(ax, ay, pole.angle);
    ball.vx += rotated.x * ACCEL;
    ball.vy += rotated.y * ACCEL;

    // apply friction
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    // update position
    ball.x += ball.vx;
    ball.y += ball.vy;

    // keep ball within canvas bounds
    ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
    ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
}

function drawFloor() {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(pole.angle);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(-canvas.width / 2, -10, canvas.width, 20);
    ctx.restore();
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#3498db';
    ctx.fill();
}

function drawGoal() {
    const r = 10;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'green';
    ctx.stroke();
}

function drawWin() {
    ctx.fillStyle = 'green';
    ctx.font = '24px Arial';
    ctx.fillText('You win!', canvas.width / 2 - 50, canvas.height / 2 - 30);
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    drawFloor();
    drawGoal();
    drawBall();

    const dx = ball.x - canvas.width / 2;
    const dy = ball.y - canvas.height / 2;
    if (Math.hypot(dx, dy) < 10) {
        drawWin();
    } else {
        requestAnimationFrame(loop);
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code in keys) {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
    }
});

loop();
