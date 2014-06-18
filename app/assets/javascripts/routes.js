define(['angular', 'app'], function(angular, app) {

    'use strict';

    return app.config(['$routeProvider', function($routeProvider) {
             $routeProvider.when('/dashboard', {templateUrl: 'dashboard', controller: 'DashboardCtrl'});
             $routeProvider.otherwise({redirectTo: '/dashboard'});
          }]);
});
