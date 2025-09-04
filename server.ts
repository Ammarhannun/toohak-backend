import express, { json, Request, Response, NextFunction } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { adminAuthRegister, adminAuthLogin, adminUserDetailsUpdate, adminUserPasswordUpdate, adminUserDetails, adminAuthLogout } from './auth';
import { adminQuizTrashEmpty, adminQuizList, adminQuizCreate, adminQuizInfo, 
         adminQuizDescriptionUpdate, adminQuizNameUpdate, adminQuizRemove, adminQuizQuestionCreate, adminQuizQuestionDelete, 
         adminQuizQuestionMove, adminQuizRestore, adminQuizTransfer,adminQuizQuestionDuplicate, adminQuizTrash, adminQuizQuestionUpdate, adminQuizThumbnail, 
         QuizSessionsView, QuizSessionStart, adminQuizSessionStatus, adminQuizSessionUpdate, adminQuizSessionResults, adminQuizSessionResultsCSV} from './quiz';
import { clear } from './other';
import { isValidQuizIdTrash,  isValidQuizId, isValidQuestionId, isValidQuiz} from './helperFunctions'
import {getAuthUserIdFromToken, tokencheck} from './token'
import { playerJoin, playerStatus, playerQuestionInfo, playerResults, playerChatSend, playerQuestionAnswer, playerChat, playerQuestionResults } from './player'
import { Redis } from '@upstash/redis';
import { config } from 'dotenv';

// Read in environment variables from `.env` if it exists
config({ path: '.env' });

// Initialize Redis
export const redis = Redis.fromEnv();

declare global {
  namespace Express {
    interface Request {
      user?: any; 
    }
  }
}// i dont know should i do it or not

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file), { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));
 
const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';
 
// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================
 
// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const result = echo(req.query.echo as string);
  if ('error' in result) {
    res.status(400);
  }
 
  return res.json(result);
});
 
//clear interface
app.delete('/v1/clear', (req: Request, res: Response) => {
  res.json(clear());
});

//this two function create the token
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  try {
    const result = adminAuthRegister(req.body.email, req.body.password, req.body.nameFirst, req.body.nameLast);
    return res.status(200).json(result);
  } catch(error) {
    return res.status(error.status).json({ error: error.message });
  }
});

app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  try{
    const result = adminAuthLogin(req.body.email, req.body.password);
    res.status(200).json(result);

  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
});

app.get('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.header('token') as string;//这个get请求是带有查询参数 //这里记得做笔记
  console.log("路由中的datail content",req.body);
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminUserDetails(token)
    res.status(200).json(result);
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
});


app.put('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminUserDetailsUpdate(token, req.body.email, req.body.nameFirst, req.body.nameLast);
    res.status(200).json(result);
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
  
});

app.put('/v2/admin/user/password', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminUserPasswordUpdate(token, req.body.oldPassword, req.body.newPassword);
    res.status(200).json(result);
  
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
  
});

app.post('/v2/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.header('token') as string;

  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminAuthLogout(token);
    return res.status(200).json({});
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
  
});

//quiz trash
app.get('/v2/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminQuizTrash(token);  
    return res.status(200).json(result);
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
 
});

app.delete('/v2/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const quizIdsString = req.query.quizIds as string;
  const quizIds = JSON.parse(quizIdsString) as number[];
  const token = req.header('token') as string;
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try {
    if (isValidQuizIdTrash(getAuthUserIdFromToken(token), quizIds) === 400) {
      res.status(400).json({error : 'invaild quizid '});
    }
  } catch (error) {
    return res.status(401).json({ error: "miss quizid " });
  }
  try{
    const result = adminQuizTrashEmpty(token, quizIds);
    return res.status(200).json({});

  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
 
});

// quiz 
app.get('/v2/admin/quiz/list',(req: Request, res: Response) => {
  const token = req.header('token') as string;
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminQuizList(token);
    return res.status(200).json(result);
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
 
});

app.post('/v2/admin/quiz', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try {
    const result = adminQuizCreate(token, req.body.name, req.body.description);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.status).json({ error: error.message });
  }
});

app.get('/v2/admin/quiz/:quizid',(req: Request, res: Response) =>{
  const token = req.header('token') as string;
  const quizid = Number(req.params.quizid)
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminQuizInfo(token, quizid);
    return res.status(200).json(result);
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
  
  
});
app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const quizid  = req.params.quizid;
  const token = req.header('token') as string;
  const userEmail = req.body.userEmail;
  const authUserId = getAuthUserIdFromToken(token);
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
 
  try {
    adminQuizTransfer(token, Number(quizid), userEmail);
    return res.status(200).json({});
  } catch(error) {
    return res.status(error.status).json({ error: error.message });
  }
});

