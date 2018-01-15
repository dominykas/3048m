'use strict';


// avoid relying on npm :trollface:
const leftPad = (str, n) => '0'.repeat(n - ('' + str).length) + str;

module.exports.isoDate = (date) => `${date.getFullYear()}-${leftPad(date.getMonth() + 1, 2)}-${leftPad(date.getDate(), 2)}`;
