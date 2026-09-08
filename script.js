/* ===================================================
   0. 8-Card 3D 파노라마 회전문 제어 기능 (Cover Arc)
=================================================== */

let currentCenterIndex = 0;
const totalGamesCount = 8;

let isDragging = false;
let dragStartX = 0;
let currentDragDistance = 0;
let didDragMove = false;

// 1) 화면 너비 및 상대 위치(offset)에 따른 3D 스타일 계산 함수
// offset이 0이면 정면, 1이면 오른쪽 1번째, -1이면 왼쪽 1번째입니다.
// 실시간 드래그 시에는 소수점(예: 0.35, -0.6)으로 부드럽게 이어집니다.
function getPanoramaOffsetStyle(offset) {
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth <= 768;
    const isTablet = screenWidth <= 950;

    let stepX = 220;
    let stepZ = 55;
    let angle = 12;
    let scaleStep = 0.08;

    if (isMobile) {
        stepX = 110;
        stepZ = 40;
        angle = 10;
        scaleStep = 0.12;
    } else if (isTablet) {
        stepX = 170;
        stepZ = 45;
        angle = 11;
    }

    const absOffset = Math.abs(offset);

    // 완전히 뒤로 돌아간 카드 (3.8칸 이상 떨어진 경우) 숨김
    if (absOffset >= 3.8) {
        return {
            transform: `translateX(0px) translateZ(-400px) rotateY(180deg) scale(0.5)`,
            opacity: 0,
            zIndex: 0,
            pointerEvents: "none"
        };
    }

    const posX = offset * stepX * (1 + absOffset * 0.12);
    const posZ = -absOffset * stepZ * 1.4;
    const rotY = -offset * angle * (1 + absOffset * 0.18);
    const scale = Math.max(0.65, 1 - absOffset * scaleStep);
    const opacity = Math.max(0.15, 1 - absOffset * 0.22);
    const zIndex = Math.max(1, Math.round(30 - absOffset * 7));

    return {
        transform: `translateX(${posX}px) translateZ(${posZ}px) rotateY(${rotY}deg) scale(${scale})`,
        opacity: opacity,
        zIndex: zIndex,
        pointerEvents: "auto"
    };
}

// 2) 8장의 카드를 3D 곡면으로 일괄 배치하는 함수 (virtualCenter: 가상 중심점)
function update3DPanoramaView(virtualCenter = currentCenterIndex) {
    const cards = document.querySelectorAll(".carousel-3d-card");
    const dots = document.querySelectorAll(".indicator-dot");

    cards.forEach((card, index) => {
        let offset = (index - virtualCenter) % totalGamesCount;
        if (offset > totalGamesCount / 2) {
            offset = offset - totalGamesCount;
        } else if (offset < -totalGamesCount / 2) {
            offset = offset + totalGamesCount;
        }

        const style = getPanoramaOffsetStyle(offset);
        card.style.transform = style.transform;
        card.style.opacity = style.opacity;
        card.style.zIndex = style.zIndex;
        card.style.pointerEvents = style.pointerEvents;

        if (Math.abs(offset) < 0.5) {
            card.classList.add("active");
        } else {
            card.classList.remove("active");
        }
    });

    const nearestIndex = ((Math.round(virtualCenter) % totalGamesCount) + totalGamesCount) % totalGamesCount;
    dots.forEach((dot, index) => {
        if (index === nearestIndex) {
            dot.classList.add("active");
        } else {
            dot.classList.remove("active");
        }
    });
}

// 3) 다음 게임으로 회전하는 함수
function goToNextGame() {
    currentCenterIndex = (currentCenterIndex + 1) % totalGamesCount;
    update3DPanoramaView(currentCenterIndex);
}

// 4) 이전 게임으로 회전하는 함수
function goToPrevGame() {
    currentCenterIndex = (currentCenterIndex - 1 + totalGamesCount) % totalGamesCount;
    update3DPanoramaView(currentCenterIndex);
}

// 5) 특정 번호의 게임을 정면으로 부르는 함수
function goToGame(targetIndex) {
    currentCenterIndex = targetIndex;
    update3DPanoramaView(currentCenterIndex);
}

// 6) 마우스/터치 드래그 시작 함수
function startDrag(clientX) {
    isDragging = true;
    didDragMove = false;
    dragStartX = clientX;
    currentDragDistance = 0;

    const scene = document.getElementById("carousel-scene");
    if (scene) {
        scene.classList.add("grabbing");
        scene.classList.add("is-dragging");
    }
}

