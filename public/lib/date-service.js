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

      /**
       * Retrieve a date range between two explicit dates.
       *
       * @returns {{from: Date, to: Date}}
       */
      createRange(from, until) {
        return {
          from: moment(from).toDate(),
          until: moment(until).toDate()
        };
      }

      /**
       * Retrieve a range from the start of a day, til the start of the next.
       *
       * @returns {{from: Date, to: Date}}
       */
      createDayRange(day) {
        var dayStart = moment(day).startOf('day');

        return this.createRange(dayStart, dayStart.clone().add(1, 'days'));
      }

      /**
       * Parses a date range using simple natural language strings
       * (eg: "tomorrow") and explicit standard date formatted date strings,
       * such as in YYYY-MM-DD.
       *
       * @returns {{from: Date, to: Date}}
       */
      parseRangeFromString(input, locationKey) {

        var now = wfLocaliseDateTimeFilter(this.now(), locationKey).clone();


        // Parses some natural language dates - doesn't use sugar as I'd like
        // to remove it as a dependency one day as it modifies the global Date object
        if (input == 'today') {
          return this.createDayRange(now);

        } else if (input == 'tomorrow') {
          return this.createDayRange(now.add(1, 'days'));

        } else if (input == 'weekend') {
          var weekendStart = now.day(6).startOf('day');

          return this.createRange(weekendStart, weekendStart.clone().add(2, 'days'));

        } else {
          var parsed = wfLocaliseDateTimeFilter(input, locationKey);

          if (!parsed.isValid()) {
            throw new Error('Could not parse date: ' + input);
          }

          return this.createDayRange(parsed);
        }
      }


      /**
       * Retrieves an Array of day starts for the localised week.
       *
       * @returns {Array.<Date>}
       */
      getDaysThisWeek(locationKey) {
        var today = wfLocaliseDateTimeFilter(this.now(), locationKey).startOf('day'),

        choices = [ today.toDate() ];

        for (var i = 1; i < 7; i++) {
          choices.push(today.clone().add('days', i).toDate());
        }

        return choices;
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
