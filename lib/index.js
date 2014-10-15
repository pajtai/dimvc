/*jshint node:true */
'use strict';

var express = require('express'),
    app = express(),
    mongoose = require('mongoose-q')(require('mongoose')),
    path = require('path'),
    bodyParser = require('body-parser'),
    winston = require('winston'),
    dependencies = require('./dependencies'),
    root,
    environment;

module.exports = {
    start : start,
    setRoot : setRoot,
    setEnvironment : setEnvironment
};

function setRoot(dir) {
    root = dir;
}

function setEnvironment(env) {
    environment = env;
}

function start(port) {

    if (!root) {
        throw new Error('Please set the base directory using, dimvc.setRoot()');
    }
    if (!environment) {
        throw new Error('Please set the environment using, dimvc.setEnvironment()');
    }

    _setupMongoose();
    _setupExpress();
    dependencies(root, app);
    _startExpress(port);
}

function _setupMongoose() {
    var mongoConfigs = require(root + '/../config/' + environment + '/mongo.json');

    mongoose.connection.on('connected', function () {
        winston.info('Database is connected.');
    });
    process.on('SIGINT', function() {
        mongoose.connection.close(function () {
            winston.info('Database is disconnected');
            process.exit(0);
        });
    });

    mongoose.connect(mongoConfigs.endpoint);
}

function _setupExpress() {
    app.use(bodyParser.json());
    app.set('views', root + '/views');
    app.set('view engine', 'jade');
    app.use(express.static(path.join(root, 'public')));
}

function _startExpress(port) {
    app.use(function(req, res) {
        res.status(404).send({ message : 'Page not found' });
    });
    app.listen(3000);
    winston.info('listening on port 3000');
}


