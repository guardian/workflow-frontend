define([
    'angular',

    './filters',
    './services',
    './directives',
    './config',
    './controllers',

    './controllers/dashboard',
    './controllers/dashboard/content-item',
    './controllers/dashboard/dashboard',
    './controllers/dashboard/date-filter',
    './controllers/dashboard/stub-crud',

    './services/composer-service',
    './services/legal-states-service',
    './services/sections-service',

    'bootstrap',
    'angular-bootstrap',
    'moment',
    'angular-xeditable',
    'angular-route'

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
          'composerService',
          'legalStatesService',
          'sectionsService',
          'xeditable'
        ]);

        // App routes
        app.config(['$routeProvider', function($routeProvider) {
          $routeProvider.when('/dashboard', { templateUrl: 'dashboard', controller: 'DashboardCtrl' });
          $routeProvider.otherwise({redirectTo: '/dashboard'});
        }]);

        app.run(function(editableOptions) {
            editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
        });

        // delayed bootstrap for async page loading
        // angular.bootstrap(document, ['workflow']);
        angular.resumeBootstrap(['workflow']);

        return app;

});
