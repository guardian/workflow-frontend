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

        return angular.module('myApp', [
             'ngRoute',
             'contentControllers',
             'myApp.filters',
             'myApp.services',
             'myApp.directives',
             'myApp.controllers'
       ]);

});
