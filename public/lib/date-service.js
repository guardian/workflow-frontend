
import moment from 'moment';
import angular from 'angular';

import './settings-service';

angular.module('wfDateService', ['wfSettingsService'])
  .factory('wfDateService', ['wfSettingsService', function(settingsService) {

    var self = {
      timezones: {
        'UK/LON': {
          title: 'London, UK',
          'DST': {
            name: 'British Summer Time',
            abbr: 'BST',
            offset: '+0100'
          },
          name: 'Greenwich Mean Time',
          abbr: 'GMT',
          offset: '+0000'
        },

        'USA/NY': {
          title: 'New York, USA',
          'DST': {
            name: 'Eastern Daylight Time',
            abbr: 'EDT',
            offset: '-0400'
          },
          name: 'Eastern Standard Time',
          abbr: 'EST',
          offset: '-0500'
        },

        'AUS/SYD': {
          title: 'Sydney, Australia',
          'DST': {
            name: 'Australian Eastern Daylight Time',
            abbr: 'AEDT',
            offset: '+1100'
          },
          name: 'Australian Eastern Standard Time',
          abbr: 'AEST',
          offset: '+1000'
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
        var date = moment(dateValue);
        date.zone(self.getCurrentTimezone().offset);

        return date.format(format);
      }
    };

    return self;

  }])

  .filter('formatDateTime', ['wfDateService', function(dateService) {
    return function(dateValue, format = 'ddd D MMM YYYY, HH:mm') {
      if (!dateValue) { return ''; }
      return dateService.format(dateValue, format) + ' ' + dateService.getCurrentTimezone().abbr;
    };
  }]);
