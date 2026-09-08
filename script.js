/* ===================================================
   0. 5-Card 3D 파노라마 회전문 제어 기능 (Cover Arc)
=================================================== */

let currentCenterIndex = 0;
const totalGamesCount = 5;

let isDragging = false;
let dragStartX = 0;
let currentDragDistance = 0;

// 1) 화면 너비에 따라 카드 간격(offset) 스타일을 계산하는 함수
function getPanoramaOffsetStyle(offset) {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 950;

    let stepX = 230;
    let stepZ = 50;
    let angle = 12;
    let scaleStep = 0.07;

    if (isMobile) {
        stepX = 110;
        stepZ = 40;
        angle = 10;
        scaleStep = 0.12;
    } else if (isTablet) {
        stepX = 180;
        stepZ = 45;
        angle = 11;
    }

    if (offset === 0) {
        return {
            transform: `translateX(0px) translateZ(0px) rotateY(0deg) scale(1)`,
            opacity: 1,
            zIndex: 20,
            pointerEvents: "auto"
        };
    } else {
        const posX = offset * stepX;
        const posZ = -Math.abs(offset) * stepZ;
        const rotY = -offset * (Math.abs(offset) === 1 ? angle : angle * 1.5);
        const scale = 1 - Math.abs(offset) * scaleStep;
        const opacity = Math.abs(offset) === 1 ? 0.92 : 0.75;
        const zIndex = 15 - Math.abs(offset) * 5;

        return {
            transform: `translateX(${posX}px) translateZ(${posZ}px) rotateY(${rotY}deg) scale(${scale})`,
            opacity: opacity,
            zIndex: zIndex,
            pointerEvents: "auto"
        };
    }
}

// 2) 5장의 카드를 3D 부채꼴 곡면으로 한 번에 배치하는 함수
function update3DPanoramaView() {
    const cards = document.querySelectorAll(".carousel-3d-card");
    const dots = document.querySelectorAll(".indicator-dot");

    cards.forEach((card, index) => {
        let offset = (index - currentCenterIndex + totalGamesCount) % totalGamesCount;
        if (offset > 2) {
            offset = offset - totalGamesCount;
        }

        const style = getPanoramaOffsetStyle(offset);
        card.style.transform = style.transform;
        card.style.opacity = style.opacity;
        card.style.zIndex = style.zIndex;
        card.style.pointerEvents = style.pointerEvents;

        if (offset === 0) {
            card.classList.add("active");
        } else {
            card.classList.remove("active");
        }
    });

    dots.forEach((dot, index) => {
        if (index === currentCenterIndex) {
            dot.classList.add("active");
        } else {
            dot.classList.remove("active");
        }
    });
}

// 3) 다음 게임으로 회전하는 함수
function goToNextGame() {
    currentCenterIndex = (currentCenterIndex + 1) % totalGamesCount;
    update3DPanoramaView();
}

// 4) 이전 게임으로 회전하는 함수
function goToPrevGame() {
    currentCenterIndex = (currentCenterIndex - 1 + totalGamesCount) % totalGamesCount;
    update3DPanoramaView();
}

// 5) 특정 번호의 게임을 정면으로 부르는 함수
function goToGame(targetIndex) {
    currentCenterIndex = targetIndex;
    update3DPanoramaView();
}

// 6) 마우스/터치 드래그 시작 함수
function startDrag(clientX) {
    isDragging = true;
    dragStartX = clientX;
    currentDragDistance = 0;

    const cylinder = document.getElementById("carousel-cylinder");
    const scene = document.getElementById("carousel-scene");
    if (cylinder) cylinder.classList.add("dragging");
    if (scene) scene.classList.add("grabbing");
}

// 7) 마우스/터치 드래그 중 실시간 추적 함수
function moveDrag(clientX) {
    if (!isDragging) return;
    currentDragDistance = clientX - dragStartX;

    const cylinder = document.getElementById("carousel-cylinder");
    if (cylinder) {
        const shiftX = currentDragDistance * 0.7;
        const tiltAngle = currentDragDistance * 0.03;
        cylinder.style.transform = `translateX(${shiftX}px) rotateY(${tiltAngle}deg)`;
    }
}

