/* eslint-disable import/extensions */
import * as cs from './consts.js';
import { readFromCache, writeToCache } from './cache.js';

/**
 * Quiz class
 */
export default class Quiz {
  // Options can contain limit, difficulty, category
  constructor (options = {}) {
    this.options = options;
  }

  // Generate the url for the fetch request based on the options
  getUrl () {
    const quizUrl = new URL(`${cs.QUIZ_API}`);
    quizUrl.searchParams.append('apiKey', cs.API_KEY);
    for (const key in this.options) {
      if (this.options[key] !== 'Any') quizUrl.searchParams.append(key, this.options[key]);
    }
    return quizUrl;
  }

  // Fetch the quiz with given options and save it in local storage
  async fetchQuiz () {
    try {
      // eslint-disable-next-line no-undef
      const res = await fetch(this.getUrl());
      const data = await res.json();
      writeToCache('quiz', data);
      return readFromCache('quiz');
    } catch (err) {
      return console.error(err);
    }
  }
}
