'use strict';

module.exports = (rows) => {

    const approvals = {};
    rows.forEach((row) => {

        if (!row.approvals || !row.approvals.data) {
            return;
        }

        row.approvals.data.forEach((approval) => {

            const k = approval.status;
            approvals[k] = approvals[k] || 0;
            ++approvals[k];
        });
    });

    if (approvals.approved) {
        return '<div class="tk-icon-lock"></div>';
    }
    else if (approvals.pending) {
        return '<div class="tk-icon-check-small"></div>';
    }
};
