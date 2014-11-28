import angular from 'angular';
import moment from 'moment';

console.log("abc123");

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

                    this.availableColums = [{
                        name: 'titles',
                        labelHTML: 'Working title / Headline',
                        colspan: 1,
                        title: ''
                    },{
                        name: 'presence',
                        labelHTML: '<i class="content-list-head__heading-icon--presence" wf-icon="presence"/>',
                        colspan: 1,
                        title: 'In use by (Coming soon)'
                    },{
                        name: 'assignee',
                        labelHTML: '<i class="content-list-head__heading-icon--assignee" wf-icon="assigned-to"/>',
                        colspan: 1,
                        title: 'Assigned to'
                    },{
                        name: 'office',
                        labelHTML: 'Office',
                        colspan: 1,
                        title: ''
                    },{
                        name: 'deadline',
                        labelHTML: 'Deadline',
                        colspan: 1,
                        title: ''
                    },{
                        name: 'section',
                        labelHTML: 'Section',
                        colspan: 1,
                        title: ''
                    },{
                        name: 'status',
                        labelHTML: 'Status',
                        colspan: 1,
                        title: ''
                    },{
                        name: 'notes',
                        labelHTML: 'Notes',
                        colspan: 1,
                        title: ''
                    },{
                        name: 'links',
                        labelHTML: 'Open in',
                        colspan: 4,
                        title: ''
                    },{
                        name: 'published-state',
                        labelHTML: 'State',
                        colspan: 1,
                        title: ''
                    }];

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