app.put('/v2/admin/quiz/:quizid/name',(req: Request, res: Response) =>{
  const token = req.header('token') as string;
  const quizid = Number(req.params.quizid);
  console.log("路由quizname中的quizid", quizid);
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminQuizNameUpdate(token, quizid, req.body.name);
    return res.status(200).json(result);
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
  
});// done

app.put('/v2/admin/quiz/:quizid/description',(req: Request, res: Response) =>{
  const token = req.header('token') as string;
  const quizid = Number(req.params.quizid);
  console.log("路由quizdescription中的quizid", quizid);
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminQuizDescriptionUpdate(token, quizid, req.body.description);
    return res.status(200).json(result);
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
  
  
});

app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const quizid = Number(req.params.quizid);
  console.log("路由quizremove中的quizid", quizid);
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }

  try {
    adminQuizRemove(token, quizid);
    return res.status(200).json({});
  } catch (error) {
    return res.status(error.status).json({ error: error.message });
  }
});



app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const quizid = Number(req.params.quizid)
  const questionBody = req.body.questionBody
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminQuizQuestionCreate(quizid, token, questionBody);
    return res.status(200).json(result);
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
  

});

app.post('/v2/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const quizid = Number(req.params.quizid);

  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try {
    const result = adminQuizRestore(quizid, token);
    return res.status(200).json(result);
  }catch (error) {
    return res.status(error.status).json({ error: error.message });
  } //fix
});

app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const { quizid, questionid } = req.params;
  const token = req.header('token') as string;
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try {
    const result = adminQuizQuestionDelete(token, Number(quizid), Number(questionid));
    return res.status(200).json({});
  } catch (error) {
    return res.status(error.status).json({ error: error.message });
  }
}); 

app.put('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizid = Number(req.params.quizid);
  const questionid = Number(req.params.questionid);
  const token = req.header('token') as string;
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }

  try {
    const result = adminQuizQuestionUpdate(quizid, questionid, token, req.body.questionBody);
    return res.status(200).json({});

  } catch (error) {
    return res.status(error.status).json({ error: error.message });
  }
  
});


app.put('/v2/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const { quizid, questionid } = req.params;
  const token = req.header('token') as string;
  const {  newPosition } = req.body;
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }

  const authUserId = getAuthUserIdFromToken(token);
  try{
    const result = adminQuizQuestionMove(token, Number(quizid), Number(questionid), Number(newPosition));
    return res.status(200).json({});
  }catch(error){
    return res.status(error.status).json({ error: error.message });
    }
  
 
});

app.post('/v2/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const quizid = Number(req.params.quizid);
  const questionid = Number(req.params.questionid);
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminQuizQuestionDuplicate(quizid, questionid, token);
    return res.status(200).json(result);

  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
  
});

app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const { quizid } = req.params;
  const token = req.header('token') as string;
  const { imgUrl } = req.body;
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminQuizThumbnail(Number(quizid), token, imgUrl);
    return res.status(200).json({});
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  } //fix
 
});

