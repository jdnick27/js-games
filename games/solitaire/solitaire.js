const board = document.getElementById("solitaire");
const messageEl = document.getElementById("message");

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function rankValue(rank) {
  return RANKS.indexOf(rank) + 1;
}

function cardColor(suit) {
  return suit === "♥" || suit === "♦" ? "red" : "black";
}

let stock = [];
let waste = [];
let foundations = [[], [], [], []];
let tableau = [[], [], [], [], [], [], []];
let selected = null;

function createDeck() {
  const deck = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => deck.push({ suit, rank, faceUp: false }));
  });
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function setup() {
  const deck = createDeck();
  shuffle(deck);
  for (let i = 0; i < 7; i++) {
    tableau[i] = [];
    for (let j = 0; j <= i; j++) {
      const card = deck.pop();
      card.faceUp = j === i;
      tableau[i].push(card);
    }
  }
  stock = deck;
  waste = [];
  foundations = [[], [], [], []];
  selected = null;
  render();
}

function drawFromStock() {
  if (stock.length) {
    const card = stock.pop();
    card.faceUp = true;
    waste.push(card);
  } else {
    stock = waste.reverse();
    stock.forEach((c) => (c.faceUp = false));
    waste = [];
  }
  render();
}

function canMoveToFoundation(card, foundation) {
  if (!foundation.length) return card.rank === "A";
  const top = foundation[foundation.length - 1];
  return top.suit === card.suit && rankValue(card.rank) === rankValue(top.rank) + 1;
}

function canMoveToTableau(cards, pile) {
  const card = cards[0];
  if (!pile.length) return card.rank === "K";
  const top = pile[pile.length - 1];
  return (
    cardColor(card.suit) !== cardColor(top.suit) &&
    rankValue(card.rank) === rankValue(top.rank) - 1
  );
}

function flipOrigin(sel) {
  if (sel.type === "tableau") {
    const pile = tableau[sel.pile];
    if (pile.length && !pile[pile.length - 1].faceUp) {
      pile[pile.length - 1].faceUp = true;
    }
  }
}

function attemptMove(sel, target) {
  let cards;
  if (sel.type === "waste") {
    cards = [waste[waste.length - 1]];
  } else {
    cards = tableau[sel.pile].slice(sel.index);
  }

  if (target.pile === "foundation") {
    if (cards.length !== 1) return false;
    const foundation = foundations[target.index];
    if (canMoveToFoundation(cards[0], foundation)) {
      if (sel.type === "waste") waste.pop();
      else tableau[sel.pile].splice(sel.index, cards.length);
      foundation.push(cards[0]);
      flipOrigin(sel);
      return true;
    }
  }

  if (target.pile === "tableau") {
    const dest = tableau[target.index];
    if (canMoveToTableau(cards, dest)) {
      if (sel.type === "waste") waste.pop();
      else tableau[sel.pile].splice(sel.index, cards.length);
      dest.push(...cards);
      flipOrigin(sel);
      return true;
    }
  }
  return false;
}

function createCardElement(card, pile, pileIndex, cardIndex) {
  const div = document.createElement("div");
  div.className = "card";
  if (!card.faceUp) {
    div.classList.add("back");
    div.textContent = "?";
  } else {
    if (cardColor(card.suit) === "red") div.classList.add("red");
    div.textContent = `${card.rank}${card.suit}`;
  }
  div.dataset.pile = pile;
  div.dataset.index = pileIndex;
  div.dataset.card = cardIndex;
  div.style.top = pile === "tableau" ? `${cardIndex * 20}px` : "0";
  div.addEventListener("click", (e) => {
    e.stopPropagation();
    onCardClick(pile, pileIndex, cardIndex);
  });
  if (
    selected &&
    selected.type === pile &&
    selected.pile === pileIndex &&
    ((pile === "tableau" && cardIndex >= selected.index) || pile !== "tableau")
  ) {
    div.classList.add("selected");
  }
  return div;
}

function onCardClick(pile, pileIndex, cardIndex) {
  if (pile === "stock") {
    drawFromStock();
    return;
  }

  if (selected) {
    if (attemptMove(selected, { pile, index: pileIndex })) {
      selected = null;
      render();
    } else if (pile === selected.type && pileIndex === selected.pile) {
      selected = null;
      render();
    } else {
      selected = null;
      render();
    }
    return;
  }

  if (pile === "waste") {
    if (waste.length) {
      selected = { type: "waste" };
      render();
    }
    return;
  }

  if (pile === "tableau") {
    const card = tableau[pileIndex][cardIndex];
    if (!card.faceUp) {
      if (cardIndex === tableau[pileIndex].length - 1) {
        card.faceUp = true;
        render();
      }
      return;
    }
    selected = { type: "tableau", pile: pileIndex, index: cardIndex };
    render();
  }
}

function checkWin() {
  if (foundations.every((f) => f.length === 13)) {
    messageEl.textContent = "You win!";
  } else {
    messageEl.textContent = "";
  }
}

function render() {
  board.innerHTML = "";
  const topRow = document.createElement("div");
  topRow.id = "topRow";
  board.appendChild(topRow);

  const stockDiv = document.createElement("div");
  stockDiv.id = "stock";
  stockDiv.className = "pile";
  stockDiv.addEventListener("click", drawFromStock);
  if (stock.length) {
    const back = document.createElement("div");
    back.className = "card back";
    stockDiv.appendChild(back);
  }
  topRow.appendChild(stockDiv);

  const wasteDiv = document.createElement("div");
  wasteDiv.id = "waste";
  wasteDiv.className = "pile";
  wasteDiv.addEventListener("click", () => onCardClick("waste", 0, 0));
  if (waste.length) {
    const card = waste[waste.length - 1];
    const cardEl = createCardElement(card, "waste", 0, waste.length - 1);
    cardEl.style.position = "static";
    wasteDiv.appendChild(cardEl);
  }
  topRow.appendChild(wasteDiv);

  const spacer = document.createElement("div");
  spacer.style.flex = "1";
  topRow.appendChild(spacer);

  for (let i = 0; i < 4; i++) {
    const fDiv = document.createElement("div");
    fDiv.className = "pile foundation";
    fDiv.addEventListener("click", () => onCardClick("foundation", i, 0));
    if (foundations[i].length) {
      const card = foundations[i][foundations[i].length - 1];
      const el = createCardElement(card, "foundation", i, foundations[i].length - 1);
      el.style.position = "static";
      fDiv.appendChild(el);
    }
    topRow.appendChild(fDiv);
  }

  const tableauRow = document.createElement("div");
  tableauRow.id = "tableauRow";
  board.appendChild(tableauRow);

  for (let i = 0; i < 7; i++) {
    const tDiv = document.createElement("div");
    tDiv.className = "pile tableau";
    tDiv.addEventListener("click", (e) => {
      if (e.target === tDiv && selected) {
        if (attemptMove(selected, { pile: "tableau", index: i })) {
          selected = null;
          render();
        }
      }
    });
    const pile = tableau[i];
    for (let j = 0; j < pile.length; j++) {
      const c = pile[j];
      const el = createCardElement(c, "tableau", i, j);
      tDiv.appendChild(el);
    }
    tableauRow.appendChild(tDiv);
  }
  checkWin();
}

setup();
