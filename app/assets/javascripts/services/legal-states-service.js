define(['angular'], function(angular) {
    'use strict';

    var legalStatesService = angular.module('legalStatesService', []);

    legalStatesService.factory('legalStatesService',
        [function() {

            function getLegalStates() {
                return [
                    {name: 'Not required', value: 'NA'},
                    {name: 'Needs checking', value: 'REQUIRED'},
                    {name: 'Approved', value: 'COMPLETE'}
                ]
            };

            return {
                getLegalStates: getLegalStates
            };

        }]);

    return legalStatesService;
});