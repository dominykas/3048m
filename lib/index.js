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
