// quiz.js
import {
  getElement,
  showElement,
  hideElement,
  setText,
  createAnswerButton,
  updateScoreDisplay,
  lockAnswers,
  markCorrectAnswer,
} from "./dom.js";
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  startTimer,
  shuffleArray,
} from "./utils.js";

console.log("Quiz JS loaded...");

let allQuestions = [];
let questions = [];

async function loadQuestions() {
  const url = new URL("../data/questions.json", import.meta.url);
  const data = await fetch(url).then((response) => response.json());
  allQuestions = Object.entries(data).flatMap(([theme, list]) =>
    list.map((question) => ({ ...question, theme }))
  );
  populateThemes(Object.keys(data));
}

function populateThemes(themes) {
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "Tous les themes";
  themeSelect.appendChild(allOption);
  themes.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme;
    option.textContent = theme;
    themeSelect.appendChild(option);
  });
}

const questionsReady = loadQuestions();

let currentQuestionIndex = 0;
let score = 0;
let bestScore = loadFromLocalStorage("bestScore", 0);
let timerId = null;
let flashcardMode = false;
let userAnswers = [];

// DOM Elements
const introScreen = getElement("#intro-screen");
const questionScreen = getElement("#question-screen");
const resultScreen = getElement("#result-screen");

const bestScoreValue = getElement("#best-score-value");
const bestScoreEnd = getElement("#best-score-end");

const questionText = getElement("#question-text");
const answersDiv = getElement("#answers");
const nextBtn = getElement("#next-btn");
const startBtn = getElement("#start-btn");
const flashcardBtn = getElement("#flashcard-btn");
const restartBtn = getElement("#restart-btn");
const timerDiv = getElement("#timer-div");
const themeSelect = getElement("#theme-select");

const scoreText = getElement("#score-text");
const timeLeftSpan = getElement("#time-left");
const recapBody = getElement("#recap-body");

const currentQuestionIndexSpan = getElement("#current-question-index");
const totalQuestionsSpan = getElement("#total-questions");

// Init
startBtn.addEventListener("click", () => startQuiz(false));
flashcardBtn.addEventListener("click", () => startQuiz(true));
nextBtn.addEventListener("click", nextQuestion);
restartBtn.addEventListener("click", restartQuiz);

setText(bestScoreValue, bestScore);

async function startQuiz(flashcard) {
  await questionsReady;
  flashcardMode = flashcard;

  hideElement(introScreen);
  showElement(questionScreen);

  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];

  const theme = themeSelect.value;
  const pool =
    theme === "all"
      ? allQuestions
      : allQuestions.filter((question) => question.theme === theme);
  questions = shuffleArray(pool);

  setText(totalQuestionsSpan, questions.length);

  showQuestion();
}

function showQuestion() {
  clearInterval(timerId);

  const q = questions[currentQuestionIndex];
  setText(questionText, q.text);
  setText(currentQuestionIndexSpan, currentQuestionIndex + 1);

  answersDiv.innerHTML = "";
  q.answers.forEach((answer, index) => {
    const btn = createAnswerButton(answer, () => selectAnswer(index, btn));
    answersDiv.appendChild(btn);
  });

  nextBtn.classList.add("hidden");

  // Pas de chrono en mode flashcard, bouton suivant toujours visible
  if (flashcardMode) {
    hideElement(timerDiv);
    nextBtn.classList.remove("hidden");
    return;
  }

  showElement(timerDiv);
  timeLeftSpan.textContent = q.timeLimit;
  timerId = startTimer(
    q.timeLimit,
    (timeLeft) => setText(timeLeftSpan, timeLeft),
    () => {
      lockAnswers(answersDiv);
      nextBtn.classList.remove("hidden");
    }
  );
}

function selectAnswer(index, btn) {
  clearInterval(timerId);

  const q = questions[currentQuestionIndex];
  userAnswers[currentQuestionIndex] = index;
  if (index === q.correct) {
    if (!flashcardMode) {
      score++;
    }
    btn.classList.add("correct");
  } else {
    btn.classList.add("wrong");
  }

  markCorrectAnswer(answersDiv, q.correct);
  lockAnswers(answersDiv);
  nextBtn.classList.remove("hidden");
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    endQuiz();
  }
}

function endQuiz() {
  hideElement(questionScreen);

  // En mode flashcard, pas de score : retour à l'accueil
  if (flashcardMode) {
    showElement(introScreen);
    return;
  }

  showElement(resultScreen);

  updateScoreDisplay(scoreText, score, questions.length);

  if (score > bestScore) {
    bestScore = score;
    saveToLocalStorage("bestScore", bestScore);
  }
  setText(bestScoreEnd, bestScore);

  showRecap();
}

function showRecap() {
  recapBody.innerHTML = "";

  questions.forEach((q, i) => {
    const row = document.createElement("tr");

    const questionCell = document.createElement("td");
    questionCell.textContent = q.text;

    const userCell = document.createElement("td");
    const userAnswer = userAnswers[i];
    userCell.textContent =
      userAnswer !== undefined ? q.answers[userAnswer] : "Pas de réponse";

    const correctCell = document.createElement("td");
    correctCell.textContent = q.answers[q.correct];

    row.appendChild(questionCell);
    row.appendChild(userCell);
    row.appendChild(correctCell);
    recapBody.appendChild(row);
  });
}

function restartQuiz() {
  hideElement(resultScreen);
  showElement(introScreen);

  setText(bestScoreValue, bestScore);
}
