(() => {
    'use strict';

    const report = (res) => {

        window.____data = res;

        const fixed = res
            .reduce((memo, row) => {

                const data = memo.data;
                const totals = memo.totals;

                if (!data[row.date]) {
                    data[row.date] = { rows: [] };
                }

                data[row.date].rows.push(row);

                if (row.hours === 0 && row.notes === null) {
                    // @todo: render these into a data-attribute?
                    return;
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
            }, { data: {}, totals: {} });

        console.table(fixed.data);
        console.table(fixed.totals);

        const headingsHtml=`<tr>
    <th>Date</th>
    ${Object.keys(fixed.totals).map((k) => `<th colspan="2" style="padding-right: 14px;">${k}</th>`).join('')}
</tr>`;

        const dataHtml = Object.keys(fixed.data)
            .reduce((memo, date) => {

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
                            hoursClass = 'has-gradient grad-blue confirmed';
                        }
                        if (fixed.data[date][k] && fixed.data[date][k].notes) {
                          notes = fixed.data[date][k].notes;
                        }

                        return `<td class="tk-time-tracker-cel ${hoursClass}"><div class="tk-hours">${hours}</div></td><td style="padding-right: 14px;">${notes}</td>`;
                    }).join('');

                const row = `<tr class="tk-time-tracker-row"><td style="white-space: nowrap;padding-right: 14px;">${date}</td>${columns}</tr>`;

                return memo + row;
            }, '');

        const html = `<table style="clear: both;" class="widget-wrapper"><thead>${headingsHtml}</thead><tbody class="tk-time-tracker">${dataHtml}</tbody></table>`;
        document.querySelector('#personPageMainContentAreaTimeTracker').insertAdjacentHTML('beforebegin', html);
    };

    if (!window.whoami) {
        alert('Are you on 10kft? And logged in?');
        return;
    }

    if (window.____data) {
        report(____data);
        return;
    }

    const userId = window.whoami.id;

    const now = new Date();

    const from = `${now.getFullYear()}-${now.getMonth()}-1`;
    const to = `${now.getFullYear()}-${now.getMonth() + 2}-1`;

    const url = `https://app.10000ft.com/api/v1/users/${userId}/time_entries?fields=approvals&from=${from}&page=1&per_page=1000&to=${to}&with_suggestions=true`;
    fetch(url, { credentials: 'include' })
        .then((res) => res.json())
        .then((body) => report(body.data));

})();
