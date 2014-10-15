/*jshint node:true */
'use strict';

module.exports = {
    isUcFirst : isUcFirst,
    lcFirst : lcFirst,
    ucFirst : ucFirst
};

function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function lcFirst(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

function isUcFirst(string) {
    var first = string.charAt(0);
    return first.toUpperCase() === first;
}