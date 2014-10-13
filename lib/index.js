/*jshint node:true */
'use strict';

var express = require('express'),
    app = express(),
    mongoose = require('mongoose-q')(require('mongoose')),
    path = require('path'),
    glob = require('glob'),
    fs = require('fs'),
    dependable = require('dependable'),
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
        console.log('Database is connected.');
    });
    process.on('SIGINT', function() {
        mongoose.connection.close(function () {
            console.log('Database is disconnected');
            process.exit(0);
        });
    });

    mongoose.connect(mongoConfigs.endpoint);
}

function _setupExpress(port) {
    app.set('port', process.env.PORT || port);
    app.set('views', root + '/views');
    app.set('view engine', 'jade');
    app.use(express.static(path.join(root, 'public')));

    _loadDependencies();
    _loadRoutes();
}

function _loadDependencies() {
    container.register('mongoose', function() {
        return mongoose;
    });


    [
        {
            type: 'controllers',
            name: 'Controller'
        }

    ].forEach(function(component) {
        _loadClass(component);
    });

    [
        {
            type: 'models',
            name: 'Model'
        },
        {
            type: 'policies',
            name: 'Policy'
        },
        {
            type: 'services',
            name: 'Service'
        }
    ].forEach(function(component) {
        _loadFunction(component);
    });

    _loadViews();
}

function _loadClass(component) {
    glob.sync(root + '/api/' + component.type + '/**').forEach(function(file) {
        var name = path.basename(file, '.js');

        if (fs.statSync(file).isFile() && new RegExp(component.name + '$').test(name)) {
            console.log('loading class: ', name);
            container.register(name, function() {
                return require(file);
            });

            // Register the injection of a new instance
            container.register(_lcFirst(name), Function(name, 'return new ' + name + '()'));
        }

    });
}

function _loadFunction(component) {
    glob.sync(root + '/api/' + component.type + '/**').forEach(function(file) {
        var name = path.basename(file, '.js');

        if (fs.statSync(file).isFile() && new RegExp(component.name + '$').test(name)) {
            console.log('loading function: ', name);
            container.register(name, function() {
                require(file);
            });

        }

    });
}

function _loadViews() {
    glob.sync(root + '/views/*.jade').forEach(function(file) {
        var name = path.basename(file, '.jade');

        console.log('loading view: ' + name);
        container.register(name, name);
    });
}

function _ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function _lcFirst(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

function _isUcFirst(string) {
    var first = string.charAt(0);
    return first.toUpperCase() === first;
}

function _loadRoutes() {
    container.register('routes', require(root + '/api/routes'));
    container.resolve(function(routes) {
        console.log('routes:');
        console.log(routes);
    });
}

