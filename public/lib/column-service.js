import angular from 'angular';
import moment from 'moment';
import { columnDefaults } from 'lib/column-defaults'

angular.module('wfColumnService', [])
    .factory('wfColumnService', ['$rootScope', '$sce', 'wfPreferencesService',
        function($rootScope, $sce, wfPreferencesService) {

            class ColumnService {

                constructor() {

                    var self = this;

                    self.availableColums = columnDefaults;

                    self.preferencePromise = wfPreferencesService.getPreference('columnConfiguration').then(function resolve (data) {

                        // if the columns from preferences are missing any columns (ie: we've added columns to the defaults)...

                        if (data.length !== self.availableColums.length) { // prefs are missing some...
                            var columns = [];

                            self.availableColums.forEach((availCol) => {
                                var found = false;
                                data.forEach((col, index) => {
                                    if (availCol.name === col.name) {
                                        found = index;
                                    }
                                });

                                if (!found) {
                                    columns.push(availCol);
                                } else {
                                    columns.push(data[found]);
                                }
                            });

                            self.columns = columns;
                        } else {
                            self.columns = data;
                        }

                        return self.columns;

                    }, function reject () {
                        self.columns = self.availableColums;
                        return self.columns;
                    });
                }

                getAvailableColumns() {
                    return Promise.resolve(this.availableColums);
                }

                getColumns() {
                    return this.columns ? Promise.resolve(this.columns) : this.preferencePromise;
                }

                setColumns(columns) {
                    this.columns = columns;
                    return wfPreferencesService.setPreference('columnConfiguration', columns);
                }
            }

            return new ColumnService();

        }
    ])
