/**
 * Directive for location picker allows selecting a location from location service.
 *
 * Broadcasts a "location:change" event when a new location is selected.
 */

import angular from 'angular';

import 'lib/date-service';
import 'lib/location-service';

import 'components/icons/icons';

var CLASS_LOCATION_PICKER = 'location-picker',
    CLASS_LOCATION_PICKER_OPEN = 'location-picker--open';

angular.module('wfLocationPicker', ['wfLocationService', 'wfDateService', 'wfIcons'])
    .directive('wfLocationPicker', [wfLocationPickerDirectiveFactory]);


function wfLocationPickerDirectiveFactory() {
    return {
        restrict: 'E',
        scope: true,
        templateUrl: '/assets/components/location-picker/location-picker.html',
        controller: ['$scope', '$rootScope', '$timeout', 'wfLocationService', wfLocationPickerController],
        controllerAs: 'ctrl',
        link: function($scope, $elem, $attrs) {
            $attrs.$addClass(CLASS_LOCATION_PICKER);

            $scope.$watch('isOpen', function(newValue) {
                if (newValue) {
                    $attrs.$addClass(CLASS_LOCATION_PICKER_OPEN);
                } else {
                    $attrs.$removeClass(CLASS_LOCATION_PICKER_OPEN);
                }
            });
        }
    };
}


function wfLocationPickerController ($scope, $rootScope, $timeout, wfLocationService) {
    $scope.locations = wfLocationService.locations;

    // Setup timer to update current time every minute
    var timer;

    function msTilNextMinute() {
        return 60000 - (Date.now() % 60000);
    }

    function incrementTime() {
        $scope.now = Date.now();
        timer = $timeout(incrementTime, msTilNextMinute());
    }

    // initialise timer
    incrementTime();

    // Cancel timer when scope is destroyed
    $scope.$on('$destroy', function () {
        if (timer) {
            $timeout.cancel(timer);
        }
    });

    this.setLocation = function(newLocation) {
        wfLocationService.setLocation(newLocation);
        $rootScope.$broadcast('location:change', newLocation);
        this.toggleOpen();
    };

    this.getLocation = function(locationKey) {
        return wfLocationService.getLocation(locationKey);
    }

    this.toggleOpen = function() {
        $scope.isOpen = !$scope.isOpen;
    };
}
