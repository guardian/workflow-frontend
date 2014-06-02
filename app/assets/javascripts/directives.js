define(['angular', 'services'], function(angular, services) {

    'use strict';

    var mod = angular.module('workflow.directives', []);

    mod.directive('appVersion', ['version', function(version) {
        return function(scope, elm, attrs) {
            elm.text(version);
        };
    }]);

    mod.directive('commonFilters', function () {
        return {
            templateUrl: '/assets/common-filters.html'
        };
    });

});
