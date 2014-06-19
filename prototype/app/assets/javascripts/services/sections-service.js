define(['angular'], function(angular) {
    'use strict';

    var sectionsService = angular.module('sectionsService', []);

    sectionsService.factory('sectionsService',
        [function() {

            function getSections() {
                return ['Dev', 'Cities', 'Technology']
            };

            return {
                getSections: getSections
            };

        }]);

    return sectionsService;
});