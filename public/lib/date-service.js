/**
 * Date service providing date formatting and parsing functionality taking
 * timezone settings into account.
 */

// 3rd party dependencies
import angular from 'angular';

// moment-timezone should require moment as dependency
import moment from 'moment-timezone/builds/moment-timezone.min';
import timezoneData from './date-service/timezone-data.json!';

import 'sugar';

// local libs
import './settings-service';


// Load in timezone data for moment
//   Only the necessary data required has been manually extracted from:
//   moment-timezone/data/packed/2014e.json
//   This will need to be manually updated when a new version of the data
//   is available in moment-timezone
//   TODO: extract latest data automatically in build process
moment.tz.load(timezoneData);


angular.module('wfDateService', ['wfSettingsService'])
  .factory('wfDateService', ['wfSettingsService', function(wfSettingsService) {

    var wfDateService = {

      // List of available timezones; keys are Airport Codes
      timezones: {
        'LON': {
          title: 'London',
          tzKey: 'Europe/London',
          locale: 'en-UK'
        },

        'NYC': {
          title: 'New York',
          tzKey: 'America/New_York',
          locale: 'en-US'
        },

        'SYD': {
          title: 'Sydney',
          tzKey: 'Australia/Sydney',
          locale: 'en-AU'
        }
      },

      getTimezone: function(locationKey) {
        locationKey = locationKey || wfSettingsService.get('timezone');
        return wfDateService.timezones[locationKey];
      },

      getCurrentTimezoneKey: function() {
        return wfSettingsService.get('timezone');
      },

      getCurrentTimezone: function() {
        var timezoneKey = wfSettingsService.get('timezone'),
            timezone = wfDateService.timezones[timezoneKey];

        if (!timezone) {
          throw new Error('Invalid timezone set: ' + timezoneKey);
        }

        return timezone;
      },

      setCurrentTimezone: function(key) {
        if (!wfDateService.timezones[key]) {
          throw new Error('Invalid timezone specified: ' + key);
        }

        wfSettingsService.set('timezone', key);
        return this;
      },

      format: function(dateValue, format = 'ddd D MMM YYYY, HH:mm', locationKey = undefined) {
        if (!dateValue) { return ''; }

        if (format == 'long') {
          format = 'dddd D MMMM YYYY, HH:mm z';
        }

        var date = moment.tz(dateValue, wfDateService.getTimezone(locationKey).tzKey);

        return date.format(format);
      },

      /**
       * Parses a Date from an input string.
       *
       * @param {string} input string to parse.
       * @return {Date}
       */
      parse: function(input, locationKey) {
        var timezone = wfDateService.getTimezone(locationKey),

        locale = timezone.locale,

        // Use sugar.js to parse the input string catering for natural language, ie: "next week"
        parsed = moment(Date.create(input, locale)),
        parsedText;

        if (!parsed.isValid()) {
          throw new Error('Could not parse date: ' + input);
        }

        // Convert back to a string without timezone data - Sugar.js cannot
        // parse dates properly in another timezone, so collect parsed date as
        // input by user without a timezone, then use moment.tz to convert
        // date properly to set timezone.
        parsedText = parsed.format('YYYY-MM-DDTHH:mm');


        return moment.tz(parsedText, timezone.tzKey).toDate();
      }
    };

    return wfDateService;

  }])

  .filter('wfFormatDateTime', ['wfDateService', function(dateService) {
    return dateService.format;
  }]);
