import angular from 'angular';

import 'lib/user';
import './dashboard-user.html';
import 'components/feature-switches/feature-switches';

angular
    .module('wfDashboardUser', ['wfUser', 'wfFeatureSwitches'])
    .controller('wfDashboardUserController', ['$scope', '$window', 'wfUser', 'wfFiltersService', function ($scope, $window, user, wfFiltersService) {
        $scope.displayName = user.displayName;
        $scope.logout = function(dialogText) {
            if($window.confirm(dialogText)) { $window.location.replace('/logout'); }
        }
        $scope.resetFilters = function () {
            wfFiltersService.clearAll(false);
        }
    }])
