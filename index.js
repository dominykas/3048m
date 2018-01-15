(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global document, fetch  */

'use strict';

const Utils = require('./utils');

const getInitialValue = function (queryFrom, queryTo) {

    const initialValue = {
        data: {},
        totals: {}
    };

    let day = queryFrom.getDate();
    let date;
    do {
        date = new Date(queryFrom.getFullYear(), queryFrom.getMonth(), day);
        const dateKey = Utils.isoDate(date);
        initialValue.data[dateKey] = {
            weekday: date.getDay(),
            date,
            lastOfMonth: new Date(queryFrom.getFullYear(), queryFrom.getMonth(), day + 1).getMonth() !== date.getMonth(),
            rows: []
        };
        day++;
    } while (date < queryTo);

    return initialValue;
};

const transformTimeEntries = function (queryFrom, queryTo, timeEntries) {

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

        if (row.is_suggestion && !data[row.date][`${id}-hours`]) {
            data[row.date][id] = { scheduled: row.scheduled_hours };
        }
        else {
            if (data[row.date][id] && data[row.date][id].hours > 0 && row.hours > 0) {
                data[row.date][id].error = true;
            }
            else {
                data[row.date][id] = {};
            }

            if (row.hours > 0) {
                data[row.date][id].hours = (data[row.date][id].hours || 0) + row.hours;
                totals[id][`${y}-${m}`] += row.hours;
            }
            if (row.notes !== null) {
                data[row.date][id].notes = row.notes;
            }
        }

        return memo;
    }, getInitialValue(queryFrom, queryTo));
};

