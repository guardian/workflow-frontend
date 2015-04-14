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

// 3rd party dependencies
import angular from 'angular';
import moment from 'moment';
import 'angular-bootstrap-datetimepicker';
import 'angular-bootstrap-datetimepicker/src/css/datetimepicker.css!';

// local dependencies
import 'lib/date-service';

// component dependencies
import './date-time-picker.css!';


angular.module('wfDateTimePicker', ['ui.bootstrap.datetimepicker', 'wfDateService'])

    // Add a listener to ui.bootstrap.datetimepicker to reset the picker to day view
    // Written using the second example from here http://angular-tips.com/blog/2013/09/experiment-decorating-directives/
    .config(function dateTimePickerMonkeyPatch($provide) {
        $provide.decorator('datetimepickerDirective', function($delegate) {
            var directive = $delegate[0];

            var link = directive.link;

            function getUTCTimeNow() {
                var timeNow = new Date();
                return timeNow.getTime() - (timeNow.getTimezoneOffset() * 60000);
            }

            directive.compile = function() {
                return function(scope, element, attrs) {
                    // get old link functionality
                    link.apply(this, arguments);
                    // add extra listener to link
                    scope.$on('resetPicker', function () {
                        scope.changeView('day', getUTCTimeNow());
                    })
                }
            };
            return $delegate
        });
    })

    .directive('wfDateTimePicker', ['$log', '$timeout', 'wfDateParser', 'wfLocaliseDateTimeFilter', 'wfFormatDateTimeFilter', function ($log, $timeout, wfDateParser, wfLocaliseDateTimeFilter, wfFormatDateTimeFilter) {

        var pickerCount = 0;

        return {
            restrict: 'A',
            require: '^ngModel',
            scope: {
                dateValue: '=ngModel',
                dateFormat: '@wfDateFormat',
                label: '@',
                helpText: '@',
                small: '@wfSmall',
                updateOn: '@wfUpdateOn',
                cancelOn: '@wfCancelOn',
                onCancel: '&wfOnCancel',
                onUpdate: '&wfOnUpdate',
                inToolbar: '@wfInToolbar'
            },
            templateUrl: '/assets/components/date-time-picker/date-time-picker.html',

            controller: function ($scope, $element, $attrs) {
                var idSuffix = pickerCount++;

                this.textInputId = 'wfDateTimePickerText' + idSuffix;
                this.dropDownButtonId = 'wfDateTimePickerButton' + idSuffix;

                // indication of default date (currently this time tomorrow) <<<<< TODO: Think about best default (or whether this field should be compulsory)
                if ($scope.inToolbar) {
                    var tomorrow = moment(moment()).add(1, 'days');
                    $scope.placeholderText = wfFormatDateTimeFilter(wfLocaliseDateTimeFilter(tomorrow), 'D MMM YYYY HH:mm');
                }


                // Watch for model updates to dateValue, and update datePicker when changes
                $scope.$watch('dateValue', function (newValue) {
                    if ($scope.datePickerValue != newValue) {

                        // Date picker will support a localised date when passed a moment object
                        $scope.datePickerValue = wfDateParser.normaliseDateString(wfLocaliseDateTimeFilter(newValue));
                    }
                });


                this.onDatePicked = function (newValue) {
                    $scope.dateValue = wfDateParser.parseDate(newValue);


                    // Delay running onUpdate so digest can run and update dateValue properly.
                    $timeout(function () {
                        $scope.onUpdate($scope.dateValue);
                    }, 0);
                };
            },
            controllerAs: 'dateTimePicker'

        };
    }])

    .directive('wfDateTimeField', ['wfFormatDateTimeFilter', 'wfLocaliseDateTimeFilter', 'wfDateParser', '$browser', '$log', function (wfFormatDateTimeFilter, wfLocaliseDateTimeFilter, wfDateParser, $browser, $log) {

        // Utility methods
        function isArrowKey(keyCode) {
            return 37 <= keyCode && keyCode <= 40;
        }

        function isModifierKey(keyCode) {
            return 15 < keyCode && keyCode < 19;
        }

        // Constants
        var KEYCODE_COMMAND = 91;
        var KEYCODE_ESCAPE = 27;

        return {
            require: '^ngModel',
            scope: {
                textValue: '=ngModel',
                updateOn: '@wfUpdateOn',
                cancelOn: '@wfCancelOn',
                onCancel: '&wfOnCancel',
                onUpdate: '&wfOnUpdate'
            },

            link: function (scope, elem, attrs, ngModel) {

                var updateOn = scope.updateOn || 'default';

                function formatText(input) {
                    return wfFormatDateTimeFilter(wfLocaliseDateTimeFilter(input), 'D MMM YYYY HH:mm');
                }

                function commitUpdate() {
                    scope.$apply(function () {
                        ngModel.$setViewValue(elem.val());
                        scope.onUpdate(ngModel.$modelValue);
                    });
                }

                function cancelUpdate() {
                    scope.$apply(function () {
                        if (hasChanged()) { // reset to model value
                            ngModel.$setViewValue(formatText(ngModel.$modelValue));
                            ngModel.$render();
                        }

                        scope.onCancel();
                    });
                }

                function parseDate(input) {
                    if (!input || input === '') {
                        return null;
                    }

                    try {
                        return wfDateParser.parseDate(input);

                        // TODO: setInvalid when invalid date specified. How do we handle errors?
                    }
                    catch (err) {
                        if (updateOn != 'default') {
                            $log.error('Error parsing date: ', err);

                            // FIXME: report error (for sentry) but do not throw it.
                            //        previous logic ignores error, needs to be handled properly.
                            if (window.onerror) { window.onerror(err); }
                        }
                    }
                }

                function hasChanged() {
                    return !moment(ngModel.$modelValue).isSame(parseDate(elem.val()));
                }


                // Setup input handlers
                // Slightly hacky, but it works..
                angular.element(elem[0].form).on('submit', commitUpdate);

                // Set event handlers on the input element
                elem.off('input keydown change'); // reset default angular input event handlers
                elem.on('input keydown change blur', function (ev) {
                    var key = ev.keyCode,
                        type = ev.type;

                    if (type == 'keydown' && updateOn == 'default') {

                        // ignore the following keys on input
                        if ((key === KEYCODE_COMMAND) || isModifierKey(key) || isArrowKey(key)) {
                            return;
                        }

                        $browser.defer(commitUpdate);
                    }

                    if (type == 'blur' && scope.cancelOn == 'blur') {
                        cancelUpdate();
                    }

                    // cancel via escape
                    if (type == 'keydown' && key == KEYCODE_ESCAPE) {
                        cancelUpdate();
                    }
                });

                ngModel.$render = function () {
                    elem.val(ngModel.$viewValue || '');
                };

                ngModel.$parsers.push(parseDate);

                ngModel.$formatters.push(formatText);

                // Watch for changes to timezone
                scope.$on('location:change', function () {
                    ngModel.$setViewValue(formatText(ngModel.$modelValue));
                    ngModel.$render();
                });

            }
        };
    }]);
