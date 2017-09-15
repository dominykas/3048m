(() => {
    'use strict';

    const report = (res) => {

        const fixed = res
            .filter((row) => {

                return !(row.hours === 0 && row.notes === null)
            })
            .reduce((memo, row) => {

                const data = memo.data;
                const totals = memo.totals;

                if (!data[row.date]) {
                    data[row.date] = { rows: [] };
                }

                data[row.date].rows.push(row);

                const id = `${row.assignable_type}-${row.assignable_id}`;

                if (!totals[id]) {
                    totals[id] = {};
                }

                const [y, m, d] = row.date.split('-');

                if (!totals[id][`${y}-${m}`]) {
                    totals[id][`${y}-${m}`] = 0;
                }

                if (row.is_suggestion && !data[row.date][`${id}-hours`]) {
                    data[row.date][`${id}-scheduled`] = row.scheduled_hours;
                }
                else {
                    delete data[row.date][`${id}-scheduled`];
                    if (row.hours > 0) {
                        data[row.date][`${id}-hours`] = row.hours;
                        totals[id][`${y}-${m}`] += row.hours;
                    }
                    if (row.notes !== null) {
                        data[row.date][`${id}-notes`] = row.notes;
                    }
                }

                return memo;
            }, { data: {}, totals: {} });

        console.table(fixed.data);
        console.table(fixed.totals);
        // console.log(document.querySelector('#personPageMainContentAreaTimeTracker'));
    };

    if (!window.whoami) {
        alert('Are you on 10kft? And logged in?');
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
