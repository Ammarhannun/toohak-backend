import { getData, setData, Question, QuizSession } from './dataStore';
import { isValidAuthUserId, isValidQuizName, quizIdGen, isValidDescription, isValidQuizId, tokenValidityCheck, getRandomColour, isDurationtotalValid, answerIdGen, 
        startCountdown, quizsessionendcheck, getQuizSession,  getPlayersBySession, hasSessionInQuiz, startQuestionTimeByquestionId} from './helperFunctions';
import {QuizCreateResponse, QuizRemoveResponse, QuizNameUpdateResponse, QuizInfoResponse, QuizDescriptionUpdateResponse, QuizListResponse, QuestionQuizCreateResponse, 
        QuizQuestionDeleteResponse, QuizTrashEmptyResponse, QuizQuestionMoveResponse, QuizQuestionDuplicateResponse, QuizQuestionUpdateResponse, QuizThumbnailUpdateResponse,
        QuizSessionsViewResponse, QuizSessionStartResponse, QuizSessionStatusResponse, QuizSessionResultsResponse, QuizSessionUpdateResponse, QuizQuestionCsv} from './returnInterfaces';
import {isValidQuizIdTrash, isQuestionLengthValid, isAnswerCountValid, isDurationValid, isPointsValid, areAnswerLengthsValid, areAnswersUnique, hasCorrectAnswer, isValidQuestionId, isValidPosition,  getToNextquestion} from './helperFunctions'
import { getAuthUserIdFromToken, createQuizSession } from './token';
import fs from 'fs';
import path from 'path';
import HTTPError from 'http-errors';
import { APIError } from './APIError';
/**
 * Given basic details about a new quiz, create one for the logged in user.
 *
 * @param {string} token - user's token
 * @param {string} name - quiz's name
 * @param {string} description - quiz's description
 * @returns {integer} quizId - quiz's id
 */
export function adminQuizCreate(token: string, name: string, description: string): QuizCreateResponse {
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);

  /*if (!authUserId) {
    throw new Error('Auth user ID is required');
  }*/

  if (!isValidAuthUserId(authUserId)) {
    throw new APIError('Invalid auth user ID', 401);
  }

  if (!isValidQuizName(name)) {
    throw new APIError('Invalid quiz name', 400);
  }

  if (!isValidDescription(description)) {
    throw new APIError( 'Invalid description', 400);
  }

  const existingQuiz = store.quizzes.find((quiz) => quiz.name === name && quiz.createdBy === authUserId);
  if (existingQuiz) {
    throw new APIError(`Quiz name '${name}' is already used by the user`, 400);
  }

  const quizId = quizIdGen();

  const newQuiz = {
    quizId: quizId,
    name: name,
    createdBy: authUserId,
    description: description,
    timeCreated: Math.floor(Date.now() / 1000),
    timeLastEdited: Math.floor(Date.now() / 1000),
    questions: [] as Question[],
    thumbnailUrl: " ",
    sessions: [] as QuizSession[],
    duration: 0,
    sessionlength: 0,
  };

  store.quizzes.push(newQuiz);
  setData(store);

  return {
    quizId: quizId
  };
}

/**
 * Removes quiz for the current user.
 *
 * @param {string} token - user's token
 * @param {integer} quizId - quiz's id
 * @returns {object} - Empty return or return error
 */
export function adminQuizRemove(token: string, quizId: number): QuizRemoveResponse {
  const data = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);

  // if (!isValidAuthUserId(authUserId)) {
  //   throw new APIError('Auth user ID is not valid.', 403);
  // }

  if (!isValidQuizId(authUserId, quizId)) {
    throw new APIError('Quiz not found or does not belong to the current user.', 403);
  }

  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId && quiz.createdBy === authUserId);

  const trashquiz = {
    quizId: quiz.quizId,
    name: quiz.name,
    createdBy: quiz.createdBy,
    description: quiz.description,
    timeCreated: quiz.timeCreated,
    timeLastEdited: Math.floor(Date.now() / 1000),
    questions: quiz.questions,
    thumbnailUrl: quiz.thumbnailUrl,
    duration: quiz.duration,
    sessionlength: quiz.sessionlength
  };
  data.trash.push(trashquiz);

  const index = data.quizzes.indexOf(quiz);
  data.quizzes.splice(index, 1);

  setData(data);

  return {};
}

/**
 * Update the name of the relevant quiz.
 *
 * @param {string} token - user's token
 * @param {integer} quizId - quiz's id
 * @param {string} name - quiz's name
 * @returns {object} - returns empty or error
 */
