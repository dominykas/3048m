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

    const apiUrl = 'https://rm.smartsheet.com/api/v1';
    const timeEntriesUrl = `${apiUrl}/users/${userId}/time_entries?fields=approvals&from=${Utils.isoDate(queryFrom)}&page=1&per_page=1000&to=${Utils.isoDate(queryTo)}&with_suggestions=true`;
    const timeEntriesPromise = fetch(timeEntriesUrl, { credentials: 'include' }).then((res) => res.json());

    const projectsUrl = `${apiUrl}/users/${userId}/projects?with_archived=true&per_page=100&with_phases=true`;
    const projectsPromise = fetch(projectsUrl, { credentials: 'include' }).then((res) => res.json());

    const leaveTypesUrl = `${apiUrl}/leave_types?page=1&with_archived=true`;
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
