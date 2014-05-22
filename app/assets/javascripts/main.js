require.config({
    paths: {
        'angular': 'components/angular.min',
        'angularRoute': 'components/angular-route'
    },
    shim: {
        'angular' : {'exports' : 'angular'},
        'angularRoute': ['angular']
    }
});

//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
window.name = "NG_DEFER_BOOTSTRAP!";

require(['angular', 'app', 'routes'],
    function(angular, app, routes) {
        'use strict';
        angular.element().ready(function() {
            angular.resumeBootstrap([app['name']]);
        });

    });
