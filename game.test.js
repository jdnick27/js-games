const setupDom = () => {
  document.body.innerHTML = `
    <canvas id="game"></canvas>
    <p id="counter"></p>
    <p id="holeInfo"></p>
    <ol id="scores"></ol>
    <div id="powerBar"><div id="powerLevel"></div></div>
  `;
};

let game;

beforeEach(() => {
  jest.resetModules();
  setupDom();
  HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    ellipse: jest.fn(),
    measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: jest.fn() }),
    translate: jest.fn(),
    closePath: jest.fn(),
  });
  game = require("./game.js");
});

test("randomRange uses bounds", () => {
  jest.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(1);
  expect(game.randomRange(2, 5)).toBe(2);
  expect(game.randomRange(2, 5)).toBe(5);
  Math.random.mockRestore();
});

test("rangesOverlap detects overlap correctly", () => {
  expect(
    game.rangesOverlap({ left: 0, right: 5 }, { left: 4, right: 10 }),
  ).toBe(true);
  expect(
    game.rangesOverlap({ left: 0, right: 5 }, { left: 6, right: 10 }),
  ).toBe(false);
});

test("obstaclesOverlap checks tree overlap", () => {
  const a = { type: "tree", x: 100, width: 20 };
  const b = { type: "tree", x: 110, width: 20 };
  const c = { type: "tree", x: 200, width: 20 };
  expect(game.obstaclesOverlap(a, b)).toBe(true);
  expect(game.obstaclesOverlap(a, c)).toBe(false);
});

test("groundHeightAt accounts for hills", () => {
  const canvas = document.getElementById("game");
  canvas.height = 200;
  game.obstacles.length = 0;
  expect(game.groundHeightAt(0)).toBe(200 - game.GROUND_THICKNESS);
  game.obstacles.push({ type: "hill", x: 0, width: 100, height: 40 });
  const expected = 200 - game.GROUND_THICKNESS - 40 * Math.sin(Math.PI * 0.5);
  expect(game.groundHeightAt(50)).toBeCloseTo(expected);
});

test("groundSlopeAt calculates slope of hills", () => {
  game.obstacles.length = 0;
  game.obstacles.push({ type: "hill", x: 0, width: 100, height: 40 });
  const expected = ((-40 * Math.PI) / 100) * Math.cos(Math.PI * 0.5);
  expect(game.groundSlopeAt(50)).toBeCloseTo(expected);
});

test("ballInBunker detects when ball is in bunker", () => {
  const canvas = document.getElementById("game");
  canvas.height = 200;
  game.obstacles.length = 0;
  game.obstacles.push({ type: "bunker", x: 100, width: 50, depth: 12 });
  game.ball.x = 120;
  game.ball.y = 160; // groundHeightAt = 180
  game.ball.radius = 10;
  expect(game.ballInBunker()).toBe(true);
  game.ball.x = 50;
  expect(game.ballInBunker()).toBe(false);
});

test("getFriction returns value based on surface", () => {
  const canvas = document.getElementById("game");
  canvas.height = 200;
  // bunker case
  game.obstacles.length = 0;
  game.obstacles.push({ type: "bunker", x: 100, width: 50, depth: 12 });
  game.ball.x = 120;
  game.ball.y = 160;
  game.ball.radius = 10;
  expect(game.getFriction()).toBe(0.92);
  // green case
  game.obstacles.length = 0;
  game.ball.x = 50;
  game.ball.y = 180 - game.ball.radius;
  game.hole.x = 50;
  game.hole.y = 180;
  game.hole.greenRadius = 80;
  expect(game.getFriction()).toBe(0.995);
  // normal case
  game.ball.x = 150;
  expect(game.getFriction()).toBe(0.99);
});
