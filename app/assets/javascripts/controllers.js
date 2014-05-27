define(['angular', 'moment', 'uiBootstrap'], function (angular, moment) {
    'use strict';
     var StubModalInstanceCtrl = function ($scope, $modalInstance) {
        $scope.stubForm = {}
        $scope.ok = function () {
            $modalInstance.close($scope.stubForm);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    return angular.module('workflow.controllers', ['ui.bootstrap'])



});
