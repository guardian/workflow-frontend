import angular from 'angular';
import moment from 'moment';

import './url-service';
import './format-service';
import './date-filters-service';

angular.module('filtersService', ['urlService', 'formatService', 'dateFilters'])
       .factory('filtersService', function(urlService, formatService, dateFilters) {

        class FiltersService
        {

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
                urlService.set(key, formatService.objToStr(value));
            }

            get(key){
                return this.filters[key];
            }
        }

        return new FiltersService();


    })

    .run(['$rootScope', 'filtersService', function($rootScope, filtersService){

        $rootScope.$on('filtersChanged.prodOffice', function(event, data) {
            filtersService.update('prodOffice', data);
            $rootScope.$broadcast('getContent');
        });

        $rootScope.$on('filtersChanged.content-type', function(event, data) {
            filtersService.update('content-type', data);
            $rootScope.$broadcast('getContent');
        });

        $rootScope.$on('filtersChanged.section', function(event, data) {
            filtersService.update('section', data);
            $rootScope.$broadcast('getContent');
        });

        $rootScope.$on('filtersChanged.state', function(event, data) {
            filtersService.update('state', data);
            $rootScope.$broadcast('getContent');
        });

        $rootScope.$on('filtersChanged.status', function(event, data) {
            filtersService.update('status', data);
            $rootScope.$broadcast('getContent');
        });

        $rootScope.$on('filtersChanged.flags', function(event, data) {
            filtersService.update('flags', data);
            $rootScope.$broadcast('getContent');
        });

        $rootScope.$on('filtersChanged.selectedDate', function(event, data) {
            filtersService.update('selectedDate', data);
            $rootScope.$broadcast('getContent');
        });

    }]);