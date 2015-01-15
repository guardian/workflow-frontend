import angular from 'angular';
import moment from 'moment';

import _ from 'lodash';

import './date-service';

angular.module('wfFiltersService', ['wfDateService'])
    .factory('wfFiltersService', ['$rootScope', '$location', 'wfDateParser', 'wfFormatDateTimeFilter', 'wfPreferencesService',
        function($rootScope, $location, wfDateParser, wfFormatDateTimeFilter, wfPreferencesService) {

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

                $rootScope.$on('filtersChanged.selectedDate', function(event, data) { // TODO: fix deadline/selectedDate namespacing
                    self.update('selectedDate', data);
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('filtersChanged.created', function(event, data) {
                    self.update('created',  data);
                    $rootScope.$broadcast('getContent');
                });

                var keywords = {
                    "type"       : "content-type",
                    "status"     : "status",
                    "state"      : "state",
                    "who"        : "assignee",
                    "assignee"   : "assignee",
                    "assignedto" : "assignee"
                };

                $rootScope.$on('filtersChanged.freeText', function(event, data) {
                    var newValue = data.newValue;
                    var oldValue = data.oldValue;
                    //self.clearAll();
                    if(newValue != null) {
                        var rest =
                            newValue.replace(/\s*([A-Za-z-]+):(\S+)\s*/g, (match, field, value) => {
                                if(_.has(keywords, field)) {
                                    self.update(keywords[field], value);
                                }
                                return "";
                            });
                        self.update('text', rest);
                    } else {
                        self.update('text', null);
                    }
                    $rootScope.$broadcast('getContent');
                });

            }

            init() {
                this.attachListeners()
            }

            constructor() {

                // TODO: Refactor filters service to promise based architecture to allow for deferred loading of filters based on preferences

                var self = this;

                var params = $location.search();

                var setUpFilters = function (params) {

                    var selectedDate = params['selectedDate'];

                    self.filters = {
                        'status': params['status'],
                        'state': params['state'],
                        'section': params['section'],
                        'content-type': params['content-type'],
                        'selectedDate': wfDateParser.parseQueryString(selectedDate),
                        'flags': params['flags'],
                        'prodOffice': params['prodOffice'],
                        'created': params['created'],
                        'assignee': params['assignee']
                    };
                };

                setUpFilters(params); // base setting

                if (Object.keys(params).length === 0) { // if no params in URL attempt to load filters from user prefs

                    wfPreferencesService.getPreference('location').then((data) => {
                        params = data || {};
                        setUpFilters(params);

                        for (var key in params) {
                            if (params.hasOwnProperty(key)) {
                                self.update(key, params[key], true);
                            }
                        }

                        $rootScope.$broadcast('getContent');
                    }, () => {
                        setUpFilters(params);
                    });
                } else {
                    setUpFilters(params);
                }
            }


            update(key, value, doNotUpdateprefs) {

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

                if (!doNotUpdateprefs) {
                    wfPreferencesService.setPreference('location', this.sanitizeFilters(this.filters));
                }

            }

            get(key) {
                return this.filters[key];
            }

            getAll() {
                return this.filters;
            }

            clearAll() {
                _.forOwn(this.filters, (value, key) => {
                    this.update(key, null);
                });
            }

            /**
             * Remove null or undefined keys from filters object for storage in user prefs
             * @param filters
             * @returns $scope.filter.namespace
             */
            sanitizeFilters (filters) {
                Object.keys(filters).map((key) => {
                    if (filters[key] === null || filters[key] === undefined) {
                        delete filters[key];
                    }
                });
                return filters;
            }

        }

        return new FiltersService();


    }])

    .run(['wfFiltersService', function (wfFiltersService) {
        wfFiltersService.init();
    }]);
