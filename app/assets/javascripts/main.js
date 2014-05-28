require.config({
    paths: {
        'angular': 'components/angular.min',
        'moment': 'components/moment.min',
        'angularRoute': 'components/angular-route',
        'uiBootstrap': 'components/ui-bootstrap-tpls-0.11.0.min',
        'sugar': 'components/sugar.min'
    },
    shim: {
        'angular' : {'exports' : 'angular'},
        'angularRoute': ['angular'],
        'uiBootstrap': ['angular']
    }
});

//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
window.name = "NG_DEFER_BOOTSTRAP!";

require(['angular', 'app', 'routes', 'moment', 'uiBootstrap', 'sugar'],
    function(angular, app, route) {
        'use strict';
        angular.element().ready(function() {
            angular.resumeBootstrap([app['name']]);
        });

    });
