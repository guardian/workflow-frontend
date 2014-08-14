import angular from 'angular';
import moment from 'moment';

import './url-service';
import './format-service';
import './date-filters-service';
import './date-service';

angular.module('filtersService', ['urlService', 'formatService', 'dateFilters', 'wfDateService'])
       .factory('filtersService', ['$rootScope', 'urlService', 'formatService', 'dateFilters', 'wfDateParser',
        function($rootScope, urlService, formatService, dateFilters, wfDateParser) {

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

            constructor()
            {
                this.filters = {};
                this.filters['status'] = urlService.get('status');
                this.filters['state'] = urlService.get('state');
                this.filters['section'] = urlService.get('section');
                this.filters['content-type'] = urlService.get('content-type');
                this.filters['selectedDate'] = formatService.stringToDate(urlService.get('selectedDate'));
                this.filters['flags'] = formatService.stringToArray(urlService.get('flags'));
                this.filters['prodOffice'] = urlService.get('prodOffice');
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

                var dateParams = dateFilters.setToAndFrom(this.filters['selectedDate']);

                params['due.from'] = formatService.dateForUri(dateParams['due.from']);
                params['due.until'] = formatService.dateForUri(dateParams['due.until']);
                return params;

            }

            update(key, value) {
                this.filters[key] = value;
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