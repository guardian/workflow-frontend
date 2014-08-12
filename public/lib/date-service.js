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

function getTimezoneForLocation(location) {
  if (!timezones[location]) {
    throw new Error('Unknown location: ' + location);
  }

  return timezones[location].tzKey;
}

function getTimezoneLocaleForLocation(location) {
  if (!timezones[location]) {
    throw new Error('Unknown location: ' + location);
  }

  return timezones[location].locale;
}

angular.module('wfDateService', ['wfLocationService'])
  .factory('wfDateParser', ['wfLocaliseDateTimeFilter', 'wfLocationService', function(wfLocaliseDateTimeFilter, wfLocationService) {

    class DateParser {

      /**
       * Parses a Date from an input string.
       *
       * @param {string} input string to parse.
       * @param {string} locationKey
       *
       * @return {Date}
       */
      parseDate(input, locationKey) {
        return wfLocaliseDateTimeFilter(
          this.normaliseDateString(input, locationKey),
          locationKey
        ).toDate();
      }

      /**
       * Normalises a date input string to YYYY-MM-DD HH:mm, accepting
       * natural language inputs such as "today", "tuesday next week 18:00"
       */
      normaliseDateString(input, locationKey) {
        locationKey = locationKey || wfLocationService.getLocationKey();

        var parsed;
        if (moment.isMoment(input)) {
          parsed = input;

        } else {
          // Parse input using sugar.js catering for natural language, ie: "next week"
          parsed = moment(Date.create(input, getTimezoneLocaleForLocation(locationKey)));
        }

        if (!parsed.isValid()) {
          throw new Error('Could not parse date: ' + input);
        }

        return parsed.format('YYYY-MM-DD HH:mm');
      }

      now() {
        return new Date();
      }

      parseRange(startDate, endDate, locationKey) {
        if (!locationKey && typeof(endDate) === 'string') {
          locationKey = endDate;
          endDate = undefined;
        }

        var now = wfLocaliseDateTimeFilter(this.now(), locationKey).clone();

        function createRange(momentFrom, momentUntil) {
          return {
            from: momentFrom.toDate(),
            until: momentUntil.toDate()
          };
        }

        function dayRange(day) {
          var dayStart = day.startOf('day');

          return createRange(dayStart, dayStart.clone().add(1, 'days'));
        }

        if (startDate == 'today') {
          return dayRange(now);

        } else if (startDate == 'tomorrow') {
          return dayRange(now.add(1, 'days'));

        } else if (startDate == 'weekend') {
          var weekendStart = now.day(6).startOf('day');

          return createRange(weekendStart, weekendStart.clone().add(2, 'days'));

        }

        // TODO: range for a specific day / date-range

        throw 'fail!';
      }
    }

    return new DateParser();

  }])

  /**
   * Localises a date input value to the specified value.
   * @return {moment}
   */
  .filter('wfLocaliseDateTime', ['wfLocationService', function(wfLocationService) {
    return function(dateValue, location) {
      if (!dateValue) { return dateValue; }

      location = location || wfLocationService.getLocationKey();

      // Must return a moment object, as JS date seems to lose timezone info.
      return moment.tz(dateValue, getTimezoneForLocation(location));
    };
  }])

  .filter('wfFormatDateTime', [function() {
    return function wfFormatDateTime(dateValue, dateFormat = 'ddd D MMM YYYY, HH:mm') {
      if (!dateValue) { return ''; }

      if (dateFormat == 'long') {
        dateFormat = 'dddd D MMMM YYYY, HH:mm z';
      }

      return moment(dateValue).format(dateFormat);
    };
  }]);
