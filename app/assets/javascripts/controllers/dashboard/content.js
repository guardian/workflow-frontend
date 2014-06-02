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

    dashboardControllers.controller('ContentCtrl', ['$scope','$http', function($scope, $http) {

        var registeredFilters = {}; // params registered by other controllers

        var getContent = function(evt, params) {
            if (params) {
                for (var key in params) {
                    registeredFilters[key] = params[key];
                }
            }
            $http.get('/api/content', {params: buildContentParams()}).success(function(response){
                $scope.contentItems = response.data;
            });
        };
        $scope.$on('getContent', getContent);

        $scope.stateIsSelected = function(state) {
            return $scope.selectedState == state;
        };
        $scope.selectState = function(state) {
            $scope.selectedState = state;
            getContent();
        };

        $scope.contentTypeIsSelected = function (contentType) {
            return $scope.selectedContentType == contentType;
        };
        $scope.selectContentType = function(contentType) {
            $scope.selectedContentType = contentType;
            getContent();
        };

        $scope.showDetail = function(content) {
            $scope.selectedContent = content;
        };

        function buildContentParams() {
            var params = {};

            // copy in filter params registered by other controllers
            for (var key in registeredFilters) {
                params[key] = registeredFilters[key];
            }

            if ($scope.selectedState) {
                params.state = $scope.selectedState;
            }

            if ($scope.selectedContentType) {
                params["content-type"] = $scope.selectedContentType;
            }
            return params;
        }

    }]);

    return dashboardControllers;
});
