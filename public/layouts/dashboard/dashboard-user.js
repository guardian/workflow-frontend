import angular from 'angular';

import 'lib/user';

angular
    .module('wfDashboardUser', ['wfUser'])
    .controller('wfDashboardUserController', ['$scope', 'wfUser', function ($scope, user) {
        $scope.displayName = user.displayName; 
        $scope.logout = function(dialogText) {
            if(window.confirm(dialogText)) { window.location.replace('/logout'); }
        }
    }])
