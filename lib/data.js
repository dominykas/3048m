/* global document, fetch  */

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
            today: dateKey === todayKey,
            weekday: date.getDay(),
            date,
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

    const existing = document.getElementById('results-3048m');
    if (existing) {
        existing.style.opacity = '0.3';
    }

    return Promise.all([timeEntriesPromise, projectsPromise, leaveTypesPromise])
        .then(([timeEntriesRes, projectsRes, laveTypesRes]) => {

            return {
                timeEntries: transformTimeEntries({ queryFrom, queryTo, displayFrom, displayTo }, timeEntriesRes.data),
                projects: projectsRes.data,
                leaveTypes: laveTypesRes.data
            };
        });
};
