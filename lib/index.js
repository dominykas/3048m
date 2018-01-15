/* global document, fetch */
'use strict';

const Data = require('./data');
const Templates = require('./templates');
const Utils = require('./utils');

const getDataHtml = function (projects, leaveTypes, entries) {

    const dataHtml = Object.keys(entries.data).reduce((memo, dateKey) => {

        const rowData = entries.data[dateKey];
        const rowProjectData = rowData.projects;
        const rowHours = Object.keys(rowProjectData).reduce((sum, k) => sum + (rowProjectData[k] && rowProjectData[k].hours || 0), 0);

        let row = '';

        if (rowData.display) {
            const columns = Object.keys(entries.totals)
                .map((k) => {

                    let hours = '';
                    let notes = '';
                    let hoursClass = '';

                    if (rowProjectData[k] && rowProjectData[k].scheduled && rowHours <= 0) {
                        hours = rowProjectData[k].scheduled;
                    }
                    if (rowProjectData[k] && rowProjectData[k].hours) {
                        hours = rowProjectData[k].hours;
                        hoursClass = 'has-gradient confirmed ' + Utils.getColorClass(projects, leaveTypes, k, rowProjectData[k].error);
                    }
                    if (rowProjectData[k] && rowProjectData[k].notes) {
                        notes = rowProjectData[k].notes;
                    }

                    if (rowProjectData[k] && rowProjectData[k].error) {
                        notes += ' <span style="color: #999;font-size: 10px;">Fix multiple entries in "Day" view</span>';
                    }

                    return `<td class="tk-time-tracker-cel ${hoursClass}"><div class="tk-hours">${hours}</div></td><td style="padding-right: 14px;">${notes}</td>`;
                }).join('');

            row = `<tr class="tk-time-tracker-row" style="${Utils.getRowStyle(rowData)}"><td style="white-space: nowrap;padding-right: 14px;">${dateKey}</td>${columns}</tr>`;
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

const userId = window.whoami.id;
const displayFrom = new Date(Date.now() - 86400 * 31 * 1000);
const displayTo = new Date(Date.now() + 86400 * 7 * 1000);

Data.load(userId, displayFrom, displayTo)
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