export function adminQuizNameUpdate (token: string, quizId: number, name: string): QuizNameUpdateResponse {
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);

  /*if (!isValidAuthUserId(authUserId)) {
    return { error: 'AuthUserId is not a valid user.' };
  }*/

  if (!isValidQuizId(authUserId, quizId)) {
    throw new APIError('Quiz ID does not refer to a valid quiz.', 403);
  }

  if (!isValidQuizName(name)) {
    throw new APIError( 'Name contains invalid characters or is not within the length range.', 400);
  }

  const existingQuiz = store.quizzes.find((quiz) => quiz.quizId === quizId && quiz.createdBy === authUserId);
  if (existingQuiz.name === ' ') {
    throw new APIError ( 'Quiz name does not exist.' , 400);
  }
  // if (!existingQuiz) {
  //   return { error: 'Quiz not found or does not belong to the current user.' };
  // }

  const existingQuizWithSameName = store.quizzes.find((quiz) => quiz.name === name && quiz.createdBy === authUserId);
  if (existingQuizWithSameName && existingQuizWithSameName.quizId !== quizId) {
    throw new APIError('Quiz name is already used by the current logged-in user', 400);
  }

  existingQuiz.name = name;
  existingQuiz.timeLastEdited = Math.floor(Date.now() / 1000);
  setData(store);

  return {};
}

/**
 * Get info of the quiz from current user.
 *
 * @param {string} token - user's token
 * @param {integer} quizId - quiz's id
 * @returns {object} - returns all the quiz details or error
 */
export function adminQuizInfo(token: string, quizId: number): QuizInfoResponse {
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);

  /*if (!isValidAuthUserId(authUserId)) {
    return { error: 'AuthUserId is not a valid user.' };
  }*/

  if (!isValidQuizId(authUserId, quizId)) {
    throw new APIError( 'Quiz ID is not connected to a valid quiz', 403);
  }

  const quiz = store.quizzes.find(quiz => quiz.quizId === quizId);


  return {
    quizId: quiz.quizId,
    name: quiz.name,
    createdBy: quiz.createdBy,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    questions: quiz.questions,
    thumbnailUrl: quiz.thumbnailUrl,
  };
}

/**
 * Update the description of selected quiz.
 *
 * @param {string} token - user's token
 * @param {integer} quizId - quiz's id
 * @param {string} description - updated description
 * @returns {object} - return a empty object or error
 */
export function adminQuizDescriptionUpdate(token: string, quizId: number, description: string): QuizDescriptionUpdateResponse {
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);

  // if (!isValidAuthUserId(authUserId)) {
  //   return { error: 'AuthUserId is not a valid user.' };
  // }

  if (!isValidQuizId(authUserId, quizId)) {
    throw new APIError( 'Quiz ID does not refer to a valid quiz', 403);
  }
  if (!isValidDescription(description)) {
    throw new APIError( 'Description contains invalid characters or is not within the length range', 400);
  }

  const existingQuiz = store.quizzes.find((quiz) => quiz.quizId === quizId && quiz.createdBy === authUserId);

  existingQuiz.description = description;
  existingQuiz.timeLastEdited = Math.floor(Date.now() / 1000);
  setData(store);
  return {};
}

/**
 * List of all quizzes made by the user.
 *
 * @param {string} token - user's token
 * @returns {object} - returns a array of quiz objects, that contains quizID and name, or returns error
 */
export function adminQuizList(token: string): QuizListResponse {
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);
  // if (!isValidAuthUserId(authUserId)) {
  //   return { error: 'AuthUserId is not a valid user.' };
  // }
  const quizzes = store.quizzes.filter(quiz => quiz.createdBy === authUserId); 
  return {
    quizzes: quizzes.map(quiz => {
      return {
        quizId: quiz.quizId,
        name: quiz.name,
      };
    })
  };
}


/**
 * Function is used to create a new question with selected quiz.
 *
 * @param {integer} quizId - quiz ID
 * @param {string} token - user's token
 * @param {object} questionBody - Question details, text, duration, points, and answers
 * @returns {integer} questionId - ID of the created question
 */
