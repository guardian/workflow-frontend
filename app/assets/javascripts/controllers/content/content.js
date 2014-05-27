define([
    'angular',
    'moment',
    'controllers/content'
], function (
    angular,
    moment,
    contentControllers
    ) {
    'use strict';
    contentControllers.controller('ContentCtrl', ['$scope','$http', function($scope, $http) {
        function formatDateForUri(date) {
            return moment(date).format("YYYY-MM-DDTHH:mm:ssZ");
        }
        $scope.stateIsSelected = function(state) {
            return $scope.selectedState == state;
        };

        $scope.selectState = function(state) {
            $scope.selectedState = state;
            getContent();
        };

        $scope.selectedContent = null;
        $scope.showDetail = function(content) {
            $scope.selectedContent = content;
        };

        $scope.selectDate = function(date) {
            if(date=='today') {
                $scope.dueFrom = moment().startOf('day');
                $scope.dueUntil = moment().startOf('day').add('days', 1);
            }
            if(date=='tomorrow') {
                $scope.dueFrom = moment().startOf('day').add('days', 1);
                $scope.dueUntil = moment().startOf('day').add('days', 2);
            }
            if(date=='weekend') {
                $scope.dueFrom = moment().day(6).startOf('day');
                $scope.dueUntil = moment().day(7).startOf('day').add('days', 1);
            }
            $scope.selectedDate = date;
            getContent();
        };

        function getContent() {
            var uri = '/content';
            var params = {};
            if ($scope.selectedState) {
                params.state = $scope.selectedState;
            }
            if ($scope.selectedDate) {
                params["due.from"] = formatDateForUri($scope.dueFrom);
                params["due.until"] = formatDateForUri($scope.dueUntil);
            }
            $http.get(uri, {params: params}).success(function(response){
                $scope.contentItems = response.data;
            });
        }
        getContent();
    }]);

    return contentControllers;
});