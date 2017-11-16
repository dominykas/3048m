(() => {
    'use strict';

    // avoid relying on npm :trollface:
    const leftPad = (str, n) => '0'.repeat(n - ('' + str).length) + str;

    const isoDate = (date) => `${date.getFullYear()}-${leftPad(date.getMonth() + 1, 2)}-${leftPad(date.getDate(), 2)}`;

    const now = new Date();

    const queryFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1); // from start of previous month
    const queryTo = new Date(now.getFullYear(), now.getMonth() + 2, 0); // till end of next month

    const today = isoDate(new Date());
    const currentMonth = new Date().getMonth();
    const displayFrom = new Date(Date.now() - 86400 * 31 * 1000);
    const displayTo = new Date(Date.now() + 86400 * 7 * 1000);

    const load = () => {

        const userId = window.whoami.id;

        const timeEntriesUrl = `https://app.10000ft.com/api/v1/users/${userId}/time_entries?fields=approvals&from=${isoDate(queryFrom)}&page=1&per_page=1000&to=${isoDate(queryTo)}&with_suggestions=true`;
        const timeEntriesPromise = fetch(timeEntriesUrl, { credentials: 'include' }).then((res) => res.json());

        const projectsUrl = `https://app.10000ft.com/api/v1/users/${userId}/projects?with_archived=true&per_page=100&with_phases=true`;
        const projectsPromise = fetch(projectsUrl, { credentials: 'include' }).then((res) => res.json());

        const leaveTypesUrl = `https://app.10000ft.com/api/v1/leave_types?page=1&with_archived=true`;
        const leaveTypesPromise = fetch(leaveTypesUrl, { credentials: 'include' }).then((res) => res.json());

        const existing = document.getElementById('results-3048m');
        if (existing) {
            existing.style.opacity = '0.3';
        }

        Promise.all([timeEntriesPromise, projectsPromise, leaveTypesPromise])
            .then(([timeEntriesRes, projectsRes, laveTypesRes]) => {

                report({
                    timeEntries: timeEntriesRes.data,
                    projects: projectsRes.data,
                    leaveTypes: laveTypesRes.data
                })
            });
    };

    const report = ({ timeEntries, projects, leaveTypes }) => {

        const getProjectHeading = (projectKey) => {

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

        const getHoursColor = function (projectKey, hasError) {

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

        const initialValue = {
            data: {},
            totals: {}
        };

        let day = queryFrom.getDate();
        let date;
        do {
            date = new Date(queryFrom.getFullYear(), queryFrom.getMonth(), day);
            const dateKey = isoDate(date);
            initialValue.data[dateKey] = {
                weekday: date.getDay(),
                date: date,
                lastOfMonth: new Date(queryFrom.getFullYear(), queryFrom.getMonth(), day + 1).getMonth() !== date.getMonth(),
                rows: []
            };
            day++;
        } while (date < queryTo);

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

            const [y, m, d] = row.date.split('-');

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

        // console.table(fixed.data);
        // console.table(fixed.totals);

        const headingsHtml = `<tr>
    <th>Date</th>
    ${Object.keys(fixed.totals).map((k) => `<th colspan="2" style="padding-right: 14px;">${getProjectHeading(k)}</th>`).join('')}
</tr>`;

        const dataHtml = Object.keys(fixed.data).reduce((memo, date) => {

            const rowData = fixed.data[date];
            const rowHours = Object.keys(rowData).reduce((sum, k) => sum + (rowData[k] && rowData[k].hours || 0), 0);

            let row = '';
            const displayRow = (rowData.date.getTime() >= displayFrom.getTime() && rowData.date.getTime() <= displayTo.getTime())
                || (rowData.date.getMonth() === currentMonth);

            if (displayRow) {
                const columns = Object.keys(fixed.totals)
                    .map((k) => {

                        let hours = '';
                        let notes = '';
                        let hoursClass = '';

                        if (rowData[k] && rowData[k].scheduled && rowHours <= 0) {
                            hours = rowData[k].scheduled;
                        }
                        if (rowData[k] && rowData[k].hours) {
                            hours = rowData[k].hours;
                            hoursClass = 'has-gradient confirmed ' + getHoursColor(k, rowData[k].error);
                        }
                        if (rowData[k] && rowData[k].notes) {
                            notes = rowData[k].notes;
                        }

                        if (rowData[k] && rowData[k].error) {
                            notes += ' <span style="color: #999;font-size: 10px;">Fix multiple entries in "Day" view</span>'
                        }

                        return `<td class="tk-time-tracker-cel ${hoursClass}"><div class="tk-hours">${hours}</div></td><td style="padding-right: 14px;">${notes}</td>`;
                    }).join('');

                let rowStyle = '';
                if (rowData.weekday === 0 || rowData.weekday === 6) {
                    rowStyle += 'background-color: #f5f5f5;';
                }
                if (date === today) {
                    rowStyle += 'outline: 1px dotted #000;';
                }

                row = `<tr class="tk-time-tracker-row" style="${rowStyle}"><td style="white-space: nowrap;padding-right: 14px;">${date}</td>${columns}</tr>`;
            }

            let totals = '';
            if (rowData.lastOfMonth) {
                const month = date.substr(0, 7);
                totals = `<tr class="tk-time-tracker-row" style="background-color:#e5e5e5">
<th scope="row">${month}</th>
${Object.keys(fixed.totals).map((k) => `<td colspan="2" style="padding-right: 14px;"><div class="tk-time-tracker-cel"><div class="tk-hours">${(fixed.totals[k][month] || 0) / 8} days</div></div></td>`).join('')}
</tr>`
            }

            return memo + row + totals;
        }, '');

        const html = `<table id="results-3048m" style="clear: both;" class="widget-wrapper"><thead>${headingsHtml}</thead><tbody class="tk-time-tracker">${dataHtml}</tbody></table>`;

        const existing = document.getElementById('results-3048m');
        if (existing) {
            existing.parentNode.removeChild(existing);
        }

        document.querySelector('#personPageMainContentAreaTimeTracker').insertAdjacentHTML('beforebegin', html);
    };

    if (!window.whoami) {
        alert('Are you on 10kft? And logged in?');
        return;
    }

    load();
})();
