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

import editableFieldTemplate from './editable-field.html';

angular.module('wfEditableField', [])
    .directive('wfEditable', ['$timeout', wfEditableDirectiveFactory])
    .directive('wfEditableField', ['$timeout', wfEditableTextFieldDirectiveFactory]);


var KEYCODE_ESC = 27,
    KEYCODE_ENTER = 13,

    CLASS_EDITABLE = 'editable',
    CLASS_EDITABLE_EDITMODE = 'editable--edit';

function wfEditableDirectiveFactory($timeout) {

    return {
        restrict: 'E',
        template: editableFieldTemplate,
        scope: {
            modelValue: '=ngModel',
            onEditableUpdate: '&wfEditableOnUpdate',
            onEditableCancel: '&wfEditableOnCancel',
            validateRequired: '=wfEditableRequired',
            validateMinlength: '=wfEditableMinlength',
            validateMaxlength: '=wfEditableMaxlength',
            noCloseMode:    '=wfNoCloseMode',
            onEditableEditModeUpdate: '&wfEditableOnEditModeUpdate'
        },
        compile: function(tElement, tAttrs) {
            var nodeName,
            $node,
            nodeAttrs = {
                'wf-editable-field': '',
                'ng-model': 'modelValue',
                'ng-required': 'validateRequired',
                'ng-minlength': 'validateMinlength',
                'ng-maxlength': 'validateMaxlength'
            };

            if (tAttrs.wfEditableType === 'textarea') {
                nodeName = 'textarea';
            } else {
                nodeName = 'input';
                nodeAttrs.type = 'text';
            }

            $node = angular.element(document.createElement(nodeName));


            tElement.find('wf-editable-field-target')
                .replaceWith($node.attr(nodeAttrs));


            return function wfEditableFieldPostLink($scope, $element, $attrs, editableController) {
                $attrs.$addClass(CLASS_EDITABLE);

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
                    return element && element.parentElement === parent || levels !== 0 && isElementChildOf(element.parentElement, parent, levels - 1);
                }

                function checkForImplicitCancelListener(event) {
                    if (!isElementChildOf(event.target, $element[0], 3)) {
                        $scope.$broadcast('wfEditable.implicitCancel');
                        $scope.$apply();
                    }
                }

                /**
                 * Adds body listeners for an implicit cancel event - either a click
                 * on the body outside the control, or focus outside of the control.
                 */
                function addImplicitCancelListeners() {
                    document.body.addEventListener('mousedown', checkForImplicitCancelListener);
                    document.body.addEventListener('focus', checkForImplicitCancelListener, true);
                }

                function removeImplicitCancelListeners() {
                    document.body.removeEventListener('mousedown', checkForImplicitCancelListener);
                    document.body.removeEventListener('focus', checkForImplicitCancelListener, true);
                }
            };
        },
        transclude: true,

        controllerAs: 'editableController',
        controller: function wfEditableFieldController($scope, $element, $attrs) {

            // one time bind of wfEditableType
            $scope.editableType = $attrs.wfEditableType;

            $scope.preserveWhitespace = $scope.editableType === 'textarea';

            this.setEditMode = (newMode) => {
                $scope.onEditableEditModeUpdate({
                    newMode: newMode
                });
                $scope.isEditMode = !!newMode;
            };

            this.setErrors = (errors) => $scope.editableErrors = errors;

            $scope.$watch('isEditMode', (newValue, oldValue) => {
                if (newValue) {
                    $attrs.$addClass(CLASS_EDITABLE_EDITMODE);
                } else {
                    $attrs.$removeClass(CLASS_EDITABLE_EDITMODE);
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

        }
    };
}


function wfEditableTextFieldDirectiveFactory($timeout) {
    return {
        restrict: 'A',
        require: ['ngModel', '^^wfEditable'],


        link: function($scope, $element, $attrs, [ ngModel, wfEditable ]) {
            $attrs.$addClass('editable__text-field');
            if ($scope.editableType === 'textarea') {
                $attrs.$addClass('editable__text-field--textarea');
            }

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
                    if ($scope.noCloseMode) {

                        // reset input
                        $element[0].value = '';

                    } else {
                        wfEditable.setEditMode(false);
                    }

                    ngModel.$setUntouched();
                    ngModel.$setPristine();
                }
            }

            function cancel() {
                $scope.onEditableCancel();
                ngModel.$rollbackViewValue();
                wfEditable.setErrors(ngModel.$error);
                wfEditable.setEditMode(false);
            }

            function implicitCancel() {
                if (ngModel.$viewValue == ngModel.$modelValue) {
                    wfEditable.setEditMode(false);
                } else {
                    wfEditable.setErrors({ notSaved: true });
                }
            }

            $scope.$on('wfEditable.commit', commit);
            $scope.$on('wfEditable.cancel', cancel);
            $scope.$on('wfEditable.implicitCancel', implicitCancel);

            $scope.$on('wfEditable.changedEditMode', ($event, mode) => {
                if (mode === true) {
                    $timeout(() => $element[0].select(), 100);
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