// 7) 마우스/터치 드래그 중 실시간 추적 함수 (1:1 버터 추적)
function moveDrag(clientX) {
    if (!isDragging) return;
    currentDragDistance = clientX - dragStartX;

    if (Math.abs(currentDragDistance) > 6) {
        didDragMove = true;
    }

    const dragProgress = currentDragDistance / 220;
    const virtualCenter = currentCenterIndex - dragProgress;
    update3DPanoramaView(virtualCenter);
}

// 8) 마우스/터치 드래그 종료 시 0.5초 관성 안착 함수
function endDrag() {
    if (!isDragging) return;
    isDragging = false;

    const scene = document.getElementById("carousel-scene");
    if (scene) {
        scene.classList.remove("grabbing");
        scene.classList.remove("is-dragging");
    }

    if (currentDragDistance > 45) {
        currentCenterIndex = (currentCenterIndex - 1 + totalGamesCount) % totalGamesCount;
    } else if (currentDragDistance < -45) {
        currentCenterIndex = (currentCenterIndex + 1) % totalGamesCount;
    }

    update3DPanoramaView(currentCenterIndex);
    currentDragDistance = 0;
}


/* ===================================================
   1. 카드 짝 맞추기 게임 (Memory Match)
=================================================== */

const cardSymbols = ['▲', '▲', '●', '●', '■', '■', '★', '★', '◆', '◆', '✦', '✦'];
let flippedCards = [];
let matchedPairsCount = 0;
let totalMovesCount = 0;
let isBoardLocked = false;

function shuffleSymbols(array) {
    return array.sort(() => Math.random() - 0.5);
}

function updateMovesDisplay() {
    const movesElement = document.getElementById("moves-count");
    if (movesElement) movesElement.textContent = totalMovesCount;
}

function updatePairsDisplay() {
    const pairsElement = document.getElementById("pairs-count");
    if (pairsElement) pairsElement.textContent = matchedPairsCount;
}

function createSingleCard(symbol) {
    const card = document.createElement("div");
    card.classList.add("memory-card");
    card.dataset.symbol = symbol;

    const cardFront = document.createElement("div");
    cardFront.classList.add("card-face", "card-front");
    cardFront.textContent = "?";

    const cardBack = document.createElement("div");
    cardBack.classList.add("card-face", "card-back");
    cardBack.textContent = symbol;

    card.appendChild(cardFront);
    card.appendChild(cardBack);

    card.addEventListener("click", () => handleCardClick(card));
    return card;
}

function checkCardMatch() {
    const firstCard = flippedCards[0];
    const secondCard = flippedCards[1];
    const isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;

    if (isMatch) {
        firstCard.classList.add("matched");
        secondCard.classList.add("matched");
        matchedPairsCount = matchedPairsCount + 1;
        updatePairsDisplay();
        resetTurn();

        if (matchedPairsCount === 6) {
            setTimeout(() => alert("축하합니다! 모든 짝을 찾으셨습니다!"), 300);
        }
    } else {
        setTimeout(() => {
            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");
            resetTurn();
        }, 700);
    }
}

function resetTurn() {
    flippedCards = [];
    isBoardLocked = false;
}

function handleCardClick(clickedCard) {
    if (isBoardLocked) return;
    if (clickedCard.classList.contains("flipped")) return;
    if (clickedCard.classList.contains("matched")) return;

    clickedCard.classList.add("flipped");
    flippedCards.push(clickedCard);

    if (flippedCards.length === 2) {
        totalMovesCount = totalMovesCount + 1;
        updateMovesDisplay();
        isBoardLocked = true;
        checkCardMatch();
    }
}

function resetMemoryGame() {
    const boardElement = document.getElementById("memory-board");
    if (!boardElement) return;

    boardElement.innerHTML = "";
    flippedCards = [];
    matchedPairsCount = 0;
    totalMovesCount = 0;
    isBoardLocked = false;

    updateMovesDisplay();
    updatePairsDisplay();

    const shuffled = shuffleSymbols([...cardSymbols]);
    shuffled.forEach((symbol) => {
        boardElement.appendChild(createSingleCard(symbol));
    });
}


/* ===================================================
   2. 반응 속도 테스트 (Reaction Speed)
=================================================== */

