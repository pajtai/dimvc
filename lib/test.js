/*jshint node:true */
'use strict';
var dependencies = require('./dependencies'),
    express = require('express'),
    modelsLoaded = false;

module.exports = function(root) {
    var app = express(),
        container = dependencies(root, app, !modelsLoaded);


    modelsLoaded = true;
    return container;
};

