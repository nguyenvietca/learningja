

// =========================
// DATA
// =========================
const flashcardsShinkanzen = shinkanzenData;
const flashcardsSoumatome = somatomeData;

let flashcards = flashcardsShinkanzen;

// =========================
// FLASHCARD RANDOM KHÔNG LẶP
// =========================
let unusedIndexes = [];
let currentIndex = 0;

// Range riêng cho từng section
let flashStart = 0;
let flashEnd = Math.min(20, flashcards.length - 1);
let quizStart = 0;
let quizEnd = Math.min(20, flashcards.length - 1);
let examStart = 0;
let examEnd = Math.min(20, flashcards.length - 1);

// Auto run state
let autoRunInterval = null;
let autoRunDirection = 0; // 0 for Next, 1 for Previous

function resetFlashcardPool() {
    unusedIndexes = [...Array(flashcards.length).keys()];
}

// =========================
// PHÁT ÂM TIẾNG NHẬT
// =========================
function speakJapanese(text) {
    const toggle = document.getElementById('autoSpeakToggle');
    if (!window.speechSynthesis || (toggle && !toggle.checked)) {
        return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';
    utter.rate = 0.8;

    // Ưu tiên giọng ja-JP nếu có
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang === 'ja-JP');
    if (jaVoice) utter.voice = jaVoice;

    window.speechSynthesis.speak(utter);
}

function nextCard(pre) {
    if (unusedIndexes.length === 0) {
        resetFlashcardPool();
    }

    const starOnly = document.getElementById("starOnlyToggle");
    const bookKey = document.getElementById("bookSelect").value;
    const starred = getStarredList(bookKey);

    // Nếu đang ở mode chỉ ôn từ chưa thuộc
    if (starOnly && starOnly.checked && starred.length > 0) {
        // Lọc starred theo range hiện tại
        const pool = starred.filter(i => i >= flashStart && i < flashEnd);
        if (pool.length === 0) {
            // không có từ starred trong range, thông báo
            document.getElementById("flashcard").innerText = "⭐ Không có từ nào chưa thuộc trong bài này!";
            document.getElementById("kana").innerText = "";
            document.getElementById("meaning").style.display = "none";
            document.getElementById("example").innerHTML = "";
            document.getElementById("kanjiDisplay").style.display = "none";
            document.getElementById("starBtn").textContent = "☆ Chưa thuộc";
            document.getElementById("starBtn").classList.remove("starred");
            return;
        }
        const posInPool = pool.indexOf(currentIndex);
        if (pre == 1) {
            const newPos = posInPool <= 0 ? pool.length - 1 : posInPool - 1;
            currentIndex = pool[newPos];
        } else if (pre == 0) {
            const newPos = posInPool >= pool.length - 1 ? 0 : posInPool + 1;
            currentIndex = pool[newPos];
        } else {
            // init: chọn phần tử đầu tiên trong pool
            if (!pool.includes(currentIndex)) currentIndex = pool[0];
        }
    } else {
        if (pre == 1) {
            currentIndex--;
            if (currentIndex < flashStart) {
                currentIndex = flashEnd - 1; // wrap về cuối
            }
        } else if (pre == 0) {
            currentIndex++;
            if (currentIndex >= flashEnd) {
                currentIndex = flashStart; // wrap về đầu
            }
        } else {
            // init call (pre === undefined): đảm bảo trong range
            if (currentIndex < flashStart || currentIndex >= flashEnd) {
                currentIndex = flashStart;
            }
        }
    }

    renderCard(pre);
    updateProgress();

    // Reset auto-run if manual click
    if (pre !== undefined) {
        autoRunDirection = pre;
        restartAutoRun();
    }
}

function startAutoRun() {
    stopAutoRun();
    const speed = parseInt(document.getElementById("autoRunSpeed").value) * 1000;
    autoRunInterval = setInterval(() => {
        nextCard(autoRunDirection);
    }, speed);
}

function stopAutoRun() {
    if (autoRunInterval) {
        clearInterval(autoRunInterval);
        autoRunInterval = null;
    }
}

function restartAutoRun() {
    const toggle = document.getElementById("autoRunToggle");
    if (toggle && toggle.checked) {
        startAutoRun();
    }
}

