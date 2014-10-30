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

                $rootScope.$on('filtersChanged.desk', function(event, data) {
                    self.update('desk', data);
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

                $rootScope.$on('filtersChanged.created', function(event, data) {
                    self.update('created',  data);
                    $rootScope.$broadcast('getContent');
                });
            }

            init() {
                this.attachListeners()
            }

            stringToArray(value) {
                if (value) return value.split(",");
                else return [];
            }

            constructor()
            {
                var params = $location.search();

                var selectedDate = params['selectedDate'];

                this.filters = {
                   'status': params['status'],
                   'state': params['state'],
                   'desk': params['desk'],
                   'section': params['section'],
                   'content-type': params['content-type'],
                   'selectedDate': wfDateParser.parseQueryString(selectedDate),
                   'flags': (function (that) {
                       var a = that.stringToArray(params['flags']);
                       return a.length > 0 ? a : undefined;
                   })(this),
                   'prodOffice': params['prodOffice'],
                   'created': params['created']
                };
            }


            update(key, value) {
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
