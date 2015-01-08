/**
 * Module containing directives for an editable field.
 */

import angular from 'angular';

angular.module('wfEditableField', [])
    .directive('wfEditable', [wfEditableDirectiveFactory])
    .directive('wfEditableField', wfEditableTextFieldDirectiveFactory);


function wfEditableDirectiveFactory() {

    return {
        restrict: 'E',
        templateUrl: '/assets/components/editable-field/editable-field.html',
        scope: {
            modelValue: '=wfEditableModel',
            editableType: '@wfEditableType'
        },

        controllerAs: 'editableController',
        controller: function wfEditableFieldController($scope, $element, $attrs) {

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

        link: function($scope, $element, $attrs, controllers) {

            var ngModel = controllers[0],
                wfEditable = controllers[1];


            console.log('linking text field directive', arguments);

            // resets / sets the ng-model-options (prevents default behaviour)
            ngModel.$options = ngModel.$options || {};

            function commit() {
                ngModel.$commitViewValue();
                wfEditable.setEditMode(false);
            }

            function cancel() {
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

            // TODO
            //  events for escape / blur / cancel
            //  events for commit / ok / enter / command + enter
        }
    };
}