function renderCard(pre) {
    const card = flashcards[currentIndex];
    document.getElementById("flashcard").innerText = card.word;
    document.getElementById("kana").innerText = card.kana;
    document.getElementById("meaning").innerText = " (" + card.meaning + ")";

    const showMeaningToggle = document.getElementById("autoShowMeaningToggle");
    if (showMeaningToggle && showMeaningToggle.checked) {
        document.getElementById("meaning").style.display = "inline";
        document.getElementById("example").style.display = "block";
        document.getElementById("toggleBtn").innerText = "Ẩn nghĩa";
    } else {
        document.getElementById("meaning").style.display = "none";
        document.getElementById("example").style.display = "none";
        document.getElementById("toggleBtn").innerText = "Hiện nghĩa";
    }

    document.getElementById("example").innerHTML = card.example + "( " + card.exMeaning + " )";

    // Hiện kanji nếu checkbox bật
    const showKanjiToggle = document.getElementById("showKanjiToggle");
    const kanjiDisplay = document.getElementById("kanjiDisplay");
    if (showKanjiToggle && showKanjiToggle.checked && card.kanji && card.kanji.length > 0) {
        kanjiDisplay.innerHTML = card.kanji.map(k =>
            `<span class="kanji-item"><span class="kanji-char">${k.char}</span><span class="kanji-hanviet">${k.hanviet}</span></span>`
        ).join("");
        kanjiDisplay.style.display = "flex";
    } else {
        kanjiDisplay.style.display = "none";
        kanjiDisplay.innerHTML = "";
    }

    var idx = currentIndex + 1;
    document.getElementById("counter").innerText = idx + " / " + flashEnd;

    // Cập nhật nút Star
    const bookKey = document.getElementById("bookSelect").value;
    const starred = getStarredList(bookKey);
    const starBtn = document.getElementById("starBtn");
    if (starred.includes(currentIndex)) {
        starBtn.textContent = "★ Chưa thuộc";
        starBtn.classList.add("starred");
    } else {
        starBtn.textContent = "☆ Chưa thuộc";
        starBtn.classList.remove("starred");
    }
    updateStarCount();

    // Phát âm khi chuyển card (không phát lúc init)
    if (pre !== undefined) {
        // Chờ voices load xong (cần thiết lần đầu)
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = function () {
                speakJapanese(card.kana);
            };
        } else {
            speakJapanese(card.kana);
        }
    }

}

// =========================
// PROGRESS BAR
// =========================
const progressBar = document.createElement("div");
progressBar.classList.add("progress-bar");

const progressFill = document.createElement("div");
progressFill.classList.add("progress-fill");

progressBar.appendChild(progressFill);
document.getElementById("progressBar").appendChild(progressBar);

function updateProgress() {
    const rangeSize = flashEnd - flashStart;
    const percent = rangeSize > 0 ? ((currentIndex - flashStart + 1) / rangeSize) * 100 : 0;
    progressFill.style.width = percent + "%";
}

function toggleMeaning() {
    const meaning = document.getElementById("meaning");
    const example = document.getElementById("example");
    const btn = document.getElementById("toggleBtn");

    if (meaning.style.display === "none") {
        meaning.style.display = "inline";
        example.style.display = "block";
        btn.innerText = "Ẩn nghĩa";
    } else {
        meaning.style.display = "none";
        example.style.display = "none";
        btn.innerText = "Hiện nghĩa";
    }
}

// =========================
// STAR / CHƯ A THUỘC
// =========================
function getStarKey(bookKey) {
    return "starred_" + bookKey;
}

function getStarredList(bookKey) {
    const raw = localStorage.getItem(getStarKey(bookKey));
    return raw ? JSON.parse(raw) : [];
}

function saveStarredList(bookKey, list) {
    localStorage.setItem(getStarKey(bookKey), JSON.stringify(list));
}

function toggleStar() {
    const bookKey = document.getElementById("bookSelect").value;
    let starred = getStarredList(bookKey);
    const idx = starred.indexOf(currentIndex);
    if (idx === -1) {
        starred.push(currentIndex);
    } else {
        starred.splice(idx, 1);
    }
    saveStarredList(bookKey, starred);
    // cập nhật nút
    const starBtn = document.getElementById("starBtn");
    if (starred.includes(currentIndex)) {
        starBtn.textContent = "★ Chưa thuộc";
        starBtn.classList.add("starred");
    } else {
        starBtn.textContent = "☆ Chưa thuộc";
        starBtn.classList.remove("starred");
    }
    updateStarCount();
}

function updateStarCount() {
    const bookKey = document.getElementById("bookSelect").value;
    const starred = getStarredList(bookKey);
    const inRange = starred.filter(i => i >= flashStart && i < flashEnd);
    const el = document.getElementById("starCount");
    if (el) el.textContent = inRange.length > 0 ? `(${inRange.length})` : "";
}
// =========================
// QUIZ + LOCAL STORAGE
// =========================
let score = localStorage.getItem("quizScore") ? parseInt(localStorage.getItem("quizScore")) : 0;
let quizTotal = localStorage.getItem("quizTotal") ? parseInt(localStorage.getItem("quizTotal")) : 0;

