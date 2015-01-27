import angular              from 'angular';
import moment               from 'moment';
import { columnDefaults }   from 'lib/column-defaults'
import startTemplate        from "components/content-list-item/content-list-item-start.html!text";
import endTemplate          from "components/content-list-item/content-list-item-end.html!text";

angular.module('wfColumnService', [])
    .factory('wfColumnService', ['$rootScope', '$sce', '$http', '$templateCache', '$q', 'wfPreferencesService',
        function($rootScope, $sce, $http, $templateCache, $q, wfPreferencesService) {

            class ColumnService {

                constructor() {

                    var self = this;

                    self.availableColums = columnDefaults;
                    self.contentItemTemplate;

                    self.preferencePromise = wfPreferencesService.getPreference('columnConfiguration').then(function resolve (data) {

                        if (typeof data[0] !== "string") {

                            return reject();
                        } else {

                            self.columns = self.availableColums;

                            data.forEach((colName) => {
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

                    function reject () {

                        self.columns = self.availableColums;
                        self.setColumns(self.columns);

                        return self.columns;
                    }
                }

                getAvailableColumns() {
                    return this.availableColums;
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
