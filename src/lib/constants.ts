export const DIFFICULTY_LABEL: Record<string, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

export const DIFFICULTY_OPTIONS = [
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Médio" },
  { value: "dificil", label: "Difícil" },
];

export const ALTERNATIVE_KEYS = ["A", "B", "C", "D"] as const;
export type AlternativeKey = (typeof ALTERNATIVE_KEYS)[number];

export const QUESTION_TYPE_LABEL: Record<string, string> = {
  objetiva: "Objetiva",
  discursiva: "Discursiva",
};

export const QUESTION_TYPE_OPTIONS = [
  { value: "objetiva", label: "Objetiva (A, B, C, D)" },
  { value: "discursiva", label: "Discursiva (linhas para resposta)" },
];

export const ANSWER_LINES_DEFAULT = 5;
export const ANSWER_LINES_PRESETS = [3, 5, 8, 10, 15, 20];

export const DEFAULT_SECTIONS = [
  "Língua Portuguesa",
  "Produção de Texto",
  "Matemática",
  "Ciências",
  "História",
  "Geografia",
  "Artes",
  "Inglês",
];

export const FONT_FAMILIES = [
  { value: "helvetica", label: "Helvetica" },
  { value: "times", label: "Times New Roman" },
  { value: "courier", label: "Courier" },
];

export const DEFAULT_GRADES = [
  "1º ano",
  "2º ano",
  "3º ano",
  "4º ano",
  "5º ano",
  "6º ano",
  "7º ano",
  "8º ano",
  "9º ano",
  "1º ano (EM)",
  "2º ano (EM)",
  "3º ano (EM)",
];

export const DEFAULT_SUBJECTS = [
  "Língua Portuguesa",
  "Matemática",
  "Ciências",
  "História",
  "Geografia",
  "Inglês",
  "Educação Física",
  "Artes",
  "Filosofia",
  "Sociologia",
  "Física",
  "Química",
  "Biologia",
];
