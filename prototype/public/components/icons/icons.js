
import angular from 'angular';

// Path to aggregated stacked icons
var ICON_FILE = '/assets/components/icons/icons.svg';

angular.module('wfIcons', [])
    .directive('wfIcon', wfIconDirective);

function wfIconDirective() {

    return {
        restrict: 'A',
        template: '<img ng-src="{{ iconUrl() }}" class="wf-icon"/>',
        scope: {
            wfIcon: '@',
            wfIconActive: '=' // boolean
        },
        link: function($scope) {
            var urlPostfix = $scope.wfIconActive !== false ? 'active' : 'inactive';

            $scope.iconUrl = () => ICON_FILE + '#' + $scope.wfIcon + '-' + urlPostfix;
        }
    };

}
