function wfDateRangeWidget ($timeout) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/date-range-widget/date-range-widget.html',
        scope: {
            startDate: '=wfDateRangeWidgetStartDate',
            endDate: '=wfDateRangeWidgetEndDate'
        },
        controller: ($scope) => {
            $scope.startDate = moment().subtract(3, 'days').startOf('day');
            $scope.endDate = moment().add(6, 'days').startOf('day');

            $scope.startDateJS = $scope.startDate.toDate();
            $scope.endDateJS = $scope.endDate.toDate();
        },
        link: ($scope, elem, attrs) => {


        }
    }
}

export { wfDateRangeWidget };
