import { Session } from 'inspector/promises';
import { getData, QuizSession, QuizSessionState, setData, Player ,Rank} from './dataStore';
import {getAuthUserIdFromToken} from './token';
let id = 0;

function isValidAuthUserId(authUserId: number) {
  const store = getData();
  return store.users.some(user => user.authUserId === authUserId);
}

function isValidQuizName(name: string) {
  if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
    return false;
  }

  if (name.length < 3) {
    return false;
  }

  if (name.length > 30) {
    return false;
  }

  return true;
}

let quizid = 0;
function quizIdGen() {
  quizid = quizid + 1;
  return quizid;
}

function isValidDescription(description: string) {
  if (description.length > 100) {
    return false;
  }
  return true;
}

function authUserIdGen() {
  getData();
  id += 1;
  return id;
}

function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  const store = getData();
  const emailExists = store.users.some(user => user.email === email);
  return !emailExists;
}

function isValidPassword(password: string) {
  const checkLetter = /[A-Za-z]/.test(password);
  const checkNumber = /\d/.test(password);
  const checkLength = password.length >= 8;
  return (checkLetter && checkNumber && checkLength);
}

function isValidName(name: string) {
  if (name.length < 2) {
    return false;
  }

  if (name.length > 20) {
    return false;
  }
  if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
    return false;
  }
  return true;
}

function isValidQuizId(authUserId: number, quizId: number) {
  const store = getData();
  const user = store.users.find(user => user.authUserId === authUserId);

  const hasQuizId = store.quizzes.some(quiz => quiz.createdBy === authUserId && quiz.quizId === quizId);
  return hasQuizId;
}

export { isValidQuizId, isValidAuthUserId, isValidQuizName, quizIdGen, isValidDescription, authUserIdGen, isValidName, isValidPassword, isValidEmail };

export function answerIdGen(authUserId: number, quizid: number): number {
  const store = getData();
  const quiz = store.quizzes.find(quiz => quiz.createdBy === authUserId && quiz.quizId === quizid);
  if (!quiz.questions || quiz.questions.length === 0) {
    return 1;  
  }
  let maxAnswerId = 0;
  for (const question of quiz.questions) {
    for (const answer of question.answers) {
      if (answer.answerId > maxAnswerId) {
        maxAnswerId = answer.answerId;
      }
    }
  }
  return maxAnswerId + 1;
}

export function isQuestionLengthValid(question: string): boolean {
  return question.length >= 5 && question.length <= 50;
}

export function isAnswerCountValid(answers: { answer: string; correct: boolean }[]): boolean {
  return answers.length >= 2 && answers.length <= 6;
}

export function isDurationValid(duration: number): boolean {
  return duration > 0 && duration <= 180;
}
export function isDurationtotalValid(authUserId: number,quizid: number ,durationnumber: number): boolean {
  const store = getData();
  const quiz = store.quizzes.find((quiz) => quiz.quizId === quizid && quiz.createdBy === authUserId);
  
    let alldurationnumber = quiz.questions.reduce((sum, question) => sum + question.duration, 0);
    if(alldurationnumber <= 180){
      quiz.duration = alldurationnumber;
      setData(store);
      return true
    }
  return false;
}

export function isPointsValid(points: number): boolean {
  return points >= 1 && points <= 10;
}

export function areAnswerLengthsValid(answers: { answer: string; correct: boolean }[]): boolean {
  return answers.every(answer => answer.answer.length >= 1 && answer.answer.length <= 30);
}

export function areAnswersUnique(answers: { answer: string; correct: boolean }[]): boolean {
  const answerStrings = answers.map(a => a.answer);
  const uniqueAnswers = new Set(answerStrings);
  return uniqueAnswers.size === answerStrings.length;
}

export function hasCorrectAnswer(answers: { answer: string; correct: boolean }[]): boolean {
  return answers.some(answer => answer.correct);
}

export function isValidQuestionId(questionId: number) {
  const store = getData();
  return store.quizzes.some(quiz => quiz.questions.some(question => question.questionId === questionId));
}


export function isValidQuizIdTrash(authUserId: number, quizIds: number[]): number | boolean {
  const store = getData(); 
  const user = store.users.find(user => user.authUserId === authUserId); 

  for (const quizId of quizIds) {
    const quiz = store.trash.find(quiz => quiz.quizId === quizId);
    if (!quiz) {
      return 400;
    }
    if (quiz.createdBy !== authUserId) {
      return 403;
    }

  }
  return true;
}

export function isValidPosition(currentPosition: number, newPosition: number, questionAmount: number) {
  if (newPosition < 0 || newPosition >= questionAmount) {
      return false;
  }
  if (currentPosition === newPosition) {
      return false;
  }
  return true;
}

export function isValidQuiz(authUserId: number, quizId: number): boolean {
  const store = getData();
  return store.trash.some(trash => trash.createdBy === authUserId && trash.quizId === quizId);
}

export function tokenValidityCheck(token: string): boolean {
  const authUserId = getAuthUserIdFromToken(token);
  return !!authUserId; 
}
const colours = ["red", "blue", "yellow", "green", "brown", "purple", "orange"];
export function getRandomColour(): string {
  const randomIndex = Math.floor(Math.random() * colours.length);
  return colours[randomIndex];
}

