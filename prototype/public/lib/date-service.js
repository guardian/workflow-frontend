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
import './location-service';


// Load in timezone data for moment
//   Only the necessary data required has been manually extracted from:
//   moment-timezone/data/packed/2014e.json
//   This will need to be manually updated when a new version of the data
//   is available in moment-timezone
//   TODO: extract latest data automatically in build process
moment.tz.load(timezoneData);


angular.module('wfDateService', ['wfLocationService'])
  .factory('wfDateService', ['wfLocationService', function(wfLocationService) {

    // maps locations to their timezone data
    var timezones = {
      'LON': {
        tzKey: 'Europe/London',
        locale: 'en-UK'
      },

      'NYC': {
        tzKey: 'America/New_York',
        locale: 'en-US'
      },

      'SYD': {
        tzKey: 'Australia/Sydney',
        locale: 'en-AU'
      }
    };

    class DateService {

      getTimezone(locationKey) {
        return timezones[wfLocationService.getLocationKey(locationKey)];
      }

      format(dateValue, dateFormat = 'ddd D MMM YYYY, HH:mm', locationKey = undefined) {
        if (!dateValue) { return ''; }

        if (dateFormat == 'long') {
          dateFormat = 'dddd D MMMM YYYY, HH:mm z';
        }

        var date = moment.tz(dateValue, this.getTimezone(locationKey).tzKey);

        return date.format(dateFormat);
      }

      /**
       * Parses a Date from an input string.
       *
       * @param {string} input string to parse.
       * @return {Date}
       */
      parse(input, locationKey) {
        var timezone = this.getTimezone(locationKey),

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
    }

    return new DateService();

  }])

  .filter('wfFormatDateTime', ['wfDateService', function(wfDateService) {
    return angular.bind(wfDateService, wfDateService.format);
  }]);
