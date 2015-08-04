import angular from 'angular';
import moment from 'moment';

import './settings-service';


var SETTING_LOCATION_KEY = 'location',

    // map of available locations <city airport code>:<city metadata>
    locations = {
        'LON': { 'title': 'London' },
        'NYC': { 'title': 'New York' },
        'SYD': { 'title': 'Sydney' },
        'SFO': { 'title': 'San Francisco' }
    };


angular.module('wfLocationService', ['wfSettingsService'])
    .factory('wfLocationService', ['$rootScope', 'wfSettingsService', wfLocationServiceFactory]);


function wfLocationServiceFactory($rootScope, wfSettingsService) {
    class wfLocationService {

        constructor() {
            this.locations = locations;
            this.setCurrentLocation();
        }

        isValidLocation(locationKey) {
            return !!locations[locationKey];
        }

        getLocation(locationKey) {
            return locations[this.getLocationKey(locationKey)];
        }

        /**
         * Retrieves the user location from settings and/or validate the input locationKey.
         */
        getLocationKey(locationKey) {
            if (!locationKey) {
                return this.getCurrentLocationKey();
                // throw new Error('A locationKey is required');
            }

            if (!this.isValidLocation(locationKey)) {
                throw new Error('Invalid location: ' + locationKey);
            }

            return locationKey;
        }

        getCurrentLocation() {
            return this.getLocation(this.getCurrentLocationKey());
        }

        getCurrentLocationKey() {
            return wfSettingsService.get(SETTING_LOCATION_KEY);
        }

        setLocation(locationKey) {
            if (!this.isValidLocation(locationKey)) {
                throw new Error('Invalid location specified: ' + locationKey);
            }

            wfSettingsService.set(SETTING_LOCATION_KEY, locationKey);

            return this;
        }

        /**
         * Ensures that the current location is set on the rootScope via
         * the wfSettingsService. Guesses the location if none set.
         */
        setCurrentLocation() {
            if (!wfSettingsService.get(SETTING_LOCATION_KEY)) {
                this.setLocation(this.guessLocation());
            }
            return this;
        }

        /**
         * Guess the user's location from their local timezone.
         * Logic ported from composer / swells.
         */
        guessLocation(date) {
            var offset = moment(date).zone();
            // offset to be applied to now in minutes to get to UTC
            // I.E if now is UTC +0100 offset is -60
            // don't blame me.
            if (offset <= -480 && offset >= -660) {
                return 'SYD';
            } else if (offset <= 560 && offset >= 400) {
                return 'SFO';
            } else if (offset < 400 && offset >= 240) {
                return 'NYC';
            } else {
                return 'LON';
            }
        }
    }

    return new wfLocationService();
}
