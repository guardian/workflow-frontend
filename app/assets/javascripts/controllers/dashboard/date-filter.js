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

    function mkDateOptions() {
        var choices = [];
        var today = moment().startOf('day');
        for (var i = 0; i < 6; i++) {
            choices.push(today.clone().add('days', i));
        }
        return choices;
    }

    dashboardControllers.controller('DateFilterCtrl', ['$scope','$http', function($scope, $http) {

        $scope.dateOptions = mkDateOptions();

        $scope.selectDate = function(date) {
            $scope.selectedDate = date;
        };

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
            console.log("emitting getContent");
            $scope.$emit('getContent');
        });

    }]);

    return dashboardControllers;
});
