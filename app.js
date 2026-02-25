

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
let quizStart = 0;
let quizEnd = Math.min(20, flashcards.length -1);

function resetFlashcardPool() {
    unusedIndexes = [...Array(flashcards.length).keys()];
}

function nextCard() {
    if (unusedIndexes.length === 0) {
        resetFlashcardPool();
    }

    const randomPos = Math.floor(Math.random() * unusedIndexes.length);
    currentIndex = unusedIndexes.splice(randomPos, 1)[0];

    renderCard();
    updateProgress();
}

function renderCard() {
	let idx = Math.floor(Math.random() * (quizEnd - quizStart + 1)) + quizStart;
	const card =flashcards[idx];
    //const card = flashcards[currentIndex];
    document.getElementById("flashcard").innerText = card.word;
    document.getElementById("kana").innerText = card.kana;
    document.getElementById("meaning").innerText = " (" + card.meaning + ")";
    document.getElementById("meaning").style.display = "none";
    document.getElementById("toggleBtn").innerText = "Hiện nghĩa";
	//example
	document.getElementById("example").style.display = "none";
	document.getElementById("example").innerHTML = card.example+ "( "+card.exMeaning+" )";
	
    //document.getElementById("counter").innerText = (flashcards.length - unusedIndexes.length) + " / " + flashcards.length;
    document.getElementById("counter").innerText = idx + " / " + quizEnd;
	
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
// PROGRESS BAR
// =========================
const progressBar = document.createElement("div");
//progressBar.style.height = "10px";
//progressBar.style.background = "#ddd";
//progressBar.style.borderRadius = "10px";
//progressBar.style.marginTop = "10px";
progressBar.classList.add("progress-bar");

const progressFill = document.createElement("div");
//progressFill.style.height = "10px";
//progressFill.style.width = "0%";
//progressFill.style.background = "#28a745";
//progressFill.style.borderRadius = "10px";
progressFill.classList.add("progress-fill");

progressBar.appendChild(progressFill);
document.getElementById("progressBar").appendChild(progressBar);

function updateProgress() {
    const percent = ((flashcards.length - unusedIndexes.length) / flashcards.length) * 100;
    //const percent = ((quizEnd - unusedIndexes.length) / quizEnd) * 100;
    progressFill.style.width = percent + "%";
}

// =========================
// QUIZ + LOCAL STORAGE
// =========================
let score = localStorage.getItem("quizScore") ? parseInt(localStorage.getItem("quizScore")) : 0;
document.getElementById("quizScore").innerText = "Điểm: " + score;

function saveScore() {
    localStorage.setItem("quizScore", score);
}

function nextQuiz() {
    //const correct = flashcards[Math.floor(Math.random() * flashcards.length)];
	let idx = Math.floor(Math.random() * (quizEnd - quizStart + 1)) + quizStart;
	const correct =flashcards[idx];
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
            if (opt === correct.meaning) {
                score++;
                saveScore();
				this.classList.add("correct-answer");
            }else{
				this.classList.add("wrong-answer");
			}
            document.getElementById("quizScore").innerText = "Điểm: " + score;
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
                Tuần ${((month-1)*4)+week} - 50 từ + 5 bài đọc
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

const examCard = document.createElement("div");
examCard.className = "card";
examCard.innerHTML = `
<h2>📝 Thi thử N2 (30 câu)</h2>
<div id="examQuestion"></div>
<div id="examOptions" style="display: grid;"></div>
<div id="examResult"></div>
<button class="primary" onclick="startExam()">Bắt đầu thi</button>
`;

//document.querySelector(".container").appendChild(examCard);

function startExam() {
    examScore = 0;
    examCount = 0;
    nextExamQuestion();
}

function nextExamQuestion() {
    if (examCount >= 30) {
        document.getElementById("examResult").innerText =
            "Kết quả: " + examScore + "/30";
        return;
    }

    examCount++;

	let idx = Math.floor(Math.random() * (quizEnd - quizStart + 1)) + quizStart;
	const correct =flashcards[idx];
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
        btn.onclick = function () {
            if (opt === correct.meaning) {
                examScore++;
				this.classList.add("correct-answer");
				setTimeout(function(){
					nextExamQuestion();
				},2000);
            }else{
				this.classList.add("wrong-answer");
			}
			document.getElementById("examQuestion").innerText = titleQuestion+" ("+ correct.kana +")";
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

    quizSelect.onchange = function () {
        const [s, e] = this.value.split("-");
        //quizStart = parseInt(s);
        //quizEnd = parseInt(e);
		updateIndex(parseInt(s),parseInt(e));
    };

    examSelect.onchange = function () {
        const [s, e] = this.value.split("-");
		updateIndex(parseInt(s),parseInt(e));
    };
	
	flashSelect.onchange = function () {
        const [s, e] = this.value.split("-");
		updateIndex(parseInt(s),parseInt(e));
    };
}
function updateIndex(quizStart,quizEnd) {
	if(quizEnd > flashcards.length){
		quizEnd = flashcards.length;
	}
	if(quizStart > flashcards.length){
		quizStart = 0;
	}
}


// =========================
// INIT
// =========================
resetFlashcardPool();
nextCard();
nextQuiz();
generateRoadmap();
generateRangeOptions();

document.getElementById("bookSelect").onchange = function(){

    if(this.value === "shinkanzen"){
        flashcards = flashcardsShinkanzen;
    } else {
        flashcards = flashcardsSoumatome;
    }
    // reset lại hệ thống
    resetFlashcardPool();
    generateRangeOptions();
    nextCard();
    nextQuiz();
};

