define([
    'angular',
    'controllers/dashboard'
], function (
    angular,
    dashboardControllers
    ) {
    'use strict';

    dashboardControllers.controller('NewStubDropdownCtrl', ['$scope', function ($scope) {
        $scope.newStub = function (contentType) {
            $scope.$emit('newStubButtonClicked', contentType);
        };
    }]);

    // stub create and edit

    var StubModalInstanceCtrl = function ($scope, $modalInstance, stub, sectionsService) {

        $scope.stub = stub;

        $scope.disabled = stub.composerId !== undefined;


        // Set dueText field content on init
        if (stub.due) {
            stub.dueText = moment(stub.due).format("D MMM YYYY, HH:mm");
        }

        // Watch changes to dueText
        $scope.$watch('stub.dueText', function() {
            $scope.dueTextChanged();
        });


        $scope.onDatePicked = function(newDate, oldDate) {
            $scope.stub.dueText = moment(newDate).format("D MMM YYYY, HH:mm");
        };

        $scope.dueTextChanged = function() {
            if (!$scope.stub.dueText) { // set to none when empty
                $scope.stub.due = null;
                return;
            }

            var due;
            try {
                due = Date.create($scope.stub.dueText).toISOString();
                $scope.stub.due = due;
            }
            catch (e) {
                delete $scope.stub.due;
            }
        };

        sectionsService.getSections().then(function (sections) {
            $scope.sections = sections.map(function(s) {return s.name;});
        });

        $scope.ok = function (addToComposer) {
            delete $scope.stub.dueText;
            $modalInstance.close({
                addToComposer: addToComposer,
                stub: $scope.stub
            });
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    dashboardControllers.controller('StubModalInstanceCtrl', ['$scope',
        '$modalInstance',
        'stub',
        'sectionsService',
        StubModalInstanceCtrl]);

    dashboardControllers.controller('StubModalCtrl', ['$scope',
        '$modal',
        '$http',
        '$q',
        'config',
        function($scope, $modal, $http, $q, config){

            var composerNewContent = config['composerNewContent'];

            $scope.$on('editStub', function(event, stub) {
                open(stub);
            });

            $scope.$on('newStub', function(event, contentType) {
                var stub = {
                    contentType: contentType || 'article',
                    section: 'Technology'
                };
                open(stub);
            });

            function open(stub, addToComposer) {

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

                modalInstance.result.then(function (modalCloseResult) {
                    var stub = modalCloseResult.stub;
                    var newStub = angular.copy(stub);
                    var addToComposer = modalCloseResult.addToComposer;

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
                                data: newStub
                            });
                        }
                        else {
                            response = $http({
                                method: 'PUT',
                                url: '/api/stubs/' + stub.id,
                                data: newStub
                            });
                        }
                        response.success(function(){
                            $scope.$emit('getContent');
                        });
                    });
                });
            };
        }]);

    // add to composer modal

    var ComposerModalInstanceCtrl = function ($scope, $modalInstance, stub) {

        $scope.contentType = {type: stub.contentType || "article"};

        $scope.ok = function () {
            $modalInstance.close($scope.contentType.type);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    dashboardControllers.controller('ComposerModalInstanceCtrl', ['$scope','$modalInstance','stub', ComposerModalInstanceCtrl]);

    dashboardControllers.controller('ComposerModalCtrl', ['$scope',
        '$modal',
        '$http',
        'config', function($scope, $modal, $http, config){


            $scope.$on('addToComposer', function(event, stub){
                open(stub);
            });

            function open(stub) {
                var modalInstance = $modal.open({
                    templateUrl: 'composerModalContent.html',
                    controller: ComposerModalInstanceCtrl,
                    resolve: {
                        stub: function () {
                            return stub;
                        }
                    }
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
                            params: {'composerId': composerId, 'contentType': type}
                        }).success(function(){
                            $scope.$emit('getContent');
                        });
                    });
                });
            };
        }]);

    return dashboardControllers;
});