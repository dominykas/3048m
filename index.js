(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

            totalHours: 0,
            projects: {},
            rowsByProjects: {},
            rows: []

        };

        day++;
    } while (date < queryTo);

    return initialValue;
};

const transformTimeEntries = function (query, timeEntries) {

    const result = getInitialValue(query);

    timeEntries.forEach((entry) => {

        const dayData = result.data[entry.date];

        dayData.rows.push(entry);

        if (entry.hours === 0 && entry.notes === null) {
            return;
        }

        const id = `${entry.assignable_type}-${entry.assignable_id}`;

        dayData.rowsByProjects[id] = dayData.rowsByProjects[id] || [];
        dayData.rowsByProjects[id].push(entry);

        if (!result.totals[id]) {
            result.totals[id] = {};
        }

        if (!result.totals[id][dayData.month]) {
            result.totals[id][dayData.month] = 0;
        }
    });

    Utils.forEach(result.data, (dayData, dateKey) => {

        const { projects, rowsByProjects } = dayData;

        Utils.forEach(rowsByProjects, (rows, projectKey) => {

            const projectData = {};

            const scheduleEntries = rows.filter((entry) => entry.is_suggestion);

            if (scheduleEntries.length > 1) {
                projectData.error = 'E_MULTIPLE_SCHEDULES';
            }

            if (scheduleEntries.length > 0) {
                projectData.scheduled = scheduleEntries[0].scheduled_hours;
            }

            const hoursEntries = rows.filter((entry) => entry.hours > 0);

            if (hoursEntries.length > 1) {
                projectData.error = 'E_MULTIPLE_ENTRIES';
            }

            if (hoursEntries.length > 0) {

                projectData.hours = hoursEntries.reduce((sum, { hours }) => sum + hours, 0);
                result.totals[projectKey][dayData.month] += projectData.hours;
                dayData.totalHours += projectData.hours;

                if (hoursEntries[0].notes !== null) {
                    projectData.notes = hoursEntries[0].notes;
                }
            }

            projects[projectKey] = projectData;
        });
    });

    return result;
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

},{"./utils":10}],2:[function(require,module,exports){
'use strict';

module.exports = (rows) => {

    const approvals = {};
    rows.forEach((row) => {

        if (!row.approvals || !row.approvals.data) {
            return;
        }

        row.approvals.data.forEach((approval) => {

            const k = approval.status;
            approvals[k] = approvals[k] || 0;
            ++approvals[k];
        });
    });

    if (approvals.approved) {
        return '<div class="tk-icon-lock"></div>';
    }
    else if (approvals.pending) {
        return '<div class="tk-icon-check-small"></div>';
    }
};

},{}],3:[function(require,module,exports){
'use strict';

const hourCellColor = (projects, leaveTypes, projectKey, hasError) => {

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

module.exports = (projects, leaveTypes, projectKey, projectData) => {

    if (projectData && projectData.hours) {
        return 'tk-time-tracker-cel has-gradient confirmed ' + hourCellColor(projects, leaveTypes, projectKey, projectData.error);
    }

    return 'tk-time-tracker-cel';
};

},{}],4:[function(require,module,exports){
'use strict';

exports.table = require('./table.ejs');

exports.approvals = require('./approvals');
exports.projectHeading = require('./projectHeading');
exports.projectHours = require('./projectHours');
exports.hourCellClass = require('./hourCellClass');
exports.rowStyle = require('./rowStyle');

},{"./approvals":2,"./hourCellClass":3,"./projectHeading":5,"./projectHours":6,"./rowStyle":7,"./table.ejs":8}],5:[function(require,module,exports){
'use strict';

module.exports = (projects, leaveTypes, projectKey) => {

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

},{}],6:[function(require,module,exports){
'use strict';

module.exports = (projectData, rowHours) => {

    if (projectData && projectData.hours) {
        return projectData.hours;
    }

    if (projectData && projectData.scheduled && rowHours <= 0) {
        return projectData.scheduled;
    }

    return '';
};

},{}],7:[function(require,module,exports){
'use strict';

module.exports = ({ weekday, today }) => {

    let rowStyle = '';

    if (weekday === 0 || weekday === 6) {
        rowStyle += 'background-color: #f5f5f5;';
    }

    if (today) {
        rowStyle += 'outline: 1px dotted #000;';
    }

    return rowStyle;
};

},{}],8:[function(require,module,exports){
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
    ;  const Templates = require('../templates'); 
    ; __append("\n\n<table id=\"results-3048m\" style=\"clear: both;\" class=\"widget-wrapper\">\n\n    <thead>\n        <tr>\n            <th>Date</th>\n            ")
    ;  Object.keys(timeEntries.totals).forEach((k) => { 
    ; __append("\n            <th colspan=\"2\" style=\"padding-right: 14px;\">")
    ; __append(escapeFn( Templates.projectHeading(projects, leaveTypes, k) ))
    ; __append("</th>\n            ")
    ;  }); 
    ; __append("\n        </tr>\n    </thead>\n\n    <tbody class=\"tk-time-tracker\">\n        ")
    ;  Utils.forEach(timeEntries.data, (dayData, dateKey) => {

            const rowHours = Object.keys(dayData.projects).reduce((sum, projectKey) => sum + (dayData.projects[projectKey].hours || 0), 0);
        
    ; __append("\n\n        ")
    ;  if (dayData.display) { 
    ; __append("\n        <tr class=\"tk-time-tracker-row\" style=\"")
    ; __append(escapeFn( Templates.rowStyle(dayData) ))
    ; __append("\">\n\n            <td style=\"white-space: nowrap;padding-right: 14px;\" title=\"")
    ; __append(escapeFn( dayData.rows.map((row) => JSON.stringify(row)).join('\n\n') ))
    ; __append("\">")
    ; __append(escapeFn( dateKey ))
    ; __append("</td>\n\n            ")
    ;  Object.keys(timeEntries.totals).forEach((projectKey) => { const projectData = dayData.projects[projectKey]; 
    ; __append("\n            <td class=\"")
    ; __append( Templates.hourCellClass(projects, leaveTypes, projectKey, projectData) )
    ; __append("\">")
    ; __append( Templates.approvals(dayData.rows) )
    ; __append("<div class=\"tk-hours\">\n                ")
    ; __append( Templates.projectHours(projectData, rowHours) )
    ; __append("\n            </div></td>\n            <td style=\"padding-right: 14px;\">\n                ")
    ; __append( projectData && projectData.notes || '' )
    ; __append("\n                ")
    ;  if (projectData && projectData.error === 'E_MULTIPLE_ENTRIES') { 
    ; __append("\n                <span style=\"color: #999;font-size: 10px;\">Fix multiple entries in \"Day\" view</span>\n                ")
    ;  } 
    ; __append("\n                ")
    ;  if (projectData && projectData.error === 'E_MULTIPLE_SCHEDULES') { 
    ; __append("\n                <span style=\"color: #900;font-size: 10px;\">Multiple schedules available</span>\n                ")
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
},{"../templates":4,"../utils":10}],9:[function(require,module,exports){
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

},{"./templates":4}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{"./data":1,"./ui":9}]},{},[11]);
