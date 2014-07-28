define([
    'angular',
    'components/location-picker/location-picker',
    'components/date-time-picker/date-time-picker'
], function(
    angular
) {
    'use strict';

    return angular.module('dashboardControllers', ['wfLocationPicker', 'wfDateTimePicker']);
});
