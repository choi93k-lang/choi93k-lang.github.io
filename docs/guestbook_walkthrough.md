# 방명록(Guestbook) 구현 및 보안 강화 완료 보고서

Firebase Cloud Firestore를 기반으로 독립형 방명록 페이지를 구축하고, 도배 및 무료 쿼터 소진을 방지하는 보안 강화 조치까지 완료했습니다.

---

## 1. 구현된 주요 구성 요소

1. **상단 네비게이션 연결**
   - [index.html](file:///c:/Projects/choi93k-lang.github.io/index.html), [about.html](file:///c:/Projects/choi93k-lang.github.io/about.html), [portfolio.html](file:///c:/Projects/choi93k-lang.github.io/portfolio.html)의 메뉴바에 `Guestbook` 링크 추가
2. **독립형 방명록 화면 ([guestbook.html](file:///c:/Projects/choi93k-lang.github.io/guestbook.html))**
   - 기존 사이트의 미니멀 모던 테마(오프화이트 `#fafaf9`, Pretendard 폰트) 적용
   - 좌측: 닉네임, 메시지 작성 카드 및 전송 버튼 (중복 클릭 방지)
   - 우측: 남겨진 방명록 실시간 카드 목록 피드
3. **자바스크립트 엔진 ([guestbook.js](file:///c:/Projects/choi93k-lang.github.io/guestbook.js))**
   - 초보자 맞춤형 단일 기능 함수 분리:
     - `formatDate(timestamp)`: 날짜/시간 포맷 변환
     - `escapeHtml(text)`: 악성 스크립트 실행 방지 (XSS 방어)
     - `createEntryCard(...)`: 카드 엘리먼트 렌더링
     - `loadGuestbookEntries()`: 최신순 50건 안전 조회
     - `saveGuestbookEntry(event)`: 유효성 검사 및 Firestore 저장
4. **정리 작업**
   - 모든 미리보기 이미지 파일들을 [`previews/`](file:///c:/Projects/choi93k-lang.github.io/previews) 폴더로 분리 이동

---

## 2. 적용된 보안 강화 조치

| 보안 항목 | 적용 전 취약점 | 강화 후 방어 내용 |
| :--- | :--- | :--- |
| **악성 대용량 텍스트/도배** | 웹 화면을 우회하여 수만~수백만 자의 텍스트 전송 가능 | [`firestore.rules`](file:///c:/Projects/choi93k-lang.github.io/firestore.rules)에서 닉네임(1~20자), 메시지(1~300자), 허용 필드(3개)만 받도록 엄격 검증 및 자동 거부 |
| **무료 읽기 쿼터 고갈** | 수천 개의 글이 쌓였을 때 새로고침마다 전체 글을 긁어와 하루 5만 건 한도 조기 소진 위험 | `limit(50)`을 적용하여 최신 50개만 조회하도록 제한 (무료 한도 완벽 보호) |
| **글 위변조 및 삭제** | 다른 사람의 글을 덮어쓰거나 지울 위험 | `allow update, delete: if false;`로 수정/삭제 전면 차단 |
| **XSS (스크립트 삽입 공격)** | 메시지 본문에 자바스크립트 코드를 삽입하여 다른 방문자 브라우저에서 실행시킬 위험 | `escapeHtml()`을 통해 특수문자를 안전하게 변환하여 일반 텍스트로만 렌더링 |

---

## 3. Git 커밋 이력

* `c952ac7`: `feat: Add Firebase Firestore guestbook page and organize preview assets`
* `7b04d1b`: `security: Strengthen Firestore rules validation and limit guestbook query to 50`
