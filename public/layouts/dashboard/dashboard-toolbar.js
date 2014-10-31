import angular from 'angular';

import 'lib/date-service';
import 'lib/filters-service';
import 'lib/prodoffice-service';
import 'lib/presence';

angular.module('wfDashboardToolbar', ['wfFiltersService', 'wfDateService', 'wfPresenceService', 'wfProdOfficeService'])
    .controller('wfDashboardToolbarController', ['$scope', 'wfFiltersService', 'wfDateParser', 'wfProdOfficeService', 'desks', 'sections', function ($scope, wfFiltersService, wfDateParser, prodOfficeService,  desks, sections) {

        $scope.selectedProdOffice = wfFiltersService.get('prodOffice');

        $scope.prodOffices = prodOfficeService.getProdOffices();

        $scope.$watch('selectedProdOffice', function () {
            $scope.$emit('filtersChanged.prodOffice', $scope.selectedProdOffice);
        });

        // Desks ================================

        $scope.selectedDesk = desks.filter((el) => el.id === parseInt(wfFiltersService.get('desk'), 10))[0];
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

        // Sections =============================

        $scope.selectedSections = sections.filter((el) => el.id === parseInt(wfFiltersService.get('section'), 10))[0];
        $scope.sections = sections;

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

    .directive('wfToolbarSectionsDropdown', ['wfFiltersService', '$rootScope', 'sectionsInDesks', function (wfFiltersService, $rootScope, sectionsInDesks) { //  wf-toolbar-sections-dropdown
        return {
            restrict: 'A',
            require: '^ngModel',
            scope: {
                ngModel: '=',
                sections: '=',
                selectedDesk: '='
            },
            link: function ($scope, $element, attrs, ngModel) {

                var sectionListElem = $element[0].querySelector('.section-list'),
                    button = $element.find('button'),
                    buttonTitle = $element[0].querySelector('.dashboard-toolbar__section-select'),
                    sectionlistHiddenClass = 'section-list--hidden';

                button.on('click', function (event) {
                    event.stopPropagation();
                    if (sectionListElem.classList.contains(sectionlistHiddenClass)) {
                        sectionListElem.classList.remove(sectionlistHiddenClass);

                        var handler;
                        handler = function (event) {
                            if (event.target !== sectionListElem && !sectionListElem.contains(event.target)) {
                                sectionListElem.classList.add(sectionlistHiddenClass);
                                document.removeEventListener('click',handler);
                            }
                        };

                        // open
                        document.addEventListener('click', handler)

                    } else {
                        sectionListElem.classList.add(sectionlistHiddenClass);
                    }
                });

                function updateNameTo (sections) {
                    var names = [];

                    sections.forEach((section) => {
                        if (section.selected) {
                            names.push(section.name.substr(0, 3));
                        }
                    });

                    var str = names.join(', ');

                    return str.length > 20 ? str.substr(0, 17) + '…' : str;
                }

                $rootScope.$on('filtersChanged.desk', function ($event, deskId) {

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
                        buttonTitle.innerHTML = updateNameTo($scope.sections);
                    }
                });

                $scope.$watch(ngModel, function () {
                    console.log('change?');
                    $scope.$emit('filtersChanged.section', $scope.selectedSections);
                });
            }
        }
    }]);
