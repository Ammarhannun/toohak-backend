import { message } from "./dataStore";

export type EmptyObject = Record<string, never>;
//auth
export interface AuthRegisterResponse {
    // token?:string[];
    token?: string;
    error?: string;
}

export interface AuthLoginResponse {
    token?: string;
    error?: string;
}
export interface UserDetailsResponse {
    user?: {
        userId: number;
        name: string;
        email: string;
        numSuccessfulLogins: number;
        numFailedPasswordsSinceLastLogin: number;
      };
      error?: string;
}
export interface UserDetailsUpdateResponse {
    error?: string;
}

export interface UserPasswordUpdateResponse {
    error?: string;
}
//quiz
export interface QuizCreateResponse {
    quizId?: number;
    error?: string;
}

export interface QuizRemoveResponse {
      error?: string;
}

export interface QuizNameUpdateResponse {
      error?: string;
}

export interface QuizInfoResponse {
    quizId?: number;
    name?: string;
    createdBy?: number;
    timeCreated?: number;
    timeLastEdited?: number;
    description?: string;
    questions?: { 
      questionId: number, 
      token: string, 
      question: string; 
      duration: number; 
      points: number; 
      answers: { 
        answer: string; 
        correct: boolean; 
      }[]; 
    }[];
    thumbnailUrl?: string;
    error?: string;
}

export interface QuizDescriptionUpdateResponse {
    error?: string;
}

export interface QuizListResponse {
    quizzes?: { quizId: number; name: string }[];
    error?: string;
}

export interface QuestionQuizCreateResponse {
  questionId?: number; 
  error?: string;     
}
export interface QuizQuestionDeleteResponse {
  error?: string;     
}
export interface QuizTrashEmptyResponse {
  error?: string;     
}
export interface QuizQuestionMoveResponse {
  error?: string;     
}
export interface QuizQuestionDuplicateResponse {
  newQuestionId?: number
  error?: string;  
}
export interface QuizQuestionUpdateResponse {
  error?: string;
}

export interface QuizThumbnailUpdateResponse {
  
}

export interface QuizSessionsViewResponse {
  activeSessions?: number[];
  inactiveSessions?: number[];
  error?: string;
}

export interface QuizSessionStartResponse {
  sessionId?: number;
  error?: string;
}

export interface QuizSessionStatusResponse {
  state?: string;
  atQuestion?: number;
  players?: string[];
  metadata?: {
    quizId: number;
    name: string;
    createdBy: number;
    timeCreated: number;
    timeLastEdited: number;
    description: string;
    numQuestions: number;
    questions: {
      questionId: number;
      question: string;
      duration: number;
      thumbnailUrl: string;
      points: number;
      answers: {
        answerId: number;
        answer: string;
        colour: string;
        correct: boolean;
      }[];
    }[];
    duration?: number;
    thumbnailUrl?: string;
  };
  error?: string;
}

export interface QuizSessionUpdateResponse {
  error?: string;
}

export interface QuizSessionResultsResponse {
  usersRankedByScore?: {
    playerId: number;
    name: string;
    score: number;
  }[];
  questionResults?: {
    questionId: number;
    question: string;
    correctAnswer: string;
    playerResults: {
      playerId: number;
      answeredCorrectly: boolean;
      score: number;
    }[];
  }[];
  error?: string;
}

export interface PlayerJoin {
  playerId?: number;
  error?: string;
}

export interface PlayerStatus {
  state?: string;
  numQuestions?: number;
  atQuestion?: number;
  error?: string;
}

export interface PlayerQuestionInfo {
  questionId: number;         
  question: string;          
  duration: number;          
  thumbnailUrl: string;  
  points: number;           
  answers: Answer[];       
}

export interface Answer {
  answerId: number;       
  answer: string;         
  colour: string;          
}

export interface PlayerResults {
  usersRankedByScore: {
      name: string;
      score: number;
  }[];
  questionResults: {
      questionId: number;
      playersCorrectList: string[];
      averageAnswerTime: number;
      percentCorrect: number;
  }[];
  error?: string;
}

export interface PlayerChatSend {
  error?: string;
}

export interface PlayerChat {
  messages?: message[],
  error?: string;
}

export interface PlayerQuestionResults {
  questionId: number,
  playersCorrectList: string[],
  averageAnswerTime: number;
  percentCorrect: number;
  error?: string;
}

export interface QuizQuestionCsv {
  url? : string;
  error?: string;
}
