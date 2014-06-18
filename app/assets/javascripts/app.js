define([
    'angular',
    'filters',
    'services',
    'directives',
    'config',
    'controllers',
    'xeditable',

    'controllers/dashboard',
    'controllers/dashboard/content-item',
    'controllers/dashboard/dashboard',
    'controllers/dashboard/date-filter',
    'controllers/dashboard/stub-crud',

    'services/sections-service',

    'angularRoute'
    ], function (angular, filters, services, directives, config, controllers) {

        'use strict';

        var app =  angular.module('workflow', [
            'ngRoute',
            'dashboardControllers',
            'workflow.filters',
            'workflow.services',
            'workflow.directives',
            'workflow.config',
            'workflow.controllers',
            'sectionsService',
            'xeditable'
        ]);
        app.run(function(editableOptions) {
            editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
        });
        return app;

});
