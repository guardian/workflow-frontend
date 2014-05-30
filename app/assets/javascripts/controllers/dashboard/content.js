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

    function formatDateForUri(date) {
        return moment(date).format("YYYY-MM-DDTHH:mm:ssZ");
    }

    dashboardControllers.controller('ContentCtrl', ['$scope','$http', function($scope, $http) {

        var getContent = function() {
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
            if ($scope.selectedState) {
                params.state = $scope.selectedState;
            }
            if ($scope.selectedDate) {
                params["due.from"] = formatDateForUri($scope.dueFrom);
                params["due.until"] = formatDateForUri($scope.dueUntil);
            }
            if ($scope.selectedContentType) {
                params["content-type"] = $scope.selectedContentType;
            }
            return params;
        }

    }]);

    return dashboardControllers;
});
