define(['angular'], function(angular) {
    'use strict';

    var prodOfficeService = angular.module('prodOfficeService', ['wfLocationService']);

    prodOfficeService.factory('prodOfficeService',
        ['wfLocationService', function(wfLocationService) {

            /* mapping from city (as returned by getLocationKey()) to
             * office */
            var tz_office = {
                "NYC"     : "US",
                "SYD"     : "AU",
                "LON"     : "UK",
                "default" : "UK"
            }

            function officeToTimezone(office) {
                if (office && tz_office[office]) return tz_office[office]
                else return tz_office["default"];
            }

            function defaultOffice() {
                return officeToTimezone(wfLocationService.getLocationKey());
            }

            function getProdOffices() {
                return [
                    {name: 'AU', value: 'AU'},
                    {name: 'UK', value: 'UK'},
                    {name: 'US', value: 'US'}
                ]
            };

            return {
                getProdOffices: getProdOffices,
                defaultOffice:  defaultOffice()
            };

        }]);

   return prodOfficeService;
});