app.get('/v1/admin/quiz/:quizid/sessions', (req: Request, res: Response) => {
  const quizid = Number(req.params.quizid);
  const token = req.header('token') as string;
  console.log("路由中的token", token);
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  const authUserId = getAuthUserIdFromToken(token);
  try{
    const result = QuizSessionsView(token, quizid);
    return res.status(200).json(result);

  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
  
});

app.post('/v1/admin/quiz/:quizid/session/start', (req: Request, res: Response) => {
  const quizid = Number(req.params.quizid);
  const token = req.header('token') as string;
  const autoStartNum = req.body.autoStartNum
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  const authUserId = getAuthUserIdFromToken(token);
  try{
    const result = QuizSessionStart(token, quizid, autoStartNum);
    return res.status(200).json(result);
  }catch(error){
    
    return res.status(error.status).json({ error: error.message });
  }
  
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const quizId = Number(req.params.quizid);
  const sessionId = Number(req.params.sessionid);
  const token = req.header('token') as string;
  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  const authUserId = getAuthUserIdFromToken(token);
  try{
    const result = adminQuizSessionStatus(quizId, sessionId, token);
    return res.status(200).json(result);  
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
 
});

app.get('/v1/player/:playerid/results', (req: Request, res: Response) => {
  const playerId = Number(req.params.playerid);
 
  try {
    const result = playerResults(playerId);
     res.status(200).json(result);
  } catch (error) {
     res.status(400).json({ error : error.message});
  }
});


app.get('/v1/admin/quiz/:quizid/session/:sessionid/results', (req: Request, res: Response) => {
  const quizId = Number(req.params.quizid);
  const sessionId = Number(req.params.sessionid);
  const token = req.header('token') as string;

  try {
    if (!tokencheck(token)) {
      return res.status(401).json({ error: "invaild token " });
    }
  } catch (error) {
    return res.status(401).json({ error: "miss token  " });
  }
  try{
    const result = adminQuizSessionResults(token, quizId, sessionId);
    return res.status(200).json(result);
  }catch(error){
    return res.status(error.status).json({ error: error.message });
    
  } //fix
  

  
});

app.get('/v1/admin/quiz/:quizId/session/:sessionId/results/csv', (req: Request, res: Response) => {
  const quizId = Number(req.params.quizId);
  const sessionId = Number(req.params.sessionId);
  const token = req.header('token') as string;

  if (!tokencheck(token)) {
    return res.status(401).json({ error: "Empty token or invalid token" });
  }
  try{
    const result = adminQuizSessionResultsCSV(token, quizId, sessionId);
    return res.status(200).json(result);
  }catch(error){
    return res.status(error.status).json({ error: error.message });
  }
  
});


app.put('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const quizId = Number(req.params.quizid);
  const sessionId = Number(req.params.sessionid);
  const token = req.header('token') as string;
  const action = req.body.action;
  if (!tokencheck(token)) {
    return res.status(401).json({ error: "Empty token or invalid token" });
  }

  const authUserId = getAuthUserIdFromToken(token);

  try{
    const result = adminQuizSessionUpdate(token, quizId, sessionId, action);
    return res.status(200).json(result);  
  }catch(error){

    return res.status(error.status).json({ error: error.message });
  }

});

app.post('/v1/player/join', (req: Request, res: Response) => {
  const { sessionId, name } = req.body;

  try {
      const joinResult = playerJoin(sessionId, name);
      res.status(200).json({
          playerId: joinResult.playerId
      });
  } catch (error) {
      res.status(400).json({
          error: error.message
      });
  }
});

app.get('/v1/player/:playerId', (req: Request, res: Response) => {
  const { playerId } = req.params;
  const playerIdAsNumber = Number(playerId);
  try {
      const StatusResult = playerStatus(playerIdAsNumber);
      res.status(200).json({
          state: StatusResult.state,
          numQuestions: StatusResult.numQuestions,
          atQuestion: StatusResult.atQuestion
      });
  } catch (error) {
      res.status(400).json({
          error: error.message
      });
  }
});

app.get('/v1/player/:playerId/question/:questionposition', (req: Request, res: Response) => {
  const { playerId } = req.params;
  const playerIdAsNumber = Number(playerId);
  const { questionposition } = req.params;
  const questionpositionAsNumber = Number(questionposition);
  try {
      const infoResult = playerQuestionInfo(playerIdAsNumber, questionpositionAsNumber);
      res.status(200).json({
        questionId: infoResult.questionId,
        question: infoResult.question,
        duration: infoResult.duration,
        thumbnailUrl: infoResult.thumbnailUrl,
        points: infoResult.points,
        answers: infoResult.answers.map(answer => ({
            answerId: answer.answerId,
            answer: answer.answer,
            colour: answer.colour,
        }))
      });
  } catch (error) {
      res.status(400).json({
          error: error.message
      });
  }
});
app.post('/v1/player/:playerId/chat', (req, res) => {
  const playerId = parseInt(req.params.playerId);
  const message = req.body.message;
  try {
      playerChatSend(playerId, message);
      res.status(200).json({});
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
});

app.put('/v1/player/:playerId/question/:questionposition/answer', (req, res) => {
  const playerId = parseInt(req.params.playerId);
  const questionposition = parseInt(req.params.questionposition);
  const answerIds = req.body.answerIds as number[];
  try {
    playerQuestionAnswer(playerId, questionposition, answerIds)
      res.status(200).json({});
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
});

app.get('/v1/player/:playerId/chat', (req, res) => {
  const playerId = parseInt(req.params.playerId);
  try {
      const info = playerChat(playerId);
      res.status(200).json(info);
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
});

app.get('/v1/player/:playerId/question/:questionpostition/results', (req: Request, res: Response) => {
  const { playerId } = req.params;
  const playerIdAsNumber = Number(playerId);
  const { questionposition } = req.params;
  const questionpositionAsNumber = Number(questionposition);

  try {
    const result = playerQuestionResults(playerIdAsNumber, questionpositionAsNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================
 
app.use((req: Request, res: Response) => {
  const error = `
    Route not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using ts-node (instead of ts-node-dev) to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;
  res.status(404).json({ error });
});
 
// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});
 
// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Shutting down server gracefully.');
    process.exit();
  });
});





