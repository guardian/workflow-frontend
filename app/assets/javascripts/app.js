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
    './services/legal-states-service',

    './services/prodoffice-service',

    'lib/date-service',
    'lib/filters-service',
    'lib/analytics',

    'angular-bootstrap',
    'angular-xeditable',
    'angular-route',
    'angular-animate/angular-animate.min'

    ], function (angular, filters, services, directives, config, controllers) {

        'use strict';

        var app =  angular.module('workflow', [
          'ngRoute',
          'ngAnimate',
          'dashboardControllers',
          'wfDateService',
          'wfAnalytics',
          'workflow.services',
          'workflow.directives',
          'workflow.config',
          'workflow.controllers',
          'composerService',
          'legalStatesService',
          'prodOfficeService',
          'wfFiltersService',
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
