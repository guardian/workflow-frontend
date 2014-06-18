define(['angular'], function(angular) {
    'use strict';

    var sectionsService = angular.module('sectionsService', []);

    sectionsService.factory('sectionsService',
        ['$http', function($http) {


            function getSections() { return $http.get('/api/sections').then(function(response){
                return response.data.data;
            });};

            return {
                getSections: getSections
            };

        }]);

    return sectionsService;
});