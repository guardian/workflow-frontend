define([
    'angular',
    'sugar',
    'moment',
    'controllers/stubs'
], function (
    angular,
    sugar,
    moment,
    stubsControllers
) {
    'use strict';



    var StubModalInstanceCtrl = function ($scope, $modalInstance, stub) {
        //default to technology for first pass of testing
        if (stub === undefined) {
            $scope.stubForm = {'section': 'Technology',
                               'contentType': 'article'
                              };
        }
        else {
            $scope.stubForm = stub;
        }
        $scope.ok = function (addToComposer) {
            $scope.stubForm.addToComposer = addToComposer;
            $modalInstance.close($scope.stubForm);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    stubsControllers.controller('StubModalInstanceCtrl', ['$scope','$modalInstance','stub', 'addToComposer', StubModalInstanceCtrl]);

    stubsControllers.controller('StubModalCtrl', ['$scope', '$modal', '$http', 'config', function($scope, $modal, $http, config){

        var composerNewContent = config['composerNewContent'];

        $scope.$on('editStub', function(event, stub) {
            $scope.open(stub);
        });

        $scope.open = function (stub, addToComposer) {

            var modalInstance = $modal.open({
                templateUrl: 'stubModalContent.html',
                controller: StubModalInstanceCtrl,
                resolve: {
                    stub: function () {
                        return stub;
                    },
                    addToComposer: function() {
                        return addToComposer;
                    }
                }
            });

            modalInstance.result.then(function (stub) {
                var newStub = angular.copy(stub);
                newStub.due = Date.create(stub.due).toISOString();
                var updateOrCreateStubResponse = function(stub) {
                    var response;
                    if (stub.id === undefined) {
                        response = $http({
                            method: 'POST',
                            url: '/api/stubs',
                            params: stub,
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                        });
                    }
                    else {
                        response = $http({
                            method: 'PUT',
                            url: '/api/stubs/' + stub.id,
                            params: stub,
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                        });
                    }
                    return response
                }
                var response;
                if(stub.addToComposer) {
                    var type = stub.contentType;
                    $http({
                        method: 'POST',
                        url: composerNewContent,
                        params: {'type': type},
                        withCredentials: true
                    }).success(function(data){
                        newStub.composerId = data.data.id;
                        response = updateOrCreateStubResponse(newStub)
                    });
                }
                else {
                    response = updateOrCreateStubResponse(newStub)
                }
                response.success(function(){
                    $scope.$emit('getStubs');
                });
            });
        };
    }])

    return stubsControllers;
});
