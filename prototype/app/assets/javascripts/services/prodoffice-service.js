define(['angular'], function(angular) {
    'use strict';

    var prodOfficeService = angular.module('prodOfficeService', []);

    prodOfficeService.factory('prodOfficeService',
        [function() {

            function getProdOffices() {
                return [
                    {name: 'Australia', value: 'AU'},
                    {name: 'UK',        value: 'UK'},
                    {name: 'US',        value: 'US'}
                ]
            };

            return {
                getProdOffices: getProdOffices
            };

        }]);

   return prodOfficeService;
});
