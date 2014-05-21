'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('ContentCtrl', ['$scope','$http', function($scope, $http) {

      $scope.selectedState = 'published';

      $scope.stateIsSelected = function(state) {
        return $scope.selectedState == state;
      }

      $scope.selectState = function(state) {
        $scope.selectedState = state;
      }

      $http.get('http://localhost:9000/content').success(function(response){
          var content = response.content
          $scope.content_items = content
      });
  }])
  .controller('MyCtrl2', ['$scope', function($scope) {

  }]);
