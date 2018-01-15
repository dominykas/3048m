(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global fetch */
'use strict';

const Utils = require('./utils');

const getInitialValue = function ({ queryFrom, queryTo, displayFrom, displayTo }) {

    const initialValue = {
        data: {},
        totals: {}
    };

    const now = new Date();
    const todayKey = Utils.isoDate(now);

    let day = queryFrom.getDate();
    let date;
    do {
        date = new Date(queryFrom.getFullYear(), queryFrom.getMonth(), day);

        const dateKey = Utils.isoDate(date);
        const nextDayAfterDate = new Date(queryFrom.getFullYear(), queryFrom.getMonth(), day + 1);

        const currentMonth = date.getMonth() === now.getMonth();
        const inDisplayRange = date.getTime() >= displayFrom.getTime() && date.getTime() <= displayTo.getTime();

        initialValue.data[dateKey] = {

            date,

            today: dateKey === todayKey,
            weekday: date.getDay(),
            month: dateKey.substr(0, 7),

            display: inDisplayRange || currentMonth,
            lastOfMonth: date.getMonth() !== nextDayAfterDate.getMonth(),

            projects: {},
            rows: []

        };

        day++;
    } while (date < queryTo);

    return initialValue;
};

const transformTimeEntries = function (query, timeEntries) {

    return timeEntries.reduce((memo, row) => {

        const data = memo.data;
        const totals = memo.totals;

        data[row.date].rows.push(row);

        if (row.hours === 0 && row.notes === null) {
            // @todo: render these into a data-attribute?
            return memo;
        }

        const id = `${row.assignable_type}-${row.assignable_id}`;

        if (!totals[id]) {
            totals[id] = {};
        }

        const [y, m] = row.date.split('-');

        if (!totals[id][`${y}-${m}`]) {
            totals[id][`${y}-${m}`] = 0;
        }

        const projectData = data[row.date].projects;

        if (row.is_suggestion && !projectData[id]) {
            projectData[id] = { scheduled: row.scheduled_hours };
        }
        else {
            if (projectData[id] && projectData[id].hours > 0 && row.hours > 0) {
                projectData[id].error = true;
            }
            else {
                projectData[id] = {};
            }

            if (row.hours > 0) {
                projectData[id].hours = (projectData[id].hours || 0) + row.hours;
                totals[id][`${y}-${m}`] += row.hours;
            }
            if (row.notes !== null) {
                projectData[id].notes = row.notes;
            }
        }

        return memo;
    }, getInitialValue(query));
};

module.exports.load = function (userId, displayFrom, displayTo) {

    const queryFrom = new Date(displayFrom.getFullYear(), displayFrom.getMonth(), 1); // from start of displayable month
    const queryTo = new Date(displayTo.getFullYear(), displayTo.getMonth() + 2, 0); // till end of month after displayable month

    const timeEntriesUrl = `https://app.10000ft.com/api/v1/users/${userId}/time_entries?fields=approvals&from=${Utils.isoDate(queryFrom)}&page=1&per_page=1000&to=${Utils.isoDate(queryTo)}&with_suggestions=true`;
    const timeEntriesPromise = fetch(timeEntriesUrl, { credentials: 'include' }).then((res) => res.json());

    const projectsUrl = `https://app.10000ft.com/api/v1/users/${userId}/projects?with_archived=true&per_page=100&with_phases=true`;
    const projectsPromise = fetch(projectsUrl, { credentials: 'include' }).then((res) => res.json());

    const leaveTypesUrl = `https://app.10000ft.com/api/v1/leave_types?page=1&with_archived=true`;
    const leaveTypesPromise = fetch(leaveTypesUrl, { credentials: 'include' }).then((res) => res.json());

    return Promise.all([timeEntriesPromise, projectsPromise, leaveTypesPromise])
        .then(([timeEntriesRes, projectsRes, laveTypesRes]) => {

            return {
                timeEntries: transformTimeEntries({ queryFrom, queryTo, displayFrom, displayTo }, timeEntriesRes.data),
                projects: projectsRes.data,
                leaveTypes: laveTypesRes.data
            };
        });
};

},{"./utils":4}],2:[function(require,module,exports){
'use strict';

module.exports.table = require('./table.ejs');

},{"./table.ejs":3}],3:[function(require,module,exports){
module.exports = (function anonymous(locals, escapeFn, include, rethrow
/*``*/) {
escapeFn = escapeFn || function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
        .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
;
  var __output = [], __append = __output.push.bind(__output);
  with (locals || {}) {
    ;  const Utils = require('../utils'); 
    ; __append("\n<table id=\"results-3048m\" style=\"clear: both;\" class=\"widget-wrapper\">\n\n    <thead>\n        <tr>\n            <th>Date</th>\n            ")
    ;  Object.keys(timeEntries.totals).forEach((k) => { 
    ; __append("\n            <th colspan=\"2\" style=\"padding-right: 14px;\">")
    ; __append(escapeFn( Utils.formatProjectHeading(projects, leaveTypes, k) ))
    ; __append("</th>\n            ")
    ;  }); 
    ; __append("\n        </tr>\n    </thead>\n\n    <tbody class=\"tk-time-tracker\">\n        ")
    ;  Utils.forEach(timeEntries.data, (dateKey, dayData) => {

            const rowProjectData = dayData.projects;
            const rowHours = Object.keys(rowProjectData).reduce((sum, projectKey) => sum + (rowProjectData[projectKey].hours || 0), 0);
        
    ; __append("\n\n        ")
    ;  if (dayData.display) { 
    ; __append("\n        <tr class=\"tk-time-tracker-row\" style=\"")
    ; __append(escapeFn( Utils.getRowStyle(dayData) ))
    ; __append("\">\n\n            <td style=\"white-space: nowrap;padding-right: 14px;\">")
    ; __append(escapeFn( dateKey ))
    ; __append("</td>\n\n            ")
    ;  Utils.forEach(timeEntries.totals, (projectKey, projectData) => { 
    ; __append("\n            <td class=\"")
    ; __append( Utils.getHourCellClass(projects, leaveTypes, projectKey, projectData) )
    ; __append("\"><div class=\"tk-hours\">\n                ")
    ; __append( Utils.getProjectHours(projectData, rowHours) )
    ; __append("\n            </div></td>\n            <td style=\"padding-right: 14px;\">\n                ")
    ; __append( projectData && projectData.notes || '' )
    ; __append("\n                ")
    ;  if (projectData && projectData.error) { 
    ; __append("\n                <span style=\"color: #999;font-size: 10px;\">Fix multiple entries in \"Day\" view</span>\n                ")
    ;  } 
    ; __append("\n            </td>\n            ")
    ;  }) 
    ; __append("\n        </tr>\n        ")
    ;  } 
    ; __append("\n\n        ")
    ;  if (dayData.lastOfMonth) { 
    ; __append("\n        <tr class=\"tk-time-tracker-row\" style=\"background-color:#e5e5e5;\">\n\n            <th scope=\"row\">")
    ; __append(escapeFn( dayData.month ))
    ; __append("</th>\n\n            ")
    ;  Object.keys(timeEntries.totals).forEach((k) => { 
    ; __append("\n            <td colspan=\"2\" style=\"padding-right: 14px;\"><div class=\"tk-time-tracker-cel\"><div class=\"tk-hours\">")
    ; __append(escapeFn( (timeEntries.totals[k][dayData.month] || 0) / 8 ))
    ; __append(" days</div></div></td>\n            ")
    ;  }); 
    ; __append("\n        </tr>\n        ")
    ;  } 
    ; __append("\n\n        ")
    ;  }); 
    ; __append("\n    </tbody>\n\n</table>\n")
  }
  return __output.join("");

})
},{"../utils":4}],4:[function(require,module,exports){
/* global document */
'use strict';

// avoid relying on npm :trollface:
exports.leftPad = (str, n) => '0'.repeat(n - ('' + str).length) + str;

exports.isoDate = (date) => `${date.getFullYear()}-${exports.leftPad(date.getMonth() + 1, 2)}-${exports.leftPad(date.getDate(), 2)}`;

exports.forEach = (object, callback) => {

    Object.keys(object).forEach((k) => callback(object[k], k));
};

exports.formatProjectHeading = (projects, leaveTypes, projectKey) => {

    if (projectKey.startsWith('LeaveType-')) {
        const leaveId = +projectKey.substr(10);
        const leave = leaveTypes.find((p) => p.id === leaveId);

        if (leave) {
            return leave.name;
        }
    }

    if (projectKey.startsWith('Project-')) {
        const projectId = +projectKey.substr(8);
        const project = projects.find((p) => p.id === projectId);

        if (project) {
            return project.name;
        }
    }

    return projectKey;
};

exports.getColorClass = (projects, leaveTypes, projectKey, hasError) => {

    if (hasError) {
        return 'grad-red';
    }

    if (projectKey.startsWith('LeaveType-')) {
        return 'grad-orange';
    }

    if (projectKey.startsWith('Project-')) {
        const projectId = +projectKey.substr(8);
        const project = projects.find((p) => p.id === projectId);

        if (project && project.project_state === 'Internal') {
            return 'grad-purple';
        }
    }

    return 'grad-blue';
};

exports.getProjectHours = function (projectData, rowHours) {

    if (projectData && projectData.hours) {
        return projectData.hours;
    }

    if (projectData && projectData.scheduled && rowHours <= 0) {
        return projectData.scheduled;
    }

    return '';
};

exports.getHourCellClass = (projects, leaveTypes, projectKey, projectData) => {

    if (projectData && projectData.hours) {
        return 'tk-time-tracker-cel has-gradient confirmed ' + exports.getColorClass(projects, leaveTypes, projectKey, projectData.error);
    }

    return 'tk-time-tracker-cel';
};

exports.getRowStyle = ({ weekday, today }) => {

    let rowStyle = '';

    if (weekday === 0 || weekday === 6) {
        rowStyle += 'background-color: #f5f5f5;';
    }

    if (today) {
        rowStyle += 'outline: 1px dotted #000;';
    }

    return rowStyle;
};

exports.existingTableFadeout = function () {

    const existing = document.getElementById('results-3048m');
    if (!existing) {
        return;
    }

    existing.style.opacity = '0.3';
};

exports.existingTableRemove = function () {

    const existing = document.getElementById('results-3048m');
    if (!existing) {
        return;
    }

    existing.parentNode.removeChild(existing);
};

},{}],5:[function(require,module,exports){
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

},{"./data":1,"./templates":2,"./utils":4}]},{},[5]);
