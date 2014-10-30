import angular from 'angular';

import 'lib/date-service';
import 'lib/filters-service';
import 'lib/prodoffice-service';
import 'lib/presence';

angular.module('wfDashboardToolbar', ['wfFiltersService', 'wfDateService', 'wfPresenceService', 'wfProdOfficeService'])
    .controller('wfDashboardToolbarController', ['$scope', 'wfFiltersService', 'wfDateParser', 'wfProdOfficeService', 'sections', 'desks','sectionsInDesks', function ($scope, wfFiltersService, wfDateParser, prodOfficeService, sections, desks, sectionsInDesks) {

        $scope.selectedProdOffice = wfFiltersService.get('prodOffice');

        $scope.prodOffices = prodOfficeService.getProdOffices();

        $scope.$watch('selectedProdOffice', function () {
            $scope.$emit('filtersChanged.prodOffice', $scope.selectedProdOffice);
        });

        // Sections =============================

        $scope.selectedSection = sections.filter((el) => el.id === parseInt(wfFiltersService.get('section'), 10))[0];
        $scope.sections = sections;

        $scope.$watch('selectedSection', function () {
            $scope.$emit('filtersChanged.section', $scope.selectedSection);
        });

        // Desks ================================

        $scope.selectedDesk = desks.filter((el) => el.id === parseInt(wfFiltersService.get('desk'), 10))[0];
        $scope.desks = desks;

        $scope.$watch('selectedDesk', function () {
            if ($scope.selectedDesk && $scope.selectedDesk.id) {

                $scope.$emit('filtersChanged.desk', $scope.selectedDesk.id);
            }
        });

        $scope.$on('filtersChanged.desk', function ($event, deskId) {
            var sectionsInThisDesk = sectionsInDesks.filter((el) => el.deskId === parseInt(deskId, 10));
            if (sectionsInThisDesk.length) {
                $scope.selectedSections = sectionsInThisDesk[0].sectionIds;
                $scope.sections = $scope.sections.map((section) => {
                    section.selected = $scope.selectedSections.indexOf(section.id) !== -1;
                    return section;
                }).sort((a, b) => {
                    if (!a.selected && b.selected) {
                        return 1;
                    } else if (a.selected && !b.selected) {
                        return -1;
                    } else {
                        return a.name > b.name; // alphabetise
                    }
                });
            }
        });

        $scope.dateOptions = wfDateParser.getDaysThisWeek();
        var selectedDate = wfFiltersService.get('selectedDate');

        // ensure that the date from the URL is the same object as the
        // one used in the Select drop-down, as its compared with ===
        $scope.dateOptions.forEach(function (date) {
            if (date.isSame(selectedDate)) {
                selectedDate = date;
            }
        });

        $scope.selectedDate = selectedDate;

        $scope.deadlineSelectActive = function () {
            return $scope.selectedDate && typeof($scope.selectedDate) != 'string';
        };

        $scope.$watch('selectedDate', function () {
            $scope.$emit('filtersChanged.selectedDate', $scope.selectedDate);
        });

    }])

    .directive('wfToolbarOption', [function () {
        return {
            restrict: 'A',
            require: '^ngModel',
            scope: {
                ngModel: '=',
                optionName: '@wfToolbarOption',
                value: '@wfToolbarOptionValue'
            },

            link: function (scope, elem, attrs, ngModel) {

                var className = 'dashboard-toolbar__' + scope.optionName + '-option',
                    activeClass = className + '--active',

                    value = scope.value || undefined;

                ngModel.$render = function () {
                    var newValue = ngModel.$modelValue;

                    if (newValue == value) {
                        elem.addClass(activeClass);
                        elem.removeClass(className);
                    } else {
                        elem.addClass(className);
                        elem.removeClass(activeClass);
                    }
                };

                elem.on('click', function (event) {
                    ngModel.$setViewValue(value);

                    ngModel.$render();
                    scope.$apply();
                });
            }
        };
    }])

    .directive('wfToolbarSectionsDropdown', [function () {
        return {
            restrict: 'A',
            require: '^ngModel',
            scope: {
                ngModel: ''
            },

            link: function ($scope, $elem, attrs, ngModel) {


                $scope.toggleDropdown


                $scope.$on('filtersChanged.desk', function ($event, deskId) {
                    var sectionsInThisDesk = sectionsInDesks.filter((el) => el.deskId === parseInt(deskId, 10));
                    if (sectionsInThisDesk.length) {
                        $scope.selectedSections = sectionsInThisDesk[0].sectionIds;
                        $scope.sections = $scope.sections.map((section) => {
                            section.selected = $scope.selectedSections.indexOf(section.id) !== -1;
                            return section;
                        }).sort((a, b) => {
                            if (!a.selected && b.selected) {
                                return 1;
                            } else if (a.selected && !b.selected) {
                                return -1;
                            } else {
                                return a.name > b.name; // alphabetise
                            }
                        });
                    }
                });
            }
        }
    }]);
