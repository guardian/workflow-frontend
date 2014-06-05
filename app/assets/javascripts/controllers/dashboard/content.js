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

    dashboardControllers.controller('ContentCtrl',
        ['$scope','$http', 'filterParams', function($scope, $http, filterParams) {

        var getContent = function(evt, params) {
            $http.get('/api/content', {params: buildContentParams()}).success(function(response){
                $scope.contentItems = response.data;
            });
        };
        $scope.$on('getContent', getContent);
        $scope.$on('changedFilters', getContent);
        $scope.$watch('selectedContentType', getContent);

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

        function buildContentParams() {
            var params = angular.copy(filterParams.get());

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
        }

    }]);

    return dashboardControllers;
});
