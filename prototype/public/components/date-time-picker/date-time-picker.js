
/**
 * Module which exposes a directive outputting a Date picker form field.
 *
 * To show just a date picker field:
 *   <div wf-date-time-picker ng-model="stub.due"/>
 *
 * To show date picker field with a label:
 *  <div wf-date-time-picker label="Due date" ng-model="stub.due"/>
 *
 * To show date picker field with a label and help text:
 *   <div wf-date-time-picker label="Due something" help-text="true" ng-model="stub.due"/>
 *
 * To show date picker field with a label and custom help text:
 *   <div wf-date-time-picker label="Due something" help-text="custom help text" ng-model="stub.due"/>
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
        onDatePicked: '=',
        label: '@',
        helpText: '@'
      },
      templateUrl: '/assets/components/date-time-picker/date-time-picker.html',

      link: function(scope, element, attrs) {

        var idSuffix = (new Date()).getTime();

        scope.textInputId = 'wfDateTimePickerText' + idSuffix;
        scope.dropDownButtonId = 'wfDateTimePickerButton' + idSuffix;

        scope.dateTimePickerConfig = { dropdownSelector: '#' + scope.dropDownButtonId };


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
