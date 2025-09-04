import request, { HttpVerb } from 'sync-request-curl';
import config from './config.json';

 
const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
 
interface RequestHelperReturnType {
  statusCode: number;
  jsonBody?: Record<string, any>;
  error?: string;
}
// requestHelper 
export const requestHelper = (
  method: HttpVerb,
  path: string,
  payload: object = {},
  token?: string,
): RequestHelperReturnType => {
  // //http request 1. request line include <1>method(PUT, GET, POST) <2> URL
  // //             2. request headers use to delivery the data or request 
  // //                <. like Authorization => use to delivery the Authentication information, such as tokens
  // //             3. body
  // //token
  // const headers: Record<string, string> = { 'Content-Type': 'application/json' }; //first string is the name //scencond string is the 内容
  
  // const Token = token || (payload as any).token;
  // console.log("server里的token", Token); 
  // if (path !== '/v1/clear' && Token) {
  //   headers['Authorization'] = `Bearer ${Token}`; // save token from http // use it to the serve and check is it correct or not
  // }else if (!Token && path !== '/v1/admin/auth/login' && path !== '/v1/admin/auth/register') {
  //   return {
  //     statusCode: 401,
  //     jsonBody: { error: 'Unknown Type: string - error.' },
  //   };
  //
  const headers = {token};
  let qs = {};
  let json = {};
  if (['GET', 'DELETE'].includes(method)) {
    qs = payload;
  } else {
    json = payload;
  }
 
  const res = request(method, SERVER_URL + path, { qs, json, headers, timeout: 60000});
  // const res = request(method, SERVER_URL + path, { qs, json, timeout: 20000 });
  const bodyString = res.body.toString();
  let bodyObject: RequestHelperReturnType;
 
  try {
    bodyObject = {
      jsonBody: JSON.parse(bodyString),
      statusCode: res.statusCode,
    };
  } catch (error: any) {
    bodyObject = {
      error: `Server responded with ${res.statusCode}, but body is not JSON!`,
      statusCode: res.statusCode,
    };
  }
 
  if ('error' in bodyObject) {
    return { statusCode: res.statusCode, error: bodyObject.error };
  }
 
  return bodyObject;
};
 
export const clearDatabase = () => {
  return requestHelper('DELETE', '/v1/clear');
};
 
// auth function
export const adminAuthRegister = (email: string, password: string, nameFirst: string, nameLast: string) => {
  return requestHelper('POST', '/v1/admin/auth/register', { email, password, nameFirst, nameLast });
};
 
export const adminAuthLogin = (email: string, password: string) => {
  return requestHelper('POST', '/v1/admin/auth/login', { email, password });
};

export const adminUserDetails = (token: string) => {
  return requestHelper('GET', '/v2/admin/user/details', { }, token=token);
};

export const adminUserDetailsUpdate = (token: string, email: string, nameFirst: string, nameLast: string) => {
  return requestHelper('PUT', '/v2/admin/user/details', {email, nameFirst, nameLast}, token=token);
};

export const adminUserPasswordUpdate = (token: string, oldPassword: string, newPassword: string) => {
  return requestHelper('PUT','/v2/admin/user/password', {oldPassword, newPassword}, token=token);
};
export const adminAuthLogout = (token: string) => {
  return requestHelper('POST', `/v2/admin/auth/logout`, {}, token=token);
};

//quiz function

export const adminQuizList = (token: string) => {
  return requestHelper('GET','/v2/admin/quiz/list', {}, token=token);
};

export const adminQuizCreate = (token: string, name: string, description: string) => {
  return requestHelper('POST', '/v2/admin/quiz', {name, description }, token=token);
};

export const adminQuizInfo = (token: string, quizid: number) => {
  return requestHelper('GET', `/v2/admin/quiz/${quizid}`, {}, token=token);
}
export const adminQuizTrash = (token: string) => {
  return requestHelper('GET', `/v2/admin/quiz/trash`,{}, token=token);
}
export const adminQuizNameUpdate = (token: string, quizid: number, name: string) => {
  return requestHelper('PUT', `/v2/admin/quiz/${quizid}/name`, {name}, token=token);
}

export const adminQuizDescriptionUpdate = (token: string, quizid: number, description: string) => {
  return requestHelper('PUT', `/v2/admin/quiz/${quizid}/description`, {description}, token=token);
}

export const adminQuizRemove = ( token: string, quizid: number) =>{
  return requestHelper('DELETE', `/v2/admin/quiz/${quizid}`, {}, token=token);
}

//iter2 new
export const adminQuizQuestionCreate = (quizid: number, token: string, questionBody: {
  question: string; 
  duration: number; 
  points: number; 
  answers: { 
    answer: string; 
    correct: boolean; 
  }[],
  thumbnailUrl: string;
}) =>{
  return requestHelper('POST', `/v2/admin/quiz/${quizid}/question`, {questionBody}, token=token);
}

