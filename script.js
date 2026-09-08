/* ===================================================
   1. 카드 짝 맞추기 게임 (Memory Match)
=================================================== */

// 사용할 카드 기호 (6종류 x 2장 = 총 12장)
const cardSymbols = ['▲', '▲', '●', '●', '■', '■', '★', '★', '◆', '◆', '✦', '✦'];

// 게임 상태 변수
let flippedCards = [];
let matchedPairsCount = 0;
let totalMovesCount = 0;
let isBoardLocked = false;

// 1) 배열을 무작위로 섞는 함수
function shuffleSymbols(array) {
    return array.sort(() => Math.random() - 0.5);
}

// 2) 시도 횟수 화면을 갱신하는 함수
function updateMovesDisplay() {
    const movesElement = document.getElementById("moves-count");
    if (movesElement) {
        movesElement.textContent = totalMovesCount;
    }
}

// 3) 찾은 짝 개수 화면을 갱신하는 함수
function updatePairsDisplay() {
    const pairsElement = document.getElementById("pairs-count");
    if (pairsElement) {
        pairsElement.textContent = matchedPairsCount;
    }
}

// 4) 카드 1장의 HTML 요소를 만드는 함수
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

// 5) 두 카드가 일치하는지 확인하는 함수
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

        // 6쌍을 모두 맞췄을 때
        if (matchedPairsCount === 6) {
            setTimeout(() => {
                alert("축하합니다! 모든 짝을 맞추셨습니다!");
            }, 300);
        }
    } else {
        // 일치하지 않으면 0.7초 뒤 다시 뒤집기
        setTimeout(() => {
            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");
            resetTurn();
        }, 700);
    }
}

// 6) 한 턴이 끝났을 때 임시 상태를 비우는 함수
function resetTurn() {
    flippedCards = [];
    isBoardLocked = false;
}

// 7) 카드를 클릭했을 때 실행되는 함수
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

// 8) 카드 게임을 초기화하고 다시 시작하는 함수
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
        const cardElement = createSingleCard(symbol);
        boardElement.appendChild(cardElement);
    });
}


/* ===================================================
   2. 반응 속도 테스트 게임 (Reaction Speed Test)
=================================================== */

let reactionState = "waiting";
let timerId = null;
let startTime = 0;

// 1) 반응 속도 박스의 화면 텍스트 및 스타일을 바꾸는 함수
function setReactionBoxState(newState, text, icon) {
    const box = document.getElementById("reaction-box");
    const textElement = document.getElementById("reaction-text");
    const iconElement = document.getElementById("reaction-icon");
    if (!box) return;

    box.className = "reaction-box-large " + newState;
    reactionState = newState;
    textElement.textContent = text;
    iconElement.textContent = icon;
}

// 2) 반응 속도 테스트를 시작(빨간색 대기 화면)하는 함수
function startReactionWaiting() {
    setReactionBoxState("ready", "초록색이 되면 즉시 클릭하세요!", "⏱");

    const randomDelay = Math.floor(Math.random() * 2500) + 1500;
    timerId = setTimeout(() => {
        startTime = Date.now();
        setReactionBoxState("now", "지금 클릭하세요!", "⚡");
    }, randomDelay);
}

// 3) 너무 일찍 클릭했을 때 처리 함수
function handleTooEarlyClick() {
    clearTimeout(timerId);
    setReactionBoxState("result", "너무 일찍 눌렀습니다! 다시 시도하세요.", "✕");
}

// 4) 제때 클릭하여 반응 속도를 기록하는 함수
function recordReactionTime() {
    const reactionTime = Date.now() - startTime;
    const resultElement = document.getElementById("reaction-result");
    if (resultElement) {
        resultElement.textContent = reactionTime + " ms";
    }
    setReactionBoxState("result", reactionTime + " ms! 클릭하여 다시 도전", "✓");
}

// 5) 반응 속도 박스 클릭 이벤트 분기 함수
function onReactionBoxClick() {
    if (reactionState === "waiting" || reactionState === "result") {
        startReactionWaiting();
    } else if (reactionState === "ready") {
        handleTooEarlyClick();
    } else if (reactionState === "now") {
        recordReactionTime();
    }
}

// 6) 반응 속도 테스트 완전 초기화 함수
function resetReactionGame() {
    clearTimeout(timerId);
    setReactionBoxState("waiting", "클릭하여 시작하기", "●");
    const resultElement = document.getElementById("reaction-result");
    if (resultElement) {
        resultElement.textContent = "-";
    }
}


/* ===================================================
   3. 게임 전용 페이지 탭 전환 기능 (play.html)
=================================================== */

// 선택된 탭(memory 또는 reaction)으로 화면을 전환하는 함수
function switchGameTab(selectedGame) {
    const memoryTabButton = document.getElementById("tab-btn-memory");
    const reactionTabButton = document.getElementById("tab-btn-reaction");
    const memoryPanel = document.getElementById("panel-memory");
    const reactionPanel = document.getElementById("panel-reaction");

    if (!memoryTabButton || !reactionTabButton) return;

    if (selectedGame === "memory") {
        memoryTabButton.classList.add("active");
        reactionTabButton.classList.remove("active");
        memoryPanel.classList.add("active");
        reactionPanel.classList.remove("active");
    } else if (selectedGame === "reaction") {
        reactionTabButton.classList.add("active");
        memoryTabButton.classList.remove("active");
        reactionPanel.classList.add("active");
        memoryPanel.classList.remove("active");
    }
}


/* ===================================================
   4. 페이지 로드 시 이벤트 연결 (초기화)
=================================================== */
window.addEventListener("DOMContentLoaded", () => {
    // 탭 전환 버튼 연결
    const memoryTabButton = document.getElementById("tab-btn-memory");
    const reactionTabButton = document.getElementById("tab-btn-reaction");

    if (memoryTabButton && reactionTabButton) {
        memoryTabButton.addEventListener("click", () => switchGameTab("memory"));
        reactionTabButton.addEventListener("click", () => switchGameTab("reaction"));
    }

    // 카드 짝 맞추기 게임 시작
    resetMemoryGame();
    const resetMemoryButton = document.getElementById("reset-memory-btn");
    if (resetMemoryButton) {
        resetMemoryButton.addEventListener("click", resetMemoryGame);
    }

    // 반응 속도 테스트 박스 이벤트 연결
    const reactionBox = document.getElementById("reaction-box");
    if (reactionBox) {
        reactionBox.addEventListener("click", onReactionBoxClick);
    }

    const resetReactionButton = document.getElementById("reset-reaction-btn");
    if (resetReactionButton) {
        resetReactionButton.addEventListener("click", resetReactionGame);
    }
});
