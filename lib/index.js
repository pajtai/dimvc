/*jshint node:true */
'use strict';

var express = require('express'),
    app = express(),
    mongoose = require('mongoose-q')(require('mongoose')),
    path = require('path'),
    glob = require('glob'),
    fs = require('fs'),
    utils = require('./utils'),
    bodyParser = require('body-parser'),
    winston = require('winston'),
    dependable = require('dependable'),
    makeApi = require('./makeApi'),
    container = dependable.container(),
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
    _setupExpress(port);
}

function _setupMongoose() {
    var mongoConfigs = require(root + '/config/' + environment + '/mongo.json');

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

function _setupExpress(port) {
    app.use(bodyParser());
    app.set('port', process.env.PORT || port);
    app.set('views', root + '/views');
    app.set('view engine', 'jade');

    app.use(express.static(path.join(root, 'public')));

    _loadDependencies();
    _loadRoutes();
    winston.info('listening on port 3000');
    app.use(function(req, res) {
        res.status(404).send({ message : 'Page not found' });
    });
    app.listen(3000);
}

function _loadDependencies() {
    container.register('mongoose', function() {
        return mongoose;
    });

    // Fewer letters than, "winston"
    container.register('log', function () {
        return winston;
    });

    _loadModels({
        type: 'models',
        name: 'Model'
    });

    [
        {
            type: 'models',
            name: 'Model'
        },
        {
            type: 'services',
            name: 'Service'
        },
        {
            type: 'controllers',
            name: 'Controller'
        },
        {
            type: 'policies',
            name: 'Policy'
        }
    ].forEach(function(component) {
           _loadValue(component);
        });

    _loadViews();

}

function _loadModels(component) {
    glob.sync(root + '/api/' + component.type + '/**').forEach(function(file) {
        var name = path.basename(file, '.js');

        if (fs.statSync(file).isFile() && new RegExp(component.name + '$').test(name)) {
            winston.info('loading model: ', name);
            container.register(name, function() {
                require(file);
            });
            makeApi(name, app, container);

        }

    });
}

function _loadValue(component) {
    glob.sync(root + '/api/' + component.type + '/**').forEach(function(file) {
        var name = path.basename(file, '.js');

        if (fs.statSync(file).isFile() && new RegExp(component.name + '$').test(name)) {
            winston.info('loading class: ', name);
            //container.register(name, require(file));

            // Register the injection of a new instance
            container.register(name, require(file));
        }

    });
}

function _loadViews() {
    glob.sync(root + '/views/*.jade').forEach(function(file) {
        var name = path.basename(file, '.jade');

        winston.info('loading view: ' + name);
        container.register(name, name);
    });
}

function _loadRoutes() {
    container.register('routes', require(root + '/api/routes'));
    container.resolve(function(routes) {
        Object.keys(routes).forEach(function(route) {
            var router = express.Router(),
                routerRoute = router.route(route),
                instruction = routes[route];

            winston.info('route', route);
            winston.info('verb', instruction[0]);
            routerRoute[instruction[0]](instruction[1]());
            app.use(router);
        });
    });
}

