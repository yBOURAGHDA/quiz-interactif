const translations = {
  fr: {
    title: "Quiz Dynamique",
    notice: "Testez vos connaissances en quelques questions chronométrées !",
    bestScore: "Meilleur score",
    theme: "Theme",
    language: "Langue",
    allThemes: "Tous les themes",
    start: "Commencer le quiz",
    flashcard: "Mode Flashcard",
    question: "Question",
    timer: "Temps restant",
    clue: "Aide",
    next: "Question suivante",
    resultTitle: "Résultat final",
    recap: "Récapitulatif",
    colQuestion: "Question",
    colYourAnswer: "Votre réponse",
    colCorrectAnswer: "Bonne réponse",
    restart: "Recommencer",
    noAnswer: "Pas de réponse",
    yourScore: "Votre score : {{score}} / {{total}}",
  },
  en: {
    title: "Dynamic Quiz",
    notice: "Test your knowledge with timed questions!",
    bestScore: "Best score",
    theme: "Theme",
    language: "Language",
    allThemes: "All themes",
    start: "Start quiz",
    flashcard: "Flashcard mode",
    question: "Question",
    timer: "Time left",
    clue: "Hint",
    next: "Next question",
    resultTitle: "Final result",
    recap: "Summary",
    colQuestion: "Question",
    colYourAnswer: "Your answer",
    colCorrectAnswer: "Correct answer",
    restart: "Restart",
    noAnswer: "No answer",
    yourScore: "Your score: {{score}} / {{total}}",
  },
};

let locale = "fr";

export function t(key, vars = {}) {
  let str = translations[locale]?.[key] ?? translations.fr[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(`{{${k}}}`, v);
  });
  return str;
}

export function setLocale(code) {
  locale = code;
}

export function getLocale() {
  return locale;
}

/** Retourne la valeur dans la langue active (string ou { fr, en }). */
export function getLocalized(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value[locale] ?? value.fr ?? Object.values(value)[0];
  }
  return value;
}

export const languages = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
];
