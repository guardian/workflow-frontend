import angular from 'angular';
import moment from 'moment';

import './date-filters-service';
import './date-service';

angular.module('filtersService', ['dateFilters', 'wfDateService'])
       .factory('filtersService', ['$rootScope', '$location', 'dateFilters', 'wfDateParser', 'wfFormatDateTimeFilter',
        function($rootScope, $location, dateFilters, wfDateParser, wfFormatDateTimeFilter) {

        class FiltersService
        {

            attachListeners() {
                var self = this;
                $rootScope.$on('filtersChanged.prodOffice', function(event, data) {
                    self.update('prodOffice', data);
                    $rootScope.$broadcast('getContent');
                });
                $rootScope.$on('filtersChanged.content-type', function(event, data) {
                    self.update('content-type', data);
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('filtersChanged.section', function(event, data) {
                    self.update('section', data);
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('filtersChanged.state', function(event, data) {
                    self.update('state', data);
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('filtersChanged.status', function(event, data) {
                    self.update('status', data);
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('filtersChanged.flags', function(event, data) {
                    self.update('flags', data);
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('filtersChanged.selectedDate', function(event, data) {
                    self.update('selectedDate', data);
                    $rootScope.$broadcast('getContent');
                });
            }

            init() {
                this.attachListeners()
            }

            stringToArray(value) {
                if(value) return value.split(",");
                else return [];
            }

            constructor()
            {
                var params = $location.search();

                var selectedDate = params['selectedDate'];

                this.filters = {};
                this.filters['status'] = params['status'];
                this.filters['state'] = params['state'];
                this.filters['section'] = params['section'];
                this.filters['content-type'] = params['content-type'];
                this.filters['selectedDate'] = wfDateParser.parseQueryString(selectedDate);
                this.filters['flags'] = this.stringToArray(params['flags']);
                this.filters['prodOffice'] = params['prodOffice'];

            }

            toServerParams()
            {
                var params = {};
                params.status = this.filters['status'];
                params.state = this.filters['state'];
                params.section = this.filters['section'];
                params["content-type"] = this.filters["content-type"];
                params.flags = this.filters['flags'];
                params.prodOffice = this.filters['prodOffice'];
                var selectedDate = this.filters['selectedDate'];
                var dateRange = wfDateParser.parseRangeFromString(selectedDate);
                params['due.from'] = wfFormatDateTimeFilter(dateRange['from'], "YYYY-MM-DDTHH:mm:ssZ");
                params['due.until'] = wfFormatDateTimeFilter(dateRange['until'], "YYYY-MM-DDTHH:mm:ssZ");
                return params;

            }

            update(key, value) {
                if(key === 'selectedDate')  {
                    var dateStr = wfDateParser.setQueryString(value);
                    this.filters[key] = dateStr;
                    $location.search(key, dateStr);
                }
                else {
                    this.filters[key] = value;
                    $location.search(key, value);
                }
            }

            get(key){
                return this.filters[key];
            }

        }

        return new FiltersService();


    }])

    .run(['filtersService', function(filtersService){
        filtersService.init();
    }]);
