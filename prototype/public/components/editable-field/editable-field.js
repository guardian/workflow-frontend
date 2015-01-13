/**
 * Module containing directives for an editable field.
 */

import angular from 'angular';

angular.module('wfEditableField', [])
    .directive('wfEditable', ['$timeout', wfEditableDirectiveFactory])
    .directive('wfEditableField', ['$timeout', wfEditableTextFieldDirectiveFactory]);


var KEYCODE_ESC = 27,
    KEYCODE_CTRL = 17,
    KEYCODE_COMMAND = 224,
    KEYCODE_ENTER = 13;


function wfEditableDirectiveFactory($timeout) {

    return {
        restrict: 'E',
        templateUrl: '/assets/components/editable-field/editable-field.html',
        scope: {
            modelValue: '=wfEditableModel',
            onEditableUpdate: '&wfEditableOnUpdate',
            onEditableCancel: '&wfEditableOnCancel'
        },
        transclude: true,

        controllerAs: 'editableController',
        controller: function wfEditableFieldController($scope, $element, $attrs) {

            // one time bind of wfEditableType
            $scope.editableType = $attrs.wfEditableType;

            this.setEditMode = (newMode) => $scope.isEditMode = !!newMode;

            var nextEditMode, debounceTimeout;
            /**
             * Debounce change to edit mode til next JS thread loop. Prevents
             * flashing of changing states when blur then focus to controls in directive.
             */
            this.debounceSetEditMode = (newMode) => {
                nextEditMode = newMode;
                if (!debounceTimeout) {
                    debounceTimeout = $timeout(() => {
                        this.setEditMode(nextEditMode);
                        debounceTimeout = undefined;
                    }, 0, true);
                }
            };

        },

        link: function($scope, $element, $attrs, editableController) {
            $attrs.$addClass('editable');

            $scope.$watch('isEditMode', (newValue, oldValue) => {
                if (newValue) {
                    $attrs.$addClass('editable--edit');
                } else {
                    $attrs.$removeClass('editable--edit');
                }

                // Broadcast changed edit mode when value changes on the applied scope.
                if (newValue !== oldValue) {
                    $scope.$broadcast('wfEditable.changedEditMode', newValue, oldValue);
                }
            });

            $scope.commit = () => {
                $scope.$broadcast('wfEditable.commit');
            };

            $scope.cancel = () => {
                $scope.$broadcast('wfEditable.cancel');
            };


            /** Adds a DOM event listener with capture for non-bubbling events (blur, focus) */
            function addEventCaptureListener(eventName, listener) {
                $element[0].addEventListener(eventName, listener, true);
            }

            /** Adds a capture listener to change edit mode */
            function addChangeEditModeListeners(eventName, editMode) {
                addEventCaptureListener(eventName, (event) => {
                    var $target = angular.element(event.target);

                    if (!$target.hasClass('editable__value')) {
                        // debounce needed when blur then focus to other controls in edit mode
                        editableController.debounceSetEditMode(editMode);
                    }
                });
            }

            addChangeEditModeListeners('blur', false);
            addChangeEditModeListeners('focus', true);
        }
    };
}


function wfEditableTextFieldDirectiveFactory($timeout) {
    return {
        restrict: 'A',
        require: ['ngModel', '^^wfEditable'],

        link: function($scope, $element, $attrs, [ ngModel, wfEditable ]) {

            // resets / sets the ng-model-options (prevents default behaviour)
            ngModel.$options = ngModel.$options || {};

            function commit() {
                $scope.onEditableUpdate({
                    newValue: ngModel.$viewValue,
                    oldValue: ngModel.$modelValue
                });

                // TODO: could check for promise from onEditableUpdate to
                //       display loader, before committing view value.

                ngModel.$commitViewValue();
                wfEditable.setEditMode(false);
            }

            function cancel() {
                $scope.onEditableCancel();
                ngModel.$rollbackViewValue();
                wfEditable.setEditMode(false);
            }

            $scope.$on('wfEditable.commit', commit);
            $scope.$on('wfEditable.cancel', cancel);

            $scope.$on('wfEditable.changedEditMode', ($event, mode) => {
                if (mode === true) {
                    $timeout(() => $element[0].select());
                }
            });

            // $element.on('blur', cancel);

            $element.on('keydown', ($event) => {
                if ($event.keyCode == KEYCODE_ESC) {
                    cancel();

                } else if ($event.keyCode === KEYCODE_ENTER) {
                    if ($scope.editableType === 'textarea') {
                        if ($event.metaKey || $event.ctrlKey || $event.altKey) {
                            commit();
                        }

                    } else {
                        commit();
                    }
                }
            });
        }
    };
}
