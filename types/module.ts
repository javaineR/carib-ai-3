export type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
};

export type Quiz = {
  title: string;
  questions: Question[];
};

export type KeyTerm = {
  term: string;
  simplifiedDefinition: string;
  examples?: string[];
  translatedDefinition?: string;
};

export type Topic = {
  title: string;
  content: string;
  subtopics: string[];
  keyTerms?: KeyTerm[];
};

export type Flashcard = {
  term: string;
  definition: string;
  simplifiedDefinition?: string;
  creoleDefinition?: string;
};

export type QAItem = {
  question: string;
  answer: string;
};

export type Module = {
  title: string;
  description: string;
  learningObjectives?: string[];
  topics: Topic[];
  learningTools: {
    games: Quiz[];
    flashcards: Flashcard[];
    questionBank: QAItem[];
  };
}; 