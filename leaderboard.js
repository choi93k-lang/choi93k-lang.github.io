// ===================================================
// Firebase SDK 모듈 불러오기 (CDN)
// ===================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===================================================
// 1. Firebase 프로젝트 설정값
// ===================================================
const firebaseConfig = {
    apiKey: "AIzaSyA1Ev-JSHrVxQdUiQZLMvj3_6Ec6kpVYkw",
    authDomain: "first-firebase-f7450.firebaseapp.com",
    projectId: "first-firebase-f7450",
    storageBucket: "first-firebase-f7450.firebasestorage.app",
    messagingSenderId: "1088636211034",
    appId: "1:1088636211034:web:c9df2b8aabb9c817296d63",
    measurementId: "G-J326F7Z2B3"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const database = getFirestore(app);
const leaderboardCollection = collection(database, "leaderboards");

// ===================================================
// 2. 게임별 랭킹 기준 설정 (8종 게임)
// ===================================================
const gameConfig = {
    clicker:   { title: "5초 스피드 연타", order: "desc", unit: "회" },
    reaction:  { title: "반응 속도 측정", order: "asc",  unit: "ms" },
    memory:    { title: "카드 짝 맞추기", order: "asc",  unit: "회" },
    updown:    { title: "업다운 추리",   order: "asc",  unit: "회" },
    rps:       { title: "가위바위보 연승", order: "desc", unit: "연승" },
    mole:      { title: "두더지 잡기",   order: "desc", unit: "마리" },
    tictactoe: { title: "스마트 틱택토", order: "desc", unit: "점" },
    dice:      { title: "주사위 대결",   order: "desc", unit: "승" }
};

// 현재 게임 임시 저장용 변수
let currentActiveGameId = "memory";
let pendingScoreNumber = 0;
let pendingScoreDisplay = "";

// ===================================================
// 3. HTML 화면 요소(DOM) 가져오기
// ===================================================
const leaderboardList = document.getElementById("leaderboard-list");
const leaderboardGameSubtitle = document.getElementById("leaderboard-game-subtitle");

const scoreModal = document.getElementById("score-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalGameTitle = document.getElementById("modal-game-title");
const modalScoreDisplay = document.getElementById("modal-score-display");
const scoreSubmitForm = document.getElementById("score-submit-form");
const playerNicknameInput = document.getElementById("player-nickname-input");
const submitScoreBtn = document.getElementById("submit-score-btn");

// ===================================================
// 4. 단일 기능 헬퍼 함수들
// ===================================================

/**
 * 기능: 악성 스크립트 실행(XSS) 방지
 */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 기능: URL 쿼리 파라미터에서 현재 활성 게임 ID를 구합니다. (예: ?game=clicker)
 */
function getCurrentGameIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get("game");
    return (gameId && gameConfig[gameId]) ? gameId : "memory";
}

/**
 * 기능: 순위(1~5)에 따른 메달/뱃지 이모지를 반환합니다.
 */
function getRankBadgeHtml(rank) {
    if (rank === 1) return `👑 1`;
    if (rank === 2) return `🥈 2`;
    if (rank === 3) return `🥉 3`;
    return `${rank}`;
}

/**
 * 기능: 특정 게임의 TOP 5 리더보드를 Firestore에서 불러와 화면에 표시합니다.
 */
async function loadLeaderboard(gameId) {
    if (!leaderboardList) return;

    currentActiveGameId = gameId;
    const config = gameConfig[gameId] || gameConfig["memory"];

    if (leaderboardGameSubtitle) {
        leaderboardGameSubtitle.textContent = `[${config.title}] 실시간 랭킹`;
    }

    leaderboardList.innerHTML = `<div class="leaderboard-loading">랭킹을 불러오는 중...</div>`;

    try {
        // 복합 색인(Index) 오류를 방지하기 위해 단일 where 조건으로 불러온 뒤 자바스크립트로 안전하게 TOP 5 정렬
        const scoreQuery = query(
            leaderboardCollection, 
            where("gameId", "==", gameId),
            limit(100)
        );
        const snapshot = await getDocs(scoreQuery);

        if (snapshot.empty) {
            leaderboardList.innerHTML = `
                <div class="leaderboard-empty">
                    아직 등록된 기록이 없습니다.<br>
                    첫 번째 1위(👑)의 주인공이 되어보세요!
                </div>
            `;
            return;
        }

        // 가져온 문서들을 배열로 변환
        const records = [];
        snapshot.forEach(doc => {
            records.push(doc.data());
        });

        // 정렬 순서에 따라 정렬 (asc: 낮은 순, desc: 높은 순)
        records.sort((a, b) => {
            if (config.order === "asc") {
                return a.score - b.score;
            } else {
                return b.score - a.score;
            }
        });

        // 상위 5개만 추출
        const top5 = records.slice(0, 5);

        leaderboardList.innerHTML = "";
        top5.forEach((record, index) => {
            const rank = index + 1;
            const safeNickname = escapeHtml(record.nickname || "익명");
            const safeDisplay = escapeHtml(record.scoreDisplay || `${record.score}`);

            const row = document.createElement("div");
            row.className = `leaderboard-row rank-${rank}`;
            row.innerHTML = `
                <span class="leaderboard-rank-badge">${getRankBadgeHtml(rank)}</span>
                <span class="leaderboard-player-name">${safeNickname}</span>
                <strong class="leaderboard-score-val">${safeDisplay}</strong>
            `;
            leaderboardList.appendChild(row);
        });

    } catch (error) {
        console.error("리더보드 로드 오류:", error);
        leaderboardList.innerHTML = `
            <div class="leaderboard-empty" style="color: #ef4444;">
                랭킹을 불러오지 못했습니다.
            </div>
        `;
    }
}

// 전역에서 게임 전환 시 호출할 수 있도록 등록
window.loadLeaderboard = loadLeaderboard;

/**
 * 기능: 게임 종료 시 전역에서 안전하게 호출할 수 있는 점수 등록 모달 열기 함수
 */
function openLeaderboardSubmit(gameId, scoreNumber, scoreDisplay) {
    if (!scoreModal) return;

    currentActiveGameId = gameId || getCurrentGameIdFromUrl();
    pendingScoreNumber = Number(scoreNumber) || 0;
    pendingScoreDisplay = String(scoreDisplay || scoreNumber);

    const config = gameConfig[currentActiveGameId] || gameConfig["memory"];

    if (modalGameTitle) modalGameTitle.textContent = config.title;
    if (modalScoreDisplay) modalScoreDisplay.textContent = pendingScoreDisplay;
    if (playerNicknameInput) {
        playerNicknameInput.value = "";
        setTimeout(() => playerNicknameInput.focus(), 150);
    }

    scoreModal.style.display = "flex";
}

// 전역 윈도우 객체에 안전 훅으로 등록 (script.js에서 손쉽게 호출 가능)
window.openLeaderboardSubmit = openLeaderboardSubmit;

/**
 * 기능: 점수 등록 모달 닫기
 */
function closeScoreModal() {
    if (scoreModal) {
        scoreModal.style.display = "none";
    }
}

/**
 * 기능: 사용자가 닉네임을 입력하고 점수 등록 버튼을 눌렀을 때 처리
 */
async function handleScoreSubmit(event) {
    event.preventDefault();

    const nickname = playerNicknameInput.value.trim();

    if (!nickname) {
        alert("닉네임을 입력해 주세요.");
        playerNicknameInput.focus();
        return;
    }

    if (nickname.length > 12) {
        alert("닉네임은 최대 12자까지 가능합니다.");
        return;
    }

    submitScoreBtn.disabled = true;
    submitScoreBtn.textContent = "등록하는 중...";

    try {
        // Firestore 'leaderboards' 컬렉션에 새 점수 문서 저장
        await addDoc(leaderboardCollection, {
            gameId: currentActiveGameId,
            nickname: nickname,
            score: pendingScoreNumber,
            scoreDisplay: pendingScoreDisplay,
            createdAt: serverTimestamp()
        });

        alert(`축하합니다! ${nickname}님의 기록이 명예의 전당에 등록되었습니다! 🎉`);
        closeScoreModal();

        // 순위표 즉시 갱신
        await loadLeaderboard(currentActiveGameId);

    } catch (error) {
        console.error("점수 등록 오류:", error);
        alert("점수 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
        submitScoreBtn.disabled = false;
        submitScoreBtn.textContent = "명예의 전당에 등록하기 🏆";
    }
}

// ===================================================
// 5. 이벤트 리스너 등록
// ===================================================

if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeScoreModal);
}

if (scoreModal) {
    // 모달 검은 배경 클릭 시 닫기
    scoreModal.addEventListener("click", (e) => {
        if (e.target === scoreModal) closeScoreModal();
    });
}

if (scoreSubmitForm) {
    scoreSubmitForm.addEventListener("submit", handleScoreSubmit);
}

// 페이지가 처음 열릴 때 현재 게임의 리더보드 즉시 로드
const initialGameId = getCurrentGameIdFromUrl();
loadLeaderboard(initialGameId);
