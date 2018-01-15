'use strict';


// avoid relying on npm :trollface:
exports.leftPad = (str, n) => '0'.repeat(n - ('' + str).length) + str;

exports.isoDate = (date) => `${date.getFullYear()}-${exports.leftPad(date.getMonth() + 1, 2)}-${exports.leftPad(date.getDate(), 2)}`;

exports.formatProjectHeading = (projects, leaveTypes, projectKey) => {

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

exports.getColorClass = (projects, leaveTypes, projectKey, hasError) => {

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
