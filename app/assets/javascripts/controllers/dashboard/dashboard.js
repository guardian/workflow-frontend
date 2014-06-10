define([
    'angular',
    'moment',
    'controllers/dashboard'
], function (
    angular,
    moment,
    dashboardControllers
) {
    'use strict';

    dashboardControllers.controller('DashboardCtrl',
        ['$scope','$http', function($scope, $http) {

        // content and stub fetch
        var getContent = function(evt, params) {
            $http.get('/api/content', {params: buildContentParams()}).success(function(response){
                $scope.contentItems = response.content;
                $scope.stubs = response.stubs;
            });
        };
        $scope.$on('getContent', getContent);
        $scope.$on('changedFilters', getContent);
        $scope.$watch('selectedContentType', getContent);

        $scope.filters = {};

        function buildContentParams() {
            var params = angular.copy($scope.filters);

            if ($scope.selectedState) {
                params.state = $scope.selectedState;
            }

            if ($scope.selectedContentType) {
                params["content-type"] = $scope.selectedContentType;
            }

            if ($scope.selectedStatus) {
                params.status = $scope.selectedStatus;
            }
            return params;
        };


        // content items stuff
        $scope.stateIsSelected = function(state) {
            return $scope.selectedState == state;
        };
        $scope.selectState = function(state) {
            $scope.selectedState = state;
            getContent();
        };

        $scope.statusIsSelected = function(status) {
            return $scope.selectedStatus == status;
        };

        $scope.selectStatus = function(status) {
            $scope.selectedStatus = status;
            getContent();
        };

        $scope.contentTypeIsSelected = function (contentType) {
            return $scope.selectedContentType == contentType;
        };

        $scope.showDetail = function(content) {
            $scope.selectedContent = content;
        };

        // stubs stuff

        $scope.$on('newStubButtonClicked', function (event, contentType) {
            $scope.$broadcast('newStub', contentType);
        });

        $scope.editStub = function (stub) {
            $scope.$broadcast('editStub', angular.copy(stub));
        };

        $scope.addToComposer = function(stub, composerUrl) {
            $scope.$broadcast('addToComposer', stub, composerUrl)
        };

        $scope.deleteStub = function(stub) {
            if (window.confirm("Are you sure? \"" + stub.title + "\" looks like a nice stub to me.")) {
                $http({
                    method: 'DELETE',
                    url: '/api/stubs/' + stub.id
                }).success(function(){
                    getContent();
                });
            }
        };

    }]);

    return dashboardControllers;
});
