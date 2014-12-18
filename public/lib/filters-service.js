import angular from 'angular';
import moment from 'moment';

import './date-service';

angular.module('wfFiltersService', ['wfDateService'])
    .factory('wfFiltersService', ['$rootScope', '$location', 'wfDateParser', 'wfFormatDateTimeFilter',
        function($rootScope, $location, wfDateParser, wfFormatDateTimeFilter) {

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

                $rootScope.$on('filtersChanged.deadline', function(event, data) { // TODO: fix deadline/selectedDate namespacing
                    self.update('selectedDate', data);
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('filtersChanged.created', function(event, data) {
                    self.update('created',  data);
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('filtersChanged.freeText', function(event, data) {
                    self.update('text', data);
                    $rootScope.$broadcast('getContent');
                });


            }

            init() {
                this.attachListeners()
            }

            constructor()
            {
                var params = $location.search();

                var selectedDate = params['selectedDate'];

                this.filters = {
                   'status': params['status'],
                   'state': params['state'],
                   'section': params['section'],
                   'content-type': params['content-type'],
                   'selectedDate': wfDateParser.parseQueryString(selectedDate),
                    'flags': params['flags'],
                   'prodOffice': params['prodOffice'],
                   'created': params['created']
                };
            }


            update(key, value) {
                if (value !== null && (value === undefined || value.length === 0)) { // empty String or Array
                    value = null; // Remove query param
                }

                if (Array.isArray(value)) {
                    value = value.join(',');
                }

                if (key === 'selectedDate') {
                    var dateStr = wfDateParser.setQueryString(value);
                    this.filters[key] = dateStr;
                    $location.search(key, dateStr);
                }
                else {
                    this.filters[key] = value;
                    $location.search(key, value);
                }
            }

            get(key) {
                return this.filters[key];
            }

            getAll() {
                return this.filters;
            }

        }

        return new FiltersService();


    }])

    .run(['wfFiltersService', function (wfFiltersService) {
        wfFiltersService.init();
    }]);
