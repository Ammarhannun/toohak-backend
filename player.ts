import { PlayerJoin, PlayerStatus, PlayerQuestionInfo, PlayerResults, PlayerChatSend, PlayerChat, PlayerQuestionResults} from './returnInterfaces';
import { getData, setData, Player, chat, message} from './dataStore';
import { playerIdGen, randomNameGen, checkSessionInFinalResults, autoStartSession, isValidMessage, isValidPlayerId,
        findSessionByPlayerid, aSubsetB, Duplicatescheck, arraysEqual, findPlayer} from './helperFunctions';
import HTTPError from 'http-errors';




/**
 * Makes a player join a quiz session
 *
 * @param {integer} sessionId - sessionId
 * @param {string} name - name of the player
 * @returns {number} playerId,  an Id for the player
 * 
 */
export function playerJoin(sessionId: number, name: string): PlayerJoin {

    const store = getData();

    const session = store.session.find(session => session.sessionId === sessionId);
    
    if (!session) {
        throw HTTPError(400, 'Session ID doesnt refer to a valid session');
    }
    if (!session.players) {
        session.players = [];
    }
    console.log("函数中的session",session);
    console.log("函数中的sessionautoStartNum",session.autoStartNum);
    
    if (session.currentState !== 'LOBBY') {
        throw HTTPError(400, 'Session is not in LOBBY state');   
    }
    if (name === ''){
        name = randomNameGen();
    }
    const nameExit = session.players.some(player => player.name === name);
    if (nameExit) {
        throw HTTPError(400, 'Player name already exists');
    }
   
    const playerId = playerIdGen();
    const numQuestions = session.question.length

    const player: Player = {
        playerId: playerId,
        name: name,
        score: 0,
        timeJoined: Date.now(),
        timeLastActive: Date.now(),
        answers: [],
        state: 'LOBBY',
        numQuestions: numQuestions,
        atQuestion: 0,
    };

    session.players.push(player);
    setData(store);
    if (session.players.length >= session.autoStartNum) {
        autoStartSession(sessionId);
    }
    return {
        playerId: playerId
    };
}

/**
 * Returns the player's status
 *
 * @param {integer} playerId - playerId
 * @returns {object} Array of status on the player (state, numQuestions, atQuestion)
 * 
 */
export function playerStatus(playerId: number): PlayerStatus {
    const session = findSessionByPlayerid(playerId)

    if (!session) {
        throw HTTPError(400, 'Player Id does not exist');
    }

    return {
        state: session.currentState,   //这个state来自quizsession 不是player     
        numQuestions: session.numQuestions, 
        atQuestion: session.questionPosition
    };

}

/**
 * Returns the player's data/information
 *
 * @param {integer} playerId - playerId
 * @param {integer} questionPosition - questionPosition
 * @returns {object} Array of information on the player (questionBody)
 * 
 */
export function playerQuestionInfo(playerId: number, questionPosition: number): PlayerQuestionInfo {
    const store = getData();
    const session = findSessionByPlayerid(playerId);

    if (!session) {
        throw HTTPError(400, 'Player ID does not exist');
    }//我决定这个方程是可以同时实现session是否存在，和player是否存在的查找的

    if (questionPosition < 1 || questionPosition > session.numQuestions) {
        throw HTTPError(400, 'Question position is not valid for the session this player is in');
    }

    const inactiveStates = ['LOBBY', 'QUESTION_COUNTDOWN', 'FINAL_RESULTS', 'END'];
    
    if (inactiveStates.includes(session.currentState)) {
        throw HTTPError(400, 'Session is in an inactive state for questions');
    }

    const question = session.question[questionPosition - 1]; 

    if (!question) {
        throw HTTPError(400, 'Question not found at this position');
    }

    return {
        questionId: question.questionId,
        question: question.question,
        duration: question.duration,
        thumbnailUrl: question.thumbnailUrl,
        points: question.points,
        answers: question.answers.map(answer => ({
            answerId: answer.answerId,
            answer: answer.answer,
            colour: answer.colour,
        })),
    };
}

