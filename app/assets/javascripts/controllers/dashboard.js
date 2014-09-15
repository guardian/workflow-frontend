define([
    'angular',
    'components/location-picker/location-picker',
    'components/date-time-picker/date-time-picker',
    'lib/content-service',
    'lib/presence'
], function(
    angular
) {
    'use strict';

    return angular.module('dashboardControllers', ['wfLocationPicker', 'wfDateTimePicker', 'wfContentService', 'wfPresenceService']);
});
