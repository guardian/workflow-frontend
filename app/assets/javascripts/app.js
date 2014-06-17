define([
    'angular',
    'filters',
    'services',
    'directives',
    'config',
    'controllers',

    'controllers/dashboard',
    'controllers/dashboard/content-item',
    'controllers/dashboard/dashboard',
    'controllers/dashboard/date-filter',
    'controllers/dashboard/stub-crud',

    'services/sections-service',
    'services/composer-service',

    'angularRoute'
    ], function (angular, filters, services, directives, config, controllers) {

        'use strict';

        return angular.module('workflow', [
            'ngRoute',
            'dashboardControllers',
            'workflow.filters',
            'workflow.services',
            'workflow.directives',
            'workflow.config',
            'workflow.controllers',
            'sectionsService',
            'composerService'
        ]);

});