let reactionState = "waiting";
let reactionTimerId = null;
let startTime = 0;

function setReactionBoxState(newState, text, icon) {
    const box = document.getElementById("reaction-box");
    const textElement = document.getElementById("reaction-text");
    const iconElement = document.getElementById("reaction-icon");
    if (!box) return;

    box.className = "reaction-box " + newState;
    reactionState = newState;
    textElement.textContent = text;
    iconElement.textContent = icon;
}

function startReactionWaiting() {
    setReactionBoxState("ready", "초록색이 되면 즉시 클릭!", "⏱");

    const randomDelay = Math.floor(Math.random() * 2500) + 1500;
    reactionTimerId = setTimeout(() => {
        startTime = Date.now();
        setReactionBoxState("now", "지금 클릭하세요!", "⚡");
    }, randomDelay);
}

function handleTooEarlyClick() {
    clearTimeout(reactionTimerId);
    setReactionBoxState("result", "너무 일찍 눌렀습니다! 다시 시도", "✕");
}

function recordReactionTime() {
    const reactionTime = Date.now() - startTime;
    const resultElement = document.getElementById("reaction-result");
    if (resultElement) resultElement.textContent = reactionTime + " ms";
    setReactionBoxState("result", reactionTime + " ms! 다시 도전", "✓");
}

function onReactionBoxClick() {
    if (reactionState === "waiting" || reactionState === "result") {
        startReactionWaiting();
    } else if (reactionState === "ready") {
        handleTooEarlyClick();
    } else if (reactionState === "now") {
        recordReactionTime();
    }
}

function resetReactionGame() {
    clearTimeout(reactionTimerId);
    setReactionBoxState("waiting", "클릭하여 시작", "●");
    const resultElement = document.getElementById("reaction-result");
    if (resultElement) resultElement.textContent = "-";
}


/* ===================================================
   3. 틱택토 게임 (Tic-Tac-Toe vs 컴퓨터)
=================================================== */

let tictactoeBoard = ["", "", "", "", "", "", "", "", ""];
let isPlayerTurn = true;
let isGameOver = false;

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function updateTicTacToeStatus(message) {
    const statusElement = document.getElementById("tictactoe-status");
    if (statusElement) statusElement.textContent = message;
}

function checkTicTacToeWinner(symbol) {
    return winningCombinations.some(combination => {
        return combination.every(index => tictactoeBoard[index] === symbol);
    });
}

function checkTicTacToeTie() {
    return tictactoeBoard.every(cell => cell !== "");
}

function computerMove() {
    if (isGameOver) return;

    const emptyIndices = [];
    tictactoeBoard.forEach((val, idx) => {
        if (val === "") emptyIndices.push(idx);
    });

    if (emptyIndices.length === 0) return;

    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    tictactoeBoard[randomIndex] = "O";

    renderTicTacToeBoard();

    if (checkTicTacToeWinner("O")) {
        updateTicTacToeStatus("컴퓨터 승리! 🤖");
        isGameOver = true;
    } else if (checkTicTacToeTie()) {
        updateTicTacToeStatus("무승부! 🤝");
        isGameOver = true;
    } else {
        isPlayerTurn = true;
        updateTicTacToeStatus("당신의 차례 (X)");
    }
}

function handleCellClick(index) {
    if (isGameOver || !isPlayerTurn || tictactoeBoard[index] !== "") return;

    tictactoeBoard[index] = "X";
    renderTicTacToeBoard();

    if (checkTicTacToeWinner("X")) {
        updateTicTacToeStatus("당신의 승리! 🎉");
        isGameOver = true;
    } else if (checkTicTacToeTie()) {
        updateTicTacToeStatus("무승부! 🤝");
        isGameOver = true;
    } else {
        isPlayerTurn = false;
        updateTicTacToeStatus("컴퓨터 생각 중... 💭");
        setTimeout(computerMove, 500);
    }
}

function renderTicTacToeBoard() {
    const boardElement = document.getElementById("tictactoe-board");
    if (!boardElement) return;

    boardElement.innerHTML = "";
    tictactoeBoard.forEach((cellValue, index) => {
        const cell = document.createElement("div");
        cell.classList.add("tictactoe-cell");
        if (cellValue === "X") cell.classList.add("x");
        if (cellValue === "O") cell.classList.add("o");
        cell.textContent = cellValue;
        cell.addEventListener("click", () => handleCellClick(index));
        boardElement.appendChild(cell);
    });
}

