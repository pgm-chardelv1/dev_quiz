/* eslint-disable import/extensions */
/*
 * Imports
 */
import Quiz from './Quiz.js';
import * as cs from './consts.js';
import * as hs from './history.js';
import { safeTags, } from './helpers.js';

import * as cache from './cache.js';

/**
 * Main app
 */
const app = {
  init () {
    this.quiz = [];
    this.quizOptions = {};
    this.answers = [];
    this.score = [];
    this.cacheElements();
    this.registerListeners();
    this.buildOptionsUI();
  },
  cacheElements () {
    // Initialize app element
    this.$app = document.querySelector('#app');
  },
  registerListeners () {
    const navHome = document.querySelector('.nav-link[data-id="Play"]');
    const navHighScores = document.querySelector('.nav-link[data-id="Highscores"]');
    navHome.addEventListener('click', () => (e) => {
      e.preventDefault();
      this.buildOptionsUI();
    });
    navHighScores.addEventListener('click', (e) => {
      e.preventDefault();
      this.displayHighScores();
    });
  },
  buildOptionsUI () {
    // Build category UI and difficulty UI
    const categoriesHTML = this.getItemListHTML('category', cs.CATEGORIES);
    const difficultyHTML = this.getItemListHTML('difficulty', cs.DIFFICULTY);
    // Build options UI
    this.$app.innerHTML = `
      <div class="form-container">
      <form class="options" action="">

        <h1>Developer Quiz</h1>
        <h2>Select quiz options</h2>

        <section id="category">
          <fieldset class="quiz-options" data-type="category">
              <legend>Choose category</legend>
              ${categoriesHTML}
            </fieldset>
          </section>

          <section id="limit">
            <fieldset class="quiz-options" data-type="limit">
              <legend>How many questions would you like to answer?</legend>
              <input type="range" min="1" max="20" value="10" class="slider" id="limitRange">
              <output class="limit-output" for="limitRange">10</output>
            </fieldset>  
          </section>

          <section id="difficulty">
            <fieldset class="quiz-options">
              <legend>Choose difficulty</legend>
              ${difficultyHTML}
            </fieldset>
          </section>

          <input type="submit" id="btn--send" value="Play this quiz!">
        </form>
      </div>`;
    this.registerOptionListeners();

    // Add options to history and set page title
    hs.add({
      link: null,
      title: `${cs.APP_TITLE} | Options`,
    });
  },
  getItemListHTML (name, array) {
    return array.map(item => `
        <div class="option"><input type="radio" id="${name}-${item.toLowerCase()}" name="${name}" value="${item}" class="quiz-option"><label for="${name}-${item.toLowerCase()}">${item}</label></div>`).join('');
  },

  // Register the listeners for the options page
  registerOptionListeners () {
    const $limitRange = document.querySelector('#limitRange');
    const $limitOutput = document.querySelector('.limit-output');
    const form = document.querySelector('form.options');
    // Change the output value if the range input changes
    $limitRange.addEventListener('input', () => {
      $limitOutput.textContent = $limitRange.value;
    });
    form.addEventListener('submit', (e) => {
      // eslint-disable-next-line no-undef
      const data = new FormData(form);
      // eslint-disable-next-line prefer-const
      let options = {};
      for (const entry of data) {
        const [key, value] = entry;
        options[`${key}`] = value;
      }
      // Add the limit manually to the options object
      options.limit = $limitRange.value;
      // Create a new quiz
      this.fetchQuiz(options);
      this.quizOptions = options;
      e.preventDefault();
    });
  },

  // Create a new Quiz and fetch the quiz questions
  async fetchQuiz (options = {}) {
    const newQuiz = new Quiz(options);
    this.quiz = await newQuiz.fetchQuiz();
    this.askQuestion();
  },
  askQuestion (i = 0) {
    // Create a variable for the current question
    const question = this.quiz[i];
    // Display the question number and quiz progress
    this.showQuestionMeter(i + 1);
    // Generate the correct input type for answers
    const inputType = this.getQuestionInputType(question);
    // Generate the answers HTML code for this question
    const questionFields = this.buildAnswerHTML(question, inputType, i);
    // Generate and display the tags
    const tags = question.tags.map(t => t.name);

    // Build the UI
    this.$app.innerHTML = `
        <div class="question-container">
          <form action="" class="question" data-id="${i}">
            <h3 class="question-tags">Tags: <span class="question-tags__tags">${tags}</span></h3>
            <fieldset>
              <legend>${safeTags(question.question)}</legend>
              ${questionFields}
            </fieldset>

            <div class="buttons">
              <button class="btn--stop">Stop Quiz</button>

              <input type="submit" class="btn--next" value="Next Question">
            </div>
          </form>
        </div>`;

    // Update the history state and page title
    hs.replace({
      title: `${cs.APP_TITLE} | Question ${i + 1}`,
    });
    this.registerQuestionListeners(i);
  },
  // Generate the input type for the answer
  getQuestionInputType (question) {
    let inputType;
    question.multiple_correct_answers === 'true' ? inputType = 'checkbox' : inputType = 'radio';
    return inputType;
  },
  // Build the HTML for the answers
  buildAnswerHTML (question, inputType, i) {
    const answers = (Object.entries(question.answers));
    // Filter out possible answers that are not null
    const answersOpts = answers.filter(a => a[1] !== null);
    return answersOpts.map(a => `<div class="answer-opt"><input type="${inputType}" id="${a[0]}" name="question${i}" value="${a[0]}" class="answer"><label for="${a[0]}">${safeTags(a[1])}</label></div>`).join('');
  },
  // Generate the listeners for this question
  registerQuestionListeners (i) {
    const questionForm = document.querySelector('.question');
    const stopButton = document.querySelector('.btn--stop');
    let count = 15;

    // Create an interval
    const interval = setInterval(() => {
      document.querySelector('.timer').innerHTML = count;
      count--;
      if (count === 0) {
        document.querySelector('.timer').innerHTML = 'Time\'s up!';
        // Generate the next question
        this.sendAnswers(i, questionForm, interval);
      }
    }, 1000);

    questionForm.addEventListener('submit', (e) => {
      // Generate the next question
      this.sendAnswers(i, questionForm, interval, count);
      e.preventDefault();
    });

    stopButton.addEventListener('click', () => {
      // eslint-disable-next-line no-undef
      // eslint-disable-next-line no-restricted-globals
      hs.go(0);
    });
  },
  sendAnswers (i, questionForm, interval, count = 0) {
    // eslint-disable-next-line no-undef
    const data = new FormData(questionForm);
    const answers = [];
    for (const value of data) {
      answers.push(value);
    }
    // Change the array of answers to only display the given answers
    const parsedAnswers = answers.map(answer => answer[1]);
    // Create an object with the answer data and count
    const answersObj = {
      count,
      answers: parsedAnswers,
    };
    // Push the answers object to the global answers array
    this.answers.push(answersObj);
    // Clear the interval
    clearInterval(interval);
    // Go to the next question or display the results if this is the last question
    (i < this.quiz.length - 1) ? this.askQuestion(i + 1) : this.showResults();
  },
  showQuestionMeter (count) {
    // Shows the quiz progress visually
    const quizInfo = document.querySelector('.quiz-info');
    const counter = document.querySelector('.quiz-info > span');
    const meter = document.querySelector('.quiz-info .fill');
    counter.innerText = `${count} / ${this.quiz.length}`;
    meter.style.width = `${(count) / this.quiz.length * 100}%`;
    quizInfo.setAttribute('data-show', 'true');
  },
  showResults () {
    // Hide the question info
    const quizInfo = document.querySelector('.quiz-info');
    quizInfo.removeAttribute('data-show');
    let correctQuestionsAmount = 0;

    // Generate the questions UI
    const output = this.answers.map((answer, i) => {
      const questionToAnswer = this.quiz[i];
      const isCorrectAnswers = [];
      // Generate the text to display for the correct answers
      const correctAnswersText = this.showCorrectAnswer(questionToAnswer);
      // Validate each given answer and add to isCorrectAnswers array
      for (let j = 0; j < answer.answers.length; j++) {
        isCorrectAnswers.push(this.validateAnswer(questionToAnswer, answer.answers[j]));
      }
      // Generate the text to display for the given answers
      const givenAnswersText = this.getGivenAnswersHTML(answer.answers, questionToAnswer);
      // Validate if the answers were correct
      const isCorrect = this.validateQuestion(isCorrectAnswers, answer.answers, questionToAnswer);
      if (isCorrect) correctQuestionsAmount++;
      // Generate a class list based on validity of answers
      const classList = isCorrect ? 'card card--correct' : 'card card--false';
      // Generate UI for each question
      return `
          <card class="${classList}">
            <h4>Question ${i + 1}</h4>
            
            <p class="question__content">${safeTags(questionToAnswer.question)}</p>
            <hr>
            
            <div class="given-answers">Your answer: <ul class="answers-list">${givenAnswersText}</ul></div>

            <p class="time">You answered in ${15 - answer.count} seconds.</p>
            
            <p class="score">You gained ${this.getScore(isCorrect, answer.count)} points!</p>
            
            <div class="correct-answers">
            <hr>
            Correct answer: <ul class="answers-list">${correctAnswersText}</ul></div>
          </card>`;
    }).join('');

    // Generate UI for results
    this.$app.innerHTML = `
      <div class="quiz__results">
        <div class="quiz__score"></div>
        ${output}
      </div>`;

    // Add the results to the history and update the page title
    hs.add({
      link: null,
      title: `${cs.APP_TITLE} | Results`,
    });

    // Get and display the total score
    this.getQuizScore(correctQuestionsAmount);
  },
  getGivenAnswersHTML (answers, question) {
    return answers.map((a) => {
      let output = '';
      if (a !== undefined && a !== '') {
        output = `<li class="question__answers--given">${safeTags(question.answers[a])}</li>`;
      }
      if (a === undefined || a === '') {
        output = `<li class="question__answers--given">You didn't answer this question.</li>`;
      }
      return output;
    }).join('');
  },
  validateAnswer (question, answer) {
    const output = (answer !== '') ? question.correct_answers[`${answer}_correct`] : false;
    return output;
  },
  validateQuestion (isCorrectAnswers, answers, questionToAnswer) {
    let isCorrect;
    // Compare the answers to the answers with value 'true'
    if (isCorrectAnswers.length === 1) {
      // Only one answer is given
      if (isCorrectAnswers[0] === 'true') {
        isCorrect = true;
      } else {
        isCorrect = false;
      }
    } else {
      // Multiple answers were given
      const questionAnswers = Object.entries(questionToAnswer.correct_answers).filter(a => a[1] === 'true');
      const correctAnswers = questionAnswers.map(a => a[0].slice(0, 8));
      // Convert to string and compare the strings
      if (JSON.stringify(answers) === JSON.stringify(correctAnswers)) {
        isCorrect = true;
      } else {
        isCorrect = false;
      }
    }
    return isCorrect;
  },
  showCorrectAnswer (question) {
    // Filter the correct answers from the the answers object
    const answers = Object.entries(question.correct_answers).filter(a => a[1] === 'true');
    // Remove the _correct from the correct answers list
    const correctAnswers = answers.map(a => a[0].slice(0, 8));
    // Return the HTML for the correct answers text
    // Make sure the string is safe to use in a HTML tag
    return correctAnswers.map((a) => {
      const qAnswer = question.answers[`${a}`];
      return `<li class="question__answers--correct">${safeTags(qAnswer)}</li>`;
    }).join('');
  },
  getScore (isCorrect, timeLeft) {
    // Generate score for each question
    // Question correct points = time left on the counter
    // No points if the question was answered wrong
    let value = 0;
    if (isCorrect) {
      this.score.push(1 * timeLeft);
      value = 1 * timeLeft;
    }
    if (!isCorrect) {
      this.score.push(0);
    }
    return value;
  },
  getQuizScore (numberCorrect) {
    // Normalize quiz score based on amount of questions
    let total = 0;
    const limit = this.score.length;
    for (let i = 0; i < limit; i++) {
      total += this.score[i];
    }

    const score = Math.ceil(total / this.quiz.length);
    const $score = document.querySelector('.quiz__score');
    const quizScore = document.createElement('p');
    quizScore.classList.add('quiz-score');
    quizScore.innerText = `You answered ${numberCorrect}/${this.quiz.length} questions correct and gained ${score} points!`;
    $score.appendChild(quizScore);

    this.saveScore(score, Date.now(), numberCorrect);
  },
  saveScore (score, timestamp, numberCorrect) {
    const options = this.quizOptions;
    const quizData = {
      id: timestamp,
      questions_total: this.quiz.length,
      questions_correct: numberCorrect,
      quiz_score: score,
      options,
    };
    const highScoresStr = cache.readFromSessionCache('highScores');
    let highScores = '';
    if (highScoresStr !== null) highScores = highScoresStr;
    highScores += `${timestamp},`;
    cache.writeToSessionCache('highScores', highScores);
    cache.writeToSessionCache(`score-${timestamp}`, quizData);
  },
  displayHighScores () {
    const highScoreIds = cache.readFromSessionCache('highScores').split(',');
    const scoresToFetch = [];
    highScoreIds.forEach((id) => {
      if (id !== '') {
        scoresToFetch.push(`score-${id}`);
      }
    });

    const scoresArray = scoresToFetch.map(
      scoreId => cache.readFromSessionCache(scoreId)
    ).sort((a, b) => {
      let value = 0;
      if (b.quiz_score < a.quiz_score) {
        value = -1;
      }
      if (b.quiz_score === a.quiz_score) {
        value = 0;
      }
      if (b.quiz_score > a.quiz_score) {
        value = 1;
      }
      return value;
    });

    const scoreHTML = scoresArray.map((score) => {
      const date = new Date(score.id);
      const dateString = date.toLocaleDateString();
      const time = date.toLocaleTimeString();
      const options = score.options;
      console.log(options);
      return `
        <li class="score-item">
          <card class="result-item">
            <div class="result-options">
              <p>Category: <span class="option-value">${options.category}</span></p>
              <p>Difficulty: <span class="option-value">${options.difficulty}</span></p>
            </div>
            <h3>${score.quiz_score} points</h3> 
            <p>${score.questions_correct}/${score.questions_total} questions correct</p>
            <p>On ${dateString} at <time>${time}</time></p>
          </card>
        </li>`;
    }).join('');

    this.$app.innerHTML = `
      <div class="highscores-container">
        <h2>High scores this session:</h2>
        <ul>${scoreHTML}</ul>
      </div>`;
  },
};

app.init();