function updateScoreDisplay() {
    document.getElementById("quizScore").innerText =
        `✅ Đúng: ${score} / ${quizTotal} câu`;
}
updateScoreDisplay();

function saveScore() {
    localStorage.setItem("quizScore", score);
    localStorage.setItem("quizTotal", quizTotal);
}

function resetScore() {
    score = 0;
    quizTotal = 0;
    saveScore();
    updateScoreDisplay();
}

function nextQuiz() {
    let idx = Math.floor(Math.random() * (quizEnd - quizStart + 1)) + quizStart;
    const correct = flashcards[idx];
    document.getElementById("quizAnswer").innerText = "";
    document.getElementById("quizQuestion").innerText =
        "Nghĩa của từ: " + correct.word + " là gì?";

    let options = [correct.meaning];

    while (options.length < 4) {
        let random = flashcards[Math.floor(Math.random() * flashcards.length)].meaning;
        if (!options.includes(random)) {
            options.push(random);
        }
    }

    options.sort(() => Math.random() - 0.5);

    const container = document.getElementById("quizOptions");
    container.innerHTML = "";
    container.style.display = "grid";

    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.innerText = opt;
        btn.style.marginBottom = "8px";

        btn.onclick = function () {
            // Khóa tất cả button ngăn click nhiều lần
            container.querySelectorAll('button').forEach(b => b.disabled = true);
            quizTotal++;
            if (opt === correct.meaning) {
                score++;
                this.classList.add("correct-answer");
            } else {
                this.classList.add("wrong-answer");
                // Highlight đáp án đúng
                container.querySelectorAll('button').forEach(b => {
                    if (b.innerText === correct.meaning) {
                        b.classList.add("correct-answer");
                    }
                });
            }
            saveScore();
            updateScoreDisplay();
            document.getElementById("quizAnswer").innerText =
                "Đáp án: " + correct.kana + " (" + correct.meaning + ")";
        };

        container.appendChild(btn);
    });
}

// =========================
// ROADMAP CHIA 6 THÁNG
// =========================
function generateRoadmap() {
    const roadmap = document.getElementById("roadmap");
    roadmap.innerHTML = "";

    for (let month = 1; month <= 6; month++) {
        const monthDiv = document.createElement("div");
        monthDiv.innerHTML = `<h3>Tháng ${month}</h3>`;

        for (let week = 1; week <= 4; week++) {
            const label = document.createElement("label");
            label.innerHTML = `
                <input type="checkbox">
                Tuần ${((month - 1) * 4) + week} - 50 từ + 5 bài đọc
            `;
            monthDiv.appendChild(label);
        }

        roadmap.appendChild(monthDiv);
    }
}

// =========================
// THI THỬ 30 CÂU
// =========================
let examScore = 0;
let examCount = 0;
function startExam() {
    examScore = 0;
    examCount = 0;
    document.getElementById("examResult").innerText = "";
    nextExamQuestion();
}

function nextExamQuestion() {
    if (examCount >= 30) {
        document.getElementById("examResult").innerText =
            "Kết quả: " + examScore + "/" + examCount;
        return;
    }

    examCount++;

    let idx;
    const randomAll = document.getElementById('randomExamToggle');
    if (randomAll && randomAll.checked) {
        idx = Math.floor(Math.random() * flashcards.length);
    } else {
        idx = Math.floor(Math.random() * (examEnd - examStart + 1)) + examStart;
    }
    const correct = flashcards[idx];
    var titleQuestion = "Câu " + examCount + ": " + correct.word;
    document.getElementById("examQuestion").innerText = titleQuestion;

    let options = [correct.meaning];

    while (options.length < 4) {
        let random = flashcards[Math.floor(Math.random() * flashcards.length)].meaning;
        if (!options.includes(random)) {
            options.push(random);
        }
    }

    options.sort(() => Math.random() - 0.5);

    const container = document.getElementById("examOptions");
    container.innerHTML = "";

    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.innerText = opt;
        btn.style.marginBottom = "8px";
        btn.onclick = function () {
            if (opt === correct.meaning) {
                examScore++;
                this.classList.add("correct-answer");
                setTimeout(function () {
                    nextExamQuestion();
                }, 2000);
            } else {
                this.classList.add("wrong-answer");
            }
            document.getElementById("examQuestion").innerText = titleQuestion + " (" + correct.kana + ")";
        };
        container.appendChild(btn);
    });
}

