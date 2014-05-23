define(['angular', 'moment'], function (angular, moment) {
    'use strict';

    return angular.module('myApp.controllers', [])
         .controller('ContentCtrl', ['$scope','$http', function($scope, $http) {

             function formatDateForUri(date) {
                 return moment(date).format("YYYY-MM-DDTHH:mm:ssZ");
             }
             $scope.stateIsSelected = function(state) {
                 return $scope.selectedState == state;
             }

             $scope.selectState = function(state) {
                 $scope.selectedState = state;
                 getContent();
             }

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
         }])
         .controller('StubsCtrl', ['$scope','$http', function($scope, $http) {
            function getStubs() {
                var uri = '/stubsJson';
                $http.get(uri).success(function(response) {
                    $scope.stubItems = response.data;
                });
            }
            getStubs();

            $scope.addStub = function() {
                $http({
                    method: 'POST',
                    url: '/newStub',
                    params: $scope.stubForm,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success(function(response) {
                    //hide modal
                    //
                });
            }
        }]);

});
