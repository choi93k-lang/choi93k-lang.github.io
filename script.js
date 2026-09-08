// 클릭 횟수를 저장하는 변수
let clickCount = 0;

// 화면의 텍스트를 최신 클릭 수로 바꿔주는 함수
function updateCountText() {
    const displayElement = document.getElementById("count-display");
    displayElement.textContent = "클릭 횟수: " + clickCount + "회";
}

// 클릭 횟수를 1 증가시키는 함수
function increaseCount() {
    clickCount = clickCount + 1;
}

// 버튼이 클릭되었을 때 실행되는 함수
function onButtonClick() {
    increaseCount();
    updateCountText();
}

// 버튼 요소를 찾아서 클릭 이벤트 연결
const actionButton = document.getElementById("click-btn");
actionButton.addEventListener("click", onButtonClick);