module.exports.load = function (userId, queryFrom, queryTo) {

    const timeEntriesUrl = `https://app.10000ft.com/api/v1/users/${userId}/time_entries?fields=approvals&from=${Utils.isoDate(queryFrom)}&page=1&per_page=1000&to=${Utils.isoDate(queryTo)}&with_suggestions=true`;
    const timeEntriesPromise = fetch(timeEntriesUrl, { credentials: 'include' }).then((res) => res.json());

    const projectsUrl = `https://app.10000ft.com/api/v1/users/${userId}/projects?with_archived=true&per_page=100&with_phases=true`;
    const projectsPromise = fetch(projectsUrl, { credentials: 'include' }).then((res) => res.json());

    const leaveTypesUrl = `https://app.10000ft.com/api/v1/leave_types?page=1&with_archived=true`;
    const leaveTypesPromise = fetch(leaveTypesUrl, { credentials: 'include' }).then((res) => res.json());

    const existing = document.getElementById('results-3048m');
    if (existing) {
        existing.style.opacity = '0.3';
    }

    return Promise.all([timeEntriesPromise, projectsPromise, leaveTypesPromise])
        .then(([timeEntriesRes, projectsRes, laveTypesRes]) => {

            return {
                timeEntries: transformTimeEntries(queryFrom, queryTo, timeEntriesRes.data),
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
    ; __append("\n<table id=\"results-3048m\" style=\"clear: both;\" class=\"widget-wrapper\">\n    <thead>\n        <tr>\n            <th>Date</th>\n            ")
    ;  Object.keys(timeEntries.totals).forEach((k) => { 
    ; __append("\n            <th colspan=\"2\" style=\"padding-right: 14px;\">")
    ; __append(escapeFn( Utils.formatProjectHeading(projects, leaveTypes, k) ))
    ; __append("</th>\n            ")
    ;  }); 
    ; __append("\n        </tr>\n    </thead>\n    <tbody class=\"tk-time-tracker\">")
    ; __append( dataHtml )
    ; __append("</tbody>\n</table>\n")
  }
  return __output.join("");

})
},{"../utils":4}],4:[function(require,module,exports){
'use strict';


// avoid relying on npm :trollface:
exports.leftPad = (str, n) => '0'.repeat(n - ('' + str).length) + str;

exports.isoDate = (date) => `${date.getFullYear()}-${exports.leftPad(date.getMonth() + 1, 2)}-${exports.leftPad(date.getDate(), 2)}`;

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

},{}],5:[function(require,module,exports){
/* global document, fetch */
'use strict';

const Data = require('./data');
const Templates = require('./templates');
const Utils = require('./utils');

const now = new Date();

const queryFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1); // from start of previous month
const queryTo = new Date(now.getFullYear(), now.getMonth() + 2, 0); // till end of next month

const getDataHtml = function (projects, leaveTypes, entries) {

    const today = Utils.isoDate(new Date());
    const currentMonth = new Date().getMonth();
    const displayFrom = new Date(Date.now() - 86400 * 31 * 1000);
    const displayTo = new Date(Date.now() + 86400 * 7 * 1000);

    const dataHtml = Object.keys(entries.data).reduce((memo, dateKey) => {

        const rowData = entries.data[dateKey];
        const rowHours = Object.keys(rowData).reduce((sum, k) => sum + (rowData[k] && rowData[k].hours || 0), 0);

        let row = '';
        const displayRow = (rowData.date.getTime() >= displayFrom.getTime() && rowData.date.getTime() <= displayTo.getTime())
            || (rowData.date.getMonth() === currentMonth);

        if (displayRow) {
            const columns = Object.keys(entries.totals)
                .map((k) => {

                    let hours = '';
                    let notes = '';
                    let hoursClass = '';

                    if (rowData[k] && rowData[k].scheduled && rowHours <= 0) {
                        hours = rowData[k].scheduled;
                    }
                    if (rowData[k] && rowData[k].hours) {
                        hours = rowData[k].hours;
                        hoursClass = 'has-gradient confirmed ' + Utils.getColorClass(projects, leaveTypes, k, rowData[k].error);
                    }
                    if (rowData[k] && rowData[k].notes) {
                        notes = rowData[k].notes;
                    }

                    if (rowData[k] && rowData[k].error) {
                        notes += ' <span style="color: #999;font-size: 10px;">Fix multiple entries in "Day" view</span>';
                    }

                    return `<td class="tk-time-tracker-cel ${hoursClass}"><div class="tk-hours">${hours}</div></td><td style="padding-right: 14px;">${notes}</td>`;
                }).join('');

            let rowStyle = '';
            if (rowData.weekday === 0 || rowData.weekday === 6) {
                rowStyle += 'background-color: #f5f5f5;';
            }
            if (dateKey === today) {
                rowStyle += 'outline: 1px dotted #000;';
            }

            row = `<tr class="tk-time-tracker-row" style="${rowStyle}"><td style="white-space: nowrap;padding-right: 14px;">${dateKey}</td>${columns}</tr>`;
        }

        let totals = '';
        if (rowData.lastOfMonth) {
            const month = dateKey.substr(0, 7);
            totals = `<tr class="tk-time-tracker-row" style="background-color:#e5e5e5">
<th scope="row">${month}</th>
${Object.keys(entries.totals).map((k) => `<td colspan="2" style="padding-right: 14px;"><div class="tk-time-tracker-cel"><div class="tk-hours">${(entries.totals[k][month] || 0) / 8} days</div></div></td>`).join('')}
</tr>`;
        }

        return memo + row + totals;
    }, '');
    return dataHtml;
};

if (!window.whoami) {
    window.alert('Are you on 10kft? And logged in?');
    return;
}

Data.load(window.whoami.id, queryFrom, queryTo)
    .then(({ timeEntries, projects, leaveTypes }) => {

        const dataHtml = getDataHtml(projects, leaveTypes, timeEntries);

        const html = Templates.table({
            timeEntries,
            projects,
            leaveTypes,
            dataHtml
        });

        const existing = document.getElementById('results-3048m');
        if (existing) {
            existing.parentNode.removeChild(existing);
        }

        document.querySelector('#personPageMainContentAreaTimeTracker').insertAdjacentHTML('beforebegin', html);
    });

},{"./data":1,"./templates":2,"./utils":4}]},{},[5]);
