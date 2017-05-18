/**
 * Date service providing date formatting and parsing functionality taking
 * timezone settings into account.
 */

// 3rd party dependencies
import angular from 'angular';

// moment-timezone should require moment as dependency
import moment from 'moment-timezone';
import timezoneData from './date-service/timezone-data.json';

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
    },

    'SFO': {
        tzKey: 'America/Los_Angeles',
        locale: 'en-US'
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
    .factory('wfDateParser', ['wfLocationService', 'wfFormatDateTimeFilter',
        function (wfLocationService, wfFormatDateTimeFilter) {


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
            return this.localiseDateTime(
                this.normaliseDateString(input, locationKey),
                locationKey
            ).toDate();
        }

        /**
         * Normalises a date input string to YYYY-MM-DD HH:mm, accepting
         * natural language inputs such as "today", "tuesday next week 18:00"
         */
        normaliseDateString(input, locationKey) {
            locationKey = locationKey || wfLocationService.getCurrentLocationKey();

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

            var now = this.localiseDateTime(this.now(), locationKey).clone();

            if (!input) {
                return {};
            }
            // Parses some natural language dates - doesn't use sugar as I'd like
            // to remove it as a dependency one day as it modifies the global Date object
            if (input == 'today') {
                const migrationDate = moment.tz("2017-04-25 11:00", "Europe/London");
                const fixedDate = moment.tz("2017-04-26 11:00", "Europe/London");
                if (now > fixedDate) {
                    return this.createDayRange(now);
                } else {
                    var dayStart = migrationDate;

                    return this.createRange(dayStart, dayStart.clone().add(1, 'days'));
                }
            } else if (input == 'tomorrow') {
                return this.createDayRange(now.add(1, 'days'));

            } else if (input == 'weekend') {
                var weekendStart = now.day(6).startOf('day');

                return this.createRange(weekendStart, weekendStart.clone().add(2, 'days'));

            } else if (input == 'yesterday') {

                return this.createDayRange(now.subtract(1, 'days'));

            } else if (input === 'last24') {

                return this.createRange(now.clone().subtract(24, 'hours'), now);

            } else if (input === 'last48') {

                return this.createRange(now.clone().subtract(48, 'hours'), now);

            } else {
                var parsed = this.localiseDateTime(input, locationKey);

                if (!parsed.isValid()) {
                    throw new Error('Could not parse date: ' + input);
                }

                return this.createDayRange(parsed);
            }
        }

        /**
         * Retrieve either string representation of 'day', or day object
         *
         * @returns {String, or <Date>}
         */
        parseQueryString(date) {
            if (!date) return undefined;
            if (date === 'today' || date === 'tomorrow' || date === 'weekend') {
                return date;
            }
            else if (moment(date, ["YYYY-MM-DD"]).isValid()) {
                return moment(date, ["YYYY-MM-DD"]);
            }
        }

        /**
         * Formats date to string if passed a date object, otherwise return what is passsed
         *
         * @returns {String, or <Date>}
         */
        setQueryString(date) {
            if (!date) return undefined;
            var dateFormat = wfFormatDateTimeFilter(date, "YYYY-MM-DD");
            if (dateFormat !== 'Invalid date') {
                return dateFormat;
            }
            else return date;

        }

        /**
         * Retrieves an Array of day starts for the localised week.
         *
         * @returns {Array.<Date>}
         */
        getDaysThisWeek(locationKey) {
            var today = this.localiseDateTime(this.now(), locationKey).startOf('day'),

                choices = [ moment(today.toDate()) ];

            for (var i = 1; i < 7; i++) {
                choices.push(moment(today.clone().add(i, 'days').toDate()));
            }

            return choices;
        }


        localiseDateTime(dateValue, location) {
            location = location || wfLocationService.getCurrentLocationKey();

            return moment.tz(dateValue, getTimezoneForLocation(location));
        }

    }

    return new DateParser();

        }])

    /**
     * Localises a date input value to the specified value.
     * Stateless and requires a "location" to be passed to filter.
     * @return {moment}
     */
    .filter('wfLocaliseDateTime', [function () {
        return function (dateValue, location) {
            if (!dateValue) {
                return dateValue;
            }

            if (!location) {
                console.warn('DEPRECATED. Specifying a location parameter is required');
                return dateValue;
            }

            // Must return a moment object, as JS date seems to lose timezone info.
            return moment.tz(dateValue, getTimezoneForLocation(location));
        };
    }])

    .filter('wfFormatDateTime', [function () {
        return function wfFormatDateTime(dateValue, dateFormat = 'ddd D MMM YYYY, HH:mm') {
            if (!dateValue) {
                return '';
            }

            if (dateFormat == 'long') {
                dateFormat = 'dddd D MMMM YYYY, HH:mm z';
            }

            if (dateFormat == 'ISO8601') {
                return dateValue.toISOString();
            }

            return moment(dateValue).format(dateFormat);
        };
    }]);
