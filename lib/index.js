/* global document */
'use strict';

const Data = require('./data');
const Templates = require('./templates');
const Utils = require('./utils');

if (!window.whoami) {
    window.alert('Are you on 10kft? And logged in?');
    return;
}

const userId = window.whoami.id;
const displayFrom = new Date(Date.now() - 86400 * 31 * 1000);
const displayTo = new Date(Date.now() + 86400 * 7 * 1000);

Utils.existingTableFadeout();
Data.load(userId, displayFrom, displayTo).then(({ timeEntries, projects, leaveTypes }) => {

    Utils.existingTableRemove();

    const html = Templates.table({ timeEntries, projects, leaveTypes });

    document.querySelector('#personPageMainContentAreaTimeTracker')
        .insertAdjacentHTML('beforebegin', html);
});
