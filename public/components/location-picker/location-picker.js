/**
 * Controller for location picker in top-toolbar.
 *
 * Broadcasts a "location:change" event when a new location is selected.
 */

import angular from 'angular';

import 'lib/date-service';
import 'lib/location-service';


angular.module('wfLocationPicker', ['wfLocationService', 'wfDateService'])
    .controller('wfLocationPickerController', ['$scope', '$rootScope', '$timeout', 'wfLocationService', function ($scope, $rootScope, $timeout, wfLocationService) {
        this.locations = wfLocationService.locations;
        this.locationKey = wfLocationService.getLocationKey();

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
        $scope.$on('$destroy', function () {
            if (timer) {
                $timeout.cancel(timer);
            }
        });


        // Watch for changes to selected location
        $scope.$watch(
            angular.bind(this, function () {
                return this.locationKey;
            }),
            function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    wfLocationService.setLocation(newValue);
                    $rootScope.$broadcast('location:change', newValue, oldValue);
                }
            }
        );
    }]);
