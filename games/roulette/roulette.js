const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
let width;
let height;

const numbers = [
  { num: 0, color: "green" },
  { num: 1, color: "red" },
  { num: 2, color: "black" },
  { num: 3, color: "red" },
  { num: 4, color: "black" },
  { num: 5, color: "red" },
  { num: 6, color: "black" },
  { num: 7, color: "red" },
  { num: 8, color: "black" },
  { num: 9, color: "red" },
  { num: 10, color: "black" },
  { num: 11, color: "black" },
  { num: 12, color: "red" },
  { num: 13, color: "black" },
  { num: 14, color: "red" },
  { num: 15, color: "black" },
  { num: 16, color: "red" },
  { num: 17, color: "black" },
  { num: 18, color: "red" },
  { num: 19, color: "red" },
  { num: 20, color: "black" },
  { num: 21, color: "red" },
  { num: 22, color: "black" },
  { num: 23, color: "red" },
  { num: 24, color: "black" },
  { num: 25, color: "red" },
  { num: 26, color: "black" },
  { num: 27, color: "red" },
  { num: 28, color: "black" },
  { num: 29, color: "black" },
  { num: 30, color: "red" },
  { num: 31, color: "black" },
  { num: 32, color: "red" },
  { num: 33, color: "black" },
  { num: 34, color: "red" },
  { num: 35, color: "black" },
  { num: 36, color: "red" },
];

let angle = 0;
let speed = 0;
let spinning = false;

let chips = 100;
const bets = {};

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  drawWheel();
}

function drawWheel() {
  ctx.clearRect(0, 0, width, height);
  const radius = Math.min(width, height) / 3;
  const centerX = width / 2;
  const centerY = height / 2;
  const slice = (2 * Math.PI) / numbers.length;
  numbers.forEach((n, i) => {
    const start = angle + i * slice;
    const end = start + slice;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, start, end);
    ctx.fillStyle = n.color;
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(start + slice / 2);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(n.num.toString(), radius * 0.75, 0);
    ctx.restore();
  });
  ctx.beginPath();
  ctx.fillStyle = "#fff";
  ctx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI);
  ctx.fill();
}

function updateDisplay(msg = "") {
  document.getElementById("chips").textContent = `Chips: ${chips}`;
  document.getElementById("message").textContent = msg;
}

function createTable() {
  const table = document.getElementById("rouletteTable");
  numbers.forEach((n) => {
    const cell = document.createElement("div");
    cell.className = `roulette-cell ${n.color}`;
    cell.textContent = n.num;
    cell.addEventListener("click", () => addChip(n.num));
    cell.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      removeChip(n.num);
    });
    table.appendChild(cell);
  });
}

function addChip(num) {
  if (spinning || chips <= 0) return;
  chips -= 1;
  bets[num] = (bets[num] || 0) + 1;
  updateDisplay();
}

function removeChip(num) {
  if (spinning || !bets[num]) return;
  bets[num] -= 1;
  chips += 1;
  if (bets[num] === 0) delete bets[num];
  updateDisplay();
}

function clearBets() {
  if (spinning) return;
  Object.keys(bets).forEach((k) => {
    chips += bets[k];
    delete bets[k];
  });
  updateDisplay();
}

function resolve(number) {
  let winnings = 0;
  Object.keys(bets).forEach((k) => {
    if (parseInt(k, 10) === number) {
      winnings += bets[k] * 36;
    }
  });
  chips += winnings;
  updateDisplay(`Winning number: ${number}`);
  clearBets();
}

function spin() {
  if (spinning || Object.keys(bets).length === 0) return;
  spinning = true;
  speed = 0.3 + Math.random() * 0.3;
  requestAnimationFrame(loop);
}

function loop() {
  if (!spinning) return;
  angle += speed;
  speed *= 0.98;
  drawWheel();
  if (speed < 0.002) {
    spinning = false;
    const slice = (2 * Math.PI) / numbers.length;
    const index = Math.floor(
      ((2 * Math.PI - (angle % (2 * Math.PI))) % (2 * Math.PI)) / slice,
    );
    const result = numbers[index].num;
    resolve(result);
  } else {
    requestAnimationFrame(loop);
  }
}

document.getElementById("spinBtn").addEventListener("click", spin);
document.getElementById("clearBtn").addEventListener("click", clearBets);

window.addEventListener("resize", resize);
resize();
createTable();
updateDisplay();