export function adminQuizQuestionCreate(
  quizId: number, 
  token: string, 
  questionBody: {
    question: string; 
    duration: number; 
    points: number; 
    answers: { 
      answer: string; 
      correct: boolean; 
    }[],
    thumbnailUrl: string,
  }
): QuestionQuizCreateResponse {
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);

  if (!isQuestionLengthValid(questionBody.question)) {
    throw new APIError( 'Question length must be between 5 and 50 characters.', 400);
  }
  if (!isDurationValid(questionBody.duration)) {
    throw new APIError('duration >0 and <180.', 400);
  }
  if (!isAnswerCountValid( questionBody.answers)) {
    throw new APIError( 'There must be between 2 and 6 answers.', 400);
  }
  
  if (!isPointsValid(questionBody.points)) {
    throw new APIError('Points must be between 1 and 10.', 400);
  }

  if (!areAnswerLengthsValid(questionBody.answers)) {
    throw new APIError( 'Each answer must be between 1 and 30 characters.', 400 );
  }

  if (!areAnswersUnique(questionBody.answers)) {
    throw new APIError('Answers must be unique.', 400);
  }

  if (!hasCorrectAnswer(questionBody.answers)) {
    throw new APIError('At least one answer must be marked as correct.', 400);
  }  

  const isValidUrl = /^https?:\/\/.+\.(jpg|jpeg|png)$/i.test(questionBody.thumbnailUrl);
  if (!isValidUrl) {
    throw new APIError('The imgUrl must start with "http://" or "https://" and end with .jpg, .jpeg, or .png', 400);
  }

  const existingQuiz = store.quizzes.find((quiz) => quiz.quizId === quizId && quiz.createdBy === authUserId);
  const questionId = quizIdGen();
  const timeLastEdited = Math.floor(Date.now() / 1000);
  let nextAnswerId = answerIdGen(authUserId, quizId);
  const newQuestion = {
    questionId: questionId,
    token: token,
    question: questionBody.question,
    duration: questionBody.duration,
    points: questionBody.points,
    answers: questionBody.answers.map(answer => ({
      ...answer,             
      colour: getRandomColour(),
      answerId: nextAnswerId++,
    })), 
    thumbnailUrl: questionBody.thumbnailUrl,
  }; 
  existingQuiz.timeLastEdited = timeLastEdited;
  existingQuiz.questions.push(newQuestion);
  if (!isDurationtotalValid(authUserId, quizId, questionBody.duration)) {
    const questiondelete = existingQuiz.questions.findIndex((question) => question.questionId === newQuestion.questionId);
    existingQuiz.questions.splice(questiondelete , 1);
    throw HTTPError(400, 'Duration add must be smaller than 180.');
  }
  setData(store); 
  return { questionId }; 
}

/**
 * Duplicates a question within the selected quiz.
 *
 * @param {integer} quizId - quiz Id
 * @param {integer} questionId - question Id
 * @param {string} token - user's token
 * @returns {integer} newQuestionId - id of duplicate question
 */
export function adminQuizQuestionDuplicate(quizId: number, questionId: number, token: string): QuizQuestionDuplicateResponse {
  const store = getData();  
  const authUserId = getAuthUserIdFromToken(token);  
  
  
  // if (!authUserId) {
  //   return { error: 'Invalid or missing token' };
  // }

   
  if (!isValidQuizId(authUserId, quizId)) {
    throw new APIError('Invalid quizz ID', 403);
  }
  if (!isValidQuestionId(questionId)) {
    throw new APIError('Invalid question ID', 400);
  }

  
  const quiz = store.quizzes.find(quiz => quiz.quizId === quizId && quiz.createdBy === authUserId);
  const questionIndex = quiz.questions.findIndex(q => q.questionId === questionId);
  if (questionIndex === -1) {
    throw new APIError('Question not found in the quiz', 400 );  
  }
  const questionid = quizIdGen();
  
  const newQuestion = { ...quiz.questions[questionIndex], questionId: questionid };
  quiz.questions.splice(questionIndex + 1, 0, newQuestion);  

  
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  
  setData(store);

  
  return { newQuestionId: newQuestion.questionId };
}


/**
 * Deletes a question from the quiz.
 *
 * @param {string} token - user's token
 * @param {integer} quizId - quiz ID
 * @param {integer} questionId - Question ID for deleting
 * @returns {object} - Empty return or an error
 */
export function adminQuizQuestionDelete(token: string, quizId: number, questionId: number): QuizQuestionDeleteResponse{
  const store = getData();
  const authUserId = getAuthUserIdFromToken(token);

  // if (!authUserId) {
  //   return { error: 'Invalid token'};
  // }

  // if (!isValidAuthUserId(authUserId)) {
  //   return { error: 'Invalid auth user ID' };
  // }

  if (!isValidQuizId(authUserId, quizId)) {
    throw new APIError('Invalid quizz ID', 403);
  }

  const quiz = store.quizzes.find(quiz => quiz.quizId === quizId && quiz.createdBy === authUserId);

  if (!isValidQuestionId(questionId)) {
    throw new APIError( 'Invalid question ID' , 400);
  }
  if(hasSessionInQuiz(quizId)){
    if (!quizsessionendcheck(quizId)) {
      throw new APIError ('quiz start', 400);
    }
  }
  const questionPos = quiz.questions.findIndex(question => question.questionId === questionId);

  quiz.questions.splice(questionPos, 1);

  setData(store);
  
  return {};
}

/**
 * Restores a quiz from the trash.
 *
 * @param {integer} quizId - quiz ID
 * @param {string} token - user's token
 * @returns {object} - Empty return or an error
 */
