define(['angular', 'services', 'moment'], function (angular, services, moment) {
    'use strict';

    var mod = angular.module('workflow.filters', []);

    mod.filter('formatDateTime', function() {
        return function(date) {
            return moment(date).format("ddd D MMM, HH:MM");
        };
    });

    mod.filter('formatDate', function() {
        return function(date) {
            return moment(date).format("ddd D MMM");
        };
    });

    return mod;
});
