define([
    'angular',
    'controllers/content'
], function (
    angular,
    contentControllers
) {
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

    contentControllers.controller('StubModalInstanceCtrl', ['$scope','$modalInstance','items', StubModalInstanceCtrl]);

    contentControllers.controller('StubModalCtrl', ['$scope', '$modal', '$http', function($scope, $modal, $http, $log){
        $scope.open = function () {

            var modalInstance = $modal.open({
                templateUrl: 'stubModalContent.html',
                controller: StubModalInstanceCtrl
            });

            modalInstance.result.then(function (stub) {
                $http({
                    method: 'POST',
                    url: '/newStub',
                    params: stub,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success(function(){
                    $scope.$emit('getStubs');
                });

            }, function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };
    }])

    return contentControllers;
});
