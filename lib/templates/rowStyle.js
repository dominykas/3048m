'use strict';

module.exports = ({ weekday, today }) => {

    let rowStyle = '';

    if (weekday === 0 || weekday === 6) {
        rowStyle += 'background-color: #f5f5f5;';
    }

    if (today) {
        rowStyle += 'outline: 1px dotted #000;';
    }

    return rowStyle;
};
