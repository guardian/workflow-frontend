function wfBundleSearch ($timeout) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/bundle-search/bundle-search.html',
        scope: {
            onCreate: '&wfBundleSearchOnCreate',
            bundleList: '='
        },
        controller: ($scope) => {

        },
        link: ($scope, elem, attrs) => {

            $scope.searchTerm = "";
            $scope.selectedIndex = 0;

            $scope.search = ($event) => {

                switch ($event.keyCode) {
                    case 40: // Down
                        $event.preventDefault();
                        $scope.selectedIndex += 1;
                        if ($scope.selectedIndex > $scope.results.length - 1) {
                            $scope.selectedIndex = $scope.results.length - 1;
                        }
                        break;

                    case 38: // Up
                        $event.preventDefault();
                        $scope.selectedIndex -= 1;
                        if ($scope.selectedIndex < 0) {
                            $scope.selectedIndex = 0;
                        }
                        break;

                    case 13: // Enter
                        $event.preventDefault();
                        $scope.loading = true;
                        $scope.onCreate({
                            bundle: $scope.results[$scope.selectedIndex]
                        }).then(() => {
                            $scope.loading = false;
                        });
                        $scope.searchTerm = '';
                        break;

                    case 27: // Escape
                        $event.preventDefault();
                        $timeout(() => {
                            elem[0].blur();
                            $scope.selectedIndex = 0;
                            $scope.results = [];
                            $scope.searchTerm = "";
                        });
                        break;

                    default:
                        $timeout(() => {
                            $scope.results = $scope.bundleList.filter((bundle) => bundle.title.indexOf($scope.searchTerm) !== -1);
                        });
                }

                if ($scope.searchTerm.length === 0 || $event.keyCode === 8 && $scope.searchTerm.length === 1) {
                    $timeout(() => {
                        $scope.selectedIndex = 0;
                        $scope.results = [];
                    });

                }
            }

        }
    }
}

export { wfBundleSearch };
