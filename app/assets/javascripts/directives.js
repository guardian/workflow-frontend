define(['angular', 'services'], function(angular, services) {

    'use strict';

    angular.module('workflow.directives', []).
        directive('appVersion', ['version', function(version) {
            return function(scope, elm, attrs) {
                elm.text(version);
            };
        }]);

});