function resetTicTacToeGame() {
    tictactoeBoard = ["", "", "", "", "", "", "", "", ""];
    isPlayerTurn = true;
    isGameOver = false;
    updateTicTacToeStatus("당신의 차례 (X)");
    renderTicTacToeBoard();
}


/* ===================================================
   4. 업다운 숫자 맞추기 (Number Up & Down)
=================================================== */

let secretNumber = 0;
let remainingAttempts = 7;
let isUpdownOver = false;

function generateSecretNumber() {
    return Math.floor(Math.random() * 100) + 1;
}

function updateUpdownAttemptsDisplay() {
    const attemptsElement = document.getElementById("updown-attempts");
    if (attemptsElement) attemptsElement.textContent = remainingAttempts;
}

function updateUpdownHint(message) {
    const hintElement = document.getElementById("updown-hint");
    if (hintElement) hintElement.textContent = message;
}

function handleUpdownGuess() {
    if (isUpdownOver) return;

    const inputElement = document.getElementById("updown-input");
    const userGuess = parseInt(inputElement.value);

    if (isNaN(userGuess) || userGuess < 1 || userGuess > 100) {
        updateUpdownHint("1~100 사이 숫자 입력!");
        return;
    }

    remainingAttempts = remainingAttempts - 1;
    updateUpdownAttemptsDisplay();

    if (userGuess === secretNumber) {
        updateUpdownHint(`정답! 🎉 (${secretNumber})`);
        isUpdownOver = true;
    } else if (remainingAttempts === 0) {
        updateUpdownHint(`기회 소진! 정답은 ${secretNumber}`);
        isUpdownOver = true;
    } else if (userGuess < secretNumber) {
        updateUpdownHint(`더 큽니다! ▲ UP (${userGuess})`);
    } else {
        updateUpdownHint(`더 작습니다! ▼ DOWN (${userGuess})`);
    }

    inputElement.value = "";
    inputElement.focus();
}

function resetUpdownGame() {
    secretNumber = generateSecretNumber();
    remainingAttempts = 7;
    isUpdownOver = false;
    updateUpdownAttemptsDisplay();
    updateUpdownHint("1 ~ 100 사이 숫자");

    const inputElement = document.getElementById("updown-input");
    if (inputElement) inputElement.value = "";
}


/* ===================================================
   5. 5초 스피드 연타 게임 (Speed Clicker)
=================================================== */

let clickerScore = 0;
let isClickerActive = false;
let clickerTimerId = null;
let clickerTimeLeft = 5.0;

function updateClickerTimerDisplay() {
    const timerElement = document.getElementById("clicker-timer");
    if (timerElement) timerElement.textContent = clickerTimeLeft.toFixed(1);
}

function updateClickerScoreDisplay() {
    const scoreElement = document.getElementById("clicker-count");
    if (scoreElement) scoreElement.textContent = clickerScore;
}

function finishClickerGame() {
    clearInterval(clickerTimerId);
    isClickerActive = false;
    const cps = (clickerScore / 5).toFixed(1);
    const resultElement = document.getElementById("clicker-result");
    if (resultElement) {
        resultElement.textContent = `종료! 총 ${clickerScore}회 (초당 ${cps}회)`;
    }
}

function startClickerTimer() {
    isClickerActive = true;
    clickerTimerId = setInterval(() => {
        clickerTimeLeft = clickerTimeLeft - 0.1;
        if (clickerTimeLeft <= 0) {
            clickerTimeLeft = 0;
            updateClickerTimerDisplay();
            finishClickerGame();
        } else {
            updateClickerTimerDisplay();
        }
    }, 100);
}

function handleClickerButtonClick() {
    if (clickerTimeLeft <= 0) return;

    if (!isClickerActive && clickerScore === 0) {
        startClickerTimer();
        const resultElement = document.getElementById("clicker-result");
        if (resultElement) resultElement.textContent = "측정 중! 빠르게 연타!";
    }

    clickerScore = clickerScore + 1;
    updateClickerScoreDisplay();
}

function resetClickerGame() {
    clearInterval(clickerTimerId);
    clickerScore = 0;
    isClickerActive = false;
    clickerTimeLeft = 5.0;

    updateClickerTimerDisplay();
    updateClickerScoreDisplay();

    const resultElement = document.getElementById("clicker-result");
    if (resultElement) resultElement.textContent = "첫 클릭 시 5초 측정 시작";
}


