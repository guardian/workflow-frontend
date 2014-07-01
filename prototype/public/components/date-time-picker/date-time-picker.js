
/**
 * Module which exposes a directive outputting a Date picker form field.
 *
 * <div wf-date-time-picker ng-model="stub.due"></div>
 */

import angular from 'angular';

import 'angular-bootstrap-datetimepicker';
import 'moment';
import 'sugar';


angular.module('wfDateTimePicker', ['ui.bootstrap.datetimepicker'])

  .filter('wfDateTimePicker.formatDateTime', function() {
    return function(date, format) {
      if (date === undefined) { return ''; }

      if (format == 'full') {
        format = 'dddd D MMM YYYY, HH:mm';
      } else {
        format = 'D MMM YYYY, HH:mm';
      }

      return moment(date).format(format);
    };
  })

  .directive('wfDateTimePicker', ['wfDateTimePicker.formatDateTimeFilter', function(formatDateTime) {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        dateValue: '=ngModel',
        onDatePicked: '='
      },
      templateUrl: '/assets/components/date-time-picker/date-time-picker.html',

      link: function(scope, element, attrs) {

        // Set dateText field content on init
        if (scope.dateValue) {
          scope.dateText = formatDateTime(scope.dateValue);
        }

        // Watch changes to dateText input field
        scope.$watch('dateText', function() {
          if (!scope.dateText) { // set to none when empty
            scope.dateValue = null;
            return;
          }

          var due;
          try {
            // Uses sugar.js Date.create to parse natural date language, ie: "today"
            due = Date.create(scope.dateText).toISOString();
            scope.dateValue = due;
          }
          catch (e) {
            // delete scope.dateValue;
            scope.dateValue = null;
          }
        });

        // handler sets text in date field when a date is selected from Drop Down picker
        scope.onDatePickedFromDropDown = function(newDate, oldDate) {
          scope.dateText = formatDateTime(newDate);
        };

      }
    };
  }]);
