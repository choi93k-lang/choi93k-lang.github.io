// ===================================================
// 오디오 매니저 모듈 (audioManager.js)
// 8종 게임별 배경음악 재생 및 상단 볼륨 ON/OFF 제어
// ===================================================

const BGM_MAPPING = {
    clicker:   "assets/audio/bgm_arcade_rush.wav",
    mole:      "assets/audio/bgm_arcade_rush.wav",
    reaction:  "assets/audio/bgm_tension_loop.wav",
    memory:    "assets/audio/bgm_puzzle_cozy.wav",
    tictactoe: "assets/audio/bgm_puzzle_cozy.wav",
    updown:    "assets/audio/bgm_puzzle_cozy.wav",
    rps:       "assets/audio/bgm_retro_game.wav",
    dice:      "assets/audio/bgm_retro_game.wav"
};

const DEFAULT_VOLUME = 0.3; // 편안하고 잔잔한 30% 볼륨
let currentBgmAudio = null;
let currentLoadedGameId = null;
let isMuted = localStorage.getItem("choi_bgm_muted") === "true"; // 이전 설정 복원
let hasUserInteracted = false;

// DOM 요소
const bgmToggleBtn = document.getElementById("bgm-toggle-btn");
const bgmIcon = document.getElementById("bgm-icon");
const bgmText = document.getElementById("bgm-text");

/**
 * 기능: 음소거 버튼 UI를 현재 상태(ON / OFF)에 맞게 갱신합니다.
 */
function updateButtonDisplay() {
    if (!bgmToggleBtn) return;

    if (isMuted) {
        bgmToggleBtn.classList.add("muted");
        if (bgmIcon) bgmIcon.textContent = "🔇";
        if (bgmText) bgmText.textContent = "BGM OFF";
    } else {
        bgmToggleBtn.classList.remove("muted");
        if (bgmIcon) bgmIcon.textContent = "🔊";
        if (bgmText) bgmText.textContent = "BGM ON";
    }
}

/**
 * 기능: 특정 게임의 배경음악을 재생합니다.
 */
function playGameBgm(gameId) {
    const soundPath = BGM_MAPPING[gameId] || BGM_MAPPING["memory"];

    // 이미 같은 음악이 재생 중인 경우 건너뜀
    if (currentLoadedGameId === gameId && currentBgmAudio && !currentBgmAudio.paused) {
        return;
    }

    currentLoadedGameId = gameId;

    // 기존 재생 중인 음악 정지
    if (currentBgmAudio) {
        currentBgmAudio.pause();
        currentBgmAudio.currentTime = 0;
    }

    // 새 오디오 객체 생성
    currentBgmAudio = new Audio(soundPath);
    currentBgmAudio.loop = true;
    currentBgmAudio.volume = DEFAULT_VOLUME;

    // 음소거 상태가 아니고, 사용자가 화면을 1회 이상 클릭했을 때만 자동 재생
    if (!isMuted && hasUserInteracted) {
        currentBgmAudio.play().catch(() => {
            // 브라우저 자동재생 차단 시 조용히 무시
        });
    }
}

// 전역 window 객체에 등록 (게임 전환 시 script.js에서 호출 가능)
window.playGameBgm = playGameBgm;

/**
 * 기능: BGM 켜기 / 끄기 토글
 */
function toggleBgm() {
    hasUserInteracted = true;
    isMuted = !isMuted;
    localStorage.setItem("choi_bgm_muted", String(isMuted));
    updateButtonDisplay();

    if (isMuted) {
        if (currentBgmAudio) {
            currentBgmAudio.pause();
        }
    } else {
        if (currentBgmAudio) {
            currentBgmAudio.play().catch(() => {});
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            const gameId = urlParams.get("game") || "memory";
            playGameBgm(gameId);
        }
    }
}

/**
 * 기능: 브라우저 Autoplay 보안 정책 대응 (첫 화면 클릭 시 음악 시작)
 */
function handleFirstUserClick() {
    if (hasUserInteracted) return;
    hasUserInteracted = true;

    // 음소거 상태가 아니면 즉시 현재 게임 BGM 시작
    if (!isMuted && currentBgmAudio && currentBgmAudio.paused) {
        currentBgmAudio.play().catch(() => {});
    }

    // 일회성 리스너 해제
    document.removeEventListener("click", handleFirstUserClick);
    document.removeEventListener("keydown", handleFirstUserClick);
}

// ===================================================
// 이벤트 리스너 등록 및 초기화
// ===================================================

if (bgmToggleBtn) {
    bgmToggleBtn.addEventListener("click", toggleBgm);
}

document.addEventListener("click", handleFirstUserClick, { once: true });
document.addEventListener("keydown", handleFirstUserClick, { once: true });

// 초기 UI 상태 세팅
updateButtonDisplay();

// URL에서 현재 게임 ID 읽어와 BGM 준비
const urlParams = new URLSearchParams(window.location.search);
const initialGameId = urlParams.get("game") || "memory";
playGameBgm(initialGameId);
