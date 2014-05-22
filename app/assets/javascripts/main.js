require.config({
    paths: {
        'angular': 'components/angular.min',
         'moment': 'components/moment.min',
        'angularRoute': 'components/angular-route'
    },
    shim: {
        'angular' : {'exports' : 'angular'},
        'angularRoute': ['angular']
    }
});

//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
window.name = "NG_DEFER_BOOTSTRAP!";

require(['angular', 'app', 'routes', 'moment'],
    function(angular, app, route) {
        'use strict';
        angular.element().ready(function() {
            angular.resumeBootstrap([app['name']]);
        });

    });
