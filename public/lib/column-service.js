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
                        self.columns = data;
                        return self.columns;
                    }, function reject () {
                        self.columns = self.availableColums;
                        return self.columns;
                    });
                }

                getAvailableColumns() {
                    return this.availableColums;
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
