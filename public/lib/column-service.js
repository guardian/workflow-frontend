import angular from 'angular';
import moment from 'moment';
import { columnDefaults } from 'lib/column-defaults'

angular.module('wfColumnService', [])
    .factory('wfColumnService', ['$rootScope', '$sce',
        function($rootScope, $sce) {

            class ColumnService {

                constructor() {
                    this.availableColums = columnDefaults;

                    this.columns = this.availableColums;

                    this.attachListeners()
                }

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

                getAvailableColumns() {
                    return this.availableColums;
                }

                getColumns() {
                    return this.columns;
                }

                setColumns(columns) {
                    this.columns = columns;
                }

            }

            return new ColumnService();

        }
    ])
