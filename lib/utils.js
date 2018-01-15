/* global document */
'use strict';

// avoid relying on npm :trollface:
exports.leftPad = (str, n) => '0'.repeat(n - ('' + str).length) + str;

exports.isoDate = (date) => `${date.getFullYear()}-${exports.leftPad(date.getMonth() + 1, 2)}-${exports.leftPad(date.getDate(), 2)}`;

exports.forEach = (object, callback) => {

    Object.keys(object).forEach((k) => callback(object[k], k));
};

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

exports.getProjectHours = function (projectData, rowHours) {

    if (projectData && projectData.hours) {
        return projectData.hours;
    }

    if (projectData && projectData.scheduled && rowHours <= 0) {
        return projectData.scheduled;
    }

    return '';
};

exports.getHourCellClass = (projects, leaveTypes, projectKey, projectData) => {

    if (projectData && projectData.hours) {
        return 'tk-time-tracker-cel has-gradient confirmed ' + exports.getColorClass(projects, leaveTypes, projectKey, projectData.error);
    }

    return 'tk-time-tracker-cel';
};

exports.getRowStyle = ({ weekday, today }) => {

    let rowStyle = '';

    if (weekday === 0 || weekday === 6) {
        rowStyle += 'background-color: #f5f5f5;';
    }

    if (today) {
        rowStyle += 'outline: 1px dotted #000;';
    }

    return rowStyle;
};

exports.existingTableFadeout = function () {

    const existing = document.getElementById('results-3048m');
    if (!existing) {
        return;
    }

    existing.style.opacity = '0.3';
};

exports.existingTableRemove = function () {

    const existing = document.getElementById('results-3048m');
    if (!existing) {
        return;
    }

    existing.parentNode.removeChild(existing);
};
