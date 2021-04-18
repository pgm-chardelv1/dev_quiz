/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
/*
* History API
 */
// Add item to history
const add = (data) => {
  history.pushState(data, null, data.link);
  document.title = data.title; // Update the title in the browser tab;
};

// Replace item in history
const replace = (data) => {
  history.replaceState(data, null, data.link);
  document.title = data.title; // Update the title in the browser tab;
};

const go = (number) => {
  history.go(number);
};

export { add, replace, go };
