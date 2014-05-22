define(['angular', 'services'], function (angular, services) {

    'use strict';

    angular.module('myApp.filters', []).
        filter('interpolate', ['version', function(version) {
            return function(text) {
                return String(text).replace(/\%VERSION\%/mg, version);
            };
        }]);

});