/* ===================================================
   6. 가위바위보 연승 챌린지 (Rock-Paper-Scissors)
=================================================== */

let currentRpsStreak = 0;
let bestRpsStreak = 0;

const rpsIcons = {
    rock: "✊",
    scissors: "✌️",
    paper: "✋"
};

function getRandomCpuChoice() {
    const choices = ["rock", "scissors", "paper"];
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
}

function determineRpsWinner(playerChoice, cpuChoice) {
    if (playerChoice === cpuChoice) {
        return "tie";
    }
    if (
        (playerChoice === "rock" && cpuChoice === "scissors") ||
        (playerChoice === "scissors" && cpuChoice === "paper") ||
        (playerChoice === "paper" && cpuChoice === "rock")
    ) {
        return "win";
    }
    return "lose";
}

function updateRpsStreakDisplay() {
    const streakElement = document.getElementById("rps-streak");
    const bestElement = document.getElementById("rps-best");
    if (streakElement) streakElement.textContent = currentRpsStreak;
    if (bestElement) bestElement.textContent = bestRpsStreak;
}

function updateRpsMessage(message) {
    const messageElement = document.getElementById("rps-message");
    if (messageElement) messageElement.textContent = message;
}

function playRpsRound(playerChoice) {
    const cpuChoice = getRandomCpuChoice();

    const playerHand = document.getElementById("rps-player-hand");
    const cpuHand = document.getElementById("rps-cpu-hand");
    if (playerHand) playerHand.textContent = rpsIcons[playerChoice];
    if (cpuHand) cpuHand.textContent = rpsIcons[cpuChoice];

    const result = determineRpsWinner(playerChoice, cpuChoice);

    if (result === "win") {
        currentRpsStreak = currentRpsStreak + 1;
        if (currentRpsStreak > bestRpsStreak) {
            bestRpsStreak = currentRpsStreak;
        }
        updateRpsMessage(`승리했습니다! 🎉 현재 ${currentRpsStreak}연승 중!`);
    } else if (result === "tie") {
        updateRpsMessage(`비겼습니다! 🤝 연승이 유지됩니다.`);
    } else {
        currentRpsStreak = 0;
        updateRpsMessage(`아쉽게 졌습니다! 🤖 연승이 초기화되었습니다.`);
    }

    updateRpsStreakDisplay();
}

function resetRpsGame() {
    currentRpsStreak = 0;
    updateRpsStreakDisplay();
    updateRpsMessage("가위, 바위, 보 중 하나를 선택하세요!");

    const playerHand = document.getElementById("rps-player-hand");
    const cpuHand = document.getElementById("rps-cpu-hand");
    if (playerHand) playerHand.textContent = "❓";
    if (cpuHand) cpuHand.textContent = "❓";
}


/* ===================================================
   7. 미니 두더지 잡기 (Whack-a-Mole)
=================================================== */

let moleScore = 0;
let moleTimeLeft = 15;
let moleTimerId = null;
let molePopupId = null;
let isMoleGameRunning = false;

function updateMoleScoreDisplay() {
    const scoreElement = document.getElementById("mole-score");
    if (scoreElement) scoreElement.textContent = moleScore;
}

function updateMoleTimerDisplay() {
    const timerElement = document.getElementById("mole-timer");
    if (timerElement) timerElement.textContent = moleTimeLeft;
}

function removeCurrentMole() {
    const holes = document.querySelectorAll(".mole-hole");
    holes.forEach(hole => hole.classList.remove("has-mole"));
}

function showRandomMole() {
    removeCurrentMole();
    const holes = document.querySelectorAll(".mole-hole");
    if (holes.length === 0) return;

    const randomIndex = Math.floor(Math.random() * holes.length);
    holes[randomIndex].classList.add("has-mole");
}

function finishMoleGame() {
    clearInterval(moleTimerId);
    clearInterval(molePopupId);
    isMoleGameRunning = false;
    removeCurrentMole();

    const startBtn = document.getElementById("start-mole-btn");
    if (startBtn) startBtn.textContent = "다시 도전하기!";

    setTimeout(() => {
        alert(`시간 종료! 총 ${moleScore}마리의 두더지를 잡았습니다! 🐹`);
    }, 150);
}