export const adminQuizQuestionDelete = (token: string, quizid: number, questionid: number) => {
  return requestHelper('DELETE', `/v2/admin/quiz/${quizid}/question/${questionid}`, {}, token=token);
};

export const adminQuizTrashEmpty = (token: string, quizIds: number[]) => {
  return requestHelper('DELETE', '/v2/admin/quiz/trash/empty', {quizIds: JSON.stringify(quizIds)},token=token);
};

export const adminQuizQuestionMove = (token: string, quizId: number, questionId: number, newPosition: number) => {
  return requestHelper('PUT', `/v2/admin/quiz/${quizId}/question/${questionId}/move`, {newPosition}, token=token);
};


export const adminQuizRestore = (quizid: number, token: string) => {
  return requestHelper('POST', `/v2/admin/quiz/${quizid}/restore`, { }, token=token);
};

export const adminQuizQuestionDuplicate = (quizid: number, questionid: number, token: string) =>{
  return requestHelper('POST', `/v2/admin/quiz/${quizid}/question/${questionid}/duplicate`, {}, token=token);
}

/**export const adminQuizTrash = (token: string) => {
  return requestHelper('GET', `/v1/admin/quiz/trash?token=${encodeURIComponent(token)}`);
};**/

export const adminQuizTransfer = (token: string, quizId: number, userEmail: string) => {
  return requestHelper('POST', `/v2/admin/quiz/${quizId}/transfer`, {userEmail}, token=token);
};

export const adminQuizQuestionUpdate = (quizid: number, questionid: number, token: string, questionBody: {
  question: string; 
  duration: number; 
  points: number; 
  answers: { 
    answer: string; 
    correct: boolean; 
  }[],
  thumbnailUrl: string;
}) => {
  return requestHelper('PUT', `/v2/admin/quiz/${quizid}/question/${questionid}`, {questionBody}, token=token);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//iter 3
export const adminQuizThumbnail = (quizid: number, token: string, imgUrl: string ) =>{
  return requestHelper('PUT', `/v1/admin/quiz/${quizid}/thumbnail`, {imgUrl}, token=token);
}

export const adminQuizSessionStatus = (quizid: number, sessionid: number, token: string) => {
  return requestHelper('GET', `/v1/admin/quiz/${quizid}/session/${sessionid}`, {}, token);
};
export const QuizSessionsView = (token: string, quizid: number) =>{
  return requestHelper('GET', `/v1/admin/quiz/${quizid}/sessions`, {}, token=token);
}

export const QuizSessionStart = (token: string, quizid: number, autoStartNum: number) =>{
  return requestHelper('POST', `/v1/admin/quiz/${quizid}/session/start`, {autoStartNum}, token=token);
}

export const adminQuizSessionResults = (token: string, quizid: number, sessionid: number) => {
  return requestHelper('GET', `/v1/admin/quiz/${quizid}/session/${sessionid}/results`, {}, token);
}
export const adminQuizSessionResultsCSV = (token: string, quizId: number, sessionId: number) => {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}/session/${sessionId}/results/csv`, {}, token);
}

export const adminQuizSessionUpdate = (token: string, quizid: number, sessionid: number, action: string) =>{
  return requestHelper('PUT', `/v1/admin/quiz/${quizid}/session/${sessionid}`, {action}, token=token);
}

export const playerJoin = (sessionId: number, name: string) =>{
  return requestHelper('POST', `/v1/player/join`, {sessionId, name});
}

export const playerStatus = (playerId: number) =>{
  return requestHelper('GET', `/v1/player/${playerId}`, {});
}

export const playerQuestionInfo = (playerId: number, questionposition: number) =>{
  return requestHelper('GET', `/v1/player/${playerId}/question/${questionposition}`, {});
}

export const playerResults = (playerId: number) => {
  return requestHelper('GET', `/v1/player/${playerId}/results`, {});
};

export const playerChatSend = (playerId: number, message: { messageBody: string}) =>{
  return requestHelper('POST', `/v1/player/${playerId}/chat`, {message});
}

export const playerQuestionAnswer = (playerId: number, questionposition: number, answerIds: number[]) =>{
  return requestHelper('PUT', `/v1/player/${playerId}/question/${questionposition}/answer`, {answerIds});
}

export const playerQuestionResults = (playerId: number, questionposition: number) => {
  return requestHelper('GET', `/v1/player/${playerId}/question/${questionposition}/results`, {questionposition} )
}

export const playerChat = (playerId: number) =>{
  return requestHelper('GET', `/v1/player/${playerId}/chat`, {});
}
//有病吧我服了 累死了
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////