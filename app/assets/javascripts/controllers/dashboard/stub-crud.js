define([
    'angular',
    '../dashboard'
], function (
    angular,
    dashboardControllers
    ) {
    'use strict';

    dashboardControllers.controller('NewStubDropdownCtrl', ['$scope', function ($scope) {
        $scope.newStub = function (contentType) {
            $scope.$emit('newStubButtonClicked', contentType);
        };

        $scope.importFromComposer = function () {
            $scope.$emit('importFromComposerButtonClicked');
        };
    }]);

    // stub create and edit

    var StubModalInstanceCtrl = function ($scope, $modalInstance, stub, sections, legalStatesService, prodOfficeService) {

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

        $scope.sections = sections;
        $scope.legalStates = legalStatesService.getLegalStates();
        $scope.prodOffices = prodOfficeService.getProdOffices();

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
        'sections',
        'legalStatesService',
        StubModalInstanceCtrl]);

    dashboardControllers.controller('StubModalCtrl', ['$scope',
        '$modal',
        '$http',
        '$q',
        'config',
        'prodOfficeService',
        function($scope, $modal, $http, $q, config, prodOffice){

            var composerNewContent = config['composerNewContent'];

            $scope.$on('editStub', function(event, stub) {
                open(stub);
            });

            $scope.$on('newStub', function(event, contentType) {
                var stub = {
                    contentType: contentType || 'article',
                    section: $scope.selectedSection || 'Technology',
                    priority: 0,
                    needsLegal: 'NA',
                    prodOffice: prodOffice.getDefaultOffice()
                };
                open(stub);
            });

            function open(stub, addToComposer) {

                var modalInstance = $modal.open({
                    templateUrl: 'stubModalContent.html',
                    controller: StubModalInstanceCtrl,
                    windowClass: 'stubModal',
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

    // composer import control
    // stub create and edit

     var ComposerImportModalInstanceCtrl = function ($scope, $modalInstance, stub, sections, legalStatesService, composerService, prodOfficeService) {

        $scope.stub = stub;

        $scope.formData = {};

        $scope.disabled = $scope.stub.composerId !== undefined;

        $scope.composerUrlChanged = function() {
            composerService.getComposerContent($scope.formData.composerUrl).then(
                function(content) {
                    if(content) {
                        $scope.stub.composerId = content.id;
                        $scope.stub.contentType = content.type;
                        $scope.stub.title = content.headline;
                    } else {
                        $scope.stub.composerId = null;
                        $scope.stub.contentType = null;
                        $scope.stub.title = null;
                    }
                }
            );
        };


        // Watch changes to dueText
        $scope.$watch('formData.dueText', function() {
            $scope.dueTextChanged();
        });


        $scope.onDatePicked = function(newDate, oldDate) {
            $scope.formData.dueText = moment(newDate).format("D MMM YYYY, HH:mm");
        };

        $scope.dueTextChanged = function() {
            if (!$scope.formData.dueText) { // set to none when empty
                $scope.stub.due = null;
                return;
            }

            var due;
            try {
                due = Date.create($scope.formData.dueText).toISOString();
                $scope.stub.due = due;
            }
            catch (e) {
                delete $scope.stub.due;
            }
        };

        $scope.sections = sections;
        $scope.legalStates = legalStatesService.getLegalStates();
        $scope.prodOffices = prodOfficeService.getProdOffices();

        $scope.ok = function () {
            $modalInstance.close({
                stub: $scope.stub
            });
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    dashboardControllers.controller('ComposerImportModalInstanceCtrl', ['$scope',
        '$modalInstance',
        'stub',
        'sections',
        'legalStatesService',
        'composerService',
        'prodOfficeService',
        ComposerImportModalInstanceCtrl]);

    dashboardControllers.controller('ComposerImportModalCtrl', ['$scope',
        '$modal',
        '$http',
        '$q',
        'config',
        'prodOfficeService',
        function($scope, $modal, $http, $q, config, prodOfficeService){

            $scope.$on('composerImport', function(event) {
                var stub = {
                    section: $scope.selectedSection || 'Technology',
                    prodOffice: prodOfficeService.getDefaultOffice(),
                    priority: 0,
                    needsLegal: 'NA'
                };
                open(stub);
            });

            function open(stub) {
                var modalInstance = $modal.open({
                    templateUrl: 'composerImportModalContent.html',
                    controller: ComposerImportModalInstanceCtrl,
                    windowClass: 'stubModal',
                    resolve: {
                        stub: function(){
                            return stub;
                        }
                    }
                });

                modalInstance.result.then(function (modalCloseResult) {
                    var stub = modalCloseResult.stub;

                    console.log('stub data:', stub);
                    var newStub = angular.copy(stub);

                    var response = $http({
                            method: 'POST',
                            url: '/api/stubs',
                            data: newStub
                        }).success(function(){
                            $scope.$emit('getContent');
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