export const startCountdown = (session: QuizSession, delay: number, nextState: QuizSessionState) => {
  session.timer = setTimeout(() => {
    session.currentState = nextState;
    session.updatedAt = new Date();
  }, delay);
};


export function quizsessionendcheck(quizId: number): boolean{
  const store = getData();
  const session = store.session.find(session => session.creatByquizId === quizId);
  if (session.currentState === 'END'){
    return true
  }
  return false //找到了返回真
}

export function playerIdGen() {
  getData();
  id += 1;
  return id;
}

export function randomNameGen(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";

  let name = '';
  for (let i = 0; i < 5; i++) {
      name += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 3; i++) {
      name += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return name;
}

export function autoStartSession(sessionId: number) {
  const store = getData();
  const session = getQuizSession(sessionId);
  if(session){
    if (session.currentState === 'LOBBY' && session.players.length === session.autoStartNum) {
      session.currentState = 'QUESTION_COUNTDOWN';
      session.updatedAt = new Date(); 
      setData(store);
      return true;
    }
  }
  return false;
}

export function checkSessionInFinalResults(playerId: number) {
  const data = getData();

  const requiredQuiz = data.session.find(s => s.players.some(p => p.playerId == playerId));
  if (requiredQuiz === undefined) {
    return { error: 'Player ID does not exist' };
  }
  
  if (requiredQuiz.currentState !== "FINAL_RESULTS") {
    return { error: 'Session is not in FINAL_RESULTS state' };
  }
  return true;
}

export function isValidPlayerId(playerId: number) {
  const store = getData();
  const player = store.session.flatMap(session => session.players).find(player => player.playerId === playerId);
  if (player){
    return player;
  }
  return null;
}

export function isValidMessage(message: string) {
  return message.length >= 1 && message.length <= 100;
}

export const getQuizSession = (sessionId: number): QuizSession | null => {
  const store = getData();
  const session = store.session.find(session => session.sessionId === sessionId)
  if(session){
    return session;
  }
  return null;
};

export function findPlayer(playerId: number): Player | null{
  const store = getData();

  const player = store.session.flatMap(session => session.players).find(player => player.playerId === playerId)
  if (player) {
    return player;
  }
  return null
}

export function getPlayersBySession(sessionId: number): string[] | null{
  const store = getData();
  const session = store.session.find(session => session.sessionId === sessionId)
  if (session) {
    return session.players.map(player => player.name);
  }
  return null
}

export function getPlayersScorcBySession(sessionId: number): number[] | null{
  const store = getData();
  const session = store.session.find(session => session.sessionId === sessionId)
  if (session) {
    return session.players.map(player => player.score);
  }
  return null
}

export function findSessionByPlayerid(playerId: number) {
  const store = getData();
  const session =  store.session.find((session: QuizSession) => 
    session.players.some((player: Player) => player.playerId === playerId)
  );
  if(session){
    return session;
  }
  return null;
}

export function aSubsetB(a: number[], b: number[]): boolean {
  return a.every(element => b.includes(element));
}

export function Duplicatescheck(result: any[]): boolean {
  const elementCount: { [key: string]: number } = {};

  for (const item of result) {
    if (elementCount[item]) {
      return true; 
    }
    elementCount[item] = 1;
  }
  return false;
}

export function arraysEqual(arr1: number[], arr2: number[]): boolean {
  if (arr1.length !== arr2.length) return false; 
  const sortedArr1 = [...arr1].sort((a, b) => a - b);
  const sortedArr2 = [...arr2].sort((a, b) => a - b);
  return sortedArr1.every((value, index) => value === sortedArr2[index]);
}

export function hasSessionInQuiz(quizId: number): boolean {
  const data = getData();
  const quiz = data.quizzes.find(q => q.quizId === quizId);
  if (quiz.sessionlength === 1) {
    return true;
  }
  return false;
}

export function getToNextquestion(sessionId: number) {
  const data = getData();
  const session = data.session.find(session => session.sessionId === sessionId)
  if (session) {
    session.questionPosition += 1;
    setData(data); 
  } 
}
export function startQuestionTimeByquestionId(quizId: number, questionId: number, session: QuizSession){
  const data = getData();
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  const question = quiz.questions[questionId];
  session.timer = setTimeout(() => {
    session.currentState = 'QUESTION_CLOSE';
    session.updatedAt = new Date();
  }, question.duration * 1000);
}

//比较两个数组元素是否相同

//比较返回问题和player回答的答案
//1.检查所有该sessionid下所有参加的player的答案，找到答对的人 
//player答案只有两种状态，正确和错误，主要是思考如何通过session的状态来确定是否应该开始检查，
//我的session从开始状态是lobby，更新状态，问题从第一个开始，只要状态到end，我们进入下一个问题
// export const winners = (quizId: number, sessionId: number): string[] => {
//   const store = getData();
//   const quiz = store.quizzes.find(quiz => quiz.quizId === quizId);
//   const session = quiz?.sessions.find(s => s.sessionId === sessionId);
//   let player = session.
// }
//2.找到答对的人的分数
//3.计算正确率
//4.计算平均时间（我们需要计数player）