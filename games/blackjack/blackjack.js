const canvas = document.getElementById("blackjack");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

const STARTING_CHIPS = 500;
const MAX_BET = 25;

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = [
  { name: "A", value: 11 },
  { name: "2", value: 2 },
  { name: "3", value: 3 },
  { name: "4", value: 4 },
  { name: "5", value: 5 },
  { name: "6", value: 6 },
  { name: "7", value: 7 },
  { name: "8", value: 8 },
  { name: "9", value: 9 },
  { name: "10", value: 10 },
  { name: "J", value: 10 },
  { name: "Q", value: 10 },
  { name: "K", value: 10 },
];

let chips = STARTING_CHIPS;
let deck = [];
let dealer = [];
let playerHands = [];
let bets = [];
let currentHand = 0;
let inRound = false;
let message = "";

function createDeck() {
  deck = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({ suit, name: rank.name, value: rank.value });
    });
  });
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
  let total = hand.reduce((a, c) => a + c.value, 0);
  let aces = hand.filter((c) => c.value === 11).length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function createCardElement(card, hidden) {
  const div = document.createElement("div");
  div.className = "card";
  if (hidden) {
    div.classList.add("back");
    div.textContent = "?";
    return div;
  }
  if (card.suit === "♥" || card.suit === "♦") {
    div.classList.add("red");
  }
  div.textContent = `${card.name}${card.suit}`;
  return div;
}

function updateDisplay() {
  document.getElementById("chips").textContent = `Chips: $${chips}`;
  const betText = bets.length ? `Bet: $${bets[currentHand]}` : "";
  document.getElementById("betDisplay").textContent = betText;

  const dealerDiv = document.getElementById("dealerHand");
  dealerDiv.innerHTML = "Dealer: ";
  dealer.forEach((card, idx) => {
    const hidden = inRound && idx === 1;
    dealerDiv.appendChild(createCardElement(card, hidden));
  });
  if (!inRound) {
    const total = document.createElement("span");
    total.textContent = ` (${handValue(dealer)})`;
    dealerDiv.appendChild(total);
  }

  const playersContainer = document.getElementById("playerHands");
  playersContainer.innerHTML = "";
  playerHands.forEach((hand, idx) => {
    const handDiv = document.createElement("div");
    handDiv.className = "hand";
    const prefix =
      playerHands.length > 1
        ? `Hand ${idx + 1}${inRound && idx === currentHand ? "*" : ""}: `
        : "Player: ";
    const label = document.createElement("span");
    label.textContent = prefix;
    handDiv.appendChild(label);
    hand.forEach((card) => {
      handDiv.appendChild(createCardElement(card));
    });
    const total = document.createElement("span");
    total.textContent = ` (${handValue(hand)})`;
    handDiv.appendChild(total);
    playersContainer.appendChild(handDiv);
  });
  document.getElementById("message").textContent = message;
}

function startRound() {
  if (inRound || chips <= 0) {
    return;
  }
  const bet = Math.min(MAX_BET, chips);
  chips -= bet;
  createDeck();
  shuffle();
  dealer = [];
  playerHands = [[]];
  bets = [bet];
  currentHand = 0;
  dealCard(playerHands[0]);
  dealCard(dealer);
  dealCard(playerHands[0]);
  dealCard(dealer);
  inRound = true;
  const playerBJ = handValue(playerHands[0]) === 21;
  const dealerBJ = handValue(dealer) === 21;
  if (playerBJ || dealerBJ) {
    if (playerBJ && dealerBJ) {
      message = "Push. Both blackjack.";
      chips += bet;
    } else if (playerBJ) {
      message = "Blackjack! You win.";
      chips += bet * 2;
    } else {
      message = "Dealer has blackjack.";
    }
    inRound = false;
    updateDisplay();
    return;
  }
  message = "Hit, Stand, Double or Split";
  updateDisplay();
}

function hit() {
  if (!inRound) return;
  const hand = playerHands[currentHand];
  dealCard(hand);
  if (handValue(hand) > 21) {
    message = `Hand ${currentHand + 1} busts.`;
    moveToNextHand();
  }
  updateDisplay();
}

function doubleDown() {
  if (!inRound) return;
  const hand = playerHands[currentHand];
  if (hand.length !== 2 || chips < bets[currentHand]) return;
  chips -= bets[currentHand];
  bets[currentHand] *= 2;
  dealCard(hand);
  if (handValue(hand) > 21) {
    message = `Hand ${currentHand + 1} busts.`;
  }
  moveToNextHand();
  updateDisplay();
}

function splitHand() {
  if (
    !inRound ||
    playerHands.length > 1 ||
    chips < bets[0] ||
    playerHands[0].length !== 2 ||
    playerHands[0][0].value !== playerHands[0][1].value
  )
    return;
  chips -= bets[0];
  const secondCard = playerHands[0].pop();
  playerHands.push([secondCard]);
  bets.push(bets[0]);
  dealCard(playerHands[0]);
  dealCard(playerHands[1]);
  message = "Playing Hand 1";
  updateDisplay();
}

function dealerPlay() {
  while (handValue(dealer) < 17) {
    dealCard(dealer);
  }
}

function moveToNextHand() {
  if (currentHand < playerHands.length - 1) {
    currentHand++;
    message += " Playing next hand.";
  } else {
    dealerPlay();
    updateResult();
  }
}

function updateResult() {
  const dealerTotal = handValue(dealer);
  const results = [];
  playerHands.forEach((hand, idx) => {
    const playerTotal = handValue(hand);
    const bet = bets[idx];
    if (playerTotal > 21) {
      results.push(`Hand ${idx + 1}: Bust.`);
    } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
      results.push(`Hand ${idx + 1}: You win!`);
      chips += bet * 2;
    } else if (playerTotal === dealerTotal) {
      results.push(`Hand ${idx + 1}: Push.`);
      chips += bet;
    } else {
      results.push(`Hand ${idx + 1}: Dealer wins.`);
    }
  });
  message = results.join(" ");
  inRound = false;
}

function stand() {
  if (!inRound) return;
  moveToNextHand();
  updateDisplay();
}

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "d") startRound();
  if (key === "h") hit();
  if (key === "s") stand();
  if (key === "p") splitHand();
  if (key === "x") doubleDown();
});

document.getElementById("dealBtn").addEventListener("click", startRound);
document.getElementById("hitBtn").addEventListener("click", hit);
document.getElementById("standBtn").addEventListener("click", stand);
document.getElementById("doubleBtn").addEventListener("click", doubleDown);
document.getElementById("splitBtn").addEventListener("click", splitHand);

window.addEventListener("resize", resize);
resize();
updateDisplay();
