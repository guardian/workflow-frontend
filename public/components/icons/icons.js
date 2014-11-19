
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
            wfIconActive: '=', // boolean
            wfIconDark: '=' //boolean
        },
        link: function($scope) {
            $scope.iconUrl = () => { 
                var postFixOptions = [
                    $scope.wfIconActive !== false ? 'active' : 'inactive',
                    $scope.wfIconDark === true ? 'dark-bg' : ''
                ];

                var urlPostfix = postFixOptions.map(function(postFixOption) {
                    return postFixOption == '' ? '' : '-' + postFixOption; 
                }).reduce(function(previous, current, i, a) {
                    return previous + current;
                });
                var url = ICON_FILE + '#' + $scope.wfIcon + urlPostfix;

                console.log("icon: " + $scope.wfIcon + " => " + url);
                
                return url;
            }
        }
    };

}