// 8) 마우스/터치 드래그 종료 시 0.32초 스냅 안착 함수
function endDrag() {
    if (!isDragging) return;
    isDragging = false;

    const cylinder = document.getElementById("carousel-cylinder");
    const scene = document.getElementById("carousel-scene");
    if (cylinder) {
        cylinder.classList.remove("dragging");
        cylinder.style.transform = "";
    }
    if (scene) scene.classList.remove("grabbing");

    // 40px 이상 밀었을 때 다음/이전으로 전환
    if (currentDragDistance > 40) {
        goToPrevGame();
    } else if (currentDragDistance < -40) {
        goToNextGame();
    }
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
   6. 페이지 로드 시 이벤트 연결 (초기화)
=================================================== */
window.addEventListener("DOMContentLoaded", () => {
    // 1) 5-Card 3D 파노라마 초기 배치
    update3DPanoramaView();

    // 2) 윈도우 크기 변경 시 재배치
    window.addEventListener("resize", update3DPanoramaView);

    // 3) 이전 / 다음 버튼 연결
    const prevButton = document.getElementById("prev-btn");
    const nextButton = document.getElementById("next-btn");
    if (prevButton) prevButton.addEventListener("click", goToPrevGame);
    if (nextButton) nextButton.addEventListener("click", goToNextGame);

    // 4) 하단 인디케이터 점 클릭 이벤트 연결
    const dots = document.querySelectorAll(".indicator-dot");
    dots.forEach((dot) => {
        dot.addEventListener("click", (e) => {
            const index = parseInt(e.target.dataset.index);
            goToGame(index);
        });
    });

    // 5) 양옆에 보이는 카드를 직접 클릭했을 때 해당 카드를 가운데로 즉시 회전시키는 기능
    const cards = document.querySelectorAll(".carousel-3d-card");
    cards.forEach((card) => {
        card.addEventListener("click", (e) => {
            const cardIndex = parseInt(card.dataset.index);
            if (cardIndex !== currentCenterIndex) {
                goToGame(cardIndex);
            }
        });
    });

    // 6) 실시간 마우스 및 터치 드래그 이벤트 연결
    const scene = document.getElementById("carousel-scene");
    if (scene) {
        scene.addEventListener("mousedown", (e) => {
            e.preventDefault();
            startDrag(e.clientX);
        });
        window.addEventListener("mousemove", (e) => moveDrag(e.clientX));
        window.addEventListener("mouseup", endDrag);

        // 모바일 터치 이벤트
        scene.addEventListener("touchstart", (e) => startDrag(e.touches[0].clientX), { passive: true });
        window.addEventListener("touchmove", (e) => moveDrag(e.touches[0].clientX), { passive: true });
        window.addEventListener("touchend", endDrag);
    }

    // 7) 5가지 게임 초기화
    resetMemoryGame();
    const resetMemoryBtn = document.getElementById("reset-memory-btn");
    if (resetMemoryBtn) resetMemoryBtn.addEventListener("click", resetMemoryGame);

    const reactionBox = document.getElementById("reaction-box");
    if (reactionBox) reactionBox.addEventListener("click", onReactionBoxClick);
    const resetReactionBtn = document.getElementById("reset-reaction-btn");
    if (resetReactionBtn) resetReactionBtn.addEventListener("click", resetReactionGame);

    resetTicTacToeGame();
    const resetTicTacToeBtn = document.getElementById("reset-tictactoe-btn");
    if (resetTicTacToeBtn) resetTicTacToeBtn.addEventListener("click", resetTicTacToeGame);

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

    resetClickerGame();
    const clickerBtn = document.getElementById("clicker-btn");
    if (clickerBtn) clickerBtn.addEventListener("click", handleClickerButtonClick);
    const resetClickerBtn = document.getElementById("reset-clicker-btn");
    if (resetClickerBtn) resetClickerBtn.addEventListener("click", resetClickerGame);
});
