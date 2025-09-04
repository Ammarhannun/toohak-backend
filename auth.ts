import { getData, setData,session } from './dataStore';
import { authUserIdGen, isValidEmail, isValidPassword, isValidName, isValidAuthUserId} from './helperFunctions';
import { AuthRegisterResponse, AuthLoginResponse, UserDetailsResponse, UserDetailsUpdateResponse, UserPasswordUpdateResponse, } from './returnInterfaces';
import {getAuthUserIdFromToken, tokencheck, createSession, creatToken } from './token'
import HTTPError from 'http-errors';
import { APIError } from './APIError';
/**
 * Registers a new user to the system by taking the email, password, first and last name, and checks if they apply to the criteria.
 *
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} nameFirst - User's first name
 * @param {string} nameLast - User's last name
 * @returns {integer} authUserId - User's ID
 *
 */
function adminAuthRegister(email: string, password: string, nameFirst: string, nameLast: string): AuthRegisterResponse {
  const data = getData();

  for (const user of data.users) {
    if (user.email === email) {
      throw new APIError('Email is already used, please use another email', 400 );
    }
  }

  if (!isValidEmail(email)) {
    throw new APIError('Invalid email format', 400);
  }

  if (!isValidPassword(password)) {
    throw new APIError('Password must be at least 8 characters and contain at least one number and one letter', 400);
  }

  if (!isValidName(nameFirst)) {
    throw new APIError( 'NameFirst length is invalid due to the name being too short or too long, or it contains invalid characters', 400);
  }

  if (!isValidName(nameLast)) {
    throw new APIError('NameLast length is invalid due to the name being too short or too long, or it contains invalid characters', 400);
  }
  
  const newUser = {
    authUserId: authUserIdGen(),
    email: email,
    password: password,
    passwordHistory: [password],
    nameFirst: nameFirst,
    nameLast: nameLast,
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    isLoggined: true,
    sessions: [] as session[],
  }
  data.users.push(newUser);
  const sessionId = createSession(newUser.authUserId);
  const session ={
    sessionId
  }
  newUser.sessions.push(session);
  const token = creatToken(newUser.authUserId);
  
  data.users.push(newUser);
  setData(data);

  
  return {
    // token: usertoken.token
    token:token
  };
}

/**
 * Logs in user by taking the email and password and checking if they belong to each other.
 *
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {integer} authUserId - User's ID
 *
 */
function adminAuthLogin(email: string, password: string): AuthLoginResponse {
  const data = getData();
  const user = data.users.find(user => user.email === email);
  if (!user) {
    throw new APIError('Email address does not exist.', 400);
  }
   if (user.password !== password) {
    user.numFailedPasswordsSinceLastLogin++;
    throw new APIError('Password is not correct for the given email.', 400);
  }
  user.numSuccessfulLogins++;
  user.numFailedPasswordsSinceLastLogin = 0;
  user.isLoggined = true;
  const sessionId = createSession(user.authUserId);
  const session ={
    sessionId
  }
  user.sessions.push(session);
  const token = creatToken(user.authUserId);
  data.users.push(user);
  setData(data);
  return { token: token};
}

/**
 * Retrieves user's details based on the user's ID.
 *
 * @param {integer} authUserId - User's ID
 * @returns {object} userDetails - User's details
 *
 */
function adminUserDetails (token: string): UserDetailsResponse {
  const data = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);
  const user = data.users.find(user => user.authUserId === authUserId);

  // if (!user) {
  //   return { error: 'AuthUserId is not a valid user.' };
  // }

  const userDetails = {
    user: {
      userId: user.authUserId,
      name: user.nameFirst + ' ' + user.nameLast,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    }
  };

  return userDetails;
}

/**
 * Updates user's detials based on the user's ID.
 *
 * @param {integer} authUserId - User's ID
 * @param {string} email - User's email
 * @param {string} nameFirst - User's first name
 * @param {string} nameLast - User's last name
 * @returns empty - Nothing
 *
 */
function adminUserDetailsUpdate (token: string, email: string, nameFirst: string, nameLast: string): UserDetailsUpdateResponse {
  const data = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);
  // if (!isValidAuthUserId(authUserId)) {
  //   return { error: 'AuthUserId is not a valid.' };
  // }

  if (!isValidName(nameFirst)) {
    throw new APIError('First name is either too short, too long, or contains invalid characters.', 400);
  }

  if (!isValidName(nameLast)) {
    throw new APIError('Last name is either too short, too long, or contains invalid characters.',400);
  }

  const userExists = data.users.find(user => user.email === email && user.authUserId !== authUserId);
  if (userExists) {
    throw new APIError('Email is already used by another user.', 400);
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new APIError('Your email is in the wrong format.', 400);
  }

  const user = data.users.find(user => user.authUserId === authUserId);
  user.email = email;
  user.nameFirst = nameFirst;
  user.nameLast = nameLast;
  setData(data);

  return {};
}

/**
 * Changes the user's password ensuring the new password is valid, has not been used before, and differs from the old password.
 *
 * @param {integer} authUserId - User's ID
 * @param {string} oldPassword - User's old password
 * @param {string} newPassword - User's new password
 * @returns empty - Nothing
 *
 */
function adminUserPasswordUpdate(token: string, oldPassword: string, newPassword: string): UserPasswordUpdateResponse {
  // if (!tokencheck(token)) {
  //   throw new Error('Token is empty or invalid');
  // }
  const data = getData();
  token = decodeURIComponent(token);
  const authUserId = getAuthUserIdFromToken(token);
  // if (!authUserId) {
  //   return { error: 'AuthUserId is not a exist.' };
  // }
  
  const user = data.users.find(user => user.authUserId == authUserId);
  
  // if (!user) {
  //   return {  error: 'AuthUserId is not a found.'  };
  // }
  // if (!isValidPassword(oldPassword)) {
  //   throw new APIError( 'Password must be greater than 8 characters and contain at least one number and one letter', 400 );
  // }
  if (user.password !== oldPassword) {
    throw new APIError('Old password is not valid', 400);
  }
  if (!isValidPassword(newPassword)) {
    throw new APIError('Password must be greater than 8 characters and contain at least one number and one letter', 400);
  }
  if (oldPassword === newPassword) {
    throw new APIError('New password cannot be the same as the old password', 400);
  }
  if (user.passwordHistory.includes(newPassword)) {
    throw new APIError('New password has been used before. Please use a different password', 400);
  }

  user.password = newPassword;
  user.passwordHistory.push(newPassword);
  setData(data);
  return {};
}

/**
 * Logs out the user by invalditing the user's session based on the token provided.
 *
 * @param {string} token - User's old password
 * @returns empty - Nothing
 *
 */
function adminAuthLogout(token: string) {
  // if(!tokencheck(token)){
  //   return { error: 'Token is empty or invalid' };
  // }
  const authUserId = getAuthUserIdFromToken(token);
 
  // if (authUserId === null) {
  //   return { error: 'authUserId is empty or invalid' };
  // }
  const data = getData();
 
  const user = data.users.find(user => user.authUserId === authUserId);
  // if (!user) {
  //   return { error: 'Token is empty or invalid' };
  // }
  user.isLoggined = false;
  setData(data);
  return {};
}
export { adminAuthRegister, adminAuthLogin, adminUserDetails, adminUserDetailsUpdate, adminUserPasswordUpdate, adminAuthLogout };
