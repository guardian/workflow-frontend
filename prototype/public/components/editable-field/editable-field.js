/**
 * Module containing directives for an editable field.
 */

import angular from 'angular';

angular.module('wfEditableField', [])
    .directive('wfEditable', [wfEditableDirectiveFactory])
    .directive('wfEditableField', ['$timeout', wfEditableTextFieldDirectiveFactory]);


var KEYCODE_ESC = 27,
    KEYCODE_CTRL = 17,
    KEYCODE_COMMAND = 224,
    KEYCODE_ENTER = 13;


function wfEditableDirectiveFactory() {

    return {
        restrict: 'E',
        templateUrl: '/assets/components/editable-field/editable-field.html',
        scope: {
            modelValue: '=wfEditableModel',
            onEditableUpdate: '&wfEditableOnUpdate',
            onEditableCancel: '&wfEditableOnCancel'
        },

        controllerAs: 'editableController',
        controller: function wfEditableFieldController($scope, $element, $attrs) {

            // one time bind of wfEditableType
            $scope.editableType = $attrs.wfEditableType;

            this.setEditMode = (flag) => {
                var newMode = !!flag;
                if ($scope.isEditMode !== flag) {
                    $scope.$broadcast('wfEditable.changedEditMode', newMode, $scope.isEditMode);
                }

                if (newMode) {
                    $element.addClass('editable--edit');
                } else {
                    $element.removeClass('editable--edit');
                }

                $scope.isEditMode = newMode;
            };

        },

        link: function($scope, $element, $attrs) {
            $element.addClass('editable');

            $scope.commit = () => {
                $scope.$broadcast('wfEditable.commit');
            };

            $scope.cancel = () => {
                $scope.$broadcast('wfEditable.cancel');
            };
        }
    };
}


function wfEditableTextFieldDirectiveFactory() {
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
