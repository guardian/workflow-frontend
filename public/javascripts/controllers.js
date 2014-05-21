'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('ContentCtrl', ['$scope','$http', function($scope, $http) {
      $http.get('http://localhost:9000/content').success(function(response){
          var content = response.content
          $scope.content_items = content

      });
  }])
  .controller('MyCtrl2', ['$scope', function($scope) {

  }]);
