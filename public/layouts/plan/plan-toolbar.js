import angular from 'angular';

import 'lib/filters-service';

angular.module('wfPlanToolbar', ['wfFiltersService'])
    .controller('wfPlanToolbarController', ['$scope', '$rootScope', function ($scope, $rootScope) {
        // controller stuff

        $scope.newsLists = _wfConfig.newsLists;
        $scope.selectedNewsList = null;


        $scope.$watch('selectedNewsList', function() {
            console.log("selected news list changed");
            if ($scope.selectedNewsList === null) { // All lists
                $scope.$emit('pvFiltersChanged.news-list', 'all');
            } else {
                $scope.$emit('pvFiltersChanged.news-list', $scope.selectedNewsList.id);
            }
        })


    }]);
