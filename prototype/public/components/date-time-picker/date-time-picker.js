
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
import moment from 'moment';
import 'sugar';


angular.module('wfDateTimePicker', ['ui.bootstrap.datetimepicker'])

  .filter('wfDateTimePicker.formatDateTime', function() {
    return function(date, format) {
      if (!date || date === '') { return ''; }

      if (format == 'full') {
        format = 'dddd D MMM YYYY, HH:mm';
      } else {
        format = 'D MMM YYYY, HH:mm';
      }

      return moment(date).format(format);
    };
  })

  .directive('wfDateTimePicker', ['wfDateTimePicker.formatDateTimeFilter', '$log', function(formatDateTime, $log) {

    var pickerCount = 0;

    return {
      restrict: 'A',
      require: ['ngModel'],
      scope: {
        dateValue: '=ngModel',
        onDatePicked: '=',
        dateFormat: '@wfDateFormat',
        label: '@',
        helpText: '@',
        updateOn: '@wfUpdateOn',
        cancelOn: '@wfCancelOn',
        onCancel: '&wfOnCancel'
      },
      templateUrl: '/assets/components/date-time-picker/date-time-picker.html',

      controller: function($scope, $element, $attrs) {
        var idSuffix = pickerCount++;

        this.textInputId = 'wfDateTimePickerText' + idSuffix;
        this.dropDownButtonId = 'wfDateTimePickerButton' + idSuffix;
      },
      controllerAs: 'dateTimePicker',

      link: function(scope, element, attrs) {

        var onCancel = scope.onCancel;
        scope.onCancel = function() {
          scope.$apply(onCancel);
        };

        // handler sets text in date field when a date is selected from Drop Down picker
        scope.onDatePickedFromDropDown = function(newDate, oldDate) {
          scope.dateText = formatDateTime(newDate);
        };

      }
    };
  }])

  .directive('wfDateTimeField', ['wfDateTimePicker.formatDateTimeFilter', '$browser', '$log', function(formatDateTimeFilter, $browser, $log) {
    return {
      require: '^ngModel',
      scope: {
        textValue: '=ngModel',
        updateOn: '@wfUpdateOn',
        cancelOn: '@wfCancelOn',
        onCancel: '&wfOnCancel'
      },

      link: function(scope, elem, attrs, ngModel) {

        var cancelUpdate, commitUpdate,

        updateOn = scope.updateOn;

        if (!updateOn || updateOn === '') {
          updateOn = 'default';
        }

        // Slightly hacky, but it works..
        angular.element(elem[0].form).on('submit', function() {
          commitUpdate();
        });

        elem.off('input keydown change'); // reset default input event handlers
        elem.on('input keydown change blur', function(ev) {
          var key = ev.keyCode;

          if (updateOn == 'default' && (ev.type == 'keydown')) {

            // ignore:
            //    command            modifiers                   arrows
            if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) { return; }

            $browser.defer(function() {
              commitUpdate();
            });
          }

          if (scope.cancelOn == 'blur' && ev.type == 'blur') {
            cancelUpdate();
          }

          // cancel via escape
          if (ev.type == 'keydown' && key == 27) {
            cancelUpdate();
          }
        });

        commitUpdate = function() {
          scope.$apply(function() {
            ngModel.$setViewValue(elem.val());
          });
        };

        cancelUpdate = function() {
          ngModel.$setViewValue(formatDateTimeFilter(ngModel.$modelValue));
          ngModel.$render();

          if (angular.isFunction(scope.onCancel)) {
            scope.onCancel();
          }
        };


        ngModel.$render = function() {
          elem.val(ngModel.$viewValue || '');
        };

        ngModel.$parsers.push(function(value) {
          Date.setLocale('en-UK');

          try {
            // Uses sugar.js Date.create to parse natural date language, ie: "today"
            var due = moment(Date.create(value));

            if (due.isValid()) {
              return moment(due).toDate();
            }

            // TODO: setInvalid when invalid date specified. How do we handle errors?
          }
          catch (err) {
            $log.error('Error parsing date: ', err);
          }
        });

        ngModel.$formatters.push(formatDateTimeFilter);
      }
    };
  }]);
