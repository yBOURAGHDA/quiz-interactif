import {
  getElement,
  showElement,
  hideElement,
  setText,
  createAnswerButton,
  lockAnswers,
  markCorrectAnswer,
} from "./dom.js";
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  startTimer,
  shuffleArray,
} from "./utils.js";
import { t, setLocale, getLocale, getLocalized, languages } from "./i18n.js";

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
  themeSelect.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = t("allThemes");
  themeSelect.appendChild(allOption);
  themes.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme;
    option.textContent = theme;
    themeSelect.appendChild(option);
  });
}

function populateLanguages() {
  languageSelect.innerHTML = "";
  languages.forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang.code;
    option.textContent = lang.label;
    languageSelect.appendChild(option);
  });
  languageSelect.value = getLocale();
}

function updateInterfaceLanguage() {
  document.documentElement.lang = getLocale();
  setText(appTitle, t("title"));
  setText(appNotice, t("notice"));
  setText(bestScoreLabel, `${t("bestScore")} :`);
  setText(themeLabel, `${t("theme")} :`);
  setText(languageLabel, `${t("language")} :`);
  setText(startBtn, t("start"));
  setText(flashcardBtn, t("flashcard"));
  setText(nextBtn, t("next"));
  setText(clueBtn, t("clue"));
  setText(restartBtn, t("restart"));
  setText(resultTitle, t("resultTitle"));
  setText(recapTitle, t("recap"));
  setText(bestScoreEndLabel, `${t("bestScore")} :`);
  setText(colQuestion, t("colQuestion"));
  setText(colYourAnswer, t("colYourAnswer"));
  setText(colCorrectAnswer, t("colCorrectAnswer"));
  setText(progressPrefix, `${t("question")} `);
  setText(timerPrefix, `${t("timer")} : `);
  const allOption = themeSelect.querySelector('option[value="all"]');
  if (allOption) allOption.textContent = t("allThemes");
}

const THEME_COLORS = {
  sport: "var(--color-sport)",
  histoire: "var(--color-histoire)",
  geographie: "var(--color-geographie)",
};

const DEFAULT_BACKGROUND =
  "linear-gradient(160deg, var(--color-bg-start), var(--color-bg-end))";

function applyThemeBackground(theme) {
  document.body.style.background =
    THEME_COLORS[theme?.toLowerCase()] ?? DEFAULT_BACKGROUND;
}

const questionsReady = loadQuestions();

let currentQuestionIndex = 0;
let score = 0;
let bestScore = loadFromLocalStorage("bestScore", 0);
let timerId = null;
let flashcardMode = false;
let userAnswers = [];

const introScreen = getElement("#intro-screen");
const questionScreen = getElement("#question-screen");
const resultScreen = getElement("#result-screen");

const appTitle = getElement("#app-title");
const appNotice = getElement("#app-notice");
const bestScoreLabel = getElement("#best-score-label");
const bestScoreValue = getElement("#best-score-value");
const bestScoreEndLabel = getElement("#best-score-end-label");
const bestScoreEnd = getElement("#best-score-end");
const themeLabel = getElement("#theme-label");
const languageLabel = getElement("#language-label");
const resultTitle = getElement("#result-title");
const recapTitle = getElement("#recap-title");
const colQuestion = getElement("#col-question");
const colYourAnswer = getElement("#col-your-answer");
const colCorrectAnswer = getElement("#col-correct-answer");
const progressPrefix = getElement("#progress-prefix");
const timerPrefix = getElement("#timer-prefix");

const questionText = getElement("#question-text");
const answersDiv = getElement("#answers");
const nextBtn = getElement("#next-btn");
const clueBtn = getElement("#clue-btn");
const clueText = getElement("#clue-text");
const startBtn = getElement("#start-btn");
const flashcardBtn = getElement("#flashcard-btn");
const restartBtn = getElement("#restart-btn");
const timerDiv = getElement("#timer-div");
const themeSelect = getElement("#theme-select");
const languageSelect = getElement("#lang-select");

const scoreText = getElement("#score-text");
const timeLeftSpan = getElement("#time-left");
const recapBody = getElement("#recap-body");

const currentQuestionIndexSpan = getElement("#current-question-index");
const totalQuestionsSpan = getElement("#total-questions");

setLocale(loadFromLocalStorage("locale", "fr"));
populateLanguages();
updateInterfaceLanguage();
setText(bestScoreValue, bestScore);

languageSelect.addEventListener("change", () => {
  setLocale(languageSelect.value);
  saveToLocalStorage("locale", languageSelect.value);
  updateInterfaceLanguage();
  if (questionScreen.style.display !== "none" && questions.length > 0) {
    showQuestion();
  }
});

startBtn.addEventListener("click", () => startQuiz(false));
flashcardBtn.addEventListener("click", () => startQuiz(true));
nextBtn.addEventListener("click", nextQuestion);
clueBtn.addEventListener("click", showClue);
restartBtn.addEventListener("click", restartQuiz);

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
  questions = shuffleArray(pool).sort((a, b) => a.difficulty - b.difficulty);

  setText(totalQuestionsSpan, questions.length);

  showQuestion();
}

function showQuestion() {
  clearInterval(timerId);

  const q = questions[currentQuestionIndex];
  const text = getLocalized(q.text);
  const answers = getLocalized(q.answers);
  const clue = getLocalized(q.clue);

  setText(questionText, text);
  setText(currentQuestionIndexSpan, currentQuestionIndex + 1);

  applyThemeBackground(q.theme);

  answersDiv.innerHTML = "";
  answers.forEach((answer, index) => {
    const btn = createAnswerButton(answer, () => selectAnswer(index, btn));
    answersDiv.appendChild(btn);
  });

  nextBtn.classList.add("hidden");
  hideElement(clueText);
  setText(clueText, "");

  if (clue) {
    showElement(clueBtn);
    clueBtn.disabled = false;
  } else {
    hideElement(clueBtn);
  }

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

function showClue() {
  const q = questions[currentQuestionIndex];
  const clue = getLocalized(q.clue);
  if (!clue) return;

  setText(clueText, clue);
  showElement(clueText);
  clueBtn.disabled = true;
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

  if (flashcardMode) {
    applyThemeBackground();
    showElement(introScreen);
    return;
  }

  showElement(resultScreen);

  setText(scoreText, t("yourScore", { score, total: questions.length }));

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

    const text = getLocalized(q.text);
    const answers = getLocalized(q.answers);

    const questionCell = document.createElement("td");
    questionCell.textContent = text;

    const userCell = document.createElement("td");
    const userAnswer = userAnswers[i];
    userCell.textContent =
      userAnswer !== undefined ? answers[userAnswer] : t("noAnswer");

    const correctCell = document.createElement("td");
    correctCell.textContent = answers[q.correct];

    row.appendChild(questionCell);
    row.appendChild(userCell);
    row.appendChild(correctCell);
    recapBody.appendChild(row);
  });
}

function restartQuiz() {
  hideElement(resultScreen);
  applyThemeBackground();
  showElement(introScreen);

  setText(bestScoreValue, bestScore);
}
