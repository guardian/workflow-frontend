
import angular from 'angular';

import 'lib/date-service';

angular.module('wfLocationPicker', ['wfDateService'])
  .controller('wfLocationPickerController', ['$scope', 'wfDateService', function($scope, dateService) {
    this.locations = dateService.timezones;
    this.locationKey = dateService.getCurrentTimezoneKey();

    $scope.$watch(
      angular.bind(this, function() { return this.locationKey; }),
      function(newValue, oldValue) {
        if (newValue !== oldValue) {
          dateService.setCurrentTimezone(newValue);
        }
      }
    );
  }]);
