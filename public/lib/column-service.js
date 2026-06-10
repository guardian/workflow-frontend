import angular from 'angular';

import moment from 'moment';
import { columnDefaults } from './column-defaults'
import startTemplate from "components/content-list-item/content-list-item-start.html";
import endTemplate from "components/content-list-item/content-list-item-end.html";
import { getDefaultFeatureSwitchValues } from './feature-switches.ts';

const columnDefaultsWithoutIntendedAudience = columnDefaults.filter(column => column.name !== 'intended-audience')


angular.module('wfColumnService', [])
    .factory('wfColumnService', ['wfPreferencesService',
        function (wfPreferencesService) {

            class ColumnService {

                constructor() {

                    var self = this;

                    self.availableColums = columnDefaultsWithoutIntendedAudience;
                    self.contentItemTemplate;

                    self.preferencePromise = wfPreferencesService.getAllPreferences().then(function resolve(preferencesData) {
                        var { columnConfiguration = [], featureSwitches = getDefaultFeatureSwitchValues() } = preferencesData;
                        if (typeof columnConfiguration[0] !== "string") {
                            return reject();
                        } else {
                            var shouldExcludeIntendedAudience = !featureSwitches.intendedAudienceColumn
                            self.availableColums = shouldExcludeIntendedAudience ? columnDefaultsWithoutIntendedAudience : columnDefaults
                            self.columns = self.availableColums;

                            self.columns.forEach((col) => { // set all to inactive
                                col.active = false;
                            });

                            columnConfiguration.forEach((colName) => { // activate preferences columns
                                self.columns.some((availCol) => {
                                    if (availCol.name == colName) {
                                        availCol.active = true; // set active
                                        return true;
                                    } else {
                                        return false;
                                    }
                                });
                            });

                            return self.columns;
                        }

                    }, reject);


                    function reject() {

                        self.columns = self.availableColums;
                        self.setColumns(self.columns);

                        return self.columns;
                    }
                }

                getAvailableColumns() {
                    return Promise.resolve(this.availableColums);
                }

                getColumns() {
                    return this.columns ? Promise.resolve(this.columns) : this.preferencePromise;
                }

                getContentItemTemplate(refresh) {

                    var self = this;

                    if (!self.contentItemTemplate || refresh) {

                        self.contentItemTemplate = self.getColumns().then((loadedColumns) => {

                            loadedColumns = loadedColumns.filter((col) => {
                                return col.active;
                            }).map((col) => {
                                return col.template;
                            });

                            loadedColumns.unshift(startTemplate);
                            loadedColumns.push(endTemplate);

                            self.contentItemTemplate = loadedColumns.join('');

                            return self.contentItemTemplate;
                        });
                    };


                    if (typeof self.contentItemTemplate.then === 'function') {

                        return self.contentItemTemplate;
                    } else {

                        return Promise.resolve(self.contentItemTemplate);
                    }
                }

                setColumns(columns) {
                    this.columns = columns;

                    var activeColumns = columns.filter((col) => {
                        return col.active;
                    }).map((col) => {
                        return col.name;
                    });

                    return wfPreferencesService.setPreference('columnConfiguration', activeColumns);
                }
            }

            return new ColumnService();

        }
    ])