function handleMoleHoleClick(holeElement) {
    if (!isMoleGameRunning) return;

    if (holeElement.classList.contains("has-mole")) {
        holeElement.classList.remove("has-mole");
        moleScore = moleScore + 1;
        updateMoleScoreDisplay();
    }
}

function startMoleGame() {
    if (isMoleGameRunning) return;

    moleScore = 0;
    moleTimeLeft = 15;
    isMoleGameRunning = true;
    updateMoleScoreDisplay();
    updateMoleTimerDisplay();

    const startBtn = document.getElementById("start-mole-btn");
    if (startBtn) startBtn.textContent = "게임 진행 중...";

    showRandomMole();
    molePopupId = setInterval(showRandomMole, 750);

    moleTimerId = setInterval(() => {
        moleTimeLeft = moleTimeLeft - 1;
        updateMoleTimerDisplay();
        if (moleTimeLeft <= 0) {
            finishMoleGame();
        }
    }, 1000);
}


/* ===================================================
   8. 행운의 주사위 대결 (Lucky Dice)
=================================================== */

let diceWins = 0;
let diceLosses = 0;

const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function rollSingleDice() {
    const value = Math.floor(Math.random() * 6) + 1;
    const face = diceFaces[value - 1];
    return { value: value, face: face };
}

function updateDiceScoreDisplay() {
    const winsElement = document.getElementById("dice-wins");
    const lossesElement = document.getElementById("dice-losses");
    if (winsElement) winsElement.textContent = diceWins;
    if (lossesElement) lossesElement.textContent = diceLosses;
}

function updateDiceMessage(message) {
    const messageElement = document.getElementById("dice-message");
    if (messageElement) messageElement.textContent = message;
}

function handleRollDice() {
    const playerFirst = rollSingleDice();
    const playerSecond = rollSingleDice();
    const playerSum = playerFirst.value + playerSecond.value;

    const cpuFirst = rollSingleDice();
    const cpuSecond = rollSingleDice();
    const cpuSum = cpuFirst.value + cpuSecond.value;

    // 주사위 기호 및 합계 화면 갱신
    const pDice1 = document.getElementById("player-dice-1");
    const pDice2 = document.getElementById("player-dice-2");
    const pSum = document.getElementById("player-dice-sum");
    if (pDice1) pDice1.textContent = playerFirst.face;
    if (pDice2) pDice2.textContent = playerSecond.face;
    if (pSum) pSum.textContent = playerSum;

    const cDice1 = document.getElementById("cpu-dice-1");
    const cDice2 = document.getElementById("cpu-dice-2");
    const cSum = document.getElementById("cpu-dice-sum");
    if (cDice1) cDice1.textContent = cpuFirst.face;
    if (cDice2) cDice2.textContent = cpuSecond.face;
    if (cSum) cSum.textContent = cpuSum;

    // 승패 판정
    if (playerSum > cpuSum) {
        diceWins = diceWins + 1;
        updateDiceMessage(`나(${playerSum}) > 컴퓨터(${cpuSum}) : 당신의 승리! 🎉`);
    } else if (playerSum < cpuSum) {
        diceLosses = diceLosses + 1;
        updateDiceMessage(`나(${playerSum}) < 컴퓨터(${cpuSum}) : 컴퓨터 승리! 🤖`);
    } else {
        updateDiceMessage(`나(${playerSum}) = 컴퓨터(${cpuSum}) : 무승부입니다! 🤝`);
    }

    updateDiceScoreDisplay();
}

function resetDiceGame() {
    diceWins = 0;
    diceLosses = 0;
    updateDiceScoreDisplay();
    updateDiceMessage("주사위를 굴려 더 높은 숫자를 뽑으세요!");

    const pDice1 = document.getElementById("player-dice-1");
    const pDice2 = document.getElementById("player-dice-2");
    const pSum = document.getElementById("player-dice-sum");
    if (pDice1) pDice1.textContent = "🎲";
    if (pDice2) pDice2.textContent = "🎲";
    if (pSum) pSum.textContent = "-";

    const cDice1 = document.getElementById("cpu-dice-1");
    const cDice2 = document.getElementById("cpu-dice-2");
    const cSum = document.getElementById("cpu-dice-sum");
    if (cDice1) cDice1.textContent = "🎲";
    if (cDice2) cDice2.textContent = "🎲";
    if (cSum) cSum.textContent = "-";
}


/* ===================================================
   9. 전용 게임 플레이 페이지 제어 (play.html)
=================================================== */

