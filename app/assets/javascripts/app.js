define([
    'angular',
    'filters',
    'services',
    'directives',
    'controllers',
    'angularRoute'
    ], function (angular, filters, services, directives, controllers) {

        'use strict';

        return angular.module('myApp', [
             'ngRoute',
             'myApp.filters',
             'myApp.services',
             'myApp.directives',
             'myApp.controllers'
       ]);

});
