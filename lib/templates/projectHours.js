'use strict';

module.exports = (projectData, rowHours) => {

    if (projectData && projectData.hours) {
        return projectData.hours;
    }

    if (projectData && projectData.scheduled && rowHours <= 0) {
        return projectData.scheduled;
    }

    return '';
};
