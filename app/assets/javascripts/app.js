define([
    'angular',
    'filters',
    'services',
    'directives',
    'config',
    'controllers',

    'controllers/dashboard',
    'controllers/dashboard/content',
    'controllers/dashboard/date-filter',

    'controllers/stubs',
    'controllers/stubs/stubs',
    'controllers/stubs/modal',
    'controllers/stubs/composerModal',

    'angularRoute'
    ], function (angular, filters, services, directives, config, controllers) {

        'use strict';

        return angular.module('workflow', [
            'ngRoute',
            'dashboardControllers',
            'stubsControllers',
            'workflow.filters',
            'workflow.services',
            'workflow.directives',
            'workflow.config',
            'workflow.controllers'
        ]);

});
