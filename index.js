let gridSize;
let players = [];
let currentPlayerIndex = 0;
let nextGrid = -1;
let gameBoard;
let smallGridsWon;
let gameActive = true;
let isFullscreen = false;

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    document.body.classList.add("fullscreen");
    isFullscreen = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      document.body.classList.remove("fullscreen");
      isFullscreen = false;
    }
  }
  // Trigger resize event to update layout
  if (gameBoard) {
    updateBoard();
  }
}

// Listen for fullscreen change events
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    document.body.classList.remove("fullscreen");
    isFullscreen = false;
    if (gameBoard) {
      updateBoard();
    }
  }
});

function showPlayerSetup() {
  const playerCount = parseInt(document.getElementById("playerCount").value);
  const playerSetup = document.getElementById("playerSetup");
  playerSetup.innerHTML = "";

  for (let i = 0; i < playerCount; i++) {
    const playerDiv = document.createElement("div");
    playerDiv.className = "player-setup";
    playerDiv.innerHTML = `
                    <label>Player ${i + 1} Symbol: </label>
                    <input type="text" id="player${i}Symbol" maxlength="1" value="${
      i === 0 ? "X" : i === 1 ? "O" : String.fromCharCode(88 + i)
    }">
                    <input type="color" id="player${i}Color" value="${getRandomColor()}">
                `;
    playerSetup.appendChild(playerDiv);
  }

  const startButton = document.createElement("button");
  startButton.textContent = "Start Game";
  startButton.onclick = startGame;
  playerSetup.appendChild(startButton);
}

function getRandomColor() {
  const letters = "456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * letters.length)];
  }
  return color;
}

function startGame() {
  gridSize = parseInt(document.getElementById("gridSize").value);
  const playerCount = parseInt(document.getElementById("playerCount").value);

  players = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({
      symbol:
        document.getElementById(`player${i}Symbol`).value ||
        String.fromCharCode(88 + i),
      color: document.getElementById(`player${i}Color`).value,
    });
  }

  document.getElementById("setup").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";

  initializeGame();
}

function showSetup() {
  document.getElementById("setup").style.display = "block";
  document.getElementById("gameContainer").style.display = "none";
}

function initializeGame() {
  gameBoard = Array(gridSize * gridSize)
    .fill()
    .map(() => Array(gridSize * gridSize).fill(""));
  smallGridsWon = Array(gridSize * gridSize).fill("");
  currentPlayerIndex = 0;
  nextGrid = -1;
  gameActive = true;
  createBoard();
  updatePlayerDisplay();
}

function createBoard() {
  const bigGrid = document.getElementById("bigGrid");
  bigGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  bigGrid.innerHTML = "";

  for (let i = 0; i < gridSize * gridSize; i++) {
    const smallGrid = document.createElement("div");
    smallGrid.className = "small-grid";
    smallGrid.id = `grid-${i}`;
    smallGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    for (let j = 0; j < gridSize * gridSize; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.onclick = () => makeMove(i, j);
      smallGrid.appendChild(cell);
    }

    bigGrid.appendChild(smallGrid);
  }
  updateBoard();
}

function updatePlayerDisplay() {
  const display = document.getElementById("playerDisplay");
  display.innerHTML = "";
  players.forEach((player, index) => {
    const playerDiv = document.createElement("div");
    playerDiv.className = `player-info ${
      index === currentPlayerIndex ? "current-player" : ""
    }`;
    playerDiv.style.backgroundColor =
      index === currentPlayerIndex ? player.color : "#eee";
    playerDiv.textContent = `Player ${index + 1}: ${player.symbol}`;
    display.appendChild(playerDiv);
  });
}

function makeMove(bigGridIndex, smallGridIndex) {
  if (!gameActive) return;
  if (smallGridsWon[bigGridIndex] !== "") return;
  if (nextGrid !== -1 && nextGrid !== bigGridIndex) return;
  if (gameBoard[bigGridIndex][smallGridIndex] !== "") return;

  const currentPlayer = players[currentPlayerIndex];
  gameBoard[bigGridIndex][smallGridIndex] = currentPlayer.symbol;

  checkSmallGridWin(bigGridIndex);
  nextGrid = smallGridIndex;
  if (smallGridsWon[nextGrid] !== "") {
    nextGrid = -1;
  }

  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  updateBoard();
  updatePlayerDisplay();
  checkBigGridWin();
}

function updateBoard() {
  for (let i = 0; i < gridSize * gridSize; i++) {
    const smallGrid = document.getElementById(`grid-${i}`);
    const cells = smallGrid.children;

    for (let j = 0; j < gridSize * gridSize; j++) {
      const cell = cells[j];
      const symbol = gameBoard[i][j];
      cell.textContent = symbol;
      if (symbol !== "") {
        const player = players.find((p) => p.symbol === symbol);
        cell.style.color = player.color;
      }
    }

    smallGrid.classList.remove("active-grid");
    if (smallGridsWon[i] !== "") {
      smallGrid.classList.add("won-grid");
      for (let cell of cells) {
        cell.style.backgroundColor =
          players.find((p) => p.symbol === smallGridsWon[i]).color + "40";
      }
    } else if (nextGrid === -1 || nextGrid === i) {
      smallGrid.classList.add("active-grid");
    }
  }
}

function checkSmallGridWin(gridIndex) {
  const grid = gameBoard[gridIndex];
  const lines = [];

  // Rows
  for (let i = 0; i < gridSize; i++) {
    lines.push(Array.from({ length: gridSize }, (_, j) => i * gridSize + j));
  }
  // Columns
  for (let i = 0; i < gridSize; i++) {
    lines.push(Array.from({ length: gridSize }, (_, j) => i + j * gridSize));
  }
  // Diagonals
  lines.push(Array.from({ length: gridSize }, (_, i) => i * gridSize + i));
  lines.push(
    Array.from({ length: gridSize }, (_, i) => (i + 1) * (gridSize - 1))
  );

  for (let line of lines) {
    const symbols = line.map((i) => grid[i]);
    if (symbols.every((s) => s !== "" && s === symbols[0])) {
      smallGridsWon[gridIndex] = symbols[0];
      return;
    }
  }
}

function checkBigGridWin() {
  const lines = [];

  // Rows
  for (let i = 0; i < gridSize; i++) {
    lines.push(Array.from({ length: gridSize }, (_, j) => i * gridSize + j));
  }
  // Columns
  for (let i = 0; i < gridSize; i++) {
    lines.push(Array.from({ length: gridSize }, (_, j) => i + j * gridSize));
  }
  // Diagonals
  lines.push(Array.from({ length: gridSize }, (_, i) => i * gridSize + i));
  lines.push(
    Array.from({ length: gridSize }, (_, i) => (i + 1) * (gridSize - 1))
  );

  for (let line of lines) {
    const symbols = line.map((i) => smallGridsWon[i]);
    if (symbols.every((s) => s !== "" && s === symbols[0])) {
      gameActive = false;
      const winner = players.find((p) => p.symbol === symbols[0]);
      alert(`Game Over! Player with symbol ${symbols[0]} wins!`);
      return;
    }
  }

  // Check for draw
  if (smallGridsWon.every((cell) => cell !== "")) {
    gameActive = false;
    alert("Game Over! It's a draw!");
  }
}

function resetGame() {
  initializeGame();
}