export function adminQuizRestore(quizId: number, token: string) {
  const store = getData();
  token = decodeURIComponent(token);

  const authUserId = getAuthUserIdFromToken(token);

  const quiz = store.quizzes.find(q => q.quizId === quizId && q.createdBy === authUserId);
  const trashQuiz = store.trash.find(q => q.quizId === quizId && q.createdBy === authUserId);
  if (quiz || trashQuiz) {
  } else {
    throw new APIError('Valid token is provided, but user is not an owner of this quiz or quiz does not exist', 403);
  }
  const quizInTrashIndex = store.trash.findIndex(quiz => quiz.quizId === quizId && quiz.createdBy === authUserId);
  if (quizInTrashIndex === -1) {
    throw new APIError( 'Quiz not found in the trash or does not belong to the current user', 400);
  }

  const existingQuizWithSameName = store.quizzes.find(quiz => quiz.name === store.trash[quizInTrashIndex].name && quiz.createdBy === authUserId);
  if (existingQuizWithSameName) {
    throw new APIError (`A quiz with the name '${existingQuizWithSameName.name}' already exists`, 400);
  }

  const restoredQuiz = {
    quizId: store.trash[quizInTrashIndex].quizId,
    name: store.trash[quizInTrashIndex].name,
    createdBy: store.trash[quizInTrashIndex].createdBy,
    description: store.trash[quizInTrashIndex].description,
    timeCreated: store.trash[quizInTrashIndex].timeCreated,  
    timeLastEdited: Math.floor(Date.now() / 1000),          
    questions: store.trash[quizInTrashIndex].questions || [] as Question[],  
    thumbnailUrl: store.trash[quizInTrashIndex].thumbnailUrl,
    duration: store.trash[quizInTrashIndex].duration,
    sessionlength:store.trash[quizInTrashIndex].sessionlength,
  };

  
  store.trash.splice(quizInTrashIndex, 1);
  store.quizzes.push(restoredQuiz);

  setData(store);

  return {};
}

/**
 * Function used to move a quiz towards a new position
 *
 * @param {string} token - user's token
 * @param {integer} quizId - quiz Id
 * @param {integer} questionId - question Id
 * @param {integer} newPosition - New position for the question
 * @returns {object} - Empty return or an error
 */
export function adminQuizQuestionMove(token: string, quizId: number, questionId: number, newPosition: number): QuizQuestionMoveResponse{
  const store = getData();
  const authUserId = getAuthUserIdFromToken(token);

  // if (!authUserId) {
  //   return { error: 'Invalid or missing token' };
  // }

  if (!isValidQuestionId(questionId)) {
    throw new APIError( 'Invalid question ID', 400);
  }
  const quiz = store.quizzes.find(quiz => quiz.quizId === quizId && quiz.createdBy === authUserId);
  if (!quiz) {
    throw new APIError('You do not own this quiz', 403);
  }

  const currentPosition = quiz.questions.findIndex(q => q.questionId === questionId);
  const questionAmount = quiz.questions.length;
  if (!isValidPosition(currentPosition, newPosition, questionAmount)) {
    throw new APIError('Invalid position', 400);
  }

  const [movedQuestion] = quiz.questions.splice(currentPosition, 1);
  quiz.questions.splice(newPosition, 0, movedQuestion);

  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  
  setData(store);

  return {};
}

/**
 * Function used to retrieve list of quizzes in the trash for current user
 *
 * @param {string} token - user's token
 * @returns {object} - Array of trashed quizzes or returns a error
 */
export function adminQuizTrash(token: string) {
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);

  // if (!isValidAuthUserId(authUserId)) {
  //   return { error: 'AuthUserId is not a valid.' };
  // }

  const quizzesTrashed = store.trash.filter(quiz => quiz.createdBy === authUserId);

  return {
    quizzes: quizzesTrashed.map(quiz => {
      return {
        quizId: quiz.quizId,
        name: quiz.name,
      };
    })
  };
}

/**
 * Function used to transfer ownership of quiz to another user based on the email of the user.
 *
 * @param {string} token - user's token
 * @param {integer} quizId - quiz Id
 * @param {string} userEmail - New owner's email
 * @returns {object} - Empty return or an error
 */
