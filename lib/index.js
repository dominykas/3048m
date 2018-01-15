'use strict';

const Data = require('./data');
const Ui = require('./ui');

if (!window.whoami) {
    window.alert('Are you on 10kft? And logged in?');
    return;
}

const userId = window.whoami.id;
const displayFrom = new Date(Date.now() - 86400 * 31 * 1000);
const displayTo = new Date(Date.now() + 86400 * 7 * 1000);

Ui.fadeout();
Data.load(userId, displayFrom, displayTo).then((data) => {

    Ui.cleanup();
    Ui.render(data);
});
