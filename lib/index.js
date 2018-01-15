/* global document, fetch */
'use strict';

const Data = require('./data');
const Templates = require('./templates');
const Utils = require('./utils');

const now = new Date();

const queryFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1); // from start of previous month
const queryTo = new Date(now.getFullYear(), now.getMonth() + 2, 0); // till end of next month

const getInitialValue = function () {

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

const transformTimeEntries = function (timeEntries) {

    const initialValue = getInitialValue();

    const fixed = timeEntries.reduce((memo, row) => {

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
    }, initialValue);
    return fixed;
};

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

const report = ({ timeEntries, projects, leaveTypes }) => {

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
};

if (!window.whoami) {
    window.alert('Are you on 10kft? And logged in?');
    return;
}

Data.load(window.whoami.id, queryFrom, queryTo)
    .then(([timeEntriesRes, projectsRes, laveTypesRes]) => {

        report({
            timeEntries: transformTimeEntries(timeEntriesRes.data),
            projects: projectsRes.data,
            leaveTypes: laveTypesRes.data
        });
    });
