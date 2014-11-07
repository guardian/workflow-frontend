var wfToolbarSectionsDropdown = function (wfFiltersService, $rootScope, sectionsInDesks) { //  wf-toolbar-sections-dropdown
    return {
        restrict: 'A',
        require: '^ngModel',
        replace: true,
        templateUrl: '/assets/components/toolbar-sections-dropdown/toolbar-sections-dropdown.html',
        scope: {
            ngModel: '=',
            sections: '=',
            selectedSections: '=',
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
                            document.removeEventListener('click', handler);
                        }
                    };

                    // open
                    document.addEventListener('click', handler)

                } else {
                    sectionListElem.classList.add(sectionlistHiddenClass);
                }
            });

            function updateNameTo(sections) {
                var names = [];
                sections.forEach((section) => {
                    if (section.selected) {
                        names.push(section.name.substr(0, 3));
                    }
                });
                var str = names.join(', ');
                return str.length > 10 ? str.substr(0, 7) + '…' : str;
            }

            function updateSections (selectedSections) {
                $scope.sections = $scope.sections.map((section) => {
                    section.selected = selectedSections.indexOf(section.id) !== -1;
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

            function buildSelectedSections () {
                $scope.checkBoxes = $scope.checkBoxes || $element[0].querySelectorAll('.section-list__chk');
                var selectedSections = [];
                for (let i = 0; i < $scope.checkBoxes.length; i++) {
                    if ($scope.checkBoxes[i].checked) {
                        selectedSections.push($scope.checkBoxes[i].value);
                    }
                }
                return selectedSections;
            }

            $rootScope.$on('filtersChanged.desk', function ($event, deskId) {
                var sectionsInThisDesk = sectionsInDesks.filter((el) => el.deskId === parseInt(deskId, 10));
                if (sectionsInThisDesk.length) {
                    updateSections(sectionsInThisDesk[0].sectionIds);
                    buttonTitle.innerHTML = updateNameTo($scope.sections);
                    if (sectionsInThisDesk[0].sectionIds.length) {
                        var selectedSectionNamesArray = $scope.sections
                                                            .filter((el) => sectionsInThisDesk[0].sectionIds.indexOf(el.id) != -1)
                                                            .map((el) => el.name);

                        $scope.$emit('filtersChanged.section', selectedSectionNamesArray);
                    }
                }
            });

            $scope.checkboxUpdate = function () {
                $scope.$emit('filtersChanged.section', buildSelectedSections());
            };

            $scope.$watch(ngModel, function () {
                updateSections(ngModel.$modelValue.map((el) => el.id));
                buttonTitle.innerHTML = updateNameTo($scope.sections);
            });
        }
    }
};

export { wfToolbarSectionsDropdown };