const arenaGamesData = {
    memory: {
        category: "01 PUZZLE",
        title: "Memory Match",
        desc: "12장의 카드를 뒤집어 같은 짝을 모두 찾는 클래식 기억력 게임입니다."
    },
    reaction: {
        category: "02 REFLEX",
        title: "Reaction Speed",
        desc: "화면이 초록색으로 바뀌는 찰나에 빠르게 반응하여 자신의 속도(ms)를 측정하세요."
    },
    tictactoe: {
        category: "03 STRATEGY",
        title: "Tic-Tac-Toe",
        desc: "컴퓨터와 번갈아가며 가로, 세로, 대각선 3줄을 먼저 완성하면 승리하는 지능형 대결입니다."
    },
    updown: {
        category: "04 LOGIC",
        title: "Up & Down",
        desc: "1부터 100 사이의 숨겨진 숫자를 7번의 기회 안에 UP/DOWN 힌트로 추리해 보세요."
    },
    clicker: {
        category: "05 SPEED",
        title: "Speed Clicker",
        desc: "5초 동안 버튼을 최대한 빠르게 연타하여 자신의 초당 클릭 속도(CPS)를 측정합니다."
    },
    rps: {
        category: "06 CHANCE",
        title: "Rock Paper Scissors",
        desc: "컴퓨터를 상대로 가위, 바위, 보를 겨루어 최고 몇 연승까지 기록할 수 있는지 도전하세요."
    },
    mole: {
        category: "07 ACTION",
        title: "Whack-a-Mole",
        desc: "3x3 구멍에서 불쑥 튀어나오는 두더지를 15초 동안 빠르게 잡아 점수를 획득하세요."
    },
    dice: {
        category: "08 LUCK",
        title: "Lucky Dice",
        desc: "컴퓨터와 주사위 2개를 굴려 더 높은 숫자의 합을 뽑는 사람이 승리하는 확률 게임입니다."
    }
};

function setupGameArena() {
    const arenaTitleElement = document.getElementById("arena-title");
    if (!arenaTitleElement) return; // play.html 페이지가 아닐 경우 실행하지 않음

    const urlParams = new URLSearchParams(window.location.search);
    const requestedGame = urlParams.get("game") || "memory";
    const selectedGame = arenaGamesData[requestedGame] ? requestedGame : "memory";

    // 1) 상단 게임 헤더 정보 표시
    const categoryElement = document.getElementById("arena-category");
    const descElement = document.getElementById("arena-desc");
    const gameInfo = arenaGamesData[selectedGame];

    if (categoryElement) categoryElement.textContent = gameInfo.category;
    if (arenaTitleElement) arenaTitleElement.textContent = gameInfo.title;
    if (descElement) descElement.textContent = gameInfo.desc;

    // 2) 요청된 게임의 패널만 화면에 표시
    const allPanels = document.querySelectorAll(".single-game-panel");
    allPanels.forEach(panel => panel.classList.remove("active"));

    const activePanel = document.getElementById(`game-panel-${selectedGame}`);
    if (activePanel) {
        activePanel.classList.add("active");
    }

    // 3) 하단 알약 버튼 강조
    const pillButtons = document.querySelectorAll(".game-pill");
    pillButtons.forEach(pill => {
        if (pill.getAttribute("href") === `play.html?game=${selectedGame}`) {
            pill.style.backgroundColor = "#1c1917";
            pill.style.color = "#ffffff";
            pill.style.borderColor = "#1c1917";
        }
    });
}


