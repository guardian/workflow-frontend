define([
    'angular',
    'filters',
    'services',
    'directives',
    'controllers',
    'controllers/dashboard',
    'controllers/dashboard/stubs',
    'controllers/dashboard/stubsmodal',
    'controllers/dashboard/content',
    'angularRoute'
    ], function (angular, filters, services, directives, controllers) {

        'use strict';

        return angular.module('workflow', [
            'ngRoute',
            'dashboardControllers',
            'workflow.filters',
            'workflow.services',
            'workflow.directives',
            'workflow.controllers'
        ]);

});
