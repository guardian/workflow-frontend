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

    function mkDateOptions() {
        var choices = [];
        var today = moment().startOf('day');
        for (var i = 0; i < 6; i++) {
            choices.push(today.clone().add('days', i));
        }
        return choices;
    }


    dashboardControllers.controller('ContentCtrl', ['$scope','$http', function($scope, $http) {

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

        $scope.selectDate = function(date) {
            $scope.selectedDate = date;
        };

        $scope.dateOptions = mkDateOptions();

        $scope.$watch('selectedDate', function(date) {
            if (date == 'today') {
                $scope.dueFrom = moment().startOf('day');
                $scope.dueUntil = moment().startOf('day').add('days', 1);
            }
            else if (date == 'tomorrow') {
                $scope.dueFrom = moment().startOf('day').add('days', 1);
                $scope.dueUntil = moment().startOf('day').add('days', 2);
            }
            else if (date == 'weekend') {
                $scope.dueFrom = moment().day(6).startOf('day');
                $scope.dueUntil = moment().day(7).startOf('day').add('days', 1);
            }
            else if (typeof date == 'object') {
                $scope.dueFrom = date;
                $scope.dueUntil = date.clone().add('days', 1);
            }
            getContent();
        });

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

        function getContent() {
            $http.get('/content', {params: buildContentParams()}).success(function(response){
                $scope.contentItems = response.data;
            });
        }

    }]);

    return dashboardControllers;
});