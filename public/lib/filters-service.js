import angular from 'angular';
import moment from 'moment';

import _ from 'lodash';

import './date-service';

angular.module('wfFiltersService', ['wfDateService'])
    .factory('wfFiltersService', ['$rootScope', '$location', '$state', 'wfDateParser', 'wfFormatDateTimeFilter', 'wfPreferencesService',
        function($rootScope, $location, $state, wfDateParser, wfFormatDateTimeFilter, wfPreferencesService) {

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
                    self.update('created', data);
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('filtersChanged.desk', function(event, data) {
                    if (data !== -1) {
                        self.update('desk',  data);
                    } else {
                        self.update('desk',  null);
                    }

                    // Desk ignored so no need to request content
                });

                $rootScope.$on('filtersChanged.touched', function(event, data) {
                    self.update('touched', data);
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('filtersChanged.assigneeEmail', function(event, data) {
                    self.update('assigneeEmail', data);
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

                var savedFilters = null;

                function enterSearchMode(data) {
                    savedFilters = _.clone(self.filters);
                    self.clearAll(true, true);
                    $rootScope.$broadcast("search-mode.enter");
                }

                function exitSearchMode(data) {
                    self.clearAll(true, true);
                    if(savedFilters != null) {
                        _.forOwn(savedFilters,
                                 (value, key) => self.update(key, value));
                    }
                    $rootScope.$broadcast("search-mode.exit");
                }

                $rootScope.$on('filtersChanged.freeText', function(event, data) {
                    var newValue = data.newValue;
                    var oldValue = data.oldValue;

                    if(oldValue == null && newValue != null) {
                        enterSearchMode(data);
                    } else if(newValue == null && oldValue != null) {
                        exitSearchMode(data);
                    }

                    if(newValue != null) {
                        var rest =
                            newValue.replace(/\s*([A-Za-z-]+):(\S+)\s*/g, (match, field, value) => {
                                if(_.has(keywords, field)) {
                                    self.update(keywords[field], value, true, true);
                                }
                                return "";
                            });
                        self.update('text', rest, true, true);
                    } else {
                        self.update('text', null, true, true);
                    }
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('filtersChanged.incopy', function(event, data) {
                    self.update('incopy', data);
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('filtersChanged.view', function(event, data) {
                    self.update('view', data);
                    $rootScope.$broadcast('getContent');
                });

                $rootScope.$on('plan-view__filters-changed.news-list', function(event, data) {
                    if (data === 'all') {
                        self.update('news-list', null);
                    } else {
                        self.update('news-list', data);
                    }
                    $rootScope.$broadcast('plan-view__filters-changed');
                });

                $rootScope.$on('plan-view__filters-changed.plan-start-date', function(event, data) {
                    self.update('plan-start-date', data);
                    $rootScope.$broadcast('plan-view__filters-changed');
                });

                $rootScope.$on('plan-view__filters-changed.plan-end-date', function(event, data) {
                    self.update('plan-end-date', data);
                    $rootScope.$broadcast('plan-view__filters-changed');
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
                        'status'       : params['status'],
                        'state'        : params['state'],
                        'section'      : params['section'],
                        'content-type' : params['content-type'],
                        'selectedDate' : wfDateParser.parseQueryString(selectedDate),
                        'flags'        : params['flags'],
                        'prodOffice'   : params['prodOffice'],
                        'created'      : params['created'],
                        'assignee'     : params['assignee'],
                        'assigneeEmail': params['assigneeEmail'],
                        'incopy'       : params['incopy'],
                        'touched'      : params['touched'],
                        'composerId'   : params['composerId'],
                        'view'         : params['view'],
                        'news-list'    : params['news-list'],
                        'plan-start-date': params['plan-start-date'],
                        'plan-end-date': params['plan-end-date']
                    };

                    $rootScope.currentlySelectedStatusFilters = self.transformStatusList(self.filters['status']);

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

                        $rootScope.$broadcast('filtersChanged.fromPreferences');
                        $rootScope.$broadcast('getContent');
                    }, () => {
                        setUpFilters(params);
                    });
                } else {
                    setUpFilters(params);
                }
            }


            update(key, value, doNotUpdateprefs, doNotUpdateUrl) {

                if ($state.is('dashboard')) {
                    if (key === 'news-list' || key === 'plan-start-date' || key === 'plan-end-date') {
                        value = null;
                    }
                }

                if (value !== null && (value === undefined || value.length === 0)) { // empty String or Array
                    value = null; // Remove query param
                }

                if (Array.isArray(value)) {
                    value = value.join(',');
                }

                if (key === 'selectedDate') {
                    var dateStr = wfDateParser.setQueryString(value);
                    this.filters[key] = dateStr;
                    doNotUpdateUrl || $location.search(key, dateStr);
                }
                else {
                    this.filters[key] = value;
                    doNotUpdateUrl || $location.search(key, value);

                    if (key == "status") {
                        $rootScope.currentlySelectedStatusFilters = this.transformStatusList(value);
                    }
                }

                if (!doNotUpdateprefs) {
                    wfPreferencesService.setPreference('location', this.sanitizeFilters(this.filters));
                }

                this.postUpdate();
            }

            postUpdate() {
                if (this.filters['composerId'] || this.filters['text']) {
                    $rootScope.$broadcast("search-mode.enter");
                } else {
                    $rootScope.$broadcast("search-mode.exit");
                }
            }

            get(key) {
                return this.filters[key];
            }

            getAll() {
                return this.filters;
            }

            clearAll(noPrefs, noUI) {
                _.forOwn(this.filters, (value, key) => {
                    this.update(key, null, noPrefs);
                });
                if(!noUI) {
                    $rootScope.$broadcast("filters.clearAll");
                }
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

            /**
             * Transform a comma separated list of statues for use by the angular interface
             * @param list
             * @returns {U[]}
             */
            transformStatusList (list) {
                return list ? list.split(',').map((status) => status == 'Stub' ? 'News list' : status) : list;
            }
        }

        return new FiltersService();


    }])

    .run(['wfFiltersService', function (wfFiltersService) {
        wfFiltersService.init();
    }]);
