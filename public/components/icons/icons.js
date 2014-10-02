
import angular from 'angular';

// Path to aggregated stacked icons
var ICON_FILE = '/assets/components/icons/icons.svg';

angular.module('wfIcons', [])
    .directive('wfIcon', wfIconDirective);

function wfIconDirective() {

    return {
        restrict: 'A',
        template: '<img src="{{ iconUrl }}" class="wf-icon"/>',
        scope: {
            wfIcon: '@'
        },
        controller: function($scope) {
            $scope.iconUrl = ICON_FILE + '#' + $scope.wfIcon;
        }
    };

}
