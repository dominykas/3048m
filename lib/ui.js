/* global document */
'use strict';

const Templates = require('./templates');

exports.fadeout = () => {

    const existing = document.getElementById('results-3048m');
    if (!existing) {
        return;
    }

    existing.style.opacity = '0.3';
};

exports.cleanup = () => {

    const existing = document.getElementById('results-3048m');
    if (!existing) {
        return;
    }

    existing.parentNode.removeChild(existing);
};

exports.render = (data) => {

    const html = Templates.table(data);

    document.querySelector('#personPageMainContentAreaTimeTracker')
        .insertAdjacentHTML('beforebegin', html);
};
