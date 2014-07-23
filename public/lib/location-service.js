
import angular from 'angular';

import './settings-service';

angular.module('wfLocationService', ['wfSettingsService'])
  .factory('wfLocationService', ['wfSettingsService', function(wfSettingsService) {

    var SETTING_LOCATION_KEY = 'location',

    // map of available locations <city airport code>:<city metadata>
    locations = {
      'LON': { 'title': 'London' },
      'NYC': { 'title': 'New York' },
      'SYD': { 'title': 'Sydney' }
    };

    class LocationService {

      constructor() {
        this.locations = locations;
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
        locationKey = locationKey || wfSettingsService.get(SETTING_LOCATION_KEY);

        if (!this.isValidLocation(locationKey)) {
          throw new Error('Invalid location: ' + locationKey);
        }

        return locationKey;
      }

      setLocation(locationKey) {
        if (!this.isValidLocation(locationKey)) {
          throw new Error('Invalid location specified: ' + locationKey);
        }

        wfSettingsService.set(SETTING_LOCATION_KEY, locationKey);
        return this;
      }
    }

    return new LocationService();
  }]);
