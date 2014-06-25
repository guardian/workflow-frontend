define(['angular', 'moment'], function(angular, moment) {

    'use strict';

    var mod = angular.module('workflow.directives', []);

    mod.directive('appVersion', ['version', function(version) {
        return function(scope, elm, attrs) {
            elm.text(version);
        };
    }]);

    mod.directive('datetime', function() {
        return {
            restrict : 'A',
            require: 'ngModel',
            link: function(scope, element, attr, ngModel) {
                function format(date) {
                    if(date === undefined) return "";
                    return moment(date).format("ddd MMMM Do YYYY, hh:mm");
                }
                ngModel.$formatters.push(format);
            }
        };
    });

});
