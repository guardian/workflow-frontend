'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('ContentCtrl', ['$scope','$http', function($scope, $http) {

      $scope.stateIsSelected = function(state) {
          return $scope.selectedState == state;
      }

      $scope.selectState = function(state) {
          $scope.selectedState = state;
          getContent();
      }

      function getContent() {
          var uri = 'http://localhost:9000/content'
          if ($scope.selectedState) {
              uri = uri + '?state=' + $scope.selectedState;
          }
          $http.get(uri).success(function(response){
              $scope.contentItems = response.content;
          });
      }

      getContent();
  }])
  .controller('MyCtrl2', ['$scope', function($scope) {

  }]);
