define([
    'angular',

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
    './services/url-parser',
    './services/legal-states-service',

    './services/prodoffice-service',

    'lib/date-service',

    'angular-bootstrap',
    'angular-xeditable',
    'angular-route'

    ], function (angular, filters, services, directives, config, controllers) {

        'use strict';

        var app =  angular.module('workflow', [
          'ngRoute',
          'dashboardControllers',
          'wfDateService',
          'workflow.services',
          'workflow.directives',
          'workflow.config',
          'workflow.controllers',
          'composerService',
          'urlParser',
          'legalStatesService',
          'prodOfficeService',
          'xeditable'
        ]);

        // App routes
        app.config(['$routeProvider', function($routeProvider) {
          $routeProvider.when('/dashboard', { templateUrl: 'dashboard',
                                              controller: 'DashboardCtrl',
                                              reloadOnSearch: false
                                             });
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
