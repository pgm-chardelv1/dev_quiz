/**
 * @param {*} text
 * @returns String safe to use within html tags
 */

const safeTags = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export { safeTags };