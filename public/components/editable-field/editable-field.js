/**
 * Module containing directives for an editable field.
 *
 * @example
 * <!-- Simple text field example: -->
 * <wf-editable wf-editable-model="myModel">myModel value: {{ myModel || 'Not set' }}</wf-editable>
 *
 * <!-- Required field: -->
 * <wf-editable wf-editable-model="myModel" wf-editable-required="true">myModel value: {{ myModel || 'Not set' }}</wf-editable>
 *
 * <!-- Call function when model updates: -->
 * <wf-editable wf-editable-model="myModel" wf-editable-on-update="sendToServer(newValue)" wf-editable-required="true">myModel value: {{ myModel || 'Not set' }}</wf-editable>
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
            onEditableCancel: '&wfEditableOnCancel',
            validateRequired: '=wfEditableRequired',
            validateMinlength: '=wfEditableMinlength',
            validateMaxlength: '=wfEditableMaxlength'
        },
        transclude: true,

        controllerAs: 'editableController',
        controller: function wfEditableFieldController($scope, $element, $attrs) {

            // one time bind of wfEditableType
            $scope.editableType = $attrs.wfEditableType;

            this.setEditMode = (newMode) => $scope.isEditMode = !!newMode;

            this.setErrors = (errors) => $scope.editableErrors = errors;

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


            $scope.$on('wfEditable.changedEditMode', ($event, newValue) => {
                if (newValue) { // entered edit mode
                    addImplicitCancelListeners();
                } else {
                    removeImplicitCancelListeners();
                }
            });


            /**
             * Search parent elements on "element" to find "parent" up a hierarchy of "levels".
             */
            function isElementChildOf(element, parent, levels) {
                return element.parentElement === parent || levels !== 0 && isElementChildOf(element.parentElement, parent, levels - 1);
            }

            function checkForImplicitCancelListener(event) {
                if (!isElementChildOf(event.target, $element[0], 3)) {
                    editableController.setEditMode(false);
                    $scope.$apply();
                }
            }

            /**
             * Adds body listeners for an implicit cancel event - either a click
             * on the body outside the control, or focus outside of the control.
             */
            function addImplicitCancelListeners() {
                document.body.addEventListener('click', checkForImplicitCancelListener);
                document.body.addEventListener('focus', checkForImplicitCancelListener, true);
            }

            function removeImplicitCancelListeners() {
                document.body.removeEventListener('click', checkForImplicitCancelListener);
                document.body.removeEventListener('focus', checkForImplicitCancelListener, true);
            }

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
                var newValue = ngModel.$viewValue,
                    oldValue = ngModel.$modelValue;

                // TODO: could check for promise from onEditableUpdate to
                //       display loader, before committing view value.

                ngModel.$commitViewValue();

                wfEditable.setErrors(ngModel.$error);

                if (ngModel.$valid) {
                    $scope.onEditableUpdate({
                        newValue: newValue,
                        oldValue: oldValue
                    });
                    wfEditable.setEditMode(false);
                }
            }

            function cancel() {
                $scope.onEditableCancel();
                ngModel.$rollbackViewValue();
                wfEditable.setErrors(ngModel.$error);
                wfEditable.setEditMode(false);
            }

            $scope.$on('wfEditable.commit', commit);
            $scope.$on('wfEditable.cancel', cancel);

            $scope.$on('wfEditable.changedEditMode', ($event, mode) => {
                if (mode === true) {
                    $timeout(() => $element[0].select());
                }
            });

            $element.on('keydown', ($event) => {
                if ($event.keyCode == KEYCODE_ESC) {
                    $scope.$apply(cancel);

                } else if ($event.keyCode === KEYCODE_ENTER) {
                    if ($scope.editableType === 'textarea') {
                        if ($event.metaKey || $event.ctrlKey || $event.altKey) {
                            $scope.$apply(commit);
                        }

                    } else {
                        $scope.$apply(commit);
                    }
                }
            });
        }
    };
}
