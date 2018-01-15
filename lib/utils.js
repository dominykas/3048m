'use strict';

// avoid relying on npm :trollface:
exports.leftPad = (str, n) => '0'.repeat(n - ('' + str).length) + str;

exports.isoDate = (date) => `${date.getFullYear()}-${exports.leftPad(date.getMonth() + 1, 2)}-${exports.leftPad(date.getDate(), 2)}`;

exports.forEach = (object, callback) => {

    if (!object) {
        return;
    }

    Object.keys(object).forEach((k) => callback(object[k], k));
};