export function adminQuizTransfer(token: string, quizId: number, userEmail: string) {
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);

  if (!isValidQuizId(authUserId, quizId)) {
    throw new APIError('User is not the owner of this quiz or quiz does not exist', 403);
  }
  
  const ownerNew = store.users.find(user => user.email === userEmail);
  if (!ownerNew) {
    throw new APIError( 'The specified user does not exist' , 400 );
  }

  if (ownerNew.authUserId === authUserId) {
    throw new APIError('Cannot transfer the quiz to the current logged-in user' , 400);
  }
  
  const existingQuizWithSameName = store.quizzes.find(quiz => quiz.name === store.quizzes.find(q => q.quizId === quizId)?.name && quiz.createdBy === ownerNew.authUserId);
  if (existingQuizWithSameName) {
    throw new APIError( 'The new owner already has a quiz with the same name'  , 400);
  }

  if(hasSessionInQuiz(quizId)){
    if (!quizsessionendcheck(quizId)) {
      throw new APIError('quiz start', 400);
    }
  }
  
  const transferQuiz = store.quizzes.find(quiz => quiz.quizId === quizId);
  transferQuiz.createdBy = ownerNew.authUserId;
  setData(store);
  return {};

}

/**
 * Function used to empty the trash permanently by being able to delete selected quizzes
 *
 * @param {string} token - user's token
 * @param {integer[]} quizIds - Array of quiz IDs that are perm. deleted
 * @returns {object} - Empty return or an error
 */
export function adminQuizTrashEmpty(token: string, quizIds: number[]): QuizTrashEmptyResponse{
  const data = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);


  // if (!isValidAuthUserId(authUserId)) {
  //   return { error: 'AuthUserId is not a valid.' };
  // }
  
  if (isValidQuizIdTrash(authUserId, quizIds) === 400) {
    throw new APIError('quiz IDs are not in the trash', 400);
  }
  if (isValidQuizIdTrash(authUserId, quizIds) === 403) {
    throw new APIError('Valid token is provided, but one or more of the Quiz IDs refers to a quiz that this current user does not own or doesn’t exist', 403);
  }

  quizIds.forEach(quizId => {
    const quizIndex = data.trash.findIndex(quiz => quiz.quizId === quizId && quiz.createdBy === authUserId);
    if (quizIndex !== -1) {
      data.trash.splice(quizIndex, 1);  
    }
  });
  setData(data);

  return {};
}

/**
 * Updates a question in the selected quiz.
 *
 * @param {integer} quizId - quiz Id
 * @param {integer} questionId - question Id
 * @param {string} token - user's token
 * @param {object} questionBody - Updated question details, text, and etc.
 * @returns {object} - Empty return or an error
 */
export function adminQuizQuestionUpdate(quizid: number, questionid: number, token: string, 
  questionBody: {
    question: string; 
    duration: number; 
    points: number; 
    answers: { 
      answer: string; 
      correct: boolean; 
    }[],
    thumbnailUrl: string,
  }
): QuizQuestionUpdateResponse {

  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);
  
  // if(!isValidQuizId(authUserId, quizid)) {
  //   return { error :' quiz not find '};
  // }
  if (!isValidQuestionId(questionid)) {
    throw new APIError('Invalid question ID', 400);
  }

  if (!isQuestionLengthValid(questionBody.question)) {
    throw new APIError('Question length must be between 5 and 50 characters.', 400);
  }
  
  if (!isAnswerCountValid( questionBody.answers)) {
    throw new APIError('There must be between 2 and 6 answers.', 400);
  }
  
  if (!isDurationValid(questionBody.duration)) {
    throw new APIError('duration >0 and <180.' , 400);
  }
  
  if (!isDurationtotalValid(authUserId,quizid, questionBody.duration)) {
    throw new APIError('Duration must be greater than 0 and small than 180 also the total must small than 180.', 400);
  }

  if (!isPointsValid(questionBody.points)) {
    throw new APIError('Points must be between 1 and 10.', 400);
  }

  if (!areAnswerLengthsValid(questionBody.answers)) {
    throw new APIError('Each answer must be between 1 and 30 characters.', 400);
  }

  if (!areAnswersUnique(questionBody.answers)) {
    throw new APIError('Answers must be unique.', 400);
  }

  if (!hasCorrectAnswer(questionBody.answers)) {
    throw new APIError('At least one answer must be marked as correct.', 400);
  }  

  const isValidUrl = /^https?:\/\/.+\.(jpg|jpeg|png)$/i.test(questionBody.thumbnailUrl);
  if (!isValidUrl) {
    throw new APIError( 'The imgUrl must start with "http://" or "https://" and end with .jpg, .jpeg, or .png', 400);
  }

  if (questionBody.thumbnailUrl === ' ') {
    throw new APIError( 'Quiz thumbnail does not exist.' , 400);
  }

  const quiz = store.quizzes.find((quiz) => quiz.quizId === quizid && quiz.createdBy === authUserId);
  const timeLastEdited = Math.floor(Date.now() / 1000);
  quiz.timeLastEdited = timeLastEdited;
  const result = quiz.questions.find(question => question.questionId === questionid);
  result.question = questionBody.question;
  result.answers = questionBody.answers.map((newAnswer, index) => ({
    answerId: result.answers[index]?.answerId,
    ...newAnswer,             
    colour: getRandomColour(), 
  })), 
  result.points = questionBody.points;
  result.duration = questionBody.duration;
  result.thumbnailUrl = questionBody.thumbnailUrl
  setData(store); 
  return {};
}

