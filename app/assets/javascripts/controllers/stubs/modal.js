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
            //todo - make this an anon object with two fields
            $scope.stubForm.addToComposer = addToComposer;
            $modalInstance.close($scope.stubForm);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    stubsControllers.controller('StubModalInstanceCtrl', ['$scope','$modalInstance','stub', 'addToComposer', StubModalInstanceCtrl]);

    stubsControllers.controller('StubModalCtrl', ['$scope',
                                                  '$modal',
                                                  '$http',
                                                  '$q',
                                                  'config',
                                                  function($scope, $modal, $http, $q, config){

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
                var addToComposer = stub.addToComposer;

                function callComposer(addToComposer) {
                    var deferred = $q.defer();
                    var type = stub.contentType;
                    if(addToComposer) {
                        $http({
                            method: 'POST',
                            url: composerNewContent,
                            params: {'type': type},
                            withCredentials: true
                        }).then(function(response){
                            var composerId = response.data.data.id;
                            deferred.resolve(composerId);
                        },function(response){
                            deferred.reject(response);
                        });
                    }
                    else {
                        deferred.resolve(null);
                    }
                    return deferred.promise;
                }


                callComposer(addToComposer).then(function(composerId) {
                    newStub.composerId = composerId;
                    var response;
                    if (newStub.id === undefined) {
                        response = $http({
                            method: 'POST',
                            url: '/api/stubs',
                            params: newStub,
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                        });
                    }
                    else {
                        response = $http({
                            method: 'PUT',
                            url: '/api/stubs/' + stub.id,
                            params: newStub,
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                        });
                    }
                    response.success(function(){
                        $scope.$emit('getStubs');
                    });
                });
            });
        };
    }]);

    return stubsControllers;
});
