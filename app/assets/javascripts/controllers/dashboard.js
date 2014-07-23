define([
    'angular',
    'components/date-time-picker/date-time-picker'
], function(
    angular
) {
    'use strict';

    return angular.module('dashboardControllers', ['wfDateTimePicker']);
});
