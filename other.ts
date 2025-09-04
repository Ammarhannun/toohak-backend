import type { EmptyObject } from './returnInterfaces';
import { getData, setData } from './dataStore';

function clear() : EmptyObject{
    for (let i = 0; i < getData().session.length; i++) {
      if (getData().session[i].timer !== null) {
          console.log("clearTimeout")
          clearTimeout(getData().session[i].timer);
      }
  }
  setData({
    users: [],
    quizzes: [],
    trash: [],
    session: [],
  });
  return { };
}

export { clear };
