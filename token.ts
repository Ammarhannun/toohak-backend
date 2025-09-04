import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getData, setData, QuizSession, Player, Result, Rank, message} from './dataStore';

export function getAuthUserIdFromToken(token: string): number |null {
    try {
      const decoded = jwt.verify(token, 'tianruikey') as { sessionId: string, authUserId: number , isLoggined: boolean};
      return decoded.authUserId;
    } catch (err) {
      console.log('无法解析 token:', err);
      return null;
    }
}
export function creatToken(authUserId: number): string{
  const store = getData();
  const user = store.users.find(user => user.authUserId === authUserId);
  const sessionid = user.sessions[user.sessions.length - 1]?.sessionId;
  const token = jwt.sign({ sessionId: sessionid , authUserId: user.authUserId, isLoggedIn: user.isLoggined }, 'tianruikey', { expiresIn: '24h' });
  return token;
}
export function tokencheck(token: string){
    const store = getData();
    const authUserId = getAuthUserIdFromToken(token);
    return store.users.some(user => user.authUserId === authUserId && user.isLoggined === true);
}

export function createSession(authUserId: number): string{
    const store = getData();
    const user = store.users.find(user => user.authUserId === authUserId);
    const sessionId = uuidv4(); // 生成唯一的 sessionId
    const session = {
      sessionId,
    };
    return sessionId;
}



export function createQuizSession(quizId: number): number | null {
  const store = getData();
  const quiz = store.quizzes.find(q => q.quizId === quizId);
  if (quiz) {
    quiz.sessionlength = 1;
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000); 
    const sessionId = parseInt(`${timestamp}${random}`);
    const newQuizSession: QuizSession = {
      creatByquizId: quizId,
      sessionId,
      questionPosition: 0, //在状态改变的时候经入下一个问题
      numQuestions: quiz.questions.length,
      currentState: 'LOBBY',
      createdAt: new Date(),
      updatedAt: new Date(),
      players: [] as Player[],
      usersRank: [] as Rank[],
      questionResults: [] as Result[],
      autoStartNum: 0,
      chat: [] as message[],
      question: quiz.questions
    };
    store.session.push(newQuizSession); 
    console.log("createQuizSession中的quizsession",store.session);
    setData(store);
    return sessionId;
  }
  return null;
}