function generateRangeOptions() {

    const quizSelect = document.getElementById("quizRangeSelect");
    const examSelect = document.getElementById("examRangeSelect");
    const flashSelect = document.getElementById("flashRangeSelect");

    quizSelect.innerHTML = "";
    examSelect.innerHTML = "";
    flashSelect.innerHTML = "";

    const totalSets = Math.ceil(flashcards.length / 20);
    for (let i = 0; i < totalSets; i++) {

        let start = i * 20;
        let end = Math.min(start + 19, flashcards.length - 1);

        const label =
            (start + 1) + " - " + (end + 1);

        const opt1 = document.createElement("option");
        opt1.value = start + "-" + end;
        opt1.textContent = "Bài " + (i + 1) + " (" + label + ")";
        quizSelect.appendChild(opt1);

        const opt2 = opt1.cloneNode(true);
        examSelect.appendChild(opt2);

        const opt3 = opt1.cloneNode(true);
        flashSelect.appendChild(opt3);
    }

    // Flashcard
    flashSelect.onchange = function () {
        const [s, e] = this.value.split("-");
        flashStart = parseInt(s);
        flashEnd = parseInt(e) + 1;
        currentIndex = flashStart;
        nextCard();
    };

    // Quiz
    quizSelect.onchange = function () {
        const [s, e] = this.value.split("-");
        quizStart = parseInt(s);
        quizEnd = parseInt(e) + 1;
        nextQuiz();
    };

    // Thi thử
    examSelect.onchange = function () {
        const [s, e] = this.value.split("-");
        examStart = parseInt(s);
        examEnd = parseInt(e) + 1;
        startExam();
    };
}
function resetAllRanges() {
    const defaultEnd = Math.min(20, flashcards.length - 1);
    flashStart = 0; flashEnd = defaultEnd;
    quizStart = 0; quizEnd = defaultEnd;
    examStart = 0; examEnd = defaultEnd;
    currentIndex = 0;
}


// =========================
// INIT
// =========================
resetFlashcardPool();
nextCard();
nextQuiz();
generateRoadmap();
generateRangeOptions();

document.getElementById("bookSelect").onchange = function () {
    if (this.value === "shinkanzen") {
        flashcards = flashcardsShinkanzen;
    } else {
        flashcards = flashcardsSoumatome;
    }
    // reset lại toàn bộ hệ thống
    resetFlashcardPool();
    resetAllRanges();
    generateRangeOptions();
    nextCard();
    nextQuiz();
};

// Auto run listeners
document.getElementById("autoRunToggle").onchange = function () {
    const speedControl = document.getElementById("speedControl");
    if (this.checked) {
        speedControl.style.display = "flex";
        startAutoRun();
    } else {
        speedControl.style.display = "none";
        stopAutoRun();
    }
};

document.getElementById("autoRunSpeed").oninput = function () {
    document.getElementById("speedValue").innerText = this.value + "s";
    restartAutoRun();
};

document.getElementById("autoShowMeaningToggle").onchange = function () {
    renderCard();
};

document.getElementById("showKanjiToggle").onchange = function () {
    renderCard();
};

document.getElementById("starOnlyToggle").onchange = function () {
    // khi bật mode star-only, nhảy về từ starred đầu tiên trong range
    nextCard();
};

// =========================
// SWIPE GESTURE (mobile)
// =========================
(function () {
    let touchStartX = 0;
    const el = document.getElementById("flashcard");
    el.addEventListener("touchstart", function (e) {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    el.addEventListener("touchend", function (e) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < 40) return; // bỏ qua swipe quá ngắn
        if (dx < 0) {
            nextCard(0); // vuốt trái → Tiếp
        } else {
            nextCard(1); // vuốt phải → Trước
        }
    }, { passive: true });
})();

// =========================
// PHÍM TẮT BÀN PHÍM
// =========================
document.addEventListener("keydown", function (e) {
    // Không kích hoạt khi đang focus vào input / select
    if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

    switch (e.key) {
        case "ArrowLeft":
            e.preventDefault();
            nextCard(1);
            break;
        case "ArrowRight":
            e.preventDefault();
            nextCard(0);
            break;
        case " ": // Space
            e.preventDefault();
            toggleMeaning();
            break;
        case "k":
        case "K": {
            const kToggle = document.getElementById("showKanjiToggle");
            if (kToggle) { kToggle.checked = !kToggle.checked; renderCard(); }
            break;
        }
        case "s":
        case "S":
            toggleStar();
            break;
    }
});