export function adminQuizThumbnail(quizId: number, token: string, imgUrl: string ): QuizThumbnailUpdateResponse {
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);

  console.log("imgUrl test", imgUrl);

  // if (!isValidAuthUserId(authUserId)) {
  //   return { error: 'AuthUserId is not a valid user.' };
  // }

  if (!isValidQuizId(authUserId, quizId)) {
    throw new APIError( 'Quiz ID does not refer to a valid quiz.' , 403);
  }

  const isValidUrl = /^https?:\/\/.+\.(jpg|jpeg|png)$/i.test(imgUrl);
  if (!isValidUrl) {
   throw new APIError('The imgUrl must start with "http://" or "https://" and end with .jpg, .jpeg, or .png' , 400);
  }
  
  const existingQuiz = store.quizzes.find((quiz) => quiz.quizId === quizId && quiz.createdBy === authUserId);
  // if (!existingQuiz) {
  //   return { error: 'Quiz not found or does not belong to the current user.' };
  // }
  existingQuiz.thumbnailUrl = imgUrl;
  existingQuiz.timeLastEdited = Math.floor(Date.now() / 1000);

  console.log("imgUrl for thumbnail created: ", existingQuiz.thumbnailUrl);

  setData(store);

  return {};
}

export function QuizSessionsView(token: string, quizId: number): QuizSessionsViewResponse {
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);
  // if (!isValidAuthUserId(authUserId)) {
  //   return { error: 'AuthUserId is not a valid user.' };
  // }

  if (!isValidQuizId(authUserId, quizId)) {
    throw new APIError('Quiz ID does not refer to a valid quiz.', 403);
  }
  const quiz = store.quizzes.find(quiz => quiz.quizId === quizId)

  if(quiz.sessionlength === 0){
    throw new APIError( 'Dont have session in quiz', 400) 
  }
  const activeSessions = store.session
    .filter(session => session.currentState !== 'END' && session.creatByquizId === quizId)
    .map(session => session.sessionId);

  const inactiveSessions = store.session
    .filter(session => session.currentState === 'END'&& session.creatByquizId === quizId)
    .map(session => session.sessionId);

  return {
      activeSessions,
      inactiveSessions
  };
}//有错，记得改 要改成抛出错误 还有里面有点累赘，要修掉，明天token也要改完

export function QuizSessionStart(token: string, quizid: number, autoStartNum: number): QuizSessionStartResponse {
  const MAX_SESSIONS = 10;
  const MAX_AUTOSTARTNUM = 50; 
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);
  // if (!isValidAuthUserId(authUserId)) {
  //   return { error: 'AuthUserId is not a valid user.' };
  // }

  if (autoStartNum > MAX_AUTOSTARTNUM) {
    throw new APIError(`autoStartNum exceeds the limit of ${MAX_AUTOSTARTNUM}`, 400);
  }
  if (store.trash.some(trashQuiz => trashQuiz.quizId === quizid)) {
    throw new APIError ( 'Quiz is in trash' , 400);
  }// dont comment it  it need to use
  
  if (!isValidQuizId(authUserId, quizid)) {
    throw new APIError( 'Quiz ID does not refer to a valid quiz.', 403);
  }

  const quiz = store.quizzes.find(q => q.quizId === quizid);
  if (quiz.questions.length === 0) {
    throw new APIError('Quiz does not contain any questions', 400);
  }

  const activeSessions = store.session.filter(session => session.currentState !== 'END' && session.creatByquizId === quizid);
  
  if (activeSessions.length >= MAX_SESSIONS) {
    throw new APIError( `There are already ${MAX_SESSIONS} active sessions for this quiz`, 400);
  }
  const sessionId = createQuizSession(quizid);
  const session = store.session.find(session => session.sessionId === sessionId);
  session.autoStartNum = autoStartNum;
  setData(store);
  return {sessionId: sessionId};
}

export function adminQuizSessionStatus(
  quizid: number,
  sessionid: number,
  token: string
): QuizSessionStatusResponse {
  const data = getData();
  const authUserId = getAuthUserIdFromToken(token);
  const quiz = data.quizzes.find((q) => q.quizId === quizid && q.createdBy === authUserId);
  if (!quiz) {
    throw new APIError('User is not the owner of this quiz or quiz does not exist', 403);
  }
  const session = getQuizSession(sessionid);
  if (!session) {
    throw new APIError('Session ID does not refer to a valid session within this quiz', 400);
  }

  const players = getPlayersBySession(sessionid);

  // Compile metadata for the quiz
  const metadata = {
    quizId: quiz.quizId,
    createdBy: quiz.createdBy,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.questions.length,
    questions: quiz.questions,
    thumbnailUrl: quiz.thumbnailUrl,
    duration: quiz.duration,
  };

  return {
    state: session.currentState,
    atQuestion: session.questionPosition ,
    players,
    metadata,
    
  };
}

