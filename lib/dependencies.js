/*jshint node:true */
'use strict';

var glob = require('glob'),
    fs = require('fs'),
    express = require('express'),
    mongoose = require('mongoose-q')(require('mongoose')),
    path = require('path'),
    makeApi = require('./makeApi'),
    dependable = require('dependable'),
    winston = require('winston'),
    container = dependable.container();

module.exports = function (root, app) {
    _loadDependencies(root, app);
    _loadRoutes(root, app);
};

function _loadDependencies(root, app) {
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
    }, root, app);

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
           _loadValue(component, root);
        });

    _loadViews(root);

}

function _loadModels(component, root, app) {
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

function _loadValue(component, root) {
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

function _loadViews(root) {
    glob.sync(root + '/views/*.jade').forEach(function(file) {
        var name = path.basename(file, '.jade');

        winston.info('loading view: ' + name);
        container.register(name, name);
    });
}

function _loadRoutes(root, app) {
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