/**
 * Date service providing date formatting and parsing functionality taking
 * timezone settings into account.
 */

import angular from 'angular';

import moment from 'moment';
import 'moment-timezone/moment-timezone'; // moment-timezone extends the moment object
import timezoneData from 'moment-timezone/data/packed/latest.json!';

import './settings-service';

// Load in timezone data for moment
moment.tz.load(timezoneData);

angular.module('wfDateService', ['wfSettingsService'])
  .factory('wfDateService', ['wfSettingsService', function(settingsService) {

    var self = {

      // List of available timezones; keys are Airport Codes
      timezones: {
        'LON': {
          title: 'London',
          tzKey: 'Europe/London'
        },

        'NYC': {
          title: 'New York',
          tzKey: 'America/New_York'
        },

        'SYD': {
          title: 'Sydney',
          tzKey: 'Australia/Sydney'
        }
      },

      getCurrentTimezoneKey: function() {
        return settingsService.get('timezone');
      },

      getCurrentTimezone: function() {
        var timezoneKey = settingsService.get('timezone'),
            timezone = self.timezones[timezoneKey];

        if (!timezone) {
          throw new Error('Invalid timezone set: ' + timezoneKey);
        }

        return timezone;
      },

      setCurrentTimezone: function(key) {
        if (!self.timezones[key]) {
          throw new Error('Invalid timezone specified: ' + key);
        }

        settingsService.set('timezone', key);
        return this;
      },

      format: function(dateValue, format) {
        var date = moment.tz(dateValue, self.getCurrentTimezone().tzKey);

        return date.format(format);
      }
    };

    return self;

  }])

  .filter('formatDateTime', ['wfDateService', function(dateService) {
    return function(dateValue, format = 'ddd D MMM YYYY, HH:mm') {
      if (!dateValue) { return ''; }
      if (format == 'long') {
        format = 'dddd D MMMM YYYY, HH:mm z';
      }
      return dateService.format(dateValue, format);
    };
  }]);