export function adminQuizSessionUpdate(token: string, quizId: number, sessionId: number, action: string): QuizSessionUpdateResponse{
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);
  const quiz = store.quizzes.find(q => q.quizId === quizId);
  const session = store.session.find(s => s.sessionId === sessionId && s.creatByquizId === quizId);
  // if (!isValidAuthUserId(authUserId)) {
  //   return { error: 'AuthUserId is not a valid user.' };
  // }

  if (!isValidQuizId(authUserId, quizId)) {
    throw new APIError('Quiz ID does not refer to a valid quiz.', 403);
  }
  if (!session) {
    throw new APIError('Session does not exist.' , 400 );
  }

  if (session.timer) {
    clearTimeout(session.timer);
    session.timer = undefined;
  }
  //我的session从开始状态是lobby，更新状态，问题从第一个开始，只要状态到NEXT_QUESTION，我们进入下一个问题, end是直接表示session完成了
  switch (session.currentState) {
    case 'LOBBY':
      if (action === 'NEXT_QUESTION') {
        session.currentState = 'QUESTION_COUNTDOWN';
        startCountdown(session, 3000, 'QUESTION_OPEN');//开始倒计时 3秒
      } else if (action === 'END') {
        session.currentState = 'END';
        if (session.timer) {
          clearTimeout(session.timer);
          session.timer = null; 
        }
      } else {
        throw new APIError( 'Invalid action in current state.', 400);
      }
      break;
                                  //倒计时没有结束用skip去到下一个state
    case 'QUESTION_COUNTDOWN':    //转到下一个问题有两种办法，第一种等3秒，第二种等skip指令，这种情况下可能还没有到三秒 skip指令就来了
      if (action === 'SKIP_COUNTDOWN') {
        if (session.timer) {
          clearTimeout(session.timer);
          session.timer = null; 
        }//检查倒计时是否还没有结束，如果没有结束停止倒计时并且如果倒计时刚刚等于3秒，就是有倒计时，清空倒计时
        session.currentState = 'QUESTION_OPEN';//倒计时 问题的duration 到了之后状态变为QUESTION_CLOSE
        //找到session里questionid对应的duration
        startQuestionTimeByquestionId(quizId, session.questionPosition, session)
      } else 
      if (action === 'END'){
        //清空倒计时
        session.currentState = 'END';
        if (session.timer) {
          clearTimeout(session.timer);
          session.timer = null; 
        }
      } else if (!action) {
        // 如果没有action更新，就自动倒计时
        startCountdown(session, 3000, 'QUESTION_OPEN');
      }else {
        throw new APIError('Invalid action in current state.', 400);
      }
      break;

    case 'QUESTION_OPEN':    //问题倒计时没结束之前 任何操作都要清空倒计时
      if (action === 'GO_TO_ANSWER') {
        session.currentState = 'ANSWER_SHOW';
        if (session.timer) {
          clearTimeout(session.timer);
          session.timer = null; 
        }
      } else if (action === 'END') {
        session.currentState = 'END';
        if (session.timer) {
          clearTimeout(session.timer);
          session.timer = null; 
        }
      } else {
        throw new APIError('Invalid action in current state.', 400);
      }
      break;

    case 'QUESTION_CLOSE': //任何操作都要清空倒计时
      if (action === 'GO_TO_ANSWER') {
        session.currentState = 'ANSWER_SHOW';
        if (session.timer) {
          clearTimeout(session.timer);
          session.timer = null; 
        }
      } else if (action === 'GO_TO_FINAL_RESULTS') {
        session.currentState = 'FINAL_RESULTS';
        if (session.timer) {
          clearTimeout(session.timer);
          session.timer = null; 
        }
      } else if (action === 'NEXT_QUESTION') {//去下一个问题 更改session所在的问题id 如果player提前结束作答 还是需要等待总体的时间结束
        session.currentState = 'QUESTION_COUNTDOWN';
        if (session.timer) {
          clearTimeout(session.timer);
          session.timer = null; 
        }
        getToNextquestion(sessionId);
        startCountdown(session, 3000, 'QUESTION_OPEN');
      } else if (action === 'END') {
        session.currentState = 'END';
        if (session.timer) {
          clearTimeout(session.timer);
          session.timer = null; 
        }
      } else {
        throw new APIError('Invalid action in current state.', 400);
      }
      break;

      case 'ANSWER_SHOW':
      if (action === 'NEXT_QUESTION') {
        session.currentState = 'QUESTION_COUNTDOWN';
        getToNextquestion(sessionId);
        if (session.timer) {
          clearTimeout(session.timer);
          session.timer = null; 
        }
        startCountdown(session, 3000, 'QUESTION_OPEN');
      } else if (action === 'GO_TO_FINAL_RESULTS') {
        session.currentState = 'FINAL_RESULTS';
      }  else if (action === 'END') {
        session.currentState = 'END';
      } else {
        throw new APIError('Invalid action in current state.', 400);
      }
      break;

      case 'FINAL_RESULTS':
      if(action === 'END') {
        session.currentState = 'END';
        session.questionPosition = 0;
      }else {
        throw new APIError('Invalid action in current state.', 400);
      }
      break;
    default:
      throw new APIError('Invalid action in current state.', 400);
  }
  console.log("session state in the function",session.currentState);
  // session.updatedAt = new Date();
  setData(store);
  return {};
};


