/*jshint node:true */
'use strict';
var express = require('express'),
    winston = require('winston'),
    utils = require('./utils'),
    _ = require('lodash');

module.exports = function _makeApi(name, app, container) {
    var router = express.Router(),
        Model = name;

    name = utils.lcFirst(name).replace(/Model$/,'');
    router.route('/' + name + 's')
        .get(function(req, res) {
            var func = '(function(<%- Model %>) {' +
                '<%- Model %>' +
                '   .findQ()' +
                '   .then(function(models) {' +
                '       res.status(200).send(models);' +
                '   })' +
                '   .catch(function(error) {' +
                '       res.status(500).send("Server error: " + error);' +
                '   });' +
                '})';
            _resolveForModel(req, res, func, Model);
        });

    router.route('/' + name + '/:id?')
        .get(function(req, res) {
            var func = '(function(<%- Model %>) {' +
                'var id = req.param("id");' +
                'if (undefined === id) {' +
                '   res.status(404).send("Not found.");' +
                '   return;' +
                '}' +
                '<%- Model %>' +
                '   .findOneQ({' +
                '       _id: "" + id' +
                '   })' +
                '   .then(function(model) {' +
                '       if (!model) {' +
                '           res.status(404).send("Not found.");' +
                '       } else {' +
                '           res.send(model);' +
                '       }' +
                '   })' +
                '   .catch(function(error) {' +
                '       res.status(500).send("Server error: " + error);' +
                '   });' +
                '})';
            _resolveForModel(req, res, func, Model);
        })
        .post(function(req, res) {
            var func = '(function(<%- Model %>) {' +
                '   new <%- Model %>()' +
                '       .saveQ()' +
                '       .then(function(model) {' +
                '           res.status(200).send(model);' +
                '       })' +
                '       .catch(function(error) {' +
                '           res.status(500).send("Server error: " + error);' +
                '       });' +
                '})';
            _resolveForModel(req, res, func, Model);
        })
        .put(function(req, res) {
            var func = '(function(<%- Model %>) {' +
                '   console.log("body: ", req.body);' +
                '    <%- Model %>' +
                '       .findByIdAndUpdateQ("" + req.param("id"), req.body)' +
                '       .then(function(model) {' +
                '           if (model) {' +
                '               res.status(200).send(model);' +
                '           } else {' +
                '               res.status(404).send("Not found.");' +
                '           }' +
                '       })' +
                '       .catch(function(error) {' +
                '           res.status(500).send("Server error: " + error);' +
                '       });' +
                '})';
            _resolveForModel(req, res, func, Model);
        })
        .delete(function(req, res) {
            var func = '(function(<%- Model %>) {' +
                '   <%- Model %>' +
                '       .findOneAndRemoveQ({' +
                '           _id: "" + req.param("id")' +
                '       })' +
                '       .then(function(model) {' +
                '           if (!model) {' +
                '               res.status(404).send("Not found.");' +
                '           } else {' +
                '               res.status(200).send(model);' +
                '           }' +
                '       })' +
                '       .catch(function(error) {' +
                '           res.status(500).send("Server error: " + error);' +
                '       });' +
                '})';
            _resolveForModel(req, res, func, Model);
        });

    app.use('/api', router);

    // req and res are used by the scope of the eval
    function _resolveForModel(req, res, func, Model) {
        func = _.template(func)({ Model : Model});
        container.resolve(eval(func));
    }
};
