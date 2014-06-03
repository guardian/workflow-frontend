define([
    'angular',
    'controllers/stubs'
], function(
    angular,
    stubsControllers
) {
    'use strict';

    var ComposerModalInstanceCtrl = function ($scope, $modalInstance) {

        $scope.type = {'contentType': 'article'};

        $scope.ok = function () {
            $modalInstance.close($scope.type.contentType);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    stubsControllers.controller('ComposerModalInstanceCtrl', ['$scope','$modalInstance','items', ComposerModalInstanceCtrl]);

    stubsControllers.controller('ComposerModalCtrl', ['$scope',
                                                      '$modal',
                                                      '$http',
                                                      'config', function($scope, $modal, $http, config){


        $scope.$on('addToComposer', function(event, stub){
            $scope.open(stub);
        });

        $scope.open = function (stub) {
            var modalInstance = $modal.open({
                templateUrl: 'composerModalContent.html',
                controller: ComposerModalInstanceCtrl
            });

            var composerNewContent = config['composerNewContent'];

            modalInstance.result.then(function (type) {
                $http({
                    method: 'POST',
                    url: composerNewContent,
                    params: {'type': type},
                    withCredentials: true
                }).success(function(data){
                    var composerId = data.data.id;
                    $http({
                       method: 'POST',
                       url: '/api/stubs/' + stub.id,
                       params: {'composerId': composerId}
                    }).success(function(){
                        $scope.$emit('getStubs');
                    });
                });
            });
        };
    }]);

    return stubsControllers;
});