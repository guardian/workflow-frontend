define(['angular', 'moment'], function (angular, moment) {
    'use strict';

    var mod = angular.module('workflow.filters', []);

    mod.filter('formatDateTime', function() {
        return function(date) {
            if(date === undefined) return "";
            return moment(date).format("dddd D MMM YYYY, HH:mm");
        };
    });

    mod.filter('formatDate', function() {
        return function(date) {
            if(date === undefined) return "";
            return moment(date).format("ddd D MMM");
        };
    });

    return mod;
});