export function playerQuestionAnswer(playerId: number, questionposition: number, answerIds: number[]) {
    const store = getData();
    const session = findSessionByPlayerid(playerId);
    if (!session) {
        throw HTTPError(400, 'Player ID does not exist');
    }//我决定这个方程是可以同时实现session是否存在，和player是否存在的查找的
    if (session.questionPosition!== questionposition) {
        throw HTTPError(400, 'question position is not valid for the session this player is in');
    }
    
    const question = session.question[questionposition - 1]; 

    const correctanswerid = question.answers
        .filter(answer => answer.correct)
        .map(answer => answer.answerId)
    if(arraysEqual(correctanswerid, answerIds) && session.currentState === 'QUESTION_OPEN'){
        const player = findPlayer(playerId);
        player.score = player.score + question.points;
        const answer = player.answers[questionposition - 1];
        answer.questionId= question.questionId;
        answer.answeredCorrectly = true;
        setData(store);
    } //更新player分数

    
    if (session.currentState !== 'QUESTION_OPEN') {
        throw HTTPError(400, 'Session is not in QUESTION_OPEN');
    }
    const answerid = question.answers.map(answer => answer.answerId);
    
    //找到正确答案的id
    if(answerIds.length < 1) {
        throw HTTPError(400, 'Less than 1 answer ID was submitted');
    }
    if (!Duplicatescheck(answerIds)){
        throw HTTPError(400, 'There are duplicate answer IDs provided');
    }
    if (!aSubsetB(answerIds, answerid)) {
        throw HTTPError(400, 'Answer IDs are not valid for this particular question');
    }
    
    return {};
}

export function playerResults(playerId: number): PlayerResults {

    if (!checkSessionInFinalResults(playerId)) {
        throw HTTPError(400, 'session dont in FinalResult');   
    }
    const session = findSessionByPlayerid(playerId); 
    const usersRankedByScore = session.players
        .map(player => ({
        name: player.name,
        score: player.score,
        }))
        .sort((a, b) => b.score - a.score);
        
        
        
    const questionResults = session.question.map(question => ({
        questionId: question.questionId,

        playersCorrectList: session.players
            .filter(player => 
                player.answers.some(answer => answer.questionId === question.questionId && answer.answeredCorrectly)
            )
            .map(player => (player.name)),
        averageAnswerTime: Math.floor(Math.random() * 60),
        percentCorrect: Math.floor(Math.random() * 100),
    }));
    return {
        usersRankedByScore,
        questionResults,
    };
}

export function playerChatSend(playerId: number, message:{messageBody: string}): PlayerChatSend {

    const store = getData();

    if(!isValidPlayerId(playerId)) {
        throw HTTPError(400, 'Player ID does not exist');
    }
    
    if(!isValidMessage(message.messageBody)) {
        throw HTTPError(400, 'message body is less than 1 character or more than 100 characters');
    }

    // const chat = store.quizzes.flatMap(quiz => quiz.sessions).flatMap(session => session.chat);
    const session = findSessionByPlayerid(playerId);
    const chat = session.chat;

    const newMessage: message = {
        messageBody: message.messageBody,
        playerId: playerId,
        playerName: findPlayer(playerId).name,
        timeSent: Date.now(),
    }
    chat.push(newMessage);
    setData(store)
    console.log("chatsend里的message",session.chat);
    return {};

}

export function playerChat(playerId: number): PlayerChat {
    const store = getData();
    if (!isValidPlayerId(playerId)) {
        throw HTTPError(400, 'Player ID does not exist');
    }

    const session = findSessionByPlayerid(playerId);
    const messages = session.chat;

    return { messages: messages };
}


export function playerQuestionResults(playerId: number, questionPosition: number): PlayerQuestionResults {
    const session = findSessionByPlayerid(playerId);
    if (!isValidPlayerId(playerId)) {
        throw HTTPError(400, 'Player ID does not exist');
    }

    if (session.currentState !== 'ANSWER_SHOW') {
        throw HTTPError(400, 'Not in ANSWER_SHOW state');
    }
    const numQuestions = session.question.length;
    if (questionPosition < 1 || questionPosition > numQuestions) {
        throw HTTPError(400, 'Position is not valid for the session');
    }

    if (session.questionPosition !== questionPosition) {
        throw HTTPError(400, 'Not currently on this question');
    }

    const question = session.question[questionPosition - 1];
    if (!question) {
        throw HTTPError (400, 'Question not found at this position');
    }
    
    const playersCorrectList = session.players
        .filter(player => 
        player.answers.some(answer => answer.questionId === question.questionId && answer.answeredCorrectly)
        )
        .map(player => (player.name))

    const averageAnswerTime = Math.floor(Math.random() * 60);
    const percentCorrect = Math.floor((playersCorrectList.length / session.players.length) * 100);

    return {
            questionId: question.questionId,
            playersCorrectList,
            averageAnswerTime,
            percentCorrect,
    }
}
