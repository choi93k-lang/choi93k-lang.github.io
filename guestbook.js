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
    orderBy, 
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

// Firebase 앱 및 Firestore 데이터베이스 초기화
const app = initializeApp(firebaseConfig);
const database = getFirestore(app);

// 'guestbook' 컬렉션(폴더) 참조
const guestbookCollection = collection(database, "guestbook");

// ===================================================
// 2. HTML 화면 요소(DOM) 가져오기
// ===================================================
const guestbookForm = document.getElementById("guestbookForm");
const authorInput = document.getElementById("authorInput");
const messageInput = document.getElementById("messageInput");
const submitBtn = document.getElementById("submitBtn");
const guestbookCount = document.getElementById("guestbookCount");
const guestbookList = document.getElementById("guestbookList");

// ===================================================
// 3. 단일 기능 함수들
// ===================================================

/**
 * 기능: 날짜 객체를 보기 편한 한국어 문자열로 변환합니다.
 * 예시: "2026. 09. 16 14:30"
 */
function formatDate(timestamp) {
    if (!timestamp) {
        return "방금 전";
    }
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}. ${month}. ${day} ${hours}:${minutes}`;
}

/**
 * 기능: 악의적인 스크립트 실행(XSS)을 방지하기 위해 특수문자를 안전하게 변환합니다.
 */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 기능: 방명록 1건의 데이터를 받아 HTML 카드 엘리먼트를 만듭니다.
 */
function createEntryCard(nickname, message, dateText) {
    const card = document.createElement("article");
    card.className = "guestbook-card";

    // 이름의 첫 글자를 따서 동그란 아바타에 표시
    const initial = nickname.trim().charAt(0).toUpperCase() || "?";
    const safeNickname = escapeHtml(nickname);
    const safeMessage = escapeHtml(message);

    card.innerHTML = `
        <div class="guestbook-card-header">
            <div class="guestbook-author-wrap">
                <div class="guestbook-author-avatar">${initial}</div>
                <span class="guestbook-author-name">${safeNickname}</span>
            </div>
            <time class="guestbook-date">${dateText}</time>
        </div>
        <p class="guestbook-card-message">${safeMessage}</p>
    `;

    return card;
}

/**
 * 기능: Firestore 데이터베이스에서 방명록 목록을 불러와 화면에 표시합니다.
 */
async function loadGuestbookEntries() {
    try {
        // 최신순(createdAt 기준 내림차순)으로 데이터 정렬 쿼리
        const guestbookQuery = query(guestbookCollection, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(guestbookQuery);

        // 목록 영역 비우기
        guestbookList.innerHTML = "";

        if (snapshot.empty) {
            guestbookCount.textContent = "총 0개의 이야기";
            guestbookList.innerHTML = `
                <div class="guestbook-state-box">
                    아직 남겨진 방명록이 없습니다.<br>
                    첫 번째 따뜻한 발자취를 남겨보세요! ✨
                </div>
            `;
            return;
        }

        // 전체 방명록 개수 표시
        guestbookCount.textContent = `총 ${snapshot.size}개의 이야기`;

        // 불러온 글들을 하나씩 화면에 카드 형태로 추가
        snapshot.forEach((doc) => {
            const data = doc.data();
            const nickname = data.nickname || "익명";
            const message = data.message || "";
            const dateText = formatDate(data.createdAt);

            const card = createEntryCard(nickname, message, dateText);
            guestbookList.appendChild(card);
        });

    } catch (error) {
        console.error("방명록을 불러오는 중 오류가 발생했습니다:", error);
        guestbookList.innerHTML = `
            <div class="guestbook-state-box" style="color: #ef4444;">
                방명록을 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.
            </div>
        `;
    }
}

/**
 * 기능: 사용자가 입력한 방명록을 검증하고 Firestore 데이터베이스에 저장합니다.
 */
async function saveGuestbookEntry(event) {
    // 폼 기본 새로고침 동작 막기
    event.preventDefault();

    const nickname = authorInput.value.trim();
    const message = messageInput.value.trim();

    // 1. 유효성 검사 (빈 값인지 확인)
    if (!nickname) {
        alert("이름 또는 닉네임을 입력해 주세요.");
        authorInput.focus();
        return;
    }

    if (!message) {
        alert("메시지 내용을 입력해 주세요.");
        messageInput.focus();
        return;
    }

    // 2. 등록 버튼 비활성화 (중복 클릭 방지)
    submitBtn.disabled = true;
    submitBtn.textContent = "등록하는 중...";

    try {
        // 3. Firestore 데이터베이스에 새 문서 추가
        await addDoc(guestbookCollection, {
            nickname: nickname,
            message: message,
            createdAt: serverTimestamp()
        });

        // 4. 입력창 비우기
        authorInput.value = "";
        messageInput.value = "";

        // 5. 목록 다시 불러오기
        await loadGuestbookEntries();

        alert("소중한 방명록이 성공적으로 등록되었습니다! 🎉");

    } catch (error) {
        console.error("방명록 저장 중 오류 발생:", error);
        alert("방명록 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
        // 6. 등록 버튼 원래대로 복구
        submitBtn.disabled = false;
        submitBtn.textContent = "방명록 등록하기";
    }
}

// ===================================================
// 4. 이벤트 리스너 등록
// ===================================================

// 폼이 제출(Submit)될 때 글 저장 함수 실행
guestbookForm.addEventListener("submit", saveGuestbookEntry);

// 페이지가 처음 열릴 때 글 목록 불러오기 실행
loadGuestbookEntries();