/* ===================================================
   10. 페이지 로드 시 이벤트 연결 (초기화)
=================================================== */
window.addEventListener("DOMContentLoaded", () => {
    // A. [index.html] 8-Card 3D 회전문 초기화
    const carouselScene = document.getElementById("carousel-scene");
    if (carouselScene) {
        update3DPanoramaView();
        window.addEventListener("resize", update3DPanoramaView);

        // 이전 / 다음 버튼
        const prevButton = document.getElementById("prev-btn");
        const nextButton = document.getElementById("next-btn");
        if (prevButton) prevButton.addEventListener("click", goToPrevGame);
        if (nextButton) nextButton.addEventListener("click", goToNextGame);

        // 인디케이터 점 클릭
        const dots = document.querySelectorAll(".indicator-dot");
        dots.forEach((dot) => {
            dot.addEventListener("click", (e) => {
                const index = parseInt(e.target.dataset.index);
                goToGame(index);
            });
        });

        // 카드 클릭 시 처리: 가운데 카드가 아니면 정면으로 회전
        const cards = document.querySelectorAll(".carousel-3d-card");
        cards.forEach((card) => {
            card.addEventListener("click", (e) => {
                if (didDragMove) return; // 드래그 중인 경우 클릭 무시
                const cardIndex = parseInt(card.dataset.index);
                if (cardIndex !== currentCenterIndex) {
                    e.preventDefault();
                    goToGame(cardIndex);
                }
            });
        });

        // 플레이하기 버튼 클릭 시: 드래그 이동 중이었다면 페이지 이동 방지
        const playButtons = document.querySelectorAll(".btn-play-now");
        playButtons.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                if (didDragMove) {
                    e.preventDefault();
                }
            });
        });

        // 마우스 드래그
        carouselScene.addEventListener("mousedown", (e) => {
            e.preventDefault();
            startDrag(e.clientX);
        });
        window.addEventListener("mousemove", (e) => moveDrag(e.clientX));
        window.addEventListener("mouseup", endDrag);

        // 모바일 터치 드래그
        carouselScene.addEventListener("touchstart", (e) => startDrag(e.touches[0].clientX), { passive: true });
        window.addEventListener("touchmove", (e) => moveDrag(e.touches[0].clientX), { passive: true });
        window.addEventListener("touchend", endDrag);
    }

    // B. [play.html] 전용 아레나 페이지 초기화
    setupGameArena();

    // C. 8개 게임 이벤트 리스너 안전 연결 (각 요소가 페이지에 존재할 때만 실행)
    // 1) 카드 짝 맞추기
    resetMemoryGame();
    const resetMemoryBtn = document.getElementById("reset-memory-btn");
    if (resetMemoryBtn) resetMemoryBtn.addEventListener("click", resetMemoryGame);

    // 2) 반응 속도
    const reactionBox = document.getElementById("reaction-box");
    if (reactionBox) reactionBox.addEventListener("click", onReactionBoxClick);
    const resetReactionBtn = document.getElementById("reset-reaction-btn");
    if (resetReactionBtn) resetReactionBtn.addEventListener("click", resetReactionGame);

    // 3) 틱택토
    resetTicTacToeGame();
    const resetTicTacToeBtn = document.getElementById("reset-tictactoe-btn");
    if (resetTicTacToeBtn) resetTicTacToeBtn.addEventListener("click", resetTicTacToeGame);

    // 4) 업다운
    resetUpdownGame();
    const updownGuessBtn = document.getElementById("updown-guess-btn");
    if (updownGuessBtn) updownGuessBtn.addEventListener("click", handleUpdownGuess);
    const updownInput = document.getElementById("updown-input");
    if (updownInput) {
        updownInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleUpdownGuess();
        });
    }
    const resetUpdownBtn = document.getElementById("reset-updown-btn");
    if (resetUpdownBtn) resetUpdownBtn.addEventListener("click", resetUpdownGame);

    // 5) 스피드 연타
    resetClickerGame();
    const clickerBtn = document.getElementById("clicker-btn");
    if (clickerBtn) clickerBtn.addEventListener("click", handleClickerButtonClick);
    const resetClickerBtn = document.getElementById("reset-clicker-btn");
    if (resetClickerBtn) resetClickerBtn.addEventListener("click", resetClickerGame);

    // 6) 가위바위보
    const rpsButtons = document.querySelectorAll(".btn-rps");
    rpsButtons.forEach(button => {
        button.addEventListener("click", () => {
            const choice = button.dataset.choice;
            playRpsRound(choice);
        });
    });
    const resetRpsBtn = document.getElementById("reset-rps-btn");
    if (resetRpsBtn) resetRpsBtn.addEventListener("click", resetRpsGame);

    // 7) 두더지 잡기
    const startMoleBtn = document.getElementById("start-mole-btn");
    if (startMoleBtn) startMoleBtn.addEventListener("click", startMoleGame);
    const moleHoles = document.querySelectorAll(".mole-hole");
    moleHoles.forEach(hole => {
        hole.addEventListener("click", () => handleMoleHoleClick(hole));
    });

    // 8) 주사위 대결
    const rollDiceBtn = document.getElementById("roll-dice-btn");
    if (rollDiceBtn) rollDiceBtn.addEventListener("click", handleRollDice);
});
