/**
 * Module containing directives for an editable field.
 */

import angular from 'angular';

angular.module('wfEditableField', [])
    .directive('wfEditable', [wfEditableDirectiveFactory])
    .directive('wfEditableField', [wfEditableTextFieldDirectiveFactory]);


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

            this.setEditMode = (flag) => $scope.isEditMode = !!flag;

        },

        link: function($scope, $element, $attrs) {
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

            // $element.on('blur', cancel);

            $element.on('keyup', (event) => {
                if (event.keyCode == 27) {
                    cancel();
                }
            });
        }
    };
}




