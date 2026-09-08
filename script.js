/* ===================================================
   0. 회전문 (캐러셀 슬라이더) 제어 기능
=================================================== */

let currentSlideIndex = 0;
const totalSlidesCount = 5;

// 화면 슬라이드 및 인디케이터를 갱신하는 함수
function updateCarouselView() {
    const track = document.getElementById("carousel-track");
    const dots = document.querySelectorAll(".indicator-dot");
    if (!track) return;

    // 슬라이드 이동 (-100% * 인덱스)
    track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;

    // 하단 동그라미 인디케이터 활성화 갱신
    dots.forEach((dot, index) => {
        if (index === currentSlideIndex) {
            dot.classList.add("active");
        } else {
            dot.classList.remove("active");
        }
    });
}

// 이전 게임으로 이동하는 함수
function goToPrevSlide() {
    currentSlideIndex = (currentSlideIndex - 1 + totalSlidesCount) % totalSlidesCount;
    updateCarouselView();
}

// 다음 게임으로 이동하는 함수
function goToNextSlide() {
    currentSlideIndex = (currentSlideIndex + 1) % totalSlidesCount;
    updateCarouselView();
}

// 특정 번호의 게임으로 바로 이동하는 함수
function goToSlide(targetIndex) {
    currentSlideIndex = targetIndex;
    updateCarouselView();
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
    setReactionBoxState("ready", "초록색이 되면 즉시 클릭하세요!", "⏱");

    const randomDelay = Math.floor(Math.random() * 2500) + 1500;
    reactionTimerId = setTimeout(() => {
        startTime = Date.now();
        setReactionBoxState("now", "지금 클릭하세요!", "⚡");
    }, randomDelay);
}

function handleTooEarlyClick() {
    clearTimeout(reactionTimerId);
    setReactionBoxState("result", "너무 일찍 눌렀습니다! 다시 시도하세요.", "✕");
}

function recordReactionTime() {
    const reactionTime = Date.now() - startTime;
    const resultElement = document.getElementById("reaction-result");
    if (resultElement) resultElement.textContent = reactionTime + " ms";
    setReactionBoxState("result", reactionTime + " ms! 클릭하여 다시 도전", "✓");
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
    setReactionBoxState("waiting", "클릭하여 시작하기", "●");
    const resultElement = document.getElementById("reaction-result");
    if (resultElement) resultElement.textContent = "-";
}


/* ===================================================
   3. 틱택토 게임 (Tic-Tac-Toe vs 컴퓨터)
=================================================== */

let tictactoeBoard = ["", "", "", "", "", "", "", "", ""];
let isPlayerTurn = true;
let isGameOver = false;

// 3줄 승리 조건 패턴 (8가지 경우)
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // 가로 3줄
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // 세로 3줄
    [0, 4, 8], [2, 4, 6]             // 대각선 2줄
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

    // 비어 있는 칸 찾기
    const emptyIndices = [];
    tictactoeBoard.forEach((val, idx) => {
        if (val === "") emptyIndices.push(idx);
    });

    if (emptyIndices.length === 0) return;

    // 랜덤으로 빈 칸 중 하나 선택
    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    tictactoeBoard[randomIndex] = "O";

    renderTicTacToeBoard();

    if (checkTicTacToeWinner("O")) {
        updateTicTacToeStatus("컴퓨터가 승리했습니다! 🤖");
        isGameOver = true;
    } else if (checkTicTacToeTie()) {
        updateTicTacToeStatus("무승부입니다! 🤝");
        isGameOver = true;
    } else {
        isPlayerTurn = true;
        updateTicTacToeStatus("당신의 차례입니다 (X)");
    }
}

