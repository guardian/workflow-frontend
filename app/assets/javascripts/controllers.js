define(['angular', 'moment'], function (angular, moment) {
    'use strict';

    return angular.module('myApp.controllers', [])
         .controller('ContentCtrl', ['$scope','$http', function($scope, $http) {

             function formatDateForUri(date) {
                 return encodeURIComponent(moment(date).format("YYYY-MM-DDTHH:mm:ssZ"))
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
                 $scope.selectedDate = date;
                  getContent();
             };

            function getContent() {
                 var uri = 'http://localhost:9000/content';
                 var params = {};
                 if ($scope.selectedState) {
                    params.state = $scope.selectedState;
                 }
                 if ($scope.selectedDate) {
                    params["due.from"] = formatDateForUri($scope.dueFrom);
                    params["due.until"] = formatDateForUri($scope.dueUntil);
                 }
                 $http.get(uri, {params: params}).success(function(response){
                    $scope.contentItems = response.content;
                 });
            }
             getContent();
         }])
         .controller('MyCtrl2', ['$scope', function($scope) {

     }]);

});
