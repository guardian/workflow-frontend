import toolbarSectionsDropdown from './toolbar-sections-dropdown.html';

var wfToolbarSectionsDropdown = function (wfFiltersService, $rootScope, sectionsInDesks) { //  wf-toolbar-sections-dropdown
    return {
        restrict: 'A',
        require: '^ngModel',
        template: toolbarSectionsDropdown,
        scope: {
            ngModel: '=',
            sections: '=',
            selectedSections: '=',
            selectedDesk: '='
        },
        link: function ($scope, $element, attrs, ngModel) {
            var sectionListElem = $element[0].querySelector('.dropdown-toolbar__list'),
                button = $element.find('button'),
                buttonTitle = $element[0].querySelector('.dashboard-toolbar__dropdown-select-text'),
                sectionListHiddenClass = 'section-list--hidden';

            /**
             * When the dropdown button is clicked; display the dropdown menu and bind event to hide the menu
             */
            button.on('click', function (event) {
                event.stopPropagation();
                if (sectionListElem.classList.contains(sectionListHiddenClass)) {
                    sectionListElem.classList.remove(sectionListHiddenClass);

                    var handler;
                    handler = function (event) {
                        if (event.target !== sectionListElem && !sectionListElem.contains(event.target)) {
                            sectionListElem.classList.add(sectionListHiddenClass);
                            document.removeEventListener('click', handler);
                        }
                    };

                    // open
                    document.addEventListener('click', handler)

                } else {
                    sectionListElem.classList.add(sectionListHiddenClass);
                }
            });

            /**
             * Given an Array of selected section IDs return an Array of Section objects with
             * the selected property set accordingly
             * @param selectedSections Array of section IDs eg: [12, 8, 3, 2]
             * @returns {Array} An Array of Section objects
             */
            function updateSections (selectedSections) {
                var sections = $scope.sections.map((section) => {
                    section.selected = selectedSections.indexOf(section.id) !== -1;
                    return section;
                }).sort((a, b) => {
                    if (!a.selected && b.selected) { // Selected at the top
                        return 1;
                    } else if (a.selected && !b.selected) { // Unselected below
                        return -1;
                    } else {
                        return a.name > b.name ? 1 : -1; // Both in Alphabetic order
                    }
                });

                // Pin 'Proffessional Networks' to the bottom of the list
                var isPN = (s) => { return (s.name.indexOf("(PN)") > -1) && !s.selected; }
                var pnSections = sections.filter(isPN);

                return sections.filter((s) => {return !isPN(s);}).concat(pnSections);
            }

            /**
             * Take an array of section objects and return a String listing the first 3 letters
             * of each selected section name
             * @param sections Array of Section objects
             * @returns {string}
             */
            function updateNameTo(sections) {
                var names = sections.filter((section) => section.selected)

                if (names.length === 1) {
                    return names[0].name;
                }

                names = names.map((section) => section.name.substr(0, 3));

                if (names.length) {
                    return names.join(', ');
                } else {
                    return 'All sections';
                }
            }

            /**
             * Return an Array of section names for checked checkboxes in the section menu
             * @returns {Array}
             */
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

            /**
             * When a desk is selected; update the list of section checkboxes and the section button text accordingly
             */
            $rootScope.$on('filtersChanged.desk', function ($event, deskId) {

                if (deskId === -1) {
                    $scope.$emit('filtersChanged.section', []);
                    $scope.sections = updateSections([]);
                    buttonTitle.innerHTML = updateNameTo($scope.sections);
                } else {
                    var sectionsInThisDesk = sectionsInDesks.filter((el) => el.deskId === parseInt(deskId, 10));
                    if (sectionsInThisDesk.length) {
                        $scope.sections = updateSections(sectionsInThisDesk[0].sectionIds);
                        buttonTitle.innerHTML = updateNameTo($scope.sections);
                        if (sectionsInThisDesk[0].sectionIds.length) {
                            var selectedSectionNamesArray = $scope.sections
                                .filter((el) => sectionsInThisDesk[0].sectionIds.indexOf(el.id) !== -1)
                                .map((el) => el.name);

                            $scope.$emit('filtersChanged.section', selectedSectionNamesArray);
                        }
                    }
                }
            });

            /**
             * When a checkbox is toggled; Update the content, desk dropdown and section button text accordingly
             */
            $scope.checkboxUpdate = function () {
                var selectedSections = buildSelectedSections();
                $scope.$emit('filtersChanged.section', selectedSections);
                buttonTitle.innerHTML = updateNameTo($scope.sections);
            };

            /**
             * When the model (selectedSections) is changed; update the sections and button text accordingly
             */
            $scope.$watch(ngModel, function () {
                $scope.sections = updateSections(ngModel.$modelValue.map((el) => el.id));
                buttonTitle.innerHTML = updateNameTo($scope.sections);
            });
        }
    }
};

export { wfToolbarSectionsDropdown };