function handleCellClick(index) {
    if (isGameOver || !isPlayerTurn || tictactoeBoard[index] !== "") return;

    // 플레이어의 수 (X)
    tictactoeBoard[index] = "X";
    renderTicTacToeBoard();

    if (checkTicTacToeWinner("X")) {
        updateTicTacToeStatus("축하합니다! 당신이 승리했습니다! 🎉");
        isGameOver = true;
    } else if (checkTicTacToeTie()) {
        updateTicTacToeStatus("무승부입니다! 🤝");
        isGameOver = true;
    } else {
        isPlayerTurn = false;
        updateTicTacToeStatus("컴퓨터가 생각 중입니다... 💭");
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
    updateTicTacToeStatus("당신의 차례입니다 (X)");
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
        updateUpdownHint("1부터 100 사이의 숫자를 입력해 주세요!");
        return;
    }

    remainingAttempts = remainingAttempts - 1;
    updateUpdownAttemptsDisplay();

    if (userGuess === secretNumber) {
        updateUpdownHint(`정답입니다! 🎉 정답: ${secretNumber}`);
        isUpdownOver = true;
    } else if (remainingAttempts === 0) {
        updateUpdownHint(`기회를 모두 소진했습니다! 😢 정답은 ${secretNumber}였습니다.`);
        isUpdownOver = true;
    } else if (userGuess < secretNumber) {
        updateUpdownHint(`더 큰 숫자입니다! ▲ UP! (입력: ${userGuess})`);
    } else {
        updateUpdownHint(`더 작은 숫자입니다! ▼ DOWN! (입력: ${userGuess})`);
    }

    inputElement.value = "";
    inputElement.focus();
}

function resetUpdownGame() {
    secretNumber = generateSecretNumber();
    remainingAttempts = 7;
    isUpdownOver = false;
    updateUpdownAttemptsDisplay();
    updateUpdownHint("1 ~ 100 사이의 숫자를 입력하세요.");

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
        resultElement.textContent = `종료! 5초간 총 ${clickerScore}회 (초당 ${cps}회 클릭)`;
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
    // 5초가 이미 끝났다면 무시
    if (clickerTimeLeft <= 0) return;

    // 첫 클릭 시 카운트다운 시작
    if (!isClickerActive && clickerScore === 0) {
        startClickerTimer();
        const resultElement = document.getElementById("clicker-result");
        if (resultElement) resultElement.textContent = "측정 중! 빠르게 연타하세요!";
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
    if (resultElement) resultElement.textContent = "첫 클릭 시 5초 측정이 시작됩니다.";
}


/* ===================================================
   6. 페이지 로드 시 이벤트 연결 (초기화)
=================================================== */
window.addEventListener("DOMContentLoaded", () => {
    // 1) 캐러셀 이전/다음 및 인디케이터 점 버튼 연결
    const prevButton = document.getElementById("prev-btn");
    const nextButton = document.getElementById("next-btn");
    if (prevButton) prevButton.addEventListener("click", goToPrevSlide);
    if (nextButton) nextButton.addEventListener("click", goToNextSlide);

    const dots = document.querySelectorAll(".indicator-dot");
    dots.forEach((dot) => {
        dot.addEventListener("click", (e) => {
            const index = parseInt(e.target.dataset.index);
            goToSlide(index);
        });
    });

    // 2) 게임 1 (카드 맞추기) 초기화
    resetMemoryGame();
    const resetMemoryBtn = document.getElementById("reset-memory-btn");
    if (resetMemoryBtn) resetMemoryBtn.addEventListener("click", resetMemoryGame);

    // 3) 게임 2 (반응 속도) 초기화
    const reactionBox = document.getElementById("reaction-box");
    if (reactionBox) reactionBox.addEventListener("click", onReactionBoxClick);
    const resetReactionBtn = document.getElementById("reset-reaction-btn");
    if (resetReactionBtn) resetReactionBtn.addEventListener("click", resetReactionGame);

    // 4) 게임 3 (틱택토) 초기화
    resetTicTacToeGame();
    const resetTicTacToeBtn = document.getElementById("reset-tictactoe-btn");
    if (resetTicTacToeBtn) resetTicTacToeBtn.addEventListener("click", resetTicTacToeGame);

    // 5) 게임 4 (업다운) 초기화
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

    // 6) 게임 5 (스피드 연타) 초기화
    resetClickerGame();
    const clickerBtn = document.getElementById("clicker-btn");
    if (clickerBtn) clickerBtn.addEventListener("click", handleClickerButtonClick);
    const resetClickerBtn = document.getElementById("reset-clicker-btn");
    if (resetClickerBtn) resetClickerBtn.addEventListener("click", resetClickerGame);
});
