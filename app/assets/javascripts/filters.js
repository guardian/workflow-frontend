define(['angular', 'services', 'moment'], function (angular, services, moment) {

    'use strict';
    var mod = angular.module('myApp.filters', []);
    mod.filter('formatDateTime',  function(){
        return function(date) {
            return moment(date).format("ddd D MMM, HH:MM");
        };
    });
    return mod;


});