export function adminQuizSessionResults(token: string, quizId: number, sessionId: number): QuizSessionResultsResponse {
  const store = getData();
  token = decodeURIComponent(token);
 
  const authUserId = getAuthUserIdFromToken(token);

  if (!isValidQuizId(authUserId, quizId)) {
    throw new APIError( 'User is not the owner of this quiz or quiz does not exist' , 403);
  }

  const quiz = store.quizzes.find(q => q.quizId === quizId && q.createdBy === authUserId);
  if (!quiz) {
    throw new APIError( 'Quiz not found or does not belong to the current user' , 403);
  }
  const session = getQuizSession(sessionId);
  if (!session) {
    throw new APIError( 'Session ID does not refer to a valid session within this quiz' , 400);
  }

  if (session.currentState !== 'FINAL_RESULTS') {
    throw new APIError('Session is not in FINAL_RESULTS state' , 400);
  }

  // Prepare results
  const usersRankedByScore = session.players
    .sort((a, b) => b.score - a.score) //排序 高到低
    .map(player => ({
      playerId: player.playerId,
      name: player.name,
      score: player.score,
    }));

  const questionResults = session.question.map(question => {
    const correctAnswer = question.answers.find(answer => answer.correct)?.answer || '';
    const questionResult = {
      questionId: session.questionPosition,
      question: question.question,//这里要改，错的是返回一个对象
      correctAnswer: correctAnswer,
      playerResults: session.players.map(player => {
        const playerAnswer = player.answers.find(answer => answer.questionId === question.questionId);
        return {
          playerId: player.playerId,
          answeredCorrectly: playerAnswer?.answer === correctAnswer,
          score: playerAnswer?.answeredCorrectly ? question.points : 0,
        };
      })
    };
    return questionResult;
  });

  return {
    usersRankedByScore,
    questionResults,
  };
}

export function adminQuizSessionResultsCSV(token: string, quizId: number, sessionId: number): QuizQuestionCsv {
  const store = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);
  if (!isValidQuizId(authUserId, quizId))  throw new APIError('User is not the owner of this quiz or quiz does not exist' , 403);

  const quiz = store.quizzes.find(q => q.quizId === quizId && q.createdBy === authUserId);
  if (!quiz) throw new APIError('Quiz not found or does not belong to the current user', 403);
  
  const session = getQuizSession(sessionId);
  if (!session) throw new APIError( 'Session ID does not refer to a valid session within this quiz' , 400);
  if (session.currentState !== 'FINAL_RESULTS') throw new APIError( 'Session is not in FINAL_RESULTS state' , 400);

  // Preparing data for CSV
  const players = session.players.sort((a, b) => a.name.localeCompare(b.name));
  const headerRow = ['Player'];

  quiz.questions.forEach((_, idx) => {
    headerRow.push(`question${idx + 1}score`, `question${idx + 1}rank`);
  });

  const csvRows = [headerRow.join(',')];

  players.forEach(player => {
    const row = [player.name];
    
    quiz.questions.forEach(question => {
      const playerAnswer = player.answers.find(a => a.questionId === question.questionId);
      const score = playerAnswer && playerAnswer.answeredCorrectly ? question.points : 0;

      const allScores = session.players.map(p => 
        p.answers.find(a => a.questionId === question.questionId)?.answeredCorrectly ? question.points : 0
      );
      const sortedScores = [...allScores].sort((a, b) => b - a);
      const rank = score ? sortedScores.indexOf(score) + 1 : 0;

      row.push(score.toString(), rank.toString());
    });

    csvRows.push(row.join(','));
  });
// writing CSV to file and trying to return the URL
  const filePath = path.join(__dirname, `results_session_${sessionId}.csv`);
  fs.writeFileSync(filePath, csvRows.join('\n'), 'utf8');
  
  return { url: `http://your-server.com/files/results_session_${sessionId}.csv` };
}
