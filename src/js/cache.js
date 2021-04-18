/* eslint-disable no-undef */
/**
 * Writes and reads from local storage
 * @param {*} url
 * @param {*} data
 */
const writeToCache = (url, data) => localStorage.setItem(url, JSON.stringify(data));
const readFromCache = url => JSON.parse(localStorage.getItem(url)) || null;

const writeToSessionCache = (url, data) => sessionStorage.setItem(url, JSON.stringify(data));
const readFromSessionCache = url => JSON.parse(sessionStorage.getItem(url)) || null;

export {
  readFromCache,
  writeToCache,
  writeToSessionCache,
  readFromSessionCache,
};
