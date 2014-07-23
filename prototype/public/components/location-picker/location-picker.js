/**
 * Controller for location picker in top-toolbar.
 */

import angular from 'angular';

import 'lib/date-service';

import './location-picker.css!';

angular.module('wfLocationPicker', ['wfDateService'])
  .controller('wfLocationPickerController', ['$scope', '$timeout', 'wfDateService', function($scope, $timeout, dateService) {
    this.locations = dateService.timezones;
    this.locationKey = dateService.getCurrentTimezoneKey();

    // Setup timer to update current time every minute
    var timer;

    function msTilNextMinute() {
      return 60000 - (Date.now() % 60000);
    }

    function incrementTime() {
      this.now = Date.now();

      timer = $timeout(angular.bind(this, incrementTime), msTilNextMinute());
    }

    // initialise timer
    incrementTime.call(this);

    // Cancel timer when scope is destroyed
    $scope.$on('$destroy', function() {
      if (timer) {
        $timeout.cancel(timer);
      }
    });


    // Watch for changes to selected location
    $scope.$watch(
      angular.bind(this, function() { return this.locationKey; }),
      function(newValue, oldValue) {
        if (newValue !== oldValue) {
          dateService.setCurrentTimezone(newValue);
        }
      }
    );
  }]);
