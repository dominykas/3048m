(() => {
    'use strict';

    const report = (res) => {

        const fixed = res
            .filter((row) => {

                return !(row.hours === 0 && row.notes === null)
            })
            .reduce((memo, row) => {

                if (!memo[row.date]) {
                    memo[row.date] = { rows: [] };
                }

                memo[row.date].rows.push(row);

                const id = `${row.assignable_type}-${row.assignable_id}`;
                if (row.is_suggestion && !memo[row.date][`${id}-hours`]) {
                    memo[row.date][`${id}-scheduled`] = row.scheduled_hours;
                } else {
                    delete memo[row.date][`${id}-scheduled`];
                    memo[row.date][`${id}-hours`] = row.hours;
                    if (row.notes !== null) {
                        memo[row.date][`${id}-notes`] = row.notes;
                    }
                }

                return memo;
            }, {});

        console.table(fixed);
    };

    const userId = window.whoami.id;

    const now = new Date();

    const from = `${now.getFullYear()}-${now.getMonth()}-1`;
    const to = `${now.getFullYear()}-${now.getMonth() + 2}-1`;

    const url = `https://app.10000ft.com/api/v1/users/${userId}/time_entries?fields=approvals&from=${from}&page=1&per_page=1000&to=${to}&with_suggestions=true`;
    fetch(url, { credentials: 'include' })
        .then((res) => res.json())
        .then((body) => report(body.data));

    // console.log(document.querySelector('#personPageMainContentAreaTimeTracker'));
})();
