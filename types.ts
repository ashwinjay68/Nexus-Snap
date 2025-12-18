export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
}

export enum AppState {
  WELCOME = 'WELCOME',
  CAMERA = 'CAMERA',
  CONFIG = 'CONFIG',
  GENERATING = 'GENERATING',
  QUIZ = 'QUIZ',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface AudioConfig {
  sampleRate: number;
}