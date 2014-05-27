define([
    'angular',
    'filters',
    'services',
    'directives',
    'controllers',
    'controllers/content',
    'controllers/content/stubs',
    'angularRoute'
    ], function (angular, filters, services, directives, controllers) {

        'use strict';

        return angular.module('workflow', [
            'ngRoute',
            'contentControllers',
            'workflow.filters',
            'workflow.services',
            'workflow.directives',
            'workflow.controllers'
        ]);

});
