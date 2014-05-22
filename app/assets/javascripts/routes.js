define(['angular', 'app'], function(angular, app) {

    'use strict';

    return app.config(['$routeProvider', function($routeProvider) {
                 $routeProvider.when('/dashboard', {templateUrl: 'dashboard'});
                 $routeProvider.otherwise({redirectTo: '/dashboard'});
               }]);
});
