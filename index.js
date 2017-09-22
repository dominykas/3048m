(() => {
    'use strict';

    // avoid relying on npm :trollface:
    const leftPad = (str, n) => '0'.repeat(n - ('' + str).length) + str;

    const now = new Date();

    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const fromFmt = `${from.getFullYear()}-${from.getMonth() + 1}-${from.getDate()}`;
    const toFmt = `${to.getFullYear()}-${to.getMonth() + 1}-${to.getDate()}`;

    const report = ({ timeEntries, projects, leaveTypes }) => {

        window.____data = { timeEntries, projects, leaveTypes };

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

        const getProjectColor = function (projectKey) {

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

        let day = from.getDate();
        let date;
        do {
            date = new Date(from.getFullYear(), from.getMonth(), day);
            const dateKey = `${date.getFullYear()}-${leftPad(date.getMonth() + 1, 2)}-${leftPad(date.getDate(), 2)}`;
            initialValue.data[dateKey] = {
                weekday: date.getDay(),
                lastOfMonth: new Date(from.getFullYear(), from.getMonth(), day + 1).getMonth() !== date.getMonth(),
                rows: []
            };
            day++;
        } while (date < to);

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
                data[row.date][id] = {};
                if (row.hours > 0) {
                    data[row.date][id].hours = row.hours;
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

            const d = fixed.data[date];

            const columns = Object.keys(fixed.totals)
                .map((k) => {

                    let hours = '';
                    let notes = '';
                    let hoursClass = '';

                    if (fixed.data[date][k] && fixed.data[date][k].scheduled) {
                        hours = fixed.data[date][k].scheduled;
                    }
                    if (fixed.data[date][k] && fixed.data[date][k].hours) {
                        hours = fixed.data[date][k].hours;
                        hoursClass = 'has-gradient confirmed ' + getProjectColor(k);
                    }
                    if (fixed.data[date][k] && fixed.data[date][k].notes) {
                        notes = fixed.data[date][k].notes;
                    }

                    return `<td class="tk-time-tracker-cel ${hoursClass}"><div class="tk-hours">${hours}</div></td><td style="padding-right: 14px;">${notes}</td>`;
                }).join('');

            const row = `<tr class="tk-time-tracker-row" style="${d.weekday === 0 || d.weekday === 6 ? 'background-color: #f5f5f5' : ''}"><td style="white-space: nowrap;padding-right: 14px;">${date}</td>${columns}</tr>`;

            let totals = '';

            if (d.lastOfMonth) {
                const month = date.substr(0, 7);
                totals = `<tr class="tk-time-tracker-row" style="background-color:#e5e5e5">
<th scope="row">${month}</th>
${Object.keys(fixed.totals).map((k) => `<td colspan="2" style="padding-right: 14px;"><div class="tk-time-tracker-cel"><div class="tk-hours">${(fixed.totals[k][month] || 0) / 8} days</div></div></td>`).join('')}
</tr>`
            }

            return memo + row + totals;
        }, '');

        const html = `<table style="clear: both;" class="widget-wrapper"><thead>${headingsHtml}</thead><tbody class="tk-time-tracker">${dataHtml}</tbody></table>`;
        document.querySelector('#personPageMainContentAreaTimeTracker').insertAdjacentHTML('beforebegin', html);
    };

    if (!window.whoami) {
        alert('Are you on 10kft? And logged in?');
        return;
    }

    const userId = window.whoami.id;

    if (window.____data) {
        report(____data);
        return;
    }

    const timeEntriesUrl = `https://app.10000ft.com/api/v1/users/${userId}/time_entries?fields=approvals&from=${fromFmt}&page=1&per_page=1000&to=${toFmt}&with_suggestions=true`;
    const timeEntriesPromise = fetch(timeEntriesUrl, { credentials: 'include' }).then((res) => res.json());

    const projectsUrl = `https://app.10000ft.com/api/v1/users/${userId}/projects?with_archived=true&per_page=100&with_phases=true`;
    const projectsPromise = fetch(projectsUrl, { credentials: 'include' }).then((res) => res.json());

    const leaveTypesUrl = `https://app.10000ft.com/api/v1/leave_types?page=1&with_archived=true`;
    const leaveTypesPromise = fetch(leaveTypesUrl, { credentials: 'include' }).then((res) => res.json());

    Promise.all([timeEntriesPromise, projectsPromise, leaveTypesPromise])
        .then(([timeEntriesRes, projectsRes, laveTypesRes]) => {

            report({
                timeEntries: timeEntriesRes.data,
                projects: projectsRes.data,
                leaveTypes: laveTypesRes.data
            })
        });
})();
