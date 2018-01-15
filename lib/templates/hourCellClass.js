'use strict';

const hourCellColor = (projects, leaveTypes, projectKey, hasError) => {

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

module.exports = (projects, leaveTypes, projectKey, projectData) => {

    if (projectData && projectData.hours) {
        return 'tk-time-tracker-cel has-gradient confirmed ' + hourCellColor(projects, leaveTypes, projectKey, projectData.error);
    }

    return 'tk-time-tracker-cel';
};
