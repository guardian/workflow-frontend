import angular from 'angular';
import moment from 'moment';
import { columnDefaults } from 'lib/column-defaults'

angular.module('wfColumnService', [])
    .factory('wfColumnService', ['$rootScope', '$sce',
        function($rootScope, $sce) {

            class ColumnService
            {

                attachListeners() {
                    var self = this;
                    $rootScope.$on('columns.add', function(event, data) {
                        self.addColumn(data);
                        //$rootScope.$broadcast('getContent');
                    });

                    $rootScope.$on('columns.remove', function(event, data) {
                        self.removeColumn(data);
                    });
                }

                init() {

                    this.availableColums = columnDefaults;

                    this.columns = this.availableColums;

                    this.attachListeners()
                }

                addColumn(data) {
                    console.log("added", data);
                }

                removeColumn(data) {
                    console.log("removed", data);
                }

                getAvailableColumns() {
                    return this.availableColums;
                }

                getColumns() {
                    return this.columns;
                }

                setColumns(columns) {
                    this.columns = columns;
                }

                stringToArray(value) {
                    if (value) return value.split(",");
                    else return [];
                }

                constructor()
                {

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

            return new ColumnService();


        }])

    .run(['wfColumnService', function (wfColumnService) {
        wfColumnService.init();
    }]);
