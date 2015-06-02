function wfDateRangeWidget ($timeout, wfFiltersService) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/date-range-widget/date-range-widget.html',
        scope: {
            dateRange: '=wfDateRangeWidgetDateRange'
        },
        controller: ($scope) => {

            let startDateOption = wfFiltersService.get('plan-start-date'),
                endDateOption = wfFiltersService.get('plan-end-date');

            $scope.dateRange = {};

            $scope.dateRange.startDate = startDateOption ? moment(startDateOption) : moment().subtract(3, 'days').startOf('day');
            $scope.dateRange.endDate = endDateOption ? moment(endDateOption) : $scope.dateRange.startDate.clone().add(6, 'days').endOf('day');

            $scope.dateRange.durationInDays = $scope.dateRange.endDate.diff($scope.dateRange.startDate, 'days');

            $scope.momentToJS = () => {
                $scope.startDateJS = $scope.dateRange.startDate.toDate();
                $scope.endDateJS = $scope.dateRange.endDate.toDate();
            };

            $scope.momentToJS();

            let shortCutApply = (fn) => {
                return () => {
                    fn();
                    $timeout(() => {
                        $scope.momentToJS();
                        $scope.parseDateRange();
                    });
                }
            };

            $scope.shortCuts = [
                {
                    name: "This week",
                    apply: shortCutApply(() => {
                        $scope.dateRange.startDate = moment().startOf('week');
                        $scope.dateRange.endDate = moment().endOf('week');
                    }),
                    active: false
                },
                {
                    name: "Next 7 days",
                    apply: shortCutApply(() => {
                        $scope.dateRange.startDate = moment();
                        $scope.dateRange.endDate = $scope.dateRange.startDate.clone().add(7, 'days');
                    }),
                    active: false
                },
                {
                    name: "Next 3 weeks",
                    apply: shortCutApply(() => {
                        $scope.dateRange.startDate = moment();
                        $scope.dateRange.endDate = $scope.dateRange.startDate.clone().add(3, 'weeks').endOf('week');
                    }),
                    active: false
                },
                {
                    name: "Next 3 months",
                    apply: shortCutApply(() => {
                        $scope.dateRange.startDate = moment();
                        $scope.dateRange.endDate = $scope.dateRange.startDate.clone().add(3, 'months').endOf('month');
                    }),
                    active: false
                }
            ];

            $scope.resetShortcutsActiveState = () => {
                $scope.shortCuts.forEach((sc) => {
                    sc.active = false;
                });
            }

        },
        link: ($scope, elem, attrs) => {

            $scope.parseDateRange = () => {
                $scope.dateRange.startDate = moment($scope.startDateJS);
                $scope.dateRange.endDate = moment($scope.endDateJS);
                $scope.dateRange.durationInDays = $scope.dateRange.endDate.diff($scope.dateRange.startDate, 'days');
            };

            $scope.activateShortCut = (shortCut) => {
                $scope.resetShortcutsActiveState();
                shortCut.apply();
                shortCut.active = true;
            }
        }
    }
}

export { wfDateRangeWidget };
