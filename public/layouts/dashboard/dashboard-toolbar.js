import angular from 'angular';

import 'lib/date-service';
import 'lib/filters-service';
import 'lib/prodoffice-service';
import 'lib/presence';
import { wfToolbarSectionsDropdown } from 'components/toolbar-sections-dropdown/toolbar-sections-dropdown';

angular.module('wfDashboardToolbar', ['wfFiltersService', 'wfDateService', 'wfPresenceService', 'wfProdOfficeService'])
    .directive('wfToolbarSectionsDropdown', ['wfFiltersService', '$rootScope', 'sectionsInDesks', wfToolbarSectionsDropdown])
    .controller('wfDashboardToolbarController', ['$scope', 'wfFiltersService', 'wfDateParser', 'wfProdOfficeService', 'desks', 'sections', 'sectionsInDesks', 'wfTitleService', function ($scope, wfFiltersService, wfDateParser, prodOfficeService,  desks, sections, sectionsInDesks, wfTitleService) {

        $scope.selectedProdOffice = wfFiltersService.get('prodOffice');

        $scope.prodOffices = prodOfficeService.getProdOffices();

        $scope.$watch('selectedProdOffice', function (newValue, oldValue) {
            if (newValue !== oldValue) {  // Prevents fire change event on init
                $scope.$emit('filtersChanged.prodOffice', $scope.selectedProdOffice);
            }
        });

        // Sections =============================

        function buildSelectedSections () {
            var sectionsString = wfFiltersService.get('section');
            var sectionsStringArray = sectionsString ? sectionsString.split(',') : [];
            return sections.filter((el) => sectionsStringArray.indexOf(el.name) != -1);
        }

        $scope.selectedSections = buildSelectedSections();

        $scope.$on('filtersChanged.fromPreferences', function() {
            $scope.selectedSections = buildSelectedSections();
            $scope.selectedDesk = updateSelectedDeskBasedOnSections($scope.selectedSections);
        });

        $scope.sections = sections;

        // Desks ================================

        /**
         * Update the selected desk scope variable based on wether a supplied array of selected sections matches any of
         * the desk configurations
         * @param selectedSections Array of sections eg: ["Environment", "Money", "News", "Technology"]
         */
        function updateSelectedDeskBasedOnSections (selectedSections) {

            if (selectedSections.length === 0) {
                return null;
            }

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

        $scope.desks = [{
            name: 'Custom',
            id: 0,
            selected: false
        }].concat(desks);

        $scope.$watch('selectedDesk', function () {
            if ($scope.selectedDesk && $scope.selectedDesk.id) {
                $scope.$emit('filtersChanged.desk', $scope.selectedDesk.id);
            } else if ($scope.selectedDesk == null) { // 'All desks'
                $scope.$emit('filtersChanged.desk', -1);
            }

            if ($scope.selectedDesk && $scope.selectedDesk.name) {
                wfTitleService.set($scope.selectedDesk.name);
            }
            else {
                wfTitleService.set('All desks');
            }
        });

        $scope.$on('filtersChanged.section', function ($event, selectedSections) { // If selected sections are changed see if they constitute a desk or not
            $scope.selectedDesk = updateSelectedDeskBasedOnSections(selectedSections);
        });

        $scope.selectedDesk = updateSelectedDeskBasedOnSections($scope.selectedSections.map((el) => el.name));

        $scope.$on('filters.clearAll', () => {
            $scope.selectedSections = [];
            $scope.selectedDesk = null;
            $scope.selectedProdOffice = null;
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
    .directive('wfToolbarDisableOnSearch', [function () {
        return {
            scope: {},
            restrict: 'A',
            link: function (scope, elem) {
                var elemScope = elem.scope()
                elemScope.isEnabled = "";
                scope.$on("search-mode.enter", function() {
                    elemScope.isEnabled = "--disabled";
                });
                scope.$on("search-mode.exit", function() {
                    elemScope.isEnabled = "";
                });
            }
        }
    }]);
