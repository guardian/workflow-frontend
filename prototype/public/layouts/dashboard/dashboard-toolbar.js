import angular from 'angular';

import 'lib/date-service';
import 'lib/filters-service';
import 'lib/prodoffice-service';
import 'lib/presence';
import { wfToolbarSectionsDropdown } from 'components/toolbar-sections-dropdown/toolbar-sections-dropdown';

angular.module('wfDashboardToolbar', ['wfFiltersService', 'wfDateService', 'wfPresenceService', 'wfProdOfficeService'])
    .directive('wfToolbarSectionsDropdown', ['wfFiltersService', '$rootScope', 'sectionsInDesks', wfToolbarSectionsDropdown])
    .controller('wfDashboardToolbarController', ['$scope', 'wfFiltersService', 'wfDateParser', 'wfProdOfficeService', 'desks', 'sections', 'sectionsInDesks', function ($scope, wfFiltersService, wfDateParser, prodOfficeService,  desks, sections, sectionsInDesks) {

        $scope.selectedProdOffice = wfFiltersService.get('prodOffice');

        $scope.prodOffices = prodOfficeService.getProdOffices();

        $scope.$watch('selectedProdOffice', function () {
            $scope.$emit('filtersChanged.prodOffice', $scope.selectedProdOffice);
        });

        // Sections =============================

        $scope.selectedSections = (function buildSelectedSections () {
            var sectionsString = wfFiltersService.get('section');
            var sectionsStringArray = sectionsString ? sectionsString.split(',') : [];
            return sections.filter((el) => sectionsStringArray.indexOf(el.name) != -1);
        })();

        $scope.sections = sections;

        // Desks ================================

        /**
         * Update the selected desk scope variable based on wether a supplied array of selected sections matches any of the desk configurations
         * @param selectedSections Array of sections eg: ["Environment", "Money", "News", "Technology"]
         */
        function updateSelectedDeskBasedOnSections (selectedSections) {
            var selectedSectionIds = $scope.sections.filter((el) => selectedSections.indexOf(el.name) != -1).map((el) => el.id);
            var selectedSectionsInDesksOption = sectionsInDesks.filter((el) => // Dirty Array comparison
                    el.sectionIds.every((e) => selectedSectionIds.indexOf(e) != -1) && // Has every element the other has
                    el.sectionIds.length === selectedSectionIds.length // same length
            );
            if (selectedSectionsInDesksOption.length) {
                // Found a matching desk
                return $scope.desks.filter((el) => el.id == selectedSectionsInDesksOption[0].deskId)[0];
            } else {
                // Custom cofiguration -> selectedDesk = 'Custom'
                return $scope.desks[0];
            }
        }

        $scope.desks = desks;
        $scope.desks.unshift({
            name: 'Custom',
            id: 0,
            selected: false
        });

        $scope.$watch('selectedDesk', function () {
            if ($scope.selectedDesk && $scope.selectedDesk.id) {

                $scope.$emit('filtersChanged.desk', $scope.selectedDesk.id);
            }
        });

        $scope.$on('filtersChanged.section', function ($event, selectedSections) { // If selected sections are changed see if they constitute a desk or not
            $scope.selectedDesk = updateSelectedDeskBasedOnSections(selectedSections);
        });

        $scope.selectedDesk = updateSelectedDeskBasedOnSections($scope.selectedSections.map((el) => el.name));



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
    }]);
