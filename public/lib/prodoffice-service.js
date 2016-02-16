define(['angular'], function (angular) {
    'use strict';

    var prodOfficeService = angular.module('wfProdOfficeService', ['wfLocationService']);

    prodOfficeService.factory('wfProdOfficeService',
        ['$rootScope', 'wfLocationService', function ($rootScope, wfLocationService) {

            /* mapping from city (as returned by getLocationKey()) to
             * office */
            var tz_office = {
                "NYC": "US",
                "SYD": "AU",
                "LON": "UK",
                "default": "UK"
            }

            function timezoneToOffice(office) {
                if (office && tz_office[office]) return tz_office[office]
                else return tz_office["default"];
            }

            var curDefaultOffice = timezoneToOffice(wfLocationService.getLocationKey());

            function getDefaultOffice() {
                return curDefaultOffice;
            }

            function getProdOffices() {
                return [
                    {name: 'AU', value: 'AU'},
                    {name: 'UK', value: 'UK'},
                    {name: 'US', value: 'US'}
                ]
            };

            var prodOffices = {
                timezoneToOffice: timezoneToOffice,
                getProdOffices: getProdOffices,
                getDefaultOffice: getDefaultOffice
            };

            $rootScope.$on('location:change', function (ev, newValue, oldValue) {
                curDefaultOffice = timezoneToOffice(newValue);
            })

            return prodOffices;
        }]);

    return prodOfficeService;
});
