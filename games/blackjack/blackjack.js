const canvas = document.getElementById("blackjack");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

const STARTING_CHIPS = 500;
const MAX_BET = 25;

let chips = STARTING_CHIPS;
let bet = 0;
let deck = [];
let player = [];
let dealer = [];
let inRound = false;
let message = "";

function createDeck() {
  deck = [];
  const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
  for (let i = 0; i < 4; i++) {
    deck.push(...values);
  }
}

function shuffle() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function dealCard(hand) {
  hand.push(deck.pop());
}

function handValue(hand) {
  let total = hand.reduce((a, b) => a + b, 0);
  let aces = hand.filter((v) => v === 11).length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function updateDisplay() {
  document.getElementById("chips").textContent = `Chips: $${chips}`;
  document.getElementById("betDisplay").textContent = bet
    ? `Bet: $${bet}`
    : "";
  const dealerText = inRound
    ? `${dealer[0]}, ?`
    : `${dealer.join(", ")} (${handValue(dealer)})`;
  document.getElementById("dealerHand").textContent = `Dealer: ${dealerText}`;
  document.getElementById("playerHand").textContent =
    `Player: ${player.join(", ")} (${handValue(player)})`;
  document.getElementById("message").textContent = message;
}

function startRound() {
  if (inRound || chips <= 0) {
    return;
  }
  bet = Math.min(MAX_BET, chips);
  chips -= bet;
  createDeck();
  shuffle();
  player = [];
  dealer = [];
  dealCard(player);
  dealCard(dealer);
  dealCard(player);
  dealCard(dealer);
  message = "Hit or Stand";
  inRound = true;
  if (handValue(player) === 21) {
    stand();
  }
  updateDisplay();
}

function hit() {
  if (!inRound) return;
  dealCard(player);
  if (handValue(player) > 21) {
    message = "Bust!";
    inRound = false;
    updateResult();
  }
  updateDisplay();
}

function dealerPlay() {
  while (handValue(dealer) < 17) {
    dealCard(dealer);
  }
}

function updateResult() {
  const playerTotal = handValue(player);
  const dealerTotal = handValue(dealer);
  if (playerTotal > 21) {
    message = "Bust! Dealer wins.";
  } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
    message = "You win!";
    chips += bet * 2;
  } else if (playerTotal === dealerTotal) {
    message = "Push.";
    chips += bet;
  } else {
    message = "Dealer wins.";
  }
  inRound = false;
}

function stand() {
  if (!inRound) return;
  dealerPlay();
  updateResult();
  updateDisplay();
}

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "d") startRound();
  if (key === "h") hit();
  if (key === "s") stand();
});

window.addEventListener("resize", resize);
resize();
updateDisplay();
