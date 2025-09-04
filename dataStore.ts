// YOU SHOULD MODIFY THIS OBJECT BELOW ONLY
interface user {
  authUserId: number,
  email: string,
  password: string,
  passwordHistory: string[],
  nameFirst: string,
  nameLast: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number,
  isLoggined: boolean,
  sessions: session[],
}
interface session {
  sessionId: string,
}

interface quizz {
  quizId: number,
  name: string,
  createdBy: number,
  description: string,
  timeCreated: number,
  timeLastEdited: number,
  questions: Question[],
  thumbnailUrl?: string,
  duration: number, 
  sessionlength: number,
}

interface message {
  messageBody: string,
  playerId: number,
  playerName: string,
  timeSent: number,
}

interface Question {
  questionId: number;
  token: string;
  question: string;
  duration: number;
  points: number;
  answers: Answer[];
  thumbnailUrl: string;
}

interface Answer {
  answer: string;
  correct: boolean;
  answerId: number;
  colour: string;
}

interface quiztrash {
  quizId: number,
  name: string,
  createdBy: number,
  description: string,
  timeCreated: number,
  timeLastEdited: number,
  questions: Question[],
  thumbnailUrl: string,
  duration: number,
  sessionlength: number
}

interface Player {
  playerId: number;
  name: string;
  score: number;
  timeJoined: number;
  timeLastActive: number;
  answers: PlayerAnswer[];
  state: QuizSessionState;
  numQuestions: number;
  atQuestion: number;

}

interface PlayerAnswer {
  questionId: number;
  answer: string;
  answeredCorrectly: boolean;
}


interface QuizSession {
  creatByquizId: number;
  sessionId: number;
  questionPosition: number;
  question: Question[],
  numQuestions: number;
  currentState: QuizSessionState;
  createdAt: Date;
  updatedAt: Date;
  timer?: NodeJS.Timeout;
  players: Player[];
  usersRank: Rank[];
  questionResults: Result[];
  autoStartNum: number;
  chat: message[];
}


interface Rank {
  name: string;
  sorce: number;
}

interface Result {
  questionId: number;
  playerCorrectLists: string[];
  averageAnswerTime: number;
  percentCorrect: number;
}

interface chat {
  message: string[],
  playerId: number,
  playerName: string,
  timeSent: number,
}

type QuizSessionState = 
  | 'LOBBY' 
  | 'QUESTION_COUNTDOWN' 
  | 'QUESTION_OPEN' 
  | 'QUESTION_CLOSE' 
  | 'ANSWER_SHOW' 
  | 'FINAL_RESULTS' 
  | 'END';

type Data ={
  users: user[],
  quizzes: quizz[],
  trash: quiztrash[],
  session: QuizSession[],
}
let data: Data = {
  users: [],
  quizzes: [],
  trash: [],
  session: [],
};

// YOU SHOULD MODIFY THIS OBJECT ABOVE ONLY

// YOU SHOULDNT NEED TO MODIFY THE FUNCTIONS BELOW IN ITERATION 1

/*
Example usage
    let store = getData()
    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

    names = store.names

    names.pop()
    names.push('Jake')

    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
    setData(store)
*/

// Use get() to access the data
function getData() {
  return data;
}

// Use set(newData) to pass in the entire data object, with modifications made
function setData(newData: Data) {
  data = newData;
}

export { getData, setData, Question, session, QuizSession, Player, PlayerAnswer, QuizSessionState , Result, Rank, chat, message};
