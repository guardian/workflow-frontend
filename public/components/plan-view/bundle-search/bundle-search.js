function wfBundleSearch ($timeout) {
    return {
        restrict: 'E',
        templateUrl: '/assets/components/plan-view/bundle-search/bundle-search.html',
        scope: {
            onAdd: '&wfBundleSearchOnAdd',
            onCreate: '&wfBundleSearchOnCreate',
            onGetColor: '&wfBundleSearchCreateColour',
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
                        if ($scope.selectedIndex > $scope.results.length) { // 1 extra after results for create new
                            $scope.selectedIndex = $scope.results.length;
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
                        if ($scope.selectedIndex > $scope.results.length - 1) { // create new
                            $scope.create();
                        } else { // add to existing
                            $scope.addTo($scope.results[$scope.selectedIndex]);
                        }
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
                            $scope.results = $scope.bundleList.filter((bundle) => bundle.title.toLowerCase().indexOf($scope.searchTerm.toLowerCase()) !== -1);
                        });
                }

                if ($scope.searchTerm.length === 0 || $event.keyCode === 8 && $scope.searchTerm.length === 1) {
                    $timeout(() => {
                        $scope.selectedIndex = 0;
                        $scope.results = [];
                    });

                }
            };

            $scope.addTo = (bundle) => {
                $scope.loading = true;
                $scope.onAdd({
                    bundle: bundle
                }).then(() => {
                    $timeout(() => {
                        $scope.loading = false;
                        $scope.searchTerm = '';
                    });
                });
            };

            $scope.create = () => {
                $scope.loading = true;
                $scope.onCreate({
                    name: $scope.searchTerm
                }).then(() => {
                    $timeout(() => {
                        $scope.loading = false;
                        $scope.searchTerm = '';
                    });
                });
            };

            $scope.getColor = (s) => {

                let ret = $scope.onGetColor({
                    prop: 'background-color',
                    title: s
                });

                let hex = ret['background-color'].replace('#','');
                let r = parseInt(hex.substring(0,2), 16);
                let g = parseInt(hex.substring(2,4), 16);
                let b = parseInt(hex.substring(4,6), 16);

                ret['background-color'] = 'rgba('+r+','+g+','+b+',0.2)';

                return ret;
            }

        }
    }
}

export { wfBundleSearch };